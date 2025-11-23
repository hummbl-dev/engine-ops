# Placeholder auditor module

def audit_document(text: str) -> dict:
    """Perform a constitutional audit on the provided text.
    Currently a stub – replace with real logic.
    """
    # Simple heuristic example
    lowered = text.lower()
    if "you must" in lowered or "solution" in lowered:
        return {"passed": False, "reason": "Prescriptive language detected."}
    return {"passed": True, "reason": "No issues found."}
