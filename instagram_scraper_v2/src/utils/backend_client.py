import requests
from typing import Dict, Any, Optional
from src.core.config import config

class BackendClient:
    def __init__(self, base_url: str = "http://localhost:3001"):
        self.base_url = base_url
        self.api_key = "hive-scraper-secret-key"
        self.headers = {
            "Content-Type": "application/json",
            "x-api-key": self.api_key
        }

    def sync_event(self, event_data: Dict[str, Any], club_name: str) -> bool:
        """Send a scraped event to the backend"""
        url = f"{self.base_url}/api/events/scraped"
        
        # Transform data to match backend expectations
        payload = {
            "title": event_data.get("caption", "Instagram Post")[:100] if event_data.get("caption") else "New Instagram Post",
            "description": event_data.get("caption", ""),
            "event_date": event_data.get("timestamp") or "2026-01-20T10:00:00Z", # Fallback date if null
            "location": "Instagram",
            "source": "scraped",
            "instagram_post_url": event_data.get("url"),
            "club_name": club_name
        }
        
        # If timestamp is null (which it is for public scrape), usage current or future date
        # In a real scenario, we might want to skip events without dates, 
        # but for this demo visualization, we'll put them as 'Upcoming'
        if not event_data.get("timestamp"):
             pass 

        try:
            response = requests.post(url, json=payload, headers=self.headers)
            if response.status_code in [200, 201]:
                print(f"  ✓ Synced: {payload['title'][:30]}...")
                return True
            else:
                print(f"  ✗ Failed to sync: {response.text}")
                return False
        except Exception as e:
            print(f"  ✗ Connection error: {e}")
            return False
