"""Engine package initialization.

We expose the submodules that are part of the public API so that imports like
`engine.providers` work reliably even if a third‑party package named `engine`
exists on the system. Importing the submodule here registers it as an attribute
on the package object.
"""

# Export the most commonly used submodules
from . import providers  # noqa: F401  (makes engine.providers available)
