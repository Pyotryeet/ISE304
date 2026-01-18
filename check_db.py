import sqlite3

conn = sqlite3.connect('backend/database/hive.db')
cursor = conn.cursor()

print("Checking database events...")
cursor.execute("SELECT title, location FROM events WHERE source = 'scraped'")
rows = cursor.fetchall()

for row in rows:
    title = row[0][:40]
    location = row[1]
    # Safe print for Windows console
    safe_title = title.encode('ascii', 'replace').decode('ascii')
    safe_loc = str(location).encode('ascii', 'replace').decode('ascii') if location else "None"
    print(f"Title: {safe_title:<40} | Location: {safe_loc}")

conn.close()
