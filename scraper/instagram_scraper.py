"""
The Hive - Instagram Event Scraper
Scrapes Instagram posts from club pages to extract event information
"""

import json
import re
import time
import requests
import os
from datetime import datetime, timedelta
from dateutil import parser as date_parser
from playwright.sync_api import sync_playwright, Page
from typing import Optional
from dotenv import load_dotenv

import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("scraper.log", encoding='utf-8'),
        logging.StreamHandler()
    ]
)

# Load environment variables
load_dotenv()

# Import LLM parser
try:
    from llm_parser import parse_event_with_llm
    LLM_AVAILABLE = True
    logging.info("LLM parser imported successfully")
except ImportError:
    LLM_AVAILABLE = False
    logging.warning("LLM parser not available, using regex fallback")


# Keywords that might indicate an event (Turkish and English)
EVENT_KEYWORDS = [
    # Turkish
    'etkinlik', 'davet', 'katılım', 'konser', 'seminer', 'workshop',
    'atölye', 'buluşma', 'toplantı', 'tarih', 'saat', 'yer', 'konum',
    'kayıt', 'bilet', 'giriş', 'ücretsiz', 'festival', 'söyleşi',
    # English
    'event', 'join', 'attend', 'concert', 'seminar', 'workshop',
    'meetup', 'meeting', 'date', 'time', 'location', 'register',
    'ticket', 'entry', 'free', 'festival', 'talk', 'presentation'
]

# Date patterns to look for
DATE_PATTERNS = [
    r'\d{1,2}[./]\d{1,2}[./]\d{2,4}',  # 12/01/2024, 12.01.2024
    r'\d{1,2}\s+(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)',  # Turkish months
    r'\d{1,2}\s+(january|february|march|april|may|june|july|august|september|october|november|december)',  # English months
    r'(pazartesi|salı|çarşamba|perşembe|cuma|cumartesi|pazar)',  # Turkish days
    r'(monday|tuesday|wednesday|thursday|friday|saturday|sunday)',  # English days
]

TIME_PATTERNS = [
    r'\d{1,2}[:.]\d{2}',  # 14:00, 14.00
    r'\d{1,2}\s*(am|pm)',  # 2pm
]


class InstagramScraper:
    def __init__(self, headless: bool = False):
        self.headless = headless
        self.browser = None
        self.context = None
        self.page = None
        self.playwright = None
    
    def start(self):
        """Start the browser"""
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(headless=self.headless)
        self.context = self.browser.new_context(
            viewport={'width': 1280, 'height': 720},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        self.page = self.context.new_page()
        print("Browser started")
    
    def stop(self):
        """Stop the browser"""
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()
        print("Browser stopped")
    
    def scrape_instagram_profile(self, instagram_url: str, club_name: str = None) -> list[dict]:
        """
        Scrape recent posts from an Instagram profile
        Returns a list of potential events extracted from posts
        """
        events = []
        
        # Clean the URL
        if not instagram_url.startswith('http'):
            instagram_url = 'https://' + instagram_url
        
        print(f"\nScraping: {instagram_url}")
        
        try:
            self.page.goto(instagram_url, wait_until="domcontentloaded", timeout=30000)
            time.sleep(3)  # Wait for dynamic content
            
            # Check if we hit a login wall
            if self._check_login_required():
                print("  [!] Login required - trying to bypass...")
                self._try_bypass_login()
            
            # Get all post links
            post_links = self._get_post_links()
            print(f"  Found {len(post_links)} posts")
            
            # Scrape each post (limit to most recent 10)
            for i, post_url in enumerate(post_links[:10]):
                print(f"  Checking post {i+1}/{min(len(post_links), 10)}...")
                event = self._scrape_post(post_url, club_name=club_name)
                if event:
                    events.append(event)
                    print(f"    [OK] Found potential event: {event.get('title', 'Unknown')[:50]}")
                time.sleep(1)  # Be nice to Instagram
            
        except Exception as e:
            print(f"  [X] Error scraping profile: {e}")
        
        return events
    
    def _check_login_required(self) -> bool:
        """Check if Instagram requires login"""
        # Look for login buttons or prompts
        login_indicators = self.page.query_selector_all('button:has-text("Log In"), a:has-text("Log In")')
        return len(login_indicators) > 0
    
    def _try_bypass_login(self):
        """Try to bypass or dismiss login prompts"""
        try:
            # Look for close buttons on popups
            close_buttons = self.page.query_selector_all('[aria-label="Close"], button:has-text("Not Now")')
            for btn in close_buttons:
                try:
                    btn.click()
                    time.sleep(1)
                except:
                    pass
        except:
            pass
    
    def _get_post_links(self) -> list[str]:
        """Get links to individual posts"""
        post_links = []
        
        # Instagram posts are usually in anchor tags with /p/ in the URL
        links = self.page.query_selector_all('a[href*="/p/"]')
        
        for link in links:
            href = link.get_attribute('href')
            if href:
                if not href.startswith('http'):
                    href = 'https://www.instagram.com' + href
                if href not in post_links:
                    post_links.append(href)
        
        return post_links
    
    def _scrape_post(self, post_url: str, club_name: str = None) -> Optional[dict]:
        """
        Scrape a single post and extract event information if present
        Uses LLM parsing if available, falls back to regex
        """
        try:
            self.page.goto(post_url, wait_until="domcontentloaded", timeout=30000)
            time.sleep(2)
            
            # Get post content
            content = self._get_post_content()
            
            if not content:
                return None
            
            # Check if this looks like an event
            if not self._is_event_post(content):
                return None
            
            # Try LLM parsing first
            event = None
            if LLM_AVAILABLE and os.getenv('OPENAI_API_KEY'):
                print("    Using LLM parser...")
                event = parse_event_with_llm(content, club_name)
                if event:
                    print("    [OK] LLM parsing successful")
            
            # Fall back to regex parsing if LLM fails
            if not event:
                print("    Using regex fallback...")
                event = {
                    'title': self._extract_title(content),
                    'description': content,
                    'event_date': self._extract_date(content),
                    'location': self._extract_location(content),
                    'category': None,
                }
            else:
                # Add the full description if LLM parsing worked
                event['description'] = event.get('description') or content
            
            # Add common fields
            event['instagram_post_url'] = post_url
            event['source'] = 'scraped'
            event['status'] = 'draft'
            event['scraped_at'] = datetime.now().isoformat()
            
            # Only return if we found at least a title or date
            if event.get('title') or event.get('event_date'):
                return event
            
            return None
            
        except Exception as e:
            print(f"    Error scraping post: {e}")
            return None
    
    def _get_post_content(self) -> str:
        """Get the text content of a post"""
        content = ""
        
        # Try different selectors for post content
        selectors = [
            'article div span',
            'article h1',
            '[data-testid="post-content"]',
            'div[role="button"] span',
        ]
        
        for selector in selectors:
            elements = self.page.query_selector_all(selector)
            for element in elements:
                try:
                    text = element.inner_text()
                    if text and len(text) > 20:  # Filter out short texts
                        content += text + "\n"
                except:
                    pass
        
        return content.strip()
    
    def _is_event_post(self, content: str) -> bool:
        """Check if post content looks like an event announcement"""
        content_lower = content.lower()
        
        # Count how many event keywords are present
        keyword_count = sum(1 for keyword in EVENT_KEYWORDS if keyword in content_lower)
        
        # Check for date patterns
        has_date = any(re.search(pattern, content_lower) for pattern in DATE_PATTERNS)
        
        # Consider it an event if it has multiple keywords or has a date with at least one keyword
        return keyword_count >= 2 or (has_date and keyword_count >= 1)
    
    def _extract_title(self, content: str) -> str:
        """Extract event title from content"""
        lines = content.split('\n')
        
        # First non-empty line is often the title
        for line in lines:
            line = line.strip()
            if len(line) > 5 and len(line) < 100:
                # Remove emojis and special characters at the start
                cleaned = re.sub(r'^[^\w\s]+', '', line).strip()
                if cleaned:
                    return cleaned[:100]  # Limit length
        
        return "Untitled Event"
    
    def _extract_date(self, content: str) -> Optional[str]:
        """Extract event date from content"""
        content_lower = content.lower()
        
        # Try each date pattern
        for pattern in DATE_PATTERNS:
            match = re.search(pattern, content_lower)
            if match:
                try:
                    # Try to parse the date
                    date_str = match.group(0)
                    parsed_date = date_parser.parse(date_str, fuzzy=True)
                    
                    # If date is in the past, assume it's next year
                    if parsed_date < datetime.now():
                        parsed_date = parsed_date.replace(year=datetime.now().year + 1)
                    
                    return parsed_date.isoformat()
                except:
                    pass
        
        # Default to one week from now if no date found
        return None
    
    def _extract_location(self, content: str) -> Optional[str]:
        """Extract location from content"""
        content_lower = content.lower()
        
        # Look for location indicators
        location_patterns = [
            r'(?:yer|konum|location|where)[:\s]+([^\n]+)',
            r'(?:@|📍)\s*([^\n]+)',
        ]
        
        for pattern in location_patterns:
            match = re.search(pattern, content_lower)
            if match:
                location = match.group(1).strip()
                if len(location) > 3:
                    return location[:200]  # Limit length
        
        return None


def load_clubs(filename: str = "clubs.json") -> list[dict]:
    """Load clubs from JSON file"""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data.get('clubs', [])
    except FileNotFoundError:
        print(f"Clubs file not found: {filename}")
        print("Please run club_scraper.py first to get the list of clubs.")
        return []


def save_events(events: list[dict], filename: str = "scraped_events.json"):
    """Save scraped events to JSON file"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump({
            'scraped_at': datetime.now().isoformat(),
            'total_events': len(events),
            'events': events
        }, f, ensure_ascii=False, indent=2)
    print(f"\nSaved {len(events)} events to {filename}")


def send_to_backend(events: list[dict], backend_url: str = "http://localhost:3001"):
    """Send scraped events to the backend API"""
    print(f"\nSending {len(events)} events to backend...")
    
    headers = {
        'Content-Type': 'application/json',
        'x-api-key': 'hive-scraper-secret-key'
    }

    for event in events:
        try:
            # Ensure required fields
            if not event.get('title') or not event.get('event_date'):
                print(f"  [!] Skipping incomplete event: {event.get('title', 'Unknown')}")
                continue

            response = requests.post(
                f"{backend_url}/api/events/scraped",
                json=event,
                headers=headers
            )
            
            if response.status_code == 201:
                print(f"  [OK] Created: {event.get('title', 'Unknown')[:50]}")
            elif response.status_code == 200:
                print(f"  [i] Skipped (Duplicate): {event.get('title', 'Unknown')[:50]}")
            else:
                print(f"  [!] Failed ({response.status_code}): {response.text}")
        except Exception as e:
            print(f"  [X] Error: {e}")


def main():
    """Main function to scrape Instagram events"""
    print("=" * 60)
    print("THE HIVE - Instagram Event Scraper")
    print("Scraping events from ITU club Instagram pages")
    print("=" * 60)
    
    # Load clubs
    clubs = load_clubs()
    
    if not clubs:
        print("\nNo clubs to scrape. Please run club_scraper.py first.")
        return
    
    print(f"\nFound {len(clubs)} clubs to scrape")
    
    # Initialize scraper
    scraper = InstagramScraper(headless=False)
    scraper.start()
    
    all_events = []
    
    try:
        for i, club in enumerate(clubs):
            print(f"\n[{i+1}/{len(clubs)}] Processing: {club['name']}")
            
            events = scraper.scrape_instagram_profile(club['instagram_url'], club_name=club['name'])
            
            # Add club info to events (in case LLM didn't get it)
            for event in events:
                if not event.get('club_name'):
                    event['club_name'] = club['name']
            
            all_events.extend(events)
            
            # Be nice to Instagram
            time.sleep(3)
        
        # Save events
        if all_events:
            save_events(all_events)
            print(f"\n[OK] Successfully scraped {len(all_events)} potential events!")
        else:
            print("\n[!] No events found.")
            
    except KeyboardInterrupt:
        print("\n\nScraping interrupted by user.")
        if all_events:
            save_events(all_events)
    
    finally:
        scraper.stop()
    
    print("\nDone!")


if __name__ == "__main__":
    main()
