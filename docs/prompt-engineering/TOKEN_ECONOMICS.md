# Token Economics Strategy

**Version:** 1.0
**Last Updated:** 2025-11-22

## 1. Budgeting

Every interaction has a cost. We budget tokens like we budget money.

### Limits

- **Input Limit:** 4,096 tokens (Default).
- **Output Limit:** 1,024 tokens (Default).
- **Context Window:** 128k tokens (Max).

### Allocation

- **System Instructions:** 10% (~500 tokens).
- **RAG Context:** 60% (~2500 tokens).
- **Conversation History:** 20% (~800 tokens).
- **User Input:** 10% (~400 tokens).

## 2. Context Management

### RAG (Retrieval Augmented Generation)

- **Chunking:** Split documents into 512-token chunks with 10% overlap.
- **Relevance:** Only inject the top 3-5 most relevant chunks.
- **Freshness:** Prioritize recent data.

### History Compression

- **Sliding Window:** Keep last N messages.
- **Summarization:** Summarize older messages into a "Memory" block.
- **Pruning:** Remove low-value messages (e.g., "Ok", "Thanks").

## 3. Cost Analysis

- **Tracking:** Log token usage for every request (`prompt_tokens`, `completion_tokens`).
- **Optimization:**
  - Use shorter variable names in JSON.
  - Remove whitespace/comments in code context.
  - Use `gpt-4o-mini` for simple classification tasks.

## 4. Caching

- **Prompt Caching:** Cache the "System Instructions + Tools" block (Prefix Caching).
- **Response Caching:** Cache identical queries for 24h.
