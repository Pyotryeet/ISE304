import time
import re
from typing import List, Optional
from datetime import datetime
from src.scrapers.base import BaseScraper
from src.models.data_models import InstagramProfile, InstagramPost
from src.core.config import config

class InstagramScraper(BaseScraper):
    def scrape(self, username: str) -> Optional[InstagramProfile]:
        """Scrape a public Instagram profile"""
        url = f"https://www.instagram.com/{username}/"
        self.navigate(url)
        
        # Check for login wall or errors
        if self._check_login_required():
            print("Login wall detected. Attempting to scroll/scrape what is visible...")
            # We might still be able to get some data
            
        return self._parse_profile(username)

    def _check_login_required(self) -> bool:
        """Check if login is strictly required (blocking content)"""
        # This is a heuristic
        try:
            return self.page.get_by_text("Log in to continue").is_visible()
        except:
            return False

    def _parse_profile(self, username: str) -> InstagramProfile:
        """Parse the profile page content"""
        # Wait for potential content load
        self.page.wait_for_selector('main', timeout=5000)
        
        # 1. Get Basic Info from Meta Tags (most reliable for public scraping without login)
        description = self.page.query_selector('meta[property="og:description"]')
        desc_content = description.get_attribute("content") if description else ""
        
        # Format: "100 Followers, 50 Following, 10 Posts - See Instagram photos..."
        followers = 0
        following = 0
        posts_count = 0
        
        # Regex to extract counts
        try:
            parts = desc_content.split(" - ")[0].split(", ")
            for part in parts:
                if "Followers" in part:
                    followers = self._parse_count(part.replace(" Followers", ""))
                elif "Following" in part:
                    following = self._parse_count(part.replace(" Following", ""))
                elif "Posts" in part:
                    posts_count = self._parse_count(part.replace(" Posts", ""))
        except:
            print("Could not parse meta description for stats")

        image_meta = self.page.query_selector('meta[property="og:image"]')
        profile_pic = image_meta.get_attribute("content") if image_meta else None
        
        title_meta = self.page.query_selector('meta[property="og:title"]')
        full_name = ""
        if title_meta:
            title_content = title_meta.get_attribute("content")
            # "Name (@username) • Instagram photos..."
            if "(" in title_content:
                full_name = title_content.split("(")[0].strip()

        # 2. Extract Visible Posts
        posts = self._extract_posts(username)

        return InstagramProfile(
            username=username,
            full_name=full_name,
            followers_count=followers,
            following_count=following,
            posts_count=posts_count,
            profile_pic_url=profile_pic,
            posts=posts
        )

    def _extract_posts(self, username: str) -> List[InstagramPost]:
        """Extract recent posts from the grid"""
        posts = []
        max_posts = config.get("scraper.max_posts_per_user", 10)
        
        # Select all anchor tags linked to posts
        # Typically /p/{shortcode}/
        links = self.page.query_selector_all('a[href*="/p/"]')
        
        unique_links = []
        seen = set()
        
        for link in links:
            href = link.get_attribute("href")
            if href and href not in seen:
                seen.add(href)
                unique_links.append(href)
                if len(unique_links) >= max_posts:
                    break
                    
        print(f"Found {len(unique_links)} potential posts.")

        for href in unique_links:
            shortcode = href.split("/p/")[1].replace("/", "")
            full_url = f"https://www.instagram.com{href}"
            
            # For minimal public scraping without opening each post (which triggers login wall quickly),
            # we create a basic Post object. opening each post is high risk for rate limits.
            # If we need captions, we MUST open them or rely on data visible in the grid (often none).
            # For now, we will try to visit the post URL briefly if configured, or just return links.
            
            # Let's try to get image alt text from the grid which sometimes contains the caption
            alt_text = None
            try:
                img = self.page.query_selector(f'a[href="{href}"] img')
                if img:
                    alt_text = img.get_attribute("alt")
            except:
                pass

            post = InstagramPost(
                id=shortcode,
                shortcode=shortcode,
                url=full_url,
                caption=alt_text, # Best effort from grid
                display_url=None # Would need to extract src
            )
            posts.append(post)
            
        return posts

    def _parse_count(self, text: str) -> int:
        """Helper to parse '1.5M', '10k' etc."""
        text = text.lower().replace(",", "").replace(" ", "")
        multiplier = 1
        if "k" in text:
            multiplier = 1000
            text = text.replace("k", "")
        elif "m" in text:
            multiplier = 1000000
            text = text.replace("m", "")
            
        try:
            return int(float(text) * multiplier)
        except:
            return 0
