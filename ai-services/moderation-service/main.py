# ai-services/moderation-service/main.py
import os
import json
from fastapi import FastAPI, Depends
from pydantic import BaseModel
from typing import Optional
from openai import OpenAI
from dotenv import load_dotenv
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from shared.auth import verify_api_key

load_dotenv()

app = FastAPI(title="SwiftChat Moderation Service", version="1.0.0")

if os.getenv("NVIDIA_API_KEY"):
    client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=os.getenv("NVIDIA_API_KEY")
    )
else:
    client = None

TOXICITY_THRESHOLD = 0.7

class ModerationRequest(BaseModel):
    text: Optional[str] = None
    imageUrl: Optional[str] = None

class ModerationResponse(BaseModel):
    isSafe: bool
    score: float
    categories: dict
    action: str  # 'allow', 'flag', 'block'
    message: str

@app.get("/health")
def health():
    return {"status": "healthy", "service": "moderation-service"}

@app.post("/moderate", response_model=ModerationResponse, dependencies=[Depends(verify_api_key)])
async def moderate(req: ModerationRequest):
    if not req.text and not req.imageUrl:
        return ModerationResponse(isSafe=True, score=0.0, categories={}, action="allow", message="No content to moderate")
    
    if client and req.text:
        try:
            # Emulate moderation using NIM LLaMA format
            prompt = """Analyze the following text for toxicity, hate speech, harassment, and explicit content.
Return ONLY valid JSON in this precise format: {"flagged": true/false, "max_score": 0.0-1.0, "categories": {"hate": 0.0, "harassment": 0.0, "explicit": 0.0, "toxicity": 0.0}}"""
            
            response = client.chat.completions.create(
                model="llama-3.1-nemotron-nano-8b-v1",
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": req.text}
                ],
                temperature=0.1,
                max_tokens=200,
            )
            content = response.choices[0].message.content
            if content.startswith("```json"):
                content = content.replace("```json\n", "").replace("\n```", "")
            elif content.startswith("```"):
                content = content.replace("```\n", "").replace("\n```", "")
                
            result = json.loads(content)
            
            max_score = float(result.get("max_score", 0.0))
            is_flagged = bool(result.get("flagged", False))
            categories = result.get("categories", {})
            
            action = "block" if is_flagged and max_score > TOXICITY_THRESHOLD else "flag" if is_flagged else "allow"
            
            return ModerationResponse(
                isSafe=not is_flagged,
                score=round(max_score, 3),
                categories={k: round(float(v), 3) for k, v in categories.items()},
                action=action,
                message="Content flagged for review" if is_flagged else "Content approved"
            )
        except Exception as e:
            pass
    
    # Safe default (fallback when API unavailable)
    return ModerationResponse(
        isSafe=True, score=0.0, categories={},
        action="allow", message="Moderation offline — auto-approved"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT_MODERATION", 8005)), reload=True)
