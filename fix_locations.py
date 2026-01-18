"""Quick script to fix Instagram locations"""
import sqlite3

conn = sqlite3.connect('backend/database/hive.db')
cursor = conn.cursor()

# Set location to NULL where it's just "Instagram"
cursor.execute("UPDATE events SET location = NULL WHERE location = 'Instagram'")
updated = cursor.rowcount

conn.commit()
conn.close()

print(f"Fixed {updated} events - removed 'Instagram' as location")
