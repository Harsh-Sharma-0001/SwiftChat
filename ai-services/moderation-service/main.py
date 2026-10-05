# ai-services/moderation-service/main.py

import json
import os
import re
import sys
from typing import Dict, Optional

import httpx
from dotenv import load_dotenv
from fastapi import Depends, FastAPI
from openai import AsyncOpenAI
from pydantic import BaseModel

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from shared.auth import verify_api_key

load_dotenv()

app = FastAPI(
    title="SwiftChat Moderation Service",
    version="1.0.0",
)

NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")

TOXICITY_THRESHOLD = 0.7


class ModerationRequest(BaseModel):
    text: Optional[str] = None
    imageUrl: Optional[str] = None


class ModerationResponse(BaseModel):
    isSafe: bool
    score: float
    categories: Dict[str, float]
    action: str
    message: str


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "moderation-service",
    }


@app.post(
    "/moderate",
    response_model=ModerationResponse,
    dependencies=[Depends(verify_api_key)],
)
async def moderate(
    req: ModerationRequest,
):
    if not req.text and not req.imageUrl:
        return ModerationResponse(
            isSafe=True,
            score=0.0,
            categories={},
            action="allow",
            message="No content to moderate",
        )

    if NVIDIA_API_KEY:
        fallback_models = [
            "meta/llama-4-maverick-17b-128e-instruct",
            "mistralai/mistral-small-3.1-24b-instruct-2503",
            "ibm/granite-3.3-8b-instruct",
            "deepseek-ai/deepseek-r1",
        ]

        prompt = (
            "Analyze the following content for toxicity, "
            "hate speech, harassment, and explicit content. "
            "Return ONLY valid JSON in this precise format: "
            '{"flagged": true/false, '
            '"max_score": 0.0-1.0, '
            '"categories": {'
            '"hate": 0.0, '
            '"harassment": 0.0, '
            '"explicit": 0.0, '
            '"toxicity": 0.0'
            "}}"
        )

        user_content = ""

        if req.text:
            user_content += (
                f"Text: {req.text}\n"
            )

        if req.imageUrl:
            user_content += (
                "Image URL (Assess context): "
                f"{req.imageUrl}\n"
            )

            fallback_models.insert(
                0,
                "google/gemma-3-27b-it",
            )

        messages = [
            {
                "role": "system",
                "content": prompt,
            },
            {
                "role": "user",
                "content": user_content,
            },
        ]

        for model in fallback_models:
            try:
                async with httpx.AsyncClient(
                    timeout=15.0
                ) as http_client:
                    client = AsyncOpenAI(
                        api_key=NVIDIA_API_KEY,
                        base_url=NVIDIA_BASE_URL,
                        http_client=http_client,
                    )

                    response = (
                        await client.chat.completions.create(
                            model=model,
                            messages=messages,
                            temperature=0.1,
                            max_tokens=200,
                        )
                    )

                    content = (
                        response.choices[0]
                        .message
                        .content
                        or ""
                    )

                    match = re.search(
                        r"\{.*\}",
                        content,
                        re.DOTALL,
                    )

                    if not match:
                        raise ValueError(
                            "No valid JSON object found in response"
                        )

                    result = json.loads(
                        match.group()
                    )

                    max_score = float(
                        result.get(
                            "max_score",
                            0.0,
                        )
                    )

                    is_flagged = bool(
                        result.get(
                            "flagged",
                            False,
                        )
                    )

                    categories = result.get(
                        "categories",
                        {},
                    )

                    action = (
                        "block"
                        if (
                            is_flagged
                            and max_score
                            > TOXICITY_THRESHOLD
                        )
                        else (
                            "flag"
                            if is_flagged
                            else "allow"
                        )
                    )

                    snippet_source = (
                        req.text
                        or req.imageUrl
                        or ""
                    )

                    snippet = (
                        snippet_source[:50] + "..."
                        if len(snippet_source) > 50
                        else snippet_source
                    )

                    print(
                        "[MODERATION LOG] "
                        f"Model: {model} | "
                        f"Action: {action.upper()} | "
                        f"Score: {max_score:.3f} | "
                        f"Content: {snippet}"
                    )

                    return ModerationResponse(
                        isSafe=not is_flagged,
                        score=round(
                            max_score,
                            3,
                        ),
                        categories={
                            str(key): round(
                                float(value),
                                3,
                            )
                            for key, value
                            in categories.items()
                        },
                        action=action,
                        message=(
                            "Content flagged for review"
                            if is_flagged
                            else "Content approved"
                        ),
                    )

            except Exception as exc:  # noqa: BLE001
                print(
                    f"[MODERATION] Model {model} "
                    f"failed: {exc}"
                )

    # Safe default fallback when the API is unavailable.
    return ModerationResponse(
        isSafe=True,
        score=0.0,
        categories={},
        action="allow",
        message="Moderation offline — auto-approved",
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT_MODERATION", "8005")),
        reload=False,
    )
