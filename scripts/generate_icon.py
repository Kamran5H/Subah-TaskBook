import math
from PIL import Image, ImageDraw

def create_subah_icon():
    size = 256
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Rounded dark background rectangle
    bg_color = (13, 17, 26, 255)
    border_color = (56, 189, 248, 180)
    corner_radius = 48

    # Rounded box
    draw.rounded_rectangle([(8, 8), (size - 8, size - 8)], radius=corner_radius, fill=bg_color, outline=border_color, width=4)

    # 2. Ambient radial glow in center
    glow_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_img)
    center = (128, 140)

    for r in range(80, 0, -2):
        alpha = int((1 - (r / 80)) * 120)
        glow_draw.ellipse([center[0] - r, center[1] - r, center[0] + r, center[1] + r], fill=(251, 191, 36, alpha))

    img = Image.alpha_composite(img, glow_img)
    draw = ImageDraw.Draw(img)

    # 3. Sunburst Rays
    sun_center = (128, 140)
    num_rays = 12
    for i in range(num_rays):
        angle = -math.pi + (i * math.pi / (num_rays - 1))
        if -math.pi * 0.9 <= angle <= -math.pi * 0.1:
            x_start = sun_center[0] + 35 * math.cos(angle)
            y_start = sun_center[1] + 35 * math.sin(angle)
            x_end = sun_center[0] + 65 * math.cos(angle)
            y_end = sun_center[1] + 65 * math.sin(angle)
            draw.line([(x_start, y_start), (x_end, y_end)], fill=(251, 191, 36, 230), width=4)

    # 4. Crescent Moon
    # Outer circle
    draw.ellipse([88, 100, 168, 180], fill=(255, 215, 0, 255))
    # Inner cutter circle for crescent
    draw.ellipse([100, 92, 175, 167], fill=bg_color)

    # 5. Morning Star
    star_center = (148, 92)
    def draw_star(c, r_out, r_in, color):
        pts = []
        for i in range(8):
            a = i * math.pi / 4
            r = r_out if i % 2 == 0 else r_in
            pts.append((c[0] + r * math.cos(a), c[1] + r * math.sin(a)))
        draw.polygon(pts, fill=color)

    draw_star(star_center, 14, 5, (255, 255, 255, 255))

    # 6. Horizon line arc
    draw.arc([30, 145, 226, 210], start=200, end=340, fill=(56, 189, 248, 240), width=4)

    # Save PNG
    img.save("assets/icon.png", format="PNG")
    # Save ICO
    img.save("assets/icon.ico", format="ICO", sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)])
    print("Icons successfully created: assets/icon.png and assets/icon.ico")

if __name__ == "__main__":
    create_subah_icon()
