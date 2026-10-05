# ai-services/search-service/main.py

import json
import os
import sys
import uuid
from typing import Any, List, Optional

import pymongo
from bson import ObjectId
from bson.errors import InvalidId
from dotenv import load_dotenv
from fastapi import Depends, FastAPI
from openai import OpenAI
from pydantic import BaseModel

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from shared.auth import verify_api_key

load_dotenv()

app = FastAPI(
    title="SwiftChat Search Service",
    version="1.0.0",
)

NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")

if NVIDIA_API_KEY:
    client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=NVIDIA_API_KEY,
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
    total: int


def get_embedding(text: str) -> List[float]:
    """Get a query embedding from the configured NVIDIA NIM model."""

    if client is None:
        return []

    response = client.embeddings.create(
        input=[text],
        model="nvidia/llama-3.2-nemoretriever-300m-embed-v1",
        extra_body={
            "input_type": "query",
            "truncate": "NONE",
        },
    )

    return response.data[0].embedding


def get_mongo_collection():
    uri = os.getenv("MONGODB_URI")

    if not uri:
        raise ValueError(
            "MONGODB_URI is not configured"
        )

    db_client = pymongo.MongoClient(uri)
    db = db_client.get_default_database()

    return db.posts


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "search-service",
    }


@app.post(
    "/search",
    response_model=SearchResponse,
    dependencies=[Depends(verify_api_key)],
)
async def semantic_search(
    req: SearchRequest,
):
    if client is None:
        return SearchResponse(
            posts=[],
            total=0,
        )

    try:
        posts_collection = get_mongo_collection()

        # Base match criteria.
        match_criteria = {
            "isPublic": True,
            "isFlagged": False,
        }

        # Exact emotion matching for mood/tone chips.
        match_criteria["emotion"] = {
            "$regex": f"^{req.query}$",
            "$options": "i",
        }

        if req.user_id:
            try:
                match_criteria["user"] = ObjectId(
                    req.user_id
                )
            except InvalidId:
                # Ignore invalid optional user filters.
                match_criteria.pop(
                    "user",
                    None,
                )

        rows = list(
            posts_collection.find(
                match_criteria
            )
            .sort("createdAt", -1)
            .limit(req.limit)
        )

        # PHASE 1:
        # Direct emotion match.
        for row in rows:
            row["id"] = str(row["_id"])
            del row["_id"]

            author = (
                posts_collection.database.users.find_one(
                    {"_id": row["user"]}
                )
            )

            if author:
                row["user"] = {
                    "username": author.get(
                        "username"
                    ),
                    "displayName": author.get(
                        "displayName"
                    ),
                    "avatarUrl": author.get(
                        "avatarUrl"
                    ),
                }
            else:
                row["user"] = {
                    "username": "unknown",
                    "displayName": "Unknown User",
                }

            row["likesCount"] = len(
                row.get("likes", [])
            )

            row["commentsCount"] = len(
                row.get("comments", [])
            )

        # PHASE 2:
        # Semantic vector search.
        if not rows:
            try:
                embedding = get_embedding(
                    req.query
                )

                if embedding:
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
                        {
                            "$match": {
                                "isPublic": True,
                                "isFlagged": False,
                            }
                        },
                        {
                            "$lookup": {
                                "from": "users",
                                "localField": "user",
                                "foreignField": "_id",
                                "as": "author",
                            }
                        },
                        {
                            "$unwind": "$author"
                        },
                        {
                            "$project": {
                                "_id": 0,
                                "id": {
                                    "$toString": "$_id"
                                },
                                "caption": 1,
                                "mediaUrl": 1,
                                "mediaType": 1,
                                "emotion": 1,
                                "createdAt": 1,
                                "likesCount": {
                                    "$size": {
                                        "$ifNull": [
                                            "$likes",
                                            [],
                                        ]
                                    }
                                },
                                "commentsCount": {
                                    "$size": {
                                        "$ifNull": [
                                            "$comments",
                                            [],
                                        ]
                                    }
                                },
                                "user": {
                                    "username": (
                                        "$author.username"
                                    ),
                                    "displayName": (
                                        "$author.displayName"
                                    ),
                                    "avatarUrl": (
                                        "$author.avatarUrl"
                                    ),
                                },
                            }
                        },
                    ]

                    rows = list(
                        posts_collection.aggregate(
                            pipeline
                        )
                    )

            except Exception as exc:  # noqa: BLE001
                print(
                    f"[SEARCH] Semantic search failed: {exc}"
                )

        # PHASE 3:
        # AI fallback when no real results exist.
        if not rows:
            print(
                f"[SEARCH] No real results for "
                f"'{req.query}'. Triggering AI Fallback."
            )

            final_rows = []

            fallback_models = [
                "meta/llama-4-maverick-17b-128e-instruct",
                "deepseek-v3.2",
                "mistralai/mistral-small-3.1-24b-instruct-2503",
                "ibm/granite-3.3-8b-instruct",
            ]

            prompt = (
                "Generate 4 short, engaging social media "
                f"post captions for the mood: {req.query}. "
                "Return only a JSON array of 4 strings, "
                "nothing else."
            )

            content = None

            for model in fallback_models:
                try:
                    response = (
                        client.chat.completions.create(
                            model=model,
                            messages=[
                                {
                                    "role": "system",
                                    "content": (
                                        "You are a creative "
                                        "social media assistant. "
                                        "Return only a JSON "
                                        "array of strings."
                                    ),
                                },
                                {
                                    "role": "user",
                                    "content": prompt,
                                },
                            ],
                            temperature=0.8,
                            max_tokens=500,
                        )
                    )

                    content = (
                        response.choices[0]
                        .message
                        .content
                        or ""
                    ).strip()

                    if content:
                        break

                    print(
                        f"[SEARCH AI] Model {model} "
                        "returned an empty response."
                    )

                except Exception as exc:  # noqa: BLE001
                    print(
                        f"[SEARCH AI] Fallback {model} "
                        f"failed: {exc}"
                    )

            if content:
                if "```json" in content:
                    content = (
                        content.split(
                            "```json",
                            1,
                        )[1]
                        .split(
                            "```",
                            1,
                        )[0]
                        .strip()
                    )

                elif "```" in content:
                    content = (
                        content.split(
                            "```",
                            1,
                        )[1]
                        .split(
                            "```",
                            1,
                        )[0]
                        .strip()
                    )

                try:
                    captions = json.loads(
                        content
                    )

                    if isinstance(
                        captions,
                        list,
                    ):
                        for index, caption in enumerate(
                            captions[:4]
                        ):
                            final_rows.append(
                                {
                                    "id": (
                                        f"synthetic-"
                                        f"{uuid.uuid4().hex[:8]}"
                                    ),
                                    "caption": str(
                                        caption
                                    ),
                                    "image": (
                                        "https://picsum.photos/"
                                        "seed/"
                                        f"{req.query.lower()}"
                                        f"{index}/400/400"
                                    ),
                                    "mediaUrl": (
                                        "https://picsum.photos/"
                                        "seed/"
                                        f"{req.query.lower()}"
                                        f"{index}/400/400"
                                    ),
                                    "emotion": req.query,
                                    "isSynthetic": True,
                                    "author": {
                                        "displayName": "ARIA",
                                        "username": (
                                            "aria_system"
                                        ),
                                    },
                                    "user": {
                                        "displayName": "ARIA",
                                        "username": (
                                            "aria_system"
                                        ),
                                    },
                                    "createdAt": "Just now",
                                    "likesCount": 42,
                                    "commentsCount": 0,
                                }
                            )

                except (
                    json.JSONDecodeError,
                    TypeError,
                    ValueError,
                ) as exc:
                    print(
                        f"[SEARCH AI] JSON Parse Error: {exc}"
                    )

            return SearchResponse(
                posts=final_rows,
                total=len(final_rows),
            )

        return SearchResponse(
            posts=rows[: req.limit],
            total=len(rows),
        )

    except Exception as exc:  # noqa: BLE001
        print(
            f"[SEARCH] Critical error: {exc}"
        )

        return SearchResponse(
            posts=[],
            total=0,
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT_SEARCH", "8003")),
        reload=False,
    )
