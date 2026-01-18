"""
The Hive - Reparse Scraped Events
Re-processes existing scraped events in the database using the LLM parser
"""

import sqlite3
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add scraper directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'scraper'))

from scraper.llm_parser import parse_event_with_llm

DB_PATH = os.path.join(os.path.dirname(__file__), 'backend', 'database', 'hive.db')


def get_scraped_events():
    """Get all scraped events from the database"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT e.id, e.title, e.description, e.location, e.category, e.event_date,
               c.name as club_name
        FROM events e
        LEFT JOIN clubs c ON e.club_id = c.id
        WHERE e.source = 'scraped'
    ''')
    
    events = cursor.fetchall()
    conn.close()
    return events


def update_event(event_id, updates):
    """Update an event in the database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    set_clauses = []
    values = []
    
    if updates.get('title'):
        set_clauses.append('title = ?')
        values.append(updates['title'])
    if updates.get('location'):
        set_clauses.append('location = ?')
        values.append(updates['location'])
    if updates.get('category'):
        set_clauses.append('category = ?')
        values.append(updates['category'])
    if updates.get('event_date'):
        set_clauses.append('event_date = ?')
        values.append(updates['event_date'])
    
    if set_clauses:
        set_clauses.append('updated_at = CURRENT_TIMESTAMP')
        query = f"UPDATE events SET {', '.join(set_clauses)} WHERE id = ?"
        values.append(event_id)
        cursor.execute(query, values)
        conn.commit()
    
    conn.close()


def main():
    print("=" * 60)
    print("THE HIVE - Reparse Scraped Events with LLM")
    print("=" * 60)
    
    # Check API key
    if not os.getenv('OPENAI_API_KEY'):
        print("[X] Error: OPENAI_API_KEY not set in environment")
        return
    
    # Get scraped events
    events = get_scraped_events()
    print(f"\nFound {len(events)} scraped events in database\n")
    
    if not events:
        print("No scraped events to process.")
        return
    
    updated_count = 0
    
    for i, event in enumerate(events):
        event_id = event['id']
        title = event['title']
        description = event['description'] or ''
        current_location = event['location']
        current_category = event['category']
        club_name = event['club_name']
        
        # Encode title for safe printing on Windows
        safe_title = title[:50].encode('ascii', 'replace').decode('ascii')
        print(f"[{i+1}/{len(events)}] Processing: {safe_title}...")
        print(f"    Current location: {current_location}")
        print(f"    Current category: {current_category}")
        
        # Combine title and description for parsing
        content = f"{title}\n\n{description}"
        
        # Parse with LLM
        parsed = parse_event_with_llm(content, club_name)
        
        if parsed:
            updates = {}
            
            # Only update if LLM found better data
            new_location = parsed.get('location')
            new_category = parsed.get('category')
            new_title = parsed.get('title')
            
            # Update location if current is empty, "Instagram", or LLM found something better
            if new_location:
                if not current_location or current_location.lower() == 'instagram' or len(current_location) < 5:
                    updates['location'] = new_location
                    print(f"    -> New location: {new_location}")
            
            # Update category if not set
            if new_category and not current_category:
                updates['category'] = new_category
                print(f"    -> New category: {new_category}")
            
            if updates:
                update_event(event_id, updates)
                updated_count += 1
                print(f"    [OK] Updated!")
            else:
                print(f"    [--] No updates needed")
        else:
            print(f"    [!] LLM parsing failed, skipping")
        
        print()
    
    print("=" * 60)
    print(f"Done! Updated {updated_count} out of {len(events)} events")
    print("=" * 60)


if __name__ == "__main__":
    main()
