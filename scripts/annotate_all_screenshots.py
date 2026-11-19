import os
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCREENSHOT_DIR = os.path.join(BASE_DIR, "public", "manual", "screenshots")

def add_callout(draw, x, y, number, radius=16):
    # Outer white border (2px)
    draw.ellipse(
        [x - radius - 2, y - radius - 2, x + radius + 2, y + radius + 2],
        fill="#ffffff"
    )
    # Bright red circle
    draw.ellipse(
        [x - radius, y - radius, x + radius, y + radius],
        fill="#dc2626"
    )
    # White number text
    try:
        font = ImageFont.truetype("arialbd.ttf", 16)
    except:
        try:
            font = ImageFont.truetype("arial.ttf", 16)
        except:
            font = ImageFont.load_default()
    
    text = str(number)
    draw.text((x, y), text, fill="#ffffff", font=font, anchor="mm")

def annotate(filename, callouts, rects=None):
    img_path = os.path.join(SCREENSHOT_DIR, filename)
    if not os.path.exists(img_path):
        print(f"Skipping {filename} - not found")
        return
    img = Image.open(img_path).convert("RGB")
    draw = ImageDraw.Draw(img)

    if rects:
        for r in rects:
            draw.rectangle(r, outline="#dc2626", width=2)

    for (x, y, num) in callouts:
        add_callout(draw, x, y, num)

    img.save(img_path, "PNG", quality=95)
    print(f"Annotated {filename} with {len(callouts)} badges.")

def main():
    # Fig 1: Home
    annotate("fig1_home.png", [
        (130, 32, 1),
        (460, 32, 2),
        (1080, 32, 3),
        (1235, 32, 4),
        (330, 480, 5),
    ])

    # Fig 2: Explore
    annotate("fig2_explore.png", [
        (320, 150, 1),
        (760, 150, 2),
        (380, 205, 3),
        (1040, 205, 4),
        (350, 360, 5),
    ])

    # Fig 3: Detail
    annotate("fig3_detail.png", [
        (250, 130, 1),
        (640, 220, 2),
        (350, 440, 3),
        (920, 440, 4),
        (300, 770, 5),
    ])

    # Fig 4: Classification
    annotate("fig4_classification.png", [
        (340, 220, 1),
        (720, 220, 2),
        (340, 460, 3),
        (950, 300, 4),
        (950, 510, 5),
    ])

    # Fig 5: Translator
    annotate("fig5_translator.png", [
        (360, 190, 1),
        (360, 330, 2),
        (560, 450, 3),
        (940, 330, 4),
        (640, 680, 5),
    ])

    # Fig 6: Dashboard
    annotate("fig6_dashboard.png", [
        (200, 140, 1),
        (1080, 140, 2),
        (420, 380, 3),
        (980, 380, 4),
        (640, 720, 5),
    ])

    # Fig 7: Admin Login
    annotate("fig7_admin_login.png", [
        (640, 260, 1),
        (640, 370, 2),
        (640, 450, 3),
        (640, 540, 4),
    ])

    # Fig 8: Admin Entries
    annotate("fig8_admin_entries.png", [
        (320, 130, 1),  # Tabs
        (1160, 130, 2), # + New Entry Button
        (450, 200, 3),  # Filter & Search
        (1150, 320, 4), # Actions (Edit/Delete)
        (1240, 32, 5),  # Sign Out
    ])

    # Fig 9: Admin New Entry
    annotate("fig9_admin_new.png", [
        (380, 160, 1),  # Title inputs
        (850, 160, 2),  # Genre & Form
        (380, 330, 3),  # Provenance (Municipality & Barangay)
        (850, 330, 4),  # Storyteller & Audio Upload
        (640, 680, 5),  # Save to Archive Button
    ])

    print("All screenshots successfully annotated with authentic red callout markers!")

if __name__ == "__main__":
    main()
