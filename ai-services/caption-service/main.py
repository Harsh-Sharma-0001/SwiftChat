# ai-services/caption-service/main.py
import os
import json
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from openai import OpenAI
from dotenv import load_dotenv
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from shared.auth import verify_api_key

load_dotenv()

app = FastAPI(title="SwiftChat Caption Service", version="1.0.0")

if os.getenv("NVIDIA_API_KEY"):
    client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=os.getenv("NVIDIA_API_KEY")
    )
else:
    client = None

TONE_PROMPTS = {
    "witty": "clever and humorous with wordplay",
    "funny": "laugh-out-loud funny with emojis",
    "heartfelt": "emotionally touching and genuine",
    "professional": "polished, professional, brand-friendly",
    "ethereal": "dreamy, poetic, and mystical",
    "vibrant": "energetic, bold, and exciting",
    "deep": "thought-provoking and philosophical",
}

class CaptionRequest(BaseModel):
    prompt: Optional[str] = None
    tone: str = "witty"
    imageUrl: Optional[str] = None
    count: int = 3

class CaptionDraft(BaseModel):
    text: str
    mood: str

class CaptionResponse(BaseModel):
    captions: List[CaptionDraft]

MOCK_CAPTIONS = {
    "witty": [
        {"text": "When the algorithm finally understands your vibe ⚡ #NeuralMatch", "mood": "VIBRANT"},
        {"text": "404: Chill not found. Uploading more chaos... 🌀", "mood": "DEEP"},
        {"text": "My aesthetic finally loaded. Please stand by for pure art. 🎨", "mood": "ETHEREAL"},
    ],
    "funny": [
        {"text": "Me: I'm fine. Also me: 🤯", "mood": "VIBRANT"},
        {"text": "If my vibe was a loading bar, it'd be stuck at 69% forever. 😂", "mood": "DEEP"},
        {"text": "Living my best glitchy simulation life. 🎮 #BugFeatures", "mood": "ETHEREAL"},
    ],
    "heartfelt": [
        {"text": "Every pixel of this moment matters. Grateful for the frequencies that led here. ✨", "mood": "VIBRANT"},
        {"text": "Found beauty in the noise today. Sometimes clarity hides in the chaos. 💫", "mood": "DEEP"},
        {"text": "The heart knows what the algorithm can't compute. Stay soft. 🌸", "mood": "ETHEREAL"},
    ],
    "ethereal": [
        {"text": "Catching light and feelings in the heart of the digital neon. ⚡ Exploring the boundaries between reality and the interface.", "mood": "VIBRANT"},
        {"text": "Just another glitch in the beautiful simulation we call home. Ready for the upgrade? 🚀", "mood": "DEEP"},
        {"text": "Lost in the frequency of a midnight dream. Where code meets soul. 🌌 #FutureVibes", "mood": "ETHEREAL"},
    ],
}

@app.get("/health")
def health():
    return {"status": "healthy", "service": "caption-service"}

@app.post("/generate", response_model=CaptionResponse, dependencies=[Depends(verify_api_key)])
async def generate_captions(req: CaptionRequest):
    tone = req.tone.lower() if req.tone.lower() in TONE_PROMPTS else "witty"
    
    if client:
        try:
            tone_desc = TONE_PROMPTS.get(tone, "witty and clever")
            context = f"Image context: {req.prompt}" if req.prompt else "a stunning visual post"
            
            system_prompt = f"""You are a creative social media caption writer for SwiftChat, 
an AI-powered emotion-aware platform. Generate exactly {req.count} unique captions.
Style: {tone_desc}. Each caption should feel authentic, include relevant emojis, 
and be under 150 characters. Return ONLY valid JSON in this exact format: {{"captions": [{{"text": "...", "mood": "VIBRANT|DEEP|ETHEREAL"}}]}}"""
            
            response = client.chat.completions.create(
                model="llama-3.1-nemotron-nano-8b-v1",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Create captions for: {context}"}
                ],
                temperature=0.7,
                max_tokens=600,
            )
            content = response.choices[0].message.content
            # Remove markdown if returned
            if content.startswith("```json"):
                content = content.replace("```json\n", "").replace("\n```", "")
            elif content.startswith("```"):
                content = content.replace("```\n", "").replace("\n```", "")
                
            result = json.loads(content)
            return CaptionResponse(captions=[CaptionDraft(**c) for c in result["captions"][:req.count]])
        except Exception as e:
            print(f"NVIDIA NIM error: {e}")
    
    # Fallback mock
    mock = MOCK_CAPTIONS.get(tone, MOCK_CAPTIONS["witty"])
    if req.prompt:
        mock[0]["text"] = f"{req.prompt} — where every moment resonates. ✨"
    return CaptionResponse(captions=[CaptionDraft(**c) for c in mock[:req.count]])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT_CAPTION", 8001)), reload=True)
