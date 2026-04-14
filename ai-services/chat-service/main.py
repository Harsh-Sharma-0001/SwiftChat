# ai-services/chat-service/main.py
import os
import httpx
import sys

from fastapi import FastAPI, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict
from openai import AsyncOpenAI
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from shared.auth import verify_api_key

load_dotenv()

app = FastAPI(title="SwiftChat Chat Service", version="1.0.0")

NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")

print(f"[ARIA BOOT] API Key loaded: {bool(NVIDIA_API_KEY)}")

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
    print(f"[ARIA DEBUG] Context received: {req.context}")

    # Extract context details with robust fallbacks
    user_context = req.context or {}
    user_name = user_context.get("displayName") or user_context.get("display_name") or "User"
    user_handle = user_context.get("username", "anonymous")
    user_email = user_context.get("email", "hidden")
    identity = user_context.get("identity_grounding", {})
    bio = user_context.get("bio") or identity.get("bio", "No bio provided.")
    recent_captions = identity.get("recent_captions", [])

    # Enhanced System Prompt - FORCED PERSONALIZATION PROTOCOL
    contextual_system_prompt = SYSTEM_PROMPT + (
        f"\n\n[NEURAL IDENTITY GROUNDING]\n"
        f"- Active Identity: {user_name} (@{user_handle})\n"
        f"- Email: {user_email}\n"
        f"- Bio: {bio}\n\n"
        f"STRICT GREETING PROTOCOL:\n"
        f"1. You are FORBIDDEN from using generic greetings like 'How can I help you today?' or 'Hello!'.\n"
        f"2. MANDATORY: You MUST greet the user by name ({user_name}) and mention their bio ({bio}) in your opening sentence. "
        f"For example: 'Hello {user_name}, I see you are a {bio}...'\n"
    )

    # 1) Fetch Context from Search Service
    context_text = ""
    is_activity_query = any(k in req.message.lower() for k in ["my activity", "my posts", "latest posts", "what did i post"])
    
    try:
        search_url = os.getenv("SEARCH_SERVICE_URL", "http://swiftchat_search_service:8003/search")
        api_key_val = os.getenv("API_KEY", "swiftchat-secret-key")
        headers = {"X-API-Key": api_key_val}
        search_query = f"@{user_handle}" if is_activity_query and user_handle else req.message

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
                    context_lines = [
                        f"- Post (Emotion: {p.get('emotion', 'neutral')} | {p.get('engagement_summary', 'Active')} | {p.get('createdAt', 'Recently')}): {p.get('caption', '')}"
                        for p in posts
                    ]
                    header = "USER ACTIVITY (Latest 5 posts):" if is_activity_query else "PLATFORM CONTEXT:"
                    context_text = f"{header}\n" + "\n".join(context_lines)
    except Exception as e:
        print(f"[ARIA] Context fetch failed: {e}")

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

    if NVIDIA_API_KEY:
        for model in fallback_models:
            print(f"[ARIA] Attempting fallback model: {model}")
            try:
                # Use a fresh client with explicit timeout for each attempt as requested
                async with httpx.AsyncClient(timeout=15.0) as http_client:
                    client = AsyncOpenAI(api_key=NVIDIA_API_KEY, base_url=NVIDIA_BASE_URL, http_client=http_client)
                    response = await client.chat.completions.create(
                        model=model,
                        messages=messages,
                        temperature=0.85,
                        max_tokens=400
                    )
                    print(f"[ARIA] Using model success: {model}")
                    return ChatResponse(response=response.choices[0].message.content.strip())
            except Exception as e:
                print(f"[ARIA] Model {model} failed: {e}")
                continue

        # If we reach here, all fallbacks failed
        return ChatResponse(response="ARIA is currently unavailable. Please try again shortly.")

    # Mock fallback if key is missing
    response = MOCK_RESPONSES[_mock_idx % len(MOCK_RESPONSES)]
    _mock_idx += 1
    return ChatResponse(response=response, intent="greeting")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT_CHAT", 8004)), reload=True)

