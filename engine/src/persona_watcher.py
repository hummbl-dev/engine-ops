"""
Watch mode for persona YAML files - auto-reload on changes.
"""
import time
from pathlib import Path
from typing import Callable, Optional
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler, FileModifiedEvent

class PersonaFileHandler(FileSystemEventHandler):
    """Handler for persona file changes."""
    
    def __init__(self, callback: Callable[[str], None], persona_dir: Path):
        self.callback = callback
        self.persona_dir = persona_dir
        self.last_modified = {}
    
    def on_modified(self, event):
        """Handle file modification events."""
        if event.is_directory:
            return
        
        if not event.src_path.endswith('.yaml'):
            return
        
        # Debounce rapid file changes
        file_path = event.src_path
        current_time = time.time()
        
        if file_path in self.last_modified:
            if current_time - self.last_modified[file_path] < 0.5:  # 500ms debounce
                return
        
        self.last_modified[file_path] = current_time
        
        # Only trigger for files in persona directory
        if Path(file_path).parent == self.persona_dir:
            persona_id = Path(file_path).stem
            print(f"Persona file changed: {persona_id}")
            self.callback(persona_id)

class PersonaWatcher:
    """Watch persona directory for changes and reload."""
    
    def __init__(self, persona_dir: Path, loader):
        """
        Initialize watcher.
        
        Args:
            persona_dir: Directory to watch
            loader: PersonaLoader instance to reload
        """
        self.persona_dir = persona_dir
        self.loader = loader
        self.observer: Optional[Observer] = None
        self.handler = PersonaFileHandler(self._on_persona_changed, persona_dir)
    
    def _on_persona_changed(self, persona_id: str):
        """Callback when a persona file changes."""
        print(f"Reloading persona: {persona_id}")
        try:
            self.loader.reload()
            print(f"Successfully reloaded persona: {persona_id}")
        except Exception as e:
            print(f"Error reloading persona {persona_id}: {e}")
    
    def start(self):
        """Start watching for file changes."""
        if self.observer is not None:
            return  # Already watching
        
        self.observer = Observer()
        self.observer.schedule(self.handler, str(self.persona_dir), recursive=False)
        self.observer.start()
        print(f"Started watching persona directory: {self.persona_dir}")
    
    def stop(self):
        """Stop watching for file changes."""
        if self.observer is not None:
            self.observer.stop()
            self.observer.join()
            self.observer = None
            print("Stopped watching persona directory")

