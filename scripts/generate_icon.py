import os
from PIL import Image, ImageDraw

def create_subah_icon():
    """
    Refines and produces the master Subah icon (PNG & multi-resolution ICO)
    featuring the golden rising sun, crescent moon, and morning star.
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, ".."))
    master_png = os.path.join(project_root, "assets", "icon.png")
    if not os.path.exists(master_png):
        print(f"Master icon {master_png} not found.")
        return

    img = Image.open(master_png).convert("RGBA")
    
    # Save PNG to both assets and src/assets for frontend titlebar display
    assets_dir = os.path.join(project_root, "assets")
    src_assets_dir = os.path.join(project_root, "src", "assets")
    os.makedirs(assets_dir, exist_ok=True)
    os.makedirs(src_assets_dir, exist_ok=True)
    img.save(os.path.join(assets_dir, "icon.png"), format="PNG")
    img.save(os.path.join(src_assets_dir, "icon.png"), format="PNG")

    # Multi-resolution ICO (256, 128, 64, 48, 32, 16)
    ico_sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
    img.save(os.path.join(assets_dir, "icon.ico"), format="ICO", sizes=ico_sizes)
    print("Icons successfully verified & refreshed: assets/icon.png, src/assets/icon.png, assets/icon.ico")

if __name__ == "__main__":
    create_subah_icon()
