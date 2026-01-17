from abc import ABC, abstractmethod
from typing import Any, Optional, Dict
from playwright.sync_api import Page
from src.core.browser import BrowserManager
from src.core.config import config

class BaseScraper(ABC):
    def __init__(self, browser_manager: BrowserManager):
        self.browser_manager = browser_manager
        self.page: Optional[Page] = None
        
    def start_browser(self):
        """Start the browser session"""
        self.page = self.browser_manager.start()
        
    def stop_browser(self):
        """Stop the browser session"""
        self.browser_manager.stop()
        
    def navigate(self, url: str):
        """Navigate to a URL with error handling"""
        if not self.page:
            self.start_browser()
            
        try:
            print(f"Navigating to {url}...")
            self.page.goto(url, wait_until="networkidle")
            self.browser_manager.random_sleep(1000, 2000)
        except Exception as e:
            print(f"Error navigating to {url}: {e}")
            
    def scroll_to_bottom(self, max_scrolls: int = 5):
        """Scroll to the bottom of the page progressively"""
        for _ in range(max_scrolls):
            self.page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            self.browser_manager.random_sleep(1000, 2000)
            
    @abstractmethod
    def scrape(self, target: str) -> Any:
        """Main scrape method to be implemented by subclasses"""
        pass
