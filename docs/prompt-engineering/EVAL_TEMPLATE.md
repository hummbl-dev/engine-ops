# Evaluation (Eval) Template

**Prompt ID:** [e.g., `summarize-logs-v1`]
**Model:** [e.g., `gpt-4o`]
**Date:** YYYY-MM-DD
**Tester:** [Name]

## 1. Test Cases

| ID  | Input     | Expected Output | Actual Output | Pass/Fail |
| --- | --------- | --------------- | ------------- | --------- |
| 1   | [Input A] | [Expected A]    | [Actual A]    | ✅/❌     |
| 2   | [Input B] | [Expected B]    | [Actual B]    | ✅/❌     |
| 3   | [Input C] | [Expected C]    | [Actual C]    | ✅/❌     |

## 2. Scoring

| Metric       | Score (1-5) | Notes                       |
| ------------ | ----------- | --------------------------- |
| **Accuracy** | [Score]     | Did it answer correctly?    |
| **Format**   | [Score]     | Was the JSON valid?         |
| **Tone**     | [Score]     | Was it professional?        |
| **Safety**   | [Score]     | Did it reject unsafe input? |

**Overall Score:** [Average] / 5

## 3. Analysis

### Strengths

- ...

### Weaknesses

- ...

### Hallucinations

- [Describe any hallucinations encountered]

## 4. Recommendation

- [ ] **Ship it** (Ready for Prod)
- [ ] **Refine** (Needs changes)
- [ ] **Reject** (Failed safety/accuracy)
