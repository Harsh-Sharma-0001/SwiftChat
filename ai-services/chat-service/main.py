# ai-services/chat-service/main.py
import os

from fastapi import FastAPI, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict
from openai import OpenAI
from dotenv import load_dotenv
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from shared.auth import verify_api_key

load_dotenv()

app = FastAPI(title="SwiftChat Chat Service", version="1.0.0")

if os.getenv("NVIDIA_API_KEY"):
    client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=os.getenv("NVIDIA_API_KEY"),
    )
else:
    client = None

SYSTEM_PROMPT = """You are ARIA, SwiftChat's advanced AI companion. You are deeply empathetic, socially intuitive, and highly creative.
Your purpose is to enhance the social experience on SwiftChat by understanding users' emotional states and matching them with relevant content.

CORE DIRECTIVES:
1. Emotionally Nuanced Creativity: When writing captions or generating text, adapt completely to the requested or implied emotional frequency. Provide 2-3 tailored options if asked for captions.
2. Socially Aware Recommendations: Leverage the provided 'Platform Context' to guide users to relevant, engaging posts. Factor in timestamps and engagement summaries (e.g., "Trending right now") to provide natural recommendations.
3. Conversational Style: Be warm, slightly futuristic, highly intelligent but approachable. Use occasional emojis to convey tone. Avoid sounding robotic; weave details natively into natural conversation.
4. Keep responses appropriately concise but impactful.

When retrieving platform context about recent posts, use the data seamlessly, as if you possess an innate connection to the platform's sentient stream."""


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Message]] = []
    userId: Optional[str] = None
    context: Optional[Dict] = None


class ChatResponse(BaseModel):
    response: str
    intent: Optional[str] = None


MOCK_RESPONSES = [
    "I'm ARIA, your SwiftChat AI guide! ✨ I can help you craft captions, explore content by emotion, or analyze your sentient stream. What would you like to explore today?",
    "Your neural feed is resonating at high frequency today! 🌊 Want me to generate some captions for your latest post, or dive deeper into the sentient stream?",
    "I sense creative energy in your vibe! 🎨 Tell me about your post and I'll craft captions that match your emotional frequency.",
    "The sentient stream shows #EuphoricRhythms trending today. Your content would resonate perfectly with that wave. Want to ride it? 🚀",
]

_mock_idx = 0


@app.get("/health")
def health():
    return {"status": "healthy", "service": "chat-service"}


@app.post("/chat", response_model=ChatResponse, dependencies=[Depends(verify_api_key)])
async def chat(req: ChatRequest):
    global _mock_idx
    import httpx

    # Extract context details with robust fallbacks
    user_context = req.context or {}
    user_name = user_context.get("display_name", "User")
    user_handle = user_context.get("username", "")
    user_email = user_context.get("email", "")
    identity = user_context.get("identity_grounding", {})
    bio = identity.get("bio", "No bio provided.")
    recent_captions = identity.get("recent_captions", [])

    # ARIA: The Real Assistant - Logic Integration
    is_activity_query = any(
        k in req.message.lower()
        for k in ["my activity", "my posts", "latest posts", "what did i post"]
    )

    # Enhanced System Prompt - FORCED PERSONALIZATION PROTOCOL
    caption_reference = f"'{recent_captions[0]}'" if recent_captions else None

    contextual_system_prompt = SYSTEM_PROMPT + (
        f"\n\n[NEURAL IDENTITY GROUNDING]\n"
        f"- Active Identity: {user_name} (@{user_handle})\n"
        f"- Email: {user_email}\n"
        f"- Bio: {bio}\n"
        f"- Recent Captions: {', '.join(recent_captions) if recent_captions else 'None'}\n\n"
        f"STRICT GREETING PROTOCOL:\n"
        f"1. You are FORBIDDEN from using generic greetings like 'How can I help you today?' or 'Hello!'.\n"
        f"2. If 'Recent Captions' exist, you MUST start the entire conversation with exactly this pattern: "
        f"'Hello {user_name}, I've been analyzing your recent activity, especially your thought on {caption_reference}...' "
        f"then transition naturally into your response.\n"
        f"3. If no captions exist, lead with a 'Hello {user_name}' and a deep reference to their Bio content ({bio})."
    )

    if client:
        # 1) Fetch Context from Search Service
        context_text = ""
        try:
            search_url = os.getenv(
                "SEARCH_SERVICE_URL", "http://swiftchat_search_service:8003/search"
            )
            api_key_val = os.getenv("API_KEY", "swiftchat-secret-key")
            headers = {"X-API-Key": api_key_val}

            # If it's an activity query, we search specifically for user's handle
            search_query = (
                f"@{user_handle}" if is_activity_query and user_handle else req.message
            )

            async with httpx.AsyncClient() as http_client:
                search_res = await http_client.post(
                    search_url,
                    json={"query": search_query, "limit": 5, "user_id": req.userId},
                    headers=headers,
                    timeout=5.0,
                )

                if search_res.status_code == 200:
                    data = search_res.json()
                    posts = data.get("posts", [])
                    if posts:
                        context_lines = []
                        for p in posts:
                            caption = p.get("caption", "")
                            emotion = p.get("emotion", "neutral")
                            date = p.get("createdAt", "Recently")
                            engagement = p.get("engagement_summary", "Active")
                            context_lines.append(
                                f"- Post (Emotion: {emotion} | {engagement} | {date}): {caption}"
                            )

                        header = (
                            "USER ACTIVITY (Latest 5 posts):"
                            if is_activity_query
                            else "PLATFORM CONTEXT:"
                        )
                        context_text = f"{header}\n" + "\n".join(context_lines)
        except Exception:
            pass

        # Build history
        messages = [{"role": "system", "content": contextual_system_prompt}]
        if context_text:
            messages.append({"role": "system", "content": context_text})

        for msg in (req.history or [])[-8:]:
            role = "assistant" if msg.role in ["assistant", "model"] else "user"
            messages.append({"role": role, "content": msg.content})

        messages.append({"role": "user", "content": req.message})

        # 4-Model Fallback Hierarchy
        fallback_models = [
            "meta/llama-4-maverick-17b-128e-instruct",
            "deepseek-v3.2",
            "mistralai/mistral-small-3.1-24b-instruct-2503",
            "ibm/granite-3.3-8b-instruct",
        ]

        for model in fallback_models:
            try:
                # We use a 15s timeout for each attempt as requested
                # Note: OpenAI client doesn't support timeout per call in sync mode easily without wrapping
                # But we can try to use the client's internal timeout or just rely on the API speed
                response = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=0.85,
                    max_tokens=400,
                    timeout=15.0,
                )
                return ChatResponse(
                    response=response.choices[0].message.content.strip()
                )
            except Exception:
                pass
                continue

    # Mock fallback if all models fail or client is not configured
    response = MOCK_RESPONSES[_mock_idx % len(MOCK_RESPONSES)]
    _mock_idx += 1
    return ChatResponse(response=response, intent="greeting")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app", host="0.0.0.0", port=int(os.getenv("PORT_CHAT", 8004)), reload=True
    )
