"""
The Hive - LLM Event Parser
Uses OpenAI GPT-4o-mini to intelligently extract event information from Instagram post captions
"""

import os
import json
from typing import Optional
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from openai import OpenAI

# Load API key from environment
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

# System prompt for event extraction
SYSTEM_PROMPT = """You are an event information extractor for a university campus event platform (ITU - Istanbul Technical University).

Given an Instagram post caption, extract the following information in JSON format:
- title: The event name/title (concise, descriptive, max 100 chars). Do NOT just use the first line if it's not the actual event name.
- description: A clean summary of the event (remove hashtags, mentions, excessive emojis)
- event_date: Date and time in ISO 8601 format (YYYY-MM-DDTHH:MM:SS). If only date is found, use 00:00:00 for time. If year is not specified, assume 2025.
- end_date: End date/time if mentioned, otherwise null
- location: The physical venue/location where the event takes place. This should be a building, room, campus location, or address. NEVER use "Instagram", social media handles, or URLs as location. If no physical location is found, use null.
- category: One of: music, sports, technology, art, academic, social, career, workshop, seminar, other

The content may be in Turkish or English. Common Turkish months:
- Ocak=January, Şubat=February, Mart=March, Nisan=April, Mayıs=May, Haziran=June
- Temmuz=July, Ağustos=August, Eylül=September, Ekim=October, Kasım=November, Aralık=December

Common location indicators in Turkish: "Yer:", "Konum:", "Nerede:", "📍"
Common date indicators: "Tarih:", "Ne zaman:", "📅"
Common time indicators: "Saat:", "🕐"

Return ONLY valid JSON, no markdown formatting, no explanation, no code blocks."""


def parse_event_with_llm(raw_content: str, club_name: str = None) -> Optional[dict]:
    """
    Parse event information from raw Instagram post content using OpenAI GPT-4o-mini.
    
    Args:
        raw_content: The raw text content from an Instagram post
        club_name: Optional club name for context
        
    Returns:
        dict with extracted event information, or None if parsing fails
    """
    if not OPENAI_API_KEY:
        print("  [!] OpenAI API key not set, falling back to regex parsing")
        return None
    
    if not raw_content or len(raw_content.strip()) < 20:
        return None
    
    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        # Build the user message
        user_message = f"Extract event information from this Instagram post:\n\n{raw_content}"
        if club_name:
            user_message += f"\n\nThis post is from the club: {club_name}"
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ],
            temperature=0.1,  # Low temperature for consistent extraction
            max_tokens=500,
            response_format={"type": "json_object"}
        )
        
        # Parse the response
        result_text = response.choices[0].message.content.strip()
        
        # Parse JSON
        parsed = json.loads(result_text)
        
        # Validate and clean the result
        event = {
            'title': _clean_string(parsed.get('title')),
            'description': _clean_string(parsed.get('description')),
            'event_date': _validate_date(parsed.get('event_date')),
            'end_date': _validate_date(parsed.get('end_date')),
            'location': _clean_location(parsed.get('location')),
            'category': _validate_category(parsed.get('category')),
        }
        
        # Only return if we got at least a title or date
        if event['title'] or event['event_date']:
            return event
        
        return None
        
    except json.JSONDecodeError as e:
        print(f"  [!] LLM returned invalid JSON: {e}")
        return None
    except Exception as e:
        print(f"  [!] LLM parsing error: {e}")
        return None


def _clean_string(value: str) -> Optional[str]:
    """Clean and validate a string value"""
    if not value or not isinstance(value, str):
        return None
    cleaned = value.strip()
    if len(cleaned) < 2:
        return None
    return cleaned


def _clean_location(location: str) -> Optional[str]:
    """Clean location, filtering out invalid values"""
    if not location or not isinstance(location, str):
        return None
    
    location = location.strip()
    
    # Filter out social media related "locations"
    invalid_locations = [
        'instagram', 'twitter', 'facebook', 'linkedin', 'youtube',
        'tiktok', 'http', 'www.', '@', 'online', 'zoom', 'teams',
        'null', 'none', 'n/a', 'tba', 'tbd'
    ]
    
    location_lower = location.lower()
    for invalid in invalid_locations:
        if invalid in location_lower:
            # Exception: if it contains more than just the invalid part, keep it
            if len(location) > len(invalid) + 10 and 'http' not in location_lower:
                continue
            return None
    
    if len(location) < 3:
        return None
    
    return location[:200]  # Limit length


def _validate_date(date_str: str) -> Optional[str]:
    """Validate and normalize a date string to ISO format"""
    if not date_str or not isinstance(date_str, str):
        return None
    
    date_str = date_str.strip()
    
    # Skip null-like values
    if date_str.lower() in ['null', 'none', 'n/a', 'tba', 'tbd', '']:
        return None
    
    try:
        # Try parsing as ISO format
        parsed = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        return parsed.isoformat()
    except ValueError:
        pass
    
    try:
        # Try other common formats
        from dateutil import parser as date_parser
        parsed = date_parser.parse(date_str, fuzzy=True)
        return parsed.isoformat()
    except:
        return None


def _validate_category(category: str) -> Optional[str]:
    """Validate category against allowed values"""
    if not category or not isinstance(category, str):
        return None
    
    category = category.strip().lower()
    
    valid_categories = [
        'music', 'sports', 'technology', 'art', 'academic',
        'social', 'career', 'workshop', 'seminar', 'other'
    ]
    
    if category in valid_categories:
        return category
    
    # Try to map similar values
    category_map = {
        'tech': 'technology',
        'sport': 'sports',
        'artistic': 'art',
        'education': 'academic',
        'educational': 'academic',
        'conference': 'seminar',
        'talk': 'seminar',
        'presentation': 'seminar',
        'networking': 'social',
        'party': 'social',
        'concert': 'music',
        'performance': 'music',
        'job': 'career',
        'internship': 'career',
        'training': 'workshop',
    }
    
    if category in category_map:
        return category_map[category]
    
    return 'other'


# Test function
if __name__ == "__main__":
    # Test with a sample caption
    test_caption = """
    🎉 Bahar Şenliği 2025! 🎉
    
    📅 Tarih: 15 Mart 2025
    🕐 Saat: 14:00 - 22:00
    📍 Yer: ITU Ayazağa Kampüsü, Merkez Anfisi
    
    Harika bir gün için hazır mısınız? 
    Konserler, yarışmalar ve sürprizler sizi bekliyor!
    
    Kayıt için bio'daki linke tıklayın 👆
    
    #ITU #BaharŞenliği #Kampüs #Etkinlik
    """
    
    print("Testing LLM Parser...")
    result = parse_event_with_llm(test_caption, "ITU Öğrenci Konseyi")
    if result:
        print("\n[OK] Parsed successfully:")
        # Use ensure_ascii=True for Windows console compatibility
        print(json.dumps(result, indent=2, ensure_ascii=True))
    else:
        print("\n[X] Parsing failed")
