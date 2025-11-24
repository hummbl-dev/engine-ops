import os
from pathlib import Path
import logging

# Workspace root inside the container (mounted volume)
WORKSPACE_ROOT = Path(os.getenv("WORKSPACE_ROOT", "/app/cortex/workspace"))

logger = logging.getLogger(__name__)

def _secure_path(filename: str) -> Path:
    """Resolve a safe absolute path inside the workspace.
    Raises ValueError if the path attempts to escape the workspace.
    """
    target = (WORKSPACE_ROOT / filename).resolve()
    if not str(target).startswith(str(WORKSPACE_ROOT.resolve())):
        raise ValueError("Path traversal detected: outside workspace")
    return target

def write_to_workspace(filename: str, content: str) -> str:
    """Write *content* to *filename* inside the workspace.
    Returns the absolute path of the written file.
    """
    path = _secure_path(filename)
    # Ensure parent directories exist
    path.parent.mkdir(parents=True, exist_ok=True)
    logger.info(f"Writing to workspace: {path} (size {len(content)} bytes)")
    path.write_text(content, encoding="utf-8")
    return str(path)
