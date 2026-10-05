# ai-services/chat-service/main.py

import os
import sys
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

import httpx
from bson.errors import InvalidId
from bson.objectid import ObjectId
from dateutil import parser as date_parser
from dotenv import load_dotenv
from fastapi import Depends, FastAPI
from openai import AsyncOpenAI
from pydantic import BaseModel
from pymongo import MongoClient
from pymongo.errors import PyMongoError

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from shared.auth import verify_api_key

load_dotenv()

app = FastAPI(
    title="SwiftChat Chat Service",
    version="1.0.0",
)

NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")

MONGODB_URI = os.getenv(
    "MONGODB_URI",
    "mongodb://localhost:27017/swiftchat",
)

try:
    mongo_client = MongoClient(MONGODB_URI)
    db = mongo_client.get_default_database()

    print(
        f"[ARIA BOOT] Connected to MongoDB database: {db.name}"
    )

except PyMongoError as exc:
    print(
        f"[ARIA BOOT] MongoDB connection failed: {exc}"
    )
    db = None

print(
    f"[ARIA BOOT] API Key loaded: {bool(NVIDIA_API_KEY)}"
)


SYSTEM_PROMPT = """You are ARIA, SwiftChat's advanced AI companion. You are deeply empathetic, socially intuitive, and highly creative.
Your purpose is to enhance the social experience on SwiftChat by understanding users' emotional states and matching them with relevant content.

CORE DIRECTIVES:
1. Emotionally Nuanced Creativity: When writing captions or generating text, adapt completely to the requested or implied emotional frequency. Provide 2-3 tailored options if asked for captions.
2. Socially Aware Recommendations: Leverage the provided 'Platform Context' to guide users to relevant, engaging posts. Factor in timestamps and engagement summaries (e.g., "Trending right now") to provide natural recommendations.
3. Conversational Style: Be warm, slightly futuristic, highly intelligent but approachable. Use occasional emojis to convey tone. Avoid sounding robotic; weave details natively into natural conversation.
4. Keep responses appropriately concise but impactful.
5. Strict Anti-Hallucination: When [REAL-TIME USER DATA] is provided, you MUST use it verbatim. Never guess or hallucinate post counts, dates, or content.

When retrieving platform context about recent posts, use the data seamlessly, as if you possess an innate connection to the platform's sentient stream."""


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Message]] = None
    userId: Optional[str] = None
    context: Optional[Dict] = None


class ChatResponse(BaseModel):
    response: str
    intent: Optional[str] = None


MOCK_RESPONSES = [
    (
        "I'm ARIA, your SwiftChat AI guide! ✨ "
        "I can help you craft captions, explore content by emotion, "
        "or analyze your sentient stream. What would you like to explore today?"
    ),
    (
        "Your neural feed is resonating at high frequency today! 🌊 "
        "Want me to generate some captions for your latest post, "
        "or dive deeper into the sentient stream?"
    ),
    (
        "I sense creative energy in your vibe! 🎨 "
        "Tell me about your post and I'll craft captions that match "
        "your emotional frequency."
    ),
    (
        "The sentient stream shows #EuphoricRhythms trending today. "
        "Your content would resonate perfectly with that wave. "
        "Want to ride it? 🚀"
    ),
]

_mock_idx = 0


def execute_data_query(
    user_id: str,
    message: str,
) -> str:
    if db is None or not user_id:
        return ""

    msg_low = (
        message.lower()
        .replace("?", "")
        .replace(".", "")
        .replace("!", "")
    )

    try:
        user_obj_id = ObjectId(user_id)
    except InvalidId:
        return ""

    try:
        if any(
            keyword in msg_low
            for keyword in ["first post", "oldest post"]
        ):
            post = db.posts.find_one(
                {"user": user_obj_id},
                sort=[("createdAt", 1)],
            )

            if post:
                likes_count = db.likes.count_documents(
                    {"post": post["_id"]}
                )
                comments_count = db.comments.count_documents(
                    {"post": post["_id"]}
                )

                return (
                    'Query: "first post"\n'
                    f'Result: Post from {post.get("createdAt")} | '
                    f'Caption: "{post.get("caption", "")}" | '
                    f"Likes: {likes_count} | "
                    f"Comments: {comments_count}"
                )

            return "No posts found matching that query."

        if any(
            keyword in msg_low
            for keyword in [
                "last post",
                "latest post",
                "recent post",
                "newest post",
            ]
        ):
            post = db.posts.find_one(
                {"user": user_obj_id},
                sort=[("createdAt", -1)],
            )

            if post:
                likes_count = db.likes.count_documents(
                    {"post": post["_id"]}
                )
                comments_count = db.comments.count_documents(
                    {"post": post["_id"]}
                )

                return (
                    'Query: "last post"\n'
                    f'Result: Post from {post.get("createdAt")} | '
                    f'Caption: "{post.get("caption", "")}" | '
                    f"Likes: {likes_count} | "
                    f"Comments: {comments_count}"
                )

            return "No posts found matching that query."

        if any(
            keyword in msg_low
            for keyword in ["most liked post", "popular post"]
        ):
            posts = list(
                db.posts.find({"user": user_obj_id})
            )

            if posts:
                best_post = None
                max_likes = -1

                for post in posts:
                    likes_count = db.likes.count_documents(
                        {"post": post["_id"]}
                    )

                    if likes_count > max_likes:
                        max_likes = likes_count
                        best_post = post

                if best_post:
                    comments_count = db.comments.count_documents(
                        {"post": best_post["_id"]}
                    )

                    return (
                        'Query: "most liked post"\n'
                        f'Result: Post from '
                        f'{best_post.get("createdAt")} | '
                        f'Caption: "{best_post.get("caption", "")}" | '
                        f"Likes: {max_likes} | "
                        f"Comments: {comments_count}"
                    )

            return "No posts found matching that query."

        if any(
            keyword in msg_low
            for keyword in ["most commented post", "most comments"]
        ):
            posts = list(
                db.posts.find({"user": user_obj_id})
            )

            if posts:
                best_post = None
                max_comments = -1

                for post in posts:
                    comment_count = db.comments.count_documents(
                        {"post": post["_id"]}
                    )

                    if comment_count > max_comments:
                        max_comments = comment_count
                        best_post = post

                if best_post:
                    likes_count = db.likes.count_documents(
                        {"post": best_post["_id"]}
                    )

                    return (
                        'Query: "most commented post"\n'
                        f'Result: Post from '
                        f'{best_post.get("createdAt")} | '
                        f'Caption: "{best_post.get("caption", "")}" | '
                        f"Likes: {likes_count} | "
                        f"Comments: {max_comments}"
                    )

            return "No posts found matching that query."

        if any(
            keyword in msg_low
            for keyword in [
                "how many posts",
                "post count",
                "total posts",
            ]
        ):
            count = db.posts.count_documents(
                {"user": user_obj_id}
            )

            return (
                'Query: "post count"\n'
                f"Result: You have made {count} posts in total."
            )

        has_date_intent = any(
            keyword in msg_low
            for keyword in [
                "post on",
                "post from",
                "post in",
            ]
        )

        if has_date_intent:
            if "post on" in msg_low:
                date_str = msg_low.split(
                    "post on",
                    1,
                )[1]
            elif "post from" in msg_low:
                date_str = msg_low.split(
                    "post from",
                    1,
                )[1]
            else:
                date_str = msg_low.split(
                    "post in",
                    1,
                )[1]

            date_str = date_str.strip()

            if date_str:
                try:
                    dt = date_parser.parse(
                        date_str,
                        fuzzy=True,
                    )

                    start_of_day = datetime(
                        dt.year,
                        dt.month,
                        dt.day,
                        tzinfo=timezone.utc,
                    )

                    end_of_day = (
                        start_of_day
                        + timedelta(days=1)
                    )

                    posts = list(
                        db.posts.find(
                            {
                                "user": user_obj_id,
                                "createdAt": {
                                    "$gte": start_of_day,
                                    "$lt": end_of_day,
                                },
                            }
                        )
                    )

                    if posts:
                        summaries = []

                        for index, post in enumerate(
                            posts[:3]
                        ):
                            summaries.append(
                                f'Post {index + 1} at '
                                f'{post.get("createdAt")}: '
                                f'"{post.get("caption", "")}"'
                            )

                        return (
                            f'Query: "posts on '
                            f'{dt.strftime("%Y-%m-%d")}"\n'
                            f"Result: Found {len(posts)} posts. "
                            "Sample: "
                            + " | ".join(summaries)
                        )

                    return "No posts found matching that query."

                except (
                    ValueError,
                    OverflowError,
                ) as parse_err:
                    print(
                        f"[ARIA] Date Parse Error: {parse_err}"
                    )

        if any(
            keyword in msg_low
            for keyword in [
                "has comment",
                "which posts have comments",
                "any post with comment",
                "post with a comment",
            ]
        ):
            posts = list(
                db.posts.find({"user": user_obj_id})
            )

            if posts:
                posts_with_comments = []

                for post in posts:
                    comment_count = (
                        db.comments.count_documents(
                            {"post": post["_id"]}
                        )
                    )

                    if comment_count > 0:
                        posts_with_comments.append(
                            (post, comment_count)
                        )

                if posts_with_comments:
                    summaries = [
                        (
                            f'Post from {post.get("createdAt")} '
                            f"(Comments: {comment_count}): "
                            f'"{post.get("caption", "")}"'
                        )
                        for post, comment_count
                        in posts_with_comments[:5]
                    ]

                    return (
                        'Query: "posts with comments"\n'
                        f"Result: Found "
                        f"{len(posts_with_comments)} "
                        "matching posts. Sample: "
                        + " | ".join(summaries)
                    )

            return "No posts with comments found."

        if any(
            keyword in msg_low
            for keyword in [
                "my posts",
                "all my posts",
                "list my posts",
            ]
        ):
            posts = list(
                db.posts.find(
                    {"user": user_obj_id},
                    sort=[("createdAt", -1)],
                    limit=5,
                )
            )

            if posts:
                summaries = []

                for post in posts:
                    like_count = db.likes.count_documents(
                        {"post": post["_id"]}
                    )
                    comment_count = db.comments.count_documents(
                        {"post": post["_id"]}
                    )

                    summaries.append(
                        f'Post from {post.get("createdAt")} '
                        f"(Likes: {like_count}, "
                        f"Comments: {comment_count}): "
                        f'"{post.get("caption", "")}"'
                    )

                return (
                    'Query: "list my posts"\n'
                    "Result: "
                    + " | ".join(summaries)
                )

            return "No posts found matching that query."

        if any(
            keyword in msg_low
            for keyword in [
                "followers count",
                "how many followers",
            ]
        ):
            user = db.users.find_one(
                {"_id": user_obj_id},
                {"followers": 1},
            )

            followers_count = (
                len(user.get("followers", []))
                if user
                else 0
            )

            return (
                'Query: "followers count"\n'
                f"Result: You have "
                f"{followers_count} followers."
            )

        if any(
            keyword in msg_low
            for keyword in [
                "following count",
                "how many following",
                "who i follow",
            ]
        ):
            user = db.users.find_one(
                {"_id": user_obj_id},
                {"following": 1},
            )

            following_count = (
                len(user.get("following", []))
                if user
                else 0
            )

            return (
                'Query: "following count"\n'
                f"Result: You are following "
                f"{following_count} people."
            )

    except PyMongoError as exc:
        print(
            f"[ARIA] execute_data_query database error: {exc}"
        )

    return ""


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "chat-service",
    }


@app.post(
    "/chat",
    response_model=ChatResponse,
    dependencies=[Depends(verify_api_key)],
)
async def chat(req: ChatRequest):
    global _mock_idx

    print(
        f"[ARIA DEBUG] Context received: {req.context}"
    )

    user_context = req.context or {}

    user_name = (
        user_context.get("displayName")
        or user_context.get("display_name")
        or "User"
    )

    user_handle = user_context.get(
        "username",
        "anonymous",
    )

    user_email = user_context.get(
        "email",
        "hidden",
    )

    identity = user_context.get(
        "identity_grounding",
        {},
    )

    bio = (
        user_context.get("bio")
        or identity.get(
            "bio",
            "No bio provided.",
        )
    )

    contextual_system_prompt = SYSTEM_PROMPT + (
        "\n\n[NEURAL IDENTITY GROUNDING]\n"
        f"- Active Identity: {user_name} (@{user_handle})\n"
        f"- Email: {user_email}\n"
        f"- Bio: {bio}\n\n"
        "STRICT GREETING PROTOCOL:\n"
        "1. You are FORBIDDEN from using generic greetings like "
        "'How can I help you today?' or 'Hello!'.\n"
        f"2. MANDATORY: You MUST greet the user by name "
        f"({user_name}) and mention their bio ({bio}) "
        "in your opening sentence. "
        f"For example: 'Hello {user_name}, "
        f"I see you are a {bio}...'\n"
    )

    has_real_data = False
    context_text = ""

    if req.userId:
        real_data_summary = execute_data_query(
            req.userId,
            req.message,
        )

        if real_data_summary:
            context_text = (
                "[REAL-TIME USER DATA - USE THIS EXACTLY, "
                "DO NOT HALLUCINATE]:\n"
                f"{real_data_summary}\n"
                "INSTRUCTION: Answer the user's question "
                "using ONLY the above real data. "
                "Do not invent numbers or dates.\n"
            )

            has_real_data = True

    is_activity_query = any(
        keyword in req.message.lower()
        for keyword in [
            "my activity",
            "my posts",
            "latest posts",
            "what did i post",
        ]
    )

    if not has_real_data:
        try:
            search_url = os.getenv(
                "SEARCH_SERVICE_URL",
                "http://swiftchat_search_service:8003/search",
            )

            api_key_val = os.getenv(
                "API_KEY",
                "swiftchat-secret-key",
            )

            headers = {
                "X-API-Key": api_key_val,
            }

            search_query = (
                f"@{user_handle}"
                if is_activity_query and user_handle
                else req.message
            )

            async with httpx.AsyncClient() as http_client:
                search_res = await http_client.post(
                    search_url,
                    json={
                        "query": search_query,
                        "limit": 5,
                        "user_id": req.userId,
                    },
                    headers=headers,
                    timeout=5.0,
                )

                if search_res.status_code == 200:
                    data = search_res.json()
                    posts = data.get("posts", [])

                    if posts:
                        context_lines = [
                            (
                                f"- Post (Emotion: "
                                f"{post.get('emotion', 'neutral')} | "
                                f"{post.get('engagement_summary', 'Active')} | "
                                f"{post.get('createdAt', 'Recently')}): "
                                f"{post.get('caption', '')}"
                            )
                            for post in posts
                        ]

                        header = (
                            "USER ACTIVITY (Latest 5 posts):"
                            if is_activity_query
                            else "PLATFORM CONTEXT:"
                        )

                        context_text = (
                            f"{header}\n"
                            + "\n".join(context_lines)
                        )

        except (
            httpx.HTTPError,
            ValueError,
            TypeError,
        ) as exc:
            print(
                f"[ARIA] Context fetch failed: {exc}"
            )

    messages = [
        {
            "role": "system",
            "content": contextual_system_prompt,
        }
    ]

    if context_text:
        messages.append(
            {
                "role": "system",
                "content": context_text,
            }
        )

    for msg in (req.history or [])[-8:]:
        role = (
            "assistant"
            if msg.role in ["assistant", "model"]
            else "user"
        )

        messages.append(
            {
                "role": role,
                "content": msg.content,
            }
        )

    messages.append(
        {
            "role": "user",
            "content": req.message,
        }
    )

    fallback_models = [
        "meta/llama-4-maverick-17b-128e-instruct",
        "deepseek-v3.2",
        "mistralai/mistral-small-3.1-24b-instruct-2503",
        "ibm/granite-3.3-8b-instruct",
    ]

    if NVIDIA_API_KEY:
        for model in fallback_models:
            print(
                f"[ARIA] Attempting fallback model: {model}"
            )

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
                            temperature=0.85,
                            max_tokens=400,
                        )
                    )

                    content = (
                        response.choices[0]
                        .message
                        .content
                    )

                    if content:
                        print(
                            f"[ARIA] Using model success: "
                            f"{model}"
                        )

                        return ChatResponse(
                            response=content.strip()
                        )

                    raise ValueError(
                        "Model returned an empty response"
                    )

            except Exception as exc:  # noqa: BLE001
                print(
                    f"[ARIA] Model {model} failed: {exc}"
                )

        return ChatResponse(
            response=(
                "ARIA is currently unavailable. "
                "Please try again shortly."
            )
        )

    response = MOCK_RESPONSES[
        _mock_idx % len(MOCK_RESPONSES)
    ]

    _mock_idx += 1

    return ChatResponse(
        response=response,
        intent="greeting",
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT_CHAT", "8004")),
        reload=False,
    )
