# ai-services/search-service/main.py
import os
from fastapi import FastAPI, Depends
from pydantic import BaseModel
from typing import Optional, List, Any
import pymongo
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
        api_key=os.getenv("NVIDIA_API_KEY")
    )
else:
    client = None

class SearchRequest(BaseModel):
    query: str
    limit: int = 10
    emotion_filter: Optional[str] = None

class SearchResponse(BaseModel):
    posts: List[Any]
    query: str
    total: int
    mode: str  # 'semantic' or 'keyword'

def get_embedding(text: str) -> List[float]:
    """Get text embedding from NVIDIA NIM explicitly specified as query type"""
    response = client.embeddings.create(
        input=[text],
        model="nvidia/nv-embed-v1",
        extra_body={"input_type": "query"}
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

@app.post("/search", response_model=SearchResponse, dependencies=[Depends(verify_api_key)])
async def semantic_search(req: SearchRequest):
    if client:
        try:
            embedding = get_embedding(req.query)
            
            # Use MongoDB Atlas Vector Search Aggregation Pipeline
            posts_collection = get_mongo_collection()
            
            pipeline = [
                {
                    "$vectorSearch": {
                        "index": "vector_index",
                        "path": "embedding",
                        "queryVector": embedding,
                        "numCandidates": max(req.limit * 10, 100),
                        "limit": req.limit
                    }
                },
                {
                    "$match": {"isPublic": True, "isFlagged": False}
                },
                {
                    "$lookup": {
                        "from": "users",
                        "localField": "user",
                        "foreignField": "_id",
                        "as": "author"
                    }
                },
                {
                    "$unwind": "$author"
                },
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
                        "user": {
                            "username": "$author.username",
                            "displayName": "$author.displayName",
                            "avatarUrl": "$author.avatarUrl"
                        }
                    }
                }
            ]
            
            rows = list(posts_collection.aggregate(pipeline))
            
            return SearchResponse(posts=rows, query=req.query, total=len(rows), mode="semantic")
        except Exception as e:
            print(f"Atlas Vector Search error: {e}")
    
    # Fallback to empty — backend keyword fallback engaged
    return SearchResponse(posts=[], query=req.query, total=0, mode="unavailable")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT_SEARCH", 8003)), reload=True)
