# 🤖 AI Instructions — SwiftChat

## Goal

Build AI-powered features:

* Caption generation
* Emotion detection
* Semantic search
* Chatbot

---

## Services

### 1. Caption Service

Input: text/image
Output: captions

---

### 2. Emotion Service

Input: text
Output: emotion + embedding

---

### 3. Search Service

* Use pgvector
* Cosine similarity search

---

### 4. Chatbot Service

* Context-aware responses
* LLM-based

---

### 5. Moderation Service

* Detect toxicity
* Filter harmful content

---

## Requirements

* FastAPI
* Dockerized
* Scalable
* Timeout handling
* Retry logic

---

## Model Options

* OpenAI GPT
* HuggingFace Transformers

---

## Performance

* Response < 3 seconds
* Cache frequent queries
