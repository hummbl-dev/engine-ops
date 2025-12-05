# Copyright (c) 2025, HUMMBL, LLC
#
# Licensed under the Business Source License 1.1 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://github.com/hummbl-dev/engine-ops/blob/main/LICENSE
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# Change Date: 2029-01-01
# Change License: Apache License, Version 2.0

"""
Safe File I/O Tools (The Sandbox)

Provides sandboxed file operations with strict path validation to prevent
path traversal attacks and unauthorized file system access.
"""

from pathlib import Path
from typing import Optional
import os


class SecurityError(Exception):
    """Raised when a security violation is detected."""

    pass


class FileSandbox:
    """
    Sandboxed file I/O with path validation.

    Allows reading from anywhere in the repository but restricts writes
    to a designated sandbox directory.
    """

    # Critical files that should NEVER be overwritten
    PROTECTED_FILES = {
        "sovereign.py",
        "config/constitution.yaml",
        ".env",
        "requirements.txt",
        "package.json",
    }

    def __init__(self, workspace_dir: str = "sandbox"):
        """
        Initialize the sandbox.

        Args:
            workspace_dir: Directory for sandboxed writes (default: "sandbox")
        """
        self.workspace_dir = Path(workspace_dir).resolve()
        self.workspace_dir.mkdir(parents=True, exist_ok=True)
        print(f"[FileSandbox] Initialized with workspace: {self.workspace_dir}")

    def validate_write_path(self, filename: str) -> Path:
        """
        Validate and resolve path for WRITE operations.

        Security checks:
        1. Must be within sandbox directory
        2. No path traversal (../)
        3. Not a protected file

        Args:
            filename: Target file path

        Returns:
            Validated absolute path

        Raises:
            SecurityError: If path validation fails
        """
        # Normalize the path
        target = (self.workspace_dir / filename).resolve()

        # Check 1: Must be within sandbox
        try:
            target.relative_to(self.workspace_dir)
        except ValueError:
            raise SecurityError(
                f"Path traversal detected: '{filename}' resolves outside sandbox. "
                f"Target: {target}, Sandbox: {self.workspace_dir}"
            )

        # Check 2: Not a protected file
        relative_path = str(target.relative_to(self.workspace_dir))
        if relative_path in self.PROTECTED_FILES:
            raise SecurityError(f"Cannot overwrite protected file: {relative_path}")

        return target

    def write_file(self, filename: str, content: str) -> str:
        """
        Safely write file to sandbox.

        Args:
            filename: Target file path (relative to sandbox)
            content: File content

        Returns:
            Absolute path of written file

        Raises:
            SecurityError: If path validation fails
        """
        target = self.validate_write_path(filename)

        # Create parent directories if needed
        target.parent.mkdir(parents=True, exist_ok=True)

        # Write file
        target.write_text(content, encoding="utf-8")

        print(f"[FileSandbox] ✅ Wrote: {target}")
        return str(target)

    def read_file(self, filename: str) -> str:
        """
        Read file from sandbox or repository (read-only).

        For reads, we allow access to the entire repository to enable
        the ArchitectAgent to read existing code.

        Args:
            filename: File path (absolute or relative to sandbox)

        Returns:
            File content

        Raises:
            FileNotFoundError: If file doesn't exist
        """
        target = Path(filename)

        # If relative path, try sandbox first, then repo root
        if not target.is_absolute():
            sandbox_path = self.workspace_dir / filename
            if sandbox_path.exists():
                target = sandbox_path
            else:
                # Allow reading from repo root
                repo_root = self.workspace_dir.parent
                target = repo_root / filename

        if not target.exists():
            raise FileNotFoundError(f"File not found: {filename}")

        content = target.read_text(encoding="utf-8")
        print(f"[FileSandbox] 📖 Read: {target} ({len(content)} bytes)")
        return content

    def list_files(self, pattern: str = "*") -> list[str]:
        """
        List files in sandbox matching pattern.

        Args:
            pattern: Glob pattern (default: all files)

        Returns:
            List of file paths relative to sandbox
        """
        files = []
        for path in self.workspace_dir.rglob(pattern):
            if path.is_file():
                relative = path.relative_to(self.workspace_dir)
                files.append(str(relative))
        return files

    def delete_file(self, filename: str) -> bool:
        """
        Delete file from sandbox.

        Args:
            filename: File path (relative to sandbox)

        Returns:
            True if deleted, False if file didn't exist

        Raises:
            SecurityError: If path validation fails
        """
        target = self.validate_write_path(filename)

        if target.exists():
            target.unlink()
            print(f"[FileSandbox] 🗑️  Deleted: {target}")
            return True
        return False


def get_file_sandbox(workspace_dir: str = "sandbox") -> FileSandbox:
    """
    Factory function to get FileSandbox instance.

    Args:
        workspace_dir: Sandbox directory path

    Returns:
        FileSandbox instance
    """
    return FileSandbox(workspace_dir)
