import requests
import json
from datetime import datetime, timedelta

API_URL = "http://localhost:3001/api/events/scraped"
API_KEY = "hive-scraper-secret-key"

def test_scraper_integration():
    print("Testing Scraper API Integration...\n")
    
    # Payload 1: New Event
    event_data = {
        "title": "Integration Test Event",
        "description": "This is a test event created via API.",
        "event_date": (datetime.now() + timedelta(days=5)).isoformat(),
        "location": "Test Lab",
        "club_name": "ITU Music Club", # Must exist in DB
        "instagram_post_url": "https://instagram.com/p/test12345",
        "source": "scraped"
    }

    headers = {
        "Content-Type": "application/json",
        "x-api-key": API_KEY
    }

    # 1. Test Valid Creation
    print("1. Testing Creation...")
    try:
        response = requests.post(API_URL, json=event_data, headers=headers)
        if response.status_code == 201:
            print("âœ… Creation Success:", response.json())
        else:
            print("âŒ Creation Failed:", response.status_code, response.text)
    except Exception as e:
        print("âŒ Error:", e)

    # 2. Test Deduplication (Run same request again)
    print("\n2. Testing Deduplication...")
    try:
        response = requests.post(API_URL, json=event_data, headers=headers)
        if response.status_code == 200:
            print("âœ… Deduplication Success:", response.json())
        else:
            print("âŒ Deduplication Failed:", response.status_code, response.text)
    except Exception as e:
        print("âŒ Error:", e)

    # 3. Test Invalid Auth
    print("\n3. Testing Invalid Auth...")
    try:
        bad_headers = headers.copy()
        bad_headers["x-api-key"] = "wrong-key"
        response = requests.post(API_URL, json=event_data, headers=bad_headers)
        if response.status_code == 401:
            print("âœ… Auth Check Success (401)")
        else:
            print("âŒ Auth Check Failed:", response.status_code)
    except Exception as e:
        print("âŒ Error:", e)

if __name__ == "__main__":
    test_scraper_integration()
