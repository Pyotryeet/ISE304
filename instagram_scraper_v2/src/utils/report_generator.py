import pandas as pd
import sys
from pathlib import Path

def generate_report(csv_path):
    try:
        df = pd.read_csv(csv_path)
        
        # Add basic styling
        html = f"""
        <html>
        <head>
            <title>Scraping Results</title>
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 20px; background: #f5f5f7; }}
                .container {{ max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
                h1 {{ color: #1d1d1f; margin-bottom: 20px; }}
                table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
                th, td {{ padding: 12px; text-align: left; border-bottom: 1px solid #e5e5e5; }}
                th {{ background-color: #f5f5f7; font-weight: 600; color: #1d1d1f; }}
                tr:hover {{ background-color: #f5f5f7; }}
                a {{ color: #0066cc; text-decoration: none; }}
                a:hover {{ text-decoration: underline; }}
                .stats {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }}
                .stat-card {{ background: #f5f5f7; padding: 20px; border-radius: 10px; }}
                .stat-value {{ font-size: 24px; font-weight: bold; color: #1d1d1f; }}
                .stat-label {{ color: #86868b; font-size: 14px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Instagram Scraper Results</h1>
                
                <div class="stats">
                    <div class="stat-card">
                        <div class="stat-value">{len(df)}</div>
                        <div class="stat-label">Profiles Scraped</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">{df['posts'].sum() if 'posts' in df.columns else 0}</div>
                        <div class="stat-label">Total Posts Found In Batch</div>
                    </div>
                </div>

                {df.to_html(index=False, escape=False, render_links=True)}
            </div>
        </body>
        </html>
        """
        
        output_path = Path(csv_path).parent / "report.html"
        with open(output_path, "w") as f:
            f.write(html)
            
        return output_path
    except Exception as e:
        print(f"Error generating report: {e}")
        return None

if __name__ == "__main__":
    if len(sys.argv) > 1:
        path = generate_report(sys.argv[1])
        if path:
            print(f"Report generated: {path}")
