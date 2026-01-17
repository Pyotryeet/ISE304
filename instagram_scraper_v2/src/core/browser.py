import random
import time
from typing import Optional
from playwright.sync_api import sync_playwright, Browser, BrowserContext, Page, Playwright
from src.core.config import config

class BrowserManager:
    def __init__(self):
        self.playwright: Optional[Playwright] = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        
        # Load config
        self.headless = config.get("browser.headless", False)
        self.viewport = config.get("browser.viewport", {"width": 1280, "height": 800})
        self.slow_mo = config.get("browser.slow_mo", 50)
        self.timeout = config.get("browser.timeout", 30000)
        self.user_data_path = config.get("paths.user_data_dir", "data/chrome_user_data")

    def start(self) -> Page:
        """Start the browser and return a page"""
        self.playwright = sync_playwright().start()
        
        # Launch with specific arguments to look more like a real user
        # and support persistent context
        launch_args = [
            "--disable-blink-features=AutomationControlled",
            "--window-size=1280,800"
        ]

        if not self.headless:
            # In headed mode, we might want to see the window
            pass

        # Using launch_persistent_context is better for maintaining session (cookies, etc.)
        # But for strictly public scraping without login, launch() + new_context is also fine.
        # Requirement said: "persistent session, cookies, cache separation" -> launch_persistent_context
        
        # Note: launch_persistent_context creates a browser AND context.
        # Launch persistent context
        self.context = self.playwright.chromium.launch_persistent_context(
            user_data_dir=self.user_data_path,
            headless=self.headless,
            args=launch_args, # Using existing launch_args
            viewport=self.viewport, # Using existing self.viewport
            slow_mo=self.slow_mo, # Using existing self.slow_mo
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36", # Default fallback
            locale="en-US",
            timezone_id="Europe/Istanbul"
        )      
        # Set default timeout
        self.context.set_default_timeout(self.timeout)
        
        # Get the default page or create new one
        if len(self.context.pages) > 0:
            self.page = self.context.pages[0]
        else:
            self.page = self.context.new_page()

        # Stealth scripts can be added here if needed
        return self.page

    def stop(self):
        """Stop the browser"""
        if self.context:
            self.context.close()
        if self.playwright:
            self.playwright.stop()

    def _get_random_user_agent(self) -> str:
        """Get a random user agent string"""
        # A small list of modern user agents
        agents = [
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
        ]
        return random.choice(agents)

    def random_sleep(self, min_ms: int = 1000, max_ms: int = 3000):
        """Sleep for a random amount of time"""
        sleep_time = random.randint(min_ms, max_ms) / 1000.0
        time.sleep(sleep_time)
