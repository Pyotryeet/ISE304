import argparse
import sys
from src.core.browser import BrowserManager
from src.scrapers.instagram import InstagramScraper
from src.scrapers.club_finder import ClubSiteScraper
from src.utils.storage import DataManager
from src.utils.backend_client import BackendClient

def main():
    parser = argparse.ArgumentParser(description="Instagram Public Data Scraper")
    
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    # Command: scrape_users
    scrape_parser = subparsers.add_parser("scrape", help="Scrape Instagram profiles")
    scrape_parser.add_argument("usernames", nargs="+", help="List of usernames to scrape")
    
    # Command: find_clubs
    find_parser = subparsers.add_parser("find", help="Find Instagram links on a club site")
    find_parser.add_argument("url", help="URL of the club directory page")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)

    print("Initializing Browser Manager...")
    browser_manager = BrowserManager()
    data_manager = DataManager()
    
    try:
        if args.command == "scrape":
            scraper = InstagramScraper(browser_manager)
            results = []
            
            scraper.start_browser()
            
            for username in args.usernames:
                print(f"\n--- Processing {username} ---")
                profile = scraper.scrape(username)
                if profile:
                    results.append(profile)
                    print(f"Successfully scraped {username}")
                    
                    # Sync to backend
                    try:
                        print("Syncing with backend...")
                        backend_client = BackendClient()
                        sync_count = 0
                        for post in profile.posts:
                            if backend_client.sync_event(post.model_dump(), username):
                                sync_count += 1
                        print(f"Synced {sync_count} events to The Hive")
                    except Exception as e:
                        print(f"Sync failed: {e}")
                else:
                    print(f"Failed to scrape {username}")
                
            if results:
                data_manager.save_profiles(results)
                
        elif args.command == "find":
            scraper = ClubSiteScraper(browser_manager)
            scraper.start_browser()
            
            print(f"\n--- Scanning {args.url} ---")
            links = scraper.scrape(args.url)
            
            if links:
                data_manager.save_links(links)
                
    except KeyboardInterrupt:
        print("\nOperation cancelled by user.")
    except Exception as e:
        print(f"\nAn error occurred: {e}")
    finally:
        print("\nShutting down browser...")
        browser_manager.stop()
        print("Done.")

if __name__ == "__main__":
    main()
