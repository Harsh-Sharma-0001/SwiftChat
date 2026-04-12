# ai-services/search-service/main.py
import os
from fastapi import FastAPI, Depends
from pydantic import BaseModel
from typing import Optional, List, Any
import pymongo
from bson import ObjectId
import httpx
import uuid
from openai import OpenAI
from dotenv import load_dotenv
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from shared.auth import verify_api_key

load_dotenv()

app = FastAPI(title="SwiftChat Search Service", version="1.0.0")

if os.getenv("NVIDIA_API_KEY"):
    client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=os.getenv("NVIDIA_API_KEY"),
    )
else:
    client = None


class SearchRequest(BaseModel):
    query: str
    limit: int = 7
    emotion_filter: Optional[str] = None
    user_id: Optional[str] = None


class SearchResponse(BaseModel):
    posts: List[Any]
    query: str
    total: int
    mode: str  # 'semantic' or 'keyword'


def get_embedding(text: str) -> List[float]:
    """Get text embedding from NVIDIA NIM explicitly specified as query type"""
    response = client.embeddings.create(
        input=[text],
        model="nvidia/llama-3.2-nemoretriever-300m-embed-v1",
        extra_body={"input_type": "query", "truncate": "NONE"},
    )
    return response.data[0].embedding


def get_mongo_collection():
    uri = os.getenv("MONGODB_URI")
    db_client = pymongo.MongoClient(uri)
    # The Mongoose models will save documents inside 'posts' and 'users' collections
    # of the database specified in the URI
    db = db_client.get_default_database()
    return db.posts


@app.get("/health")
def health():
    return {"status": "healthy", "service": "search-service"}


@app.post(
    "/search", response_model=SearchResponse, dependencies=[Depends(verify_api_key)]
)
async def semantic_search(req: SearchRequest):
    if client:
        try:
            embedding = get_embedding(req.query)

            # Use MongoDB Atlas Vector Search Aggregation Pipeline
            posts_collection = get_mongo_collection()

            # Base match criteria
            match_criteria = {"isPublic": True, "isFlagged": False}
            if req.user_id:
                try:
                    match_criteria["user"] = ObjectId(req.user_id)
                except Exception:
                    pass  # Invalid ID, ignore filter or handle as error

            pipeline = [
                {
                    "$vectorSearch": {
                        "index": "vector_index",
                        "path": "embedding",
                        "queryVector": embedding,
                        "numCandidates": 150,
                        "limit": 50,
                    }
                },
                {"$match": match_criteria},
                {
                    "$lookup": {
                        "from": "users",
                        "localField": "user",
                        "foreignField": "_id",
                        "as": "author",
                    }
                },
                {"$unwind": "$author"},
                {
                    "$project": {
                        "_id": 0,
                        "id": {"$toString": "$_id"},
                        "caption": 1,
                        "mediaUrl": 1,
                        "mediaType": 1,
                        "emotion": 1,
                        "moodScore": 1,
                        "createdAt": 1,
                        "likesCount": {"$size": {"$ifNull": ["$likes", []]}},
                        "commentsCount": {"$size": {"$ifNull": ["$comments", []]}},
                        "user": {
                            "username": "$author.username",
                            "displayName": "$author.displayName",
                            "avatarUrl": "$author.avatarUrl",
                        },
                    }
                },
            ]

            rows = list(posts_collection.aggregate(pipeline))

            if rows:
                # Add synthetic engagement summary
                for r in rows:
                    r["engagement_summary"] = (
                        "Trending" if r.get("likesCount", 0) > 50 else "Active"
                    )

                # Reranking payload preparation
                passages = []
                for idx, r in enumerate(rows):
                    caption = r.get("caption", "")
                    emotion = r.get("emotion", "neutral")
                    user = r.get("user", {}).get("username", "unknown")
                    # Combine context for reranker to evaluate
                    passage_text = (
                        f"User: @{user} | Emotion: {emotion} | Context: {caption}"
                    )
                    passages.append({"text": passage_text})

                rerank_payload = {
                    "model": "nv-rerank-qa-mistral-4b:1",
                    "query": req.query,
                    "passages": passages,
                }

                async with httpx.AsyncClient() as http_client:
                    res = await http_client.post(
                        "https://ai.api.nvidia.com/v1/retrieval/nvidia/reranking",
                        json=rerank_payload,
                        headers={
                            "Authorization": f"Bearer {os.getenv('NVIDIA_API_KEY')}",
                            "Content-Type": "application/json",
                        },
                        timeout=15.0,
                    )
                    res.raise_for_status()
                    rank_data = res.json()

                rankings = rank_data.get("rankings", [])

            if rows:
                # ... (existing reranking logic) ...
                rankings = rank_data.get("rankings", [])
                reranked_rows = [rows[rank["index"]] for rank in rankings]
                final_rows = reranked_rows[: req.limit]
            else:
                # SEARCH DISCOVERY: Imagine 3 trending posts if results are 0
                final_rows = []
                try:
                    prompt = f"Imagine 3 highly engaging social media posts for the vibe: '{req.query}'. Return ONLY a JSON list of objects with 'caption' and 'mood' (VIBRANT, DEEP, or ETHEREAL)."

                    response = client.chat.completions.create(
                        model="google/gemma-3-27b-it",
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.8,
                        max_tokens=500,
                    )

                    content = response.choices[0].message.content.strip()
                    # Basic JSON cleanup if model adds markdown
                    if "```json" in content:
                        content = content.split("```json")[1].split("```")[0].strip()
                    elif "```" in content:
                        content = content.split("```")[1].split("```")[0].strip()

                    import json

                    imagined = json.loads(content)

                    for i, item in enumerate(imagined[:3]):
                        mood = item.get("mood", "VIBRANT").upper()
                    # Mood to Photo-ID Mapping for 100% Reliability
                    MOOD_IMAGE_MAPPING = {
                        "CINEMATIC": "photo-1485846234645-a62644efbdc1",
                        "POETIC": "photo-1444703686981-a3abbc4d4fe3",
                        "CYBERPUNK": "photo-1510511459019-5deecc729f6a",
                        "MINIMALIST": "photo-1494438639946-1ebd1d20bf85",
                        "ETHEREAL": "photo-1464822759023-fed622ff2c3b",
                        "VIBRANT": "photo-1550684848-fac1c5b4e853",
                        "DEEP": "photo-1502134249126-9f3755a50d78",
                        "SARCASTIC": "photo-1531259683007-016a7b628fc3",
                        "GEN-Z": "photo-1523240715632-b8aee269c41a",
                        "DARK": "photo-1514539079130-25950c84af65",
                        "CRYSTAL": "photo-1515516089376-88db1e26e9c0",
                    }

                    for i, item in enumerate(imagined[:3]):
                        mood = item.get("mood", "VIBRANT").upper()
                        # Use mapped ID or a reliable random one if not found
                        photo_id = MOOD_IMAGE_MAPPING.get(
                            mood, "photo-1493612276216-ee3925520721"
                        )
                        mediaUrl = f"https://images.unsplash.com/{photo_id}?auto=format&fit=crop&w=600&q=80"

                        final_rows.append(
                            {
                                "id": f"synthetic-{str(uuid.uuid4())[:8]}",
                                "caption": item.get("caption", ""),
                                "mediaUrl": mediaUrl,
                                "mediaType": "image",
                                "emotion": mood,
                                "user": {
                                    "username": "aria_imagined",
                                    "displayName": "ARIA Synthetic Feed",
                                    "avatarUrl": "https://api.dicebear.com/7.x/bottts/svg?seed=aria",
                                },
                                "createdAt": "Just now",
                                "likesCount": 99,
                                "commentsCount": 5,
                                "engagement_summary": "Trending Vibe",
                            }
                        )
                except Exception:
                    pass
                    final_rows = []

            return SearchResponse(
                posts=final_rows,
                query=req.query,
                total=len(final_rows),
                mode="semantic-reranked" if rows else "synthetic-discovery",
            )
        except Exception:
            pass

    # Fallback to empty — backend keyword fallback engaged
    return SearchResponse(posts=[], query=req.query, total=0, mode="unavailable")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT_SEARCH", 8003)),
        reload=True,
    )
