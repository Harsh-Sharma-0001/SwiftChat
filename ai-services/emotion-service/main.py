# ai-services/emotion-service/main.py
import os
import json
from fastapi import FastAPI, Depends
from pydantic import BaseModel
from typing import Optional, List
from openai import OpenAI
from dotenv import load_dotenv
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from shared.auth import verify_api_key

load_dotenv()

app = FastAPI(title="SwiftChat Emotion Service", version="1.0.0")

if os.getenv("NVIDIA_API_KEY"):
    client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=os.getenv("NVIDIA_API_KEY")
    )
else:
    client = None

EMOTION_VIBES = {
    "joy": "Electric", "happiness": "Electric", "euphoria": "Electric",
    "calm": "Resonant", "peace": "Resonant", "serenity": "Resonant",
    "melancholy": "Indigo", "sadness": "Indigo", "loneliness": "Indigo",
    "inspired": "Vivid", "creative": "Vivid", "motivated": "Vivid",
    "energetic": "Pulse", "excited": "Pulse", "restless": "Pulse",
    "nostalgic": "Amber", "reflective": "Amber",
    "zen": "Crystal", "focused": "Crystal", "deep": "Crystal",
}

class EmotionRequest(BaseModel):
    text: str

class EmotionResponse(BaseModel):
    emotion: str
    score: float
    vibe: str
    tags: List[str]

@app.get("/health")
def health():
    return {"status": "healthy", "service": "emotion-service"}

@app.post("/analyze", response_model=EmotionResponse, dependencies=[Depends(verify_api_key)])
async def analyze_emotion(req: EmotionRequest):
    text_lower = req.text.lower()
    
    if client:
        try:
            prompt = """Analyze the emotion in the following text. 
Return ONLY valid JSON in this format: {"emotion": "primary emotion name", "score": 0.0-1.0, 
"tags": ["tag1", "tag2"]}. Keep emotion as one word."""
            
            response = client.chat.completions.create(
                model="llama-3.1-nemotron-nano-8b-v1",
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": req.text}
                ],
                temperature=0.3,
                max_tokens=200,
            )
            content = response.choices[0].message.content
            if content.startswith("```json"):
                content = content.replace("```json\n", "").replace("\n```", "")
            elif content.startswith("```"):
                content = content.replace("```\n", "").replace("\n```", "")
            
            result = json.loads(content)
            emotion = result.get("emotion", "Neutral").lower()
            vibe = EMOTION_VIBES.get(emotion, "Electric")
            return EmotionResponse(
                emotion=emotion.capitalize(),
                score=result.get("score", 0.75),
                vibe=vibe,
                tags=result.get("tags", [emotion])
            )
        except Exception as e:
            print(f"NVIDIA NIM emotion error: {e}")
    
    # Keyword-based fallback
    for keyword, vibe in EMOTION_VIBES.items():
        if keyword in text_lower:
            return EmotionResponse(emotion=keyword.capitalize(), score=0.75, vibe=vibe, tags=[keyword])
    
    return EmotionResponse(emotion="Neutral", score=0.5, vibe="Electric", tags=["neutral"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT_EMOTION", 8002)), reload=True)
