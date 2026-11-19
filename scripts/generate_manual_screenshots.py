import os
import time
import subprocess
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCREENSHOT_DIR = os.path.join(BASE_DIR, "public", "manual", "screenshots")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
TEMP_PROFILE = r"C:\Users\admin\AppData\Local\Temp\shot_profile"

def capture(url, filename, width=1280, height=850):
    target_path = os.path.join(SCREENSHOT_DIR, filename)
    cmd = [
        CHROME_PATH,
        "--headless",
        "--disable-gpu",
        f"--user-data-dir={TEMP_PROFILE}",
        f"--window-size={width},{height}",
        f"--screenshot={target_path}",
        url
    ]
    print(f"Capturing {url} to {filename}...")
    res = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
    if os.path.exists(target_path):
        size = os.path.getsize(target_path)
        print(f" -> Success! Size: {size} bytes")
        return target_path
    else:
        print(f" -> Failed to create {target_path}")
        return None

def add_callout(draw, x, y, number, radius=16):
    # Circle with red fill and white border
    draw.ellipse(
        [x - radius, y - radius, x + radius, y + radius],
        fill="#dc2626",
        outline="#ffffff",
        width=2
    )
    # White centered text
    try:
        font = ImageFont.truetype("arialbd.ttf", 15)
    except:
        try:
            font = ImageFont.truetype("arial.ttf", 15)
        except:
            font = ImageFont.load_default()
    
    text = str(number)
    draw.text((x, y), text, fill="#ffffff", font=font, anchor="mm")

def annotate(filename, callouts, rects=None):
    img_path = os.path.join(SCREENSHOT_DIR, filename)
    if not os.path.exists(img_path):
        print(f"Image {filename} not found to annotate.")
        return
    img = Image.open(img_path).convert("RGB")
    draw = ImageDraw.Draw(img)

    if rects:
        for r in rects:
            draw.rectangle(r, outline="#dc2626", width=2)

    for (x, y, num) in callouts:
        add_callout(draw, x, y, num)

    img.save(img_path, "PNG")
    print(f"Annotated {filename} with {len(callouts)} badges.")

def main():
    # 1. Home
    capture("http://localhost:3000", "fig1_home.png", 1280, 850)
    annotate("fig1_home.png", [
        (130, 32, 1),   # Header / Logo
        (460, 32, 2),   # Navigation Links
        (1080, 32, 3),  # Search Box & Language
        (1235, 32, 4),  # Admin Login Button
        (330, 480, 5),  # Hero Call to Action
    ])

    # 2. Explorer
    capture("http://localhost:3000/explore", "fig2_explore.png", 1280, 850)
    annotate("fig2_explore.png", [
        (320, 150, 1),  # Search input
        (760, 150, 2),  # Oral Literature vs Folk Song filters
        (380, 205, 3),  # Genre filter chips
        (1040, 205, 4), # Provenance / Municipality dropdown
        (350, 360, 5),  # Entry Card & Audio playback trigger
    ])

    # 3. Entry Detail
    capture("http://localhost:3000/archive/cmvnxgovq000jawurtx7fu6gl", "fig3_detail.png", 1280, 850)
    annotate("fig3_detail.png", [
        (250, 130, 1),  # Title & Provenance badge
        (640, 220, 2),  # Audio Player Bar
        (350, 440, 3),  # Agusan Manobo Original Transcription
        (920, 440, 4),  # Parallel English / Bisaya Translations
        (300, 770, 5),  # Linguistic & Cultural Metadata
    ])

    # 4. Classification Workbench
    capture("http://localhost:3000/classification", "fig4_classification.png", 1280, 850)
    annotate("fig4_classification.png", [
        (340, 220, 1),  # Input Textarea
        (720, 220, 2),  # Engine Selection (Rule-Based, ML, Gemini LLM)
        (340, 460, 3),  # "Classify Literary Entry" Button
        (950, 300, 4),  # Classification Result (Genre & Theme)
        (950, 510, 5),  # Model Explanation & TF-IDF Weights
    ])

    # 5. Translator & Lexical Validator
    capture("http://localhost:3000/translator", "fig5_translator.png", 1280, 850)
    annotate("fig5_translator.png", [
        (360, 190, 1),  # Language direction toggle
        (360, 330, 2),  # Text input
        (560, 450, 3),  # Translate & Validate action
        (940, 330, 4),  # Translation output
        (640, 680, 5),  # Affix Decomposition & Webonary validation table
    ])

    # 6. Analytics Dashboard
    capture("http://localhost:3000/dashboard", "fig6_dashboard.png", 1280, 850)
    annotate("fig6_dashboard.png", [
        (200, 140, 1),  # Total archived works stat
        (1080, 140, 2), # CSV & JSON Export buttons
        (420, 380, 3),  # Genre & Theme distribution charts
        (980, 380, 4),  # Geographic provenance distribution
        (640, 720, 5),  # Municipal provenance breakdown
    ])

    # 7. Admin Login
    capture("http://localhost:3000/admin/login", "fig7_admin_login.png", 1280, 850)
    annotate("fig7_admin_login.png", [
        (640, 260, 1),  # Login Card Header
        (640, 370, 2),  # Password Input field
        (640, 450, 3),  # Sign In button
        (640, 540, 4),  # Security warning
    ])

    # 8. Admin New Entry
    capture("http://localhost:3000/admin/new", "fig8_admin_new.png", 1280, 850)
    annotate("fig8_admin_new.png", [
        (400, 150, 1),  # Title & Literary Type fields
        (850, 150, 2),  # Genre & Themes selection
        (400, 350, 3),  # Geographic Provenance (Municipality & Barangay)
        (850, 350, 4),  # Informant & Audio File Upload
        (640, 700, 5),  # "Save to Cultural Archive" Button
    ])

    print("All screenshots generated and annotated successfully!")

if __name__ == "__main__":
    main()
