# ai-services/chat-service/main.py
import os
import json
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
        api_key=os.getenv("NVIDIA_API_KEY")
    )
else:
    client = None

SYSTEM_PROMPT = """You are ARIA, SwiftChat's AI assistant — an emotion-aware, helpful guide 
on a futuristic social media platform. You help users:
1. Generate creative captions for their posts (ask for tone preference: witty, ethereal, deep, heartfelt)
2. Discover content by emotion ("Show me calm posts", "Find inspired creators")
3. Navigate the platform (explain features, guide to sections)
4. Analyze their emotional patterns and sentient stream data
5. Suggest people to connect with based on emotional resonance

Keep responses concise (< 100 words), warm, slightly futuristic in tone. Use occasional emojis.
When generating captions, always provide 2-3 options with different moods."""

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Message]] = []
    userId: Optional[str] = None

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
    
    if client:
        try:
            # Build history natively mapped to OpenAI spec
            messages = [{"role": "system", "content": SYSTEM_PROMPT}]
            for msg in (req.history or [])[-8:]:
                # Map to system/user/assistant
                role = "assistant" if msg.role in ["assistant", "model"] else "user"
                messages.append({"role": role, "content": msg.content})
            
            messages.append({"role": "user", "content": req.message})

            response = client.chat.completions.create(
                model="llama-3.1-nemotron-nano-8b-v1",
                messages=messages,
                temperature=0.85,
                max_tokens=200,
            )
            return ChatResponse(response=response.choices[0].message.content.strip())
        except Exception as e:
            print(f"Chat service error: {e}")
    
    # Mock rotation
    response = MOCK_RESPONSES[_mock_idx % len(MOCK_RESPONSES)]
    _mock_idx += 1
    return ChatResponse(response=response, intent="greeting")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT_CHAT", 8004)), reload=True)
