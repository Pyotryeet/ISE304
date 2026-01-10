"""
The Hive - Club Scraper
Scrapes ITU club list from ari24.com/kulupler to extract Instagram URLs
"""

import json
import re
import time
from datetime import datetime
from playwright.sync_api import sync_playwright, Page


def scrape_clubs_list(page: Page) -> list[dict]:
    """
    Scrape the list of ITU clubs from ari24.com/kulupler
    Returns a list of clubs with their name and Instagram URL
    """
    clubs = []
    
    print("Navigating to clubs page...")
    page.goto("https://ari24.com/kulupler", wait_until="networkidle")
    
    # Wait for content to load
    time.sleep(2)
    
    # Get all club elements - adjust selectors based on actual page structure
    # This is a generic approach, may need adjustment based on actual HTML
    
    # Try to find club cards or list items
    club_elements = page.query_selector_all('a[href*="instagram.com"]')
    
    print(f"Found {len(club_elements)} Instagram links")
    
    for element in club_elements:
        try:
            instagram_url = element.get_attribute('href')
            
            # Try to get club name from parent element or nearby text
            parent = element.query_selector('xpath=..')
            club_name = None
            
            # Try different strategies to find the club name
            # Strategy 1: Look for nearby heading or text
            if parent:
                name_element = parent.query_selector('h1, h2, h3, h4, h5, h6, p, span, strong')
                if name_element:
                    club_name = name_element.inner_text().strip()
            
            # Strategy 2: Use the Instagram username as fallback
            if not club_name or len(club_name) < 2:
                # Extract username from Instagram URL
                match = re.search(r'instagram\.com/([^/?]+)', instagram_url)
                if match:
                    club_name = match.group(1).replace('_', ' ').title()
            
            if club_name and instagram_url:
                clubs.append({
                    'name': club_name,
                    'instagram_url': instagram_url
                })
                print(f"Found club: {club_name} - {instagram_url}")
                
        except Exception as e:
            print(f"Error processing club element: {e}")
            continue
    
    # Remove duplicates by Instagram URL
    seen_urls = set()
    unique_clubs = []
    for club in clubs:
        if club['instagram_url'] not in seen_urls:
            seen_urls.add(club['instagram_url'])
            unique_clubs.append(club)
    
    return unique_clubs


def save_clubs_to_file(clubs: list[dict], filename: str = "clubs.json"):
    """Save scraped clubs to a JSON file"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump({
            'scraped_at': datetime.now().isoformat(),
            'total_clubs': len(clubs),
            'clubs': clubs
        }, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(clubs)} clubs to {filename}")


def main():
    """Main function to scrape clubs"""
    print("=" * 60)
    print("THE HIVE - Club Scraper")
    print("Scraping ITU clubs from ari24.com/kulupler")
    print("=" * 60)
    
    with sync_playwright() as p:
        # Launch browser in visible mode as requested
        print("\nLaunching browser (headless=False)...")
        browser = p.chromium.launch(headless=False)
        
        # Create a new page with a reasonable viewport
        context = browser.new_context(
            viewport={'width': 1280, 'height': 720},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        page = context.new_page()
        
        try:
            clubs = scrape_clubs_list(page)
            
            if clubs:
                save_clubs_to_file(clubs)
                print(f"\n✓ Successfully scraped {len(clubs)} clubs!")
            else:
                print("\n⚠ No clubs found. The page structure may have changed.")
                print("Please check the page manually and update the selectors.")
            
        except Exception as e:
            print(f"\n✗ Error during scraping: {e}")
            # Take a screenshot for debugging
            page.screenshot(path="error_screenshot.png")
            print("Screenshot saved to error_screenshot.png")
            
        finally:
            print("\nClosing browser...")
            browser.close()
    
    print("\nDone!")


if __name__ == "__main__":
    main()
