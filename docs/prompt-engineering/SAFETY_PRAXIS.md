# Safety & Alignment Praxis

**Version:** 1.0
**Last Updated:** 2025-11-22

## 1. Core Philosophy
**Safety First.** An AI that is helpful but unsafe is a liability. We prioritize safety and alignment over raw capability.

## 2. Input Guardrails (Sanitization)
Before a user message reaches the LLM:
- **PII Scrubbing:** Remove emails, phone numbers, and IP addresses.
- **Injection Detection:** Scan for common jailbreak patterns (e.g., "Ignore previous instructions").
- **Length Limits:** Enforce strict token limits to prevent DoS.

## 3. Output Guardrails (Validation)
Before the LLM response reaches the user:
- **Format Validation:** Ensure JSON output matches the schema.
- **Content Filtering:** Scan for harmful, biased, or inappropriate content.
- **Hallucination Check:** Verify citations against the provided context (RAG).

## 4. Alignment Guidelines
### Tone
- **Professional:** Helpful, direct, and objective.
- **Concise:** No fluff. "No yapping."
- **Humble:** Admit uncertainty. "I don't know" is better than a hallucination.

### Refusal Strategy
When refusing a request:
1.  **Refuse:** "I cannot fulfill this request."
2.  **Explain:** "It violates the safety policy regarding X."
3.  **Pivot:** "However, I can help you with Y."

## 5. Incident Response
- **Jailbreak:** Revoke user session, log incident, update `SAFETY_PRAXIS.md`.
- **Hallucination:** Add example to "Negative Constraints" in prompt.
