import json
import pandas as pd
from pathlib import Path
from typing import List, Union, Dict, Any
from datetime import datetime
from src.core.config import config
from src.models.data_models import InstagramProfile

class DataManager:
    def __init__(self):
        self.output_dir = Path(config.get("paths.output_dir", "data/output"))
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def save_profiles(self, profiles: List[InstagramProfile], filename_prefix: str = "profiles"):
        """Save list of profiles to JSON and CSV"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # specific dir for this run
        run_dir = self.output_dir / f"run_{timestamp}"
        run_dir.mkdir(exist_ok=True)
        
        # Convert to list of dicts
        data = [p.model_dump() for p in profiles]
        
        # Save JSON (Full nested data)
        json_path = run_dir / f"{filename_prefix}.json"
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2, default=str)
            
        print(f"Saved JSON to {json_path}")
        
        # Save CSV (Flattened high-level data)
        flat_data = []
        for p in profiles:
            flat = {
                "username": p.username,
                "full_name": p.full_name,
                "followers": p.followers_count,
                "following": p.following_count,
                "posts": p.posts_count,
                "url": f"https://instagram.com/{p.username}/",
                "scraped_at": p.scraped_at
            }
            flat_data.append(flat)
            
        if flat_data:
            df = pd.DataFrame(flat_data)
            csv_path = run_dir / f"{filename_prefix}.csv"
            df.to_csv(csv_path, index=False)
            print(f"Saved CSV to {csv_path}")

    def save_links(self, links: List[str], filename: str = "found_links.txt"):
        """Save a simple list of links"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        run_dir = self.output_dir / f"run_{timestamp}"
        run_dir.mkdir(exist_ok=True)

        path = run_dir / filename
        with open(path, 'w') as f:
            for link in links:
                f.write(f"{link}\n")
        print(f"Saved links to {path}")
