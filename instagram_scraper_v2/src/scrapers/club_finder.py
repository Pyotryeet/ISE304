import re
from typing import List, Dict, Optional
from src.scrapers.base import BaseScraper
from src.core.config import config

class ClubSiteScraper(BaseScraper):
    def scrape(self, url: str) -> List[str]:
        """
        Scrape a club directory page to find Instagram links.
        Returns a list of Instagram profile URLs found.
        """
        self.navigate(url)
        
        # 1. Find all links
        instagram_links = []
        try:
            # Generic search for anything containing instagram.com
            elements = self.page.query_selector_all('a[href*="instagram.com"]')
            
            for element in elements:
                href = element.get_attribute("href")
                if href:
                    clean_link = self._clean_instagram_link(href)
                    if clean_link and clean_link not in instagram_links:
                        instagram_links.append(clean_link)
                            
        except Exception as e:
            print(f"Error finding links: {e}")
            
        print(f"Found {len(instagram_links)} unique Instagram handles.")
        return instagram_links

    def _clean_instagram_link(self, url: str) -> Optional[str]:
        """Normalize Instagram URL to https://www.instagram.com/username/"""
        # Remove query params
        base = url.split("?")[0]
        
        # Check standard format
        pattern = r"instagram\.com/([a-zA-Z0-9_.]+)"
        match = re.search(pattern, base)
        
        if match:
            username = match.group(1)
            # Filter out 'p', 'reel', 'stories' etc. if we only want profiles
            if username not in ['p', 'reel', 'stories', 'explore', 'direct']:
                return f"https://www.instagram.com/{username}/"
        
        return None
