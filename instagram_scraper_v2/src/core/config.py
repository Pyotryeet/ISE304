import yaml
import os
from pathlib import Path
from typing import Dict, Any, Union

class ConfigManager:
    _instance = None
    _config: Dict[str, Any] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ConfigManager, cls).__new__(cls)
            cls._instance._load_config()
        return cls._instance

    def _load_config(self):
        """Load configuration from settings.yaml"""
        # Determine project root relative to this file
        # src/core/config.py -> src/core -> src -> root
        root_dir = Path(__file__).parent.parent.parent
        config_path = root_dir / "config" / "settings.yaml"

        if not config_path.exists():
            raise FileNotFoundError(f"Configuration file not found at {config_path}")

        with open(config_path, "r") as f:
            self._config = yaml.safe_load(f)
        
        # Ensure output directories exist
        self._ensure_directories()

    def _ensure_directories(self):
        """Create necessary directories defined in config"""
        root_dir = Path(__file__).parent.parent.parent
        paths = self._config.get("paths", {})
        
        for key, path_str in paths.items():
            full_path = root_dir / path_str
            full_path.mkdir(parents=True, exist_ok=True)

    def get(self, key: str, default: Any = None) -> Any:
        """Get a configuration value using dot notation (e.g. 'browser.headless')"""
        keys = key.split(".")
        value = self._config
        
        try:
            for k in keys:
                value = value[k]
            return value
        except (KeyError, TypeError):
            return default

# Global instance
config = ConfigManager()
