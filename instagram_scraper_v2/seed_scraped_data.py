from src.utils.backend_client import BackendClient
from datetime import datetime, timedelta

def seed_data():
    client = BackendClient()
    
    events = [
        {
            "club": "itumdk",
            "data": {
                "caption": "🎵 MDK Konseri bu Cuma! Herkesi bekliyoruz. #itu #konser #mdk",
                "timestamp": (datetime.now() + timedelta(days=2)).isoformat(),
                "url": "https://www.instagram.com/p/mock1"
            }
        },
        {
            "club": "itusinemakulubu",
            "data": {
                "caption": "🎬 Film Gösterimi: Interstellar. Yer: SDKM, Saat: 18:00.",
                "timestamp": (datetime.now() + timedelta(days=3)).isoformat(),
                "url": "https://www.instagram.com/p/mock2"
            }
        },
        {
            "club": "itugonulluluk",
            "data": {
                "caption": "🤝 Sosyal Sorumluluk Projesi tanışma toplantısı.",
                "timestamp": (datetime.now() + timedelta(days=5)).isoformat(),
                "url": "https://www.instagram.com/p/mock3"
            }
        },
        {
            "club": "ituimk",
            "data": {
                "caption": "🏗️ İMK Şantiye Gezisi: İstanbul Havalimanı Metro Projesi.",
                "timestamp": (datetime.now() + timedelta(days=7)).isoformat(),
                "url": "https://www.instagram.com/p/mock4"
            }
        },
        {
            "club": "itufotografkulubu",
            "data": {
                "caption": "📸 Temel Fotoğrafçılık Atölyesi bu hafta başlıyor!",
                "timestamp": (datetime.now() + timedelta(days=4)).isoformat(),
                "url": "https://www.instagram.com/p/mock5"
            }
        },
        {
            "club": "ieeeitu",
            "data": {
                "caption": "🤖 Robotik Zirvesi için geri sayım başladı. Biletler bio'da!",
                "timestamp": (datetime.now() + timedelta(days=10)).isoformat(),
                "url": "https://www.instagram.com/p/mock6"
            }
        },
        {
            "club": "itu.kmk",
            "data": {
                "caption": "🧪 Kariyer Günleri: İlaç Sektöründe Mühendislik.",
                "timestamp": (datetime.now() + timedelta(days=8)).isoformat(),
                "url": "https://www.instagram.com/p/mock7"
            }
        },
        {
            "club": "ituotg",
            "data": {
                "caption": "🚗 Otonom Araç Takımı yeni üye alımları başladı!",
                "timestamp": (datetime.now() + timedelta(days=2)).isoformat(),
                "url": "https://www.instagram.com/p/mock8"
            }
        }
    ]

    print("Seeding mock scraped data to verify website integration...")
    for item in events:
        print(f"Sending event for {item['club']}...")
        client.sync_event(item['data'], item['club'])
    print("Done! Check localhost:5173")

if __name__ == "__main__":
    seed_data()
