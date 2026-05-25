import cv2
import numpy as np
import os

# =========================================================
# CONFIGURATION
# =========================================================

# Input scanned sheet
INPUT_IMAGE = "data/raw/CONS_KA.png"

# Output folder
OUTPUT_DIR = "data/mini_dataset/CONS_KA"

# Grid size
ROWS = 17
COLS = 11

# =========================================================
# IMPORTANT TUNING VALUES
# =========================================================

# ROTATION
# -----------------------------------------
# Rotate image if grid looks tilted.
#
# Negative  -> clockwise
# Positive  -> anticlockwise
#
# Examples:
# -0.5
# -1.0
#  1.0
#
ROTATION_ANGLE = 0


# OUTER GRID CROP ADJUSTMENTS
# -----------------------------------------
# These control the GREEN outer rectangle.
#
# Increase LEFT_ADJUST
# -> crop moves RIGHT
#
# Increase RIGHT_ADJUST
# -> crop becomes SMALLER from right
#
# Increase TOP_ADJUST
# -> crop moves DOWN
#
# Increase BOTTOM_ADJUST
# -> crop becomes SMALLER from bottom
#
LEFT_ADJUST = 6
RIGHT_ADJUST = 4
TOP_ADJUST = 4
BOTTOM_ADJUST = 5


# INNER CELL PADDING
# -----------------------------------------
# Removes borders from each cropped cell.
#
# Increase:
# -> removes more borders
#
# Decrease:
# -> keeps more character area
#
CELL_PADDING = 6


# EMPTY CELL THRESHOLD
# -----------------------------------------
# Increase:
# -> fewer cells saved
#
# Decrease:
# -> more cells saved
#
MIN_PIXEL_THRESHOLD = 80


# =========================================================
# CREATE OUTPUT DIRECTORIES
# =========================================================

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs("outputs", exist_ok=True)

# =========================================================
# LOAD IMAGE
# =========================================================

image = cv2.imread(INPUT_IMAGE)

if image is None:
    raise Exception("Image not found")

# =========================================================
# ROTATE IMAGE
# =========================================================

(h_img, w_img) = image.shape[:2]

center = (w_img // 2, h_img // 2)

rotation_matrix = cv2.getRotationMatrix2D(
    center,
    ROTATION_ANGLE,
    1.0
)

image = cv2.warpAffine(
    image,
    rotation_matrix,
    (w_img, h_img)
)

original = image.copy()

# =========================================================
# PREPROCESS
# =========================================================

gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

blur = cv2.GaussianBlur(gray, (5, 5), 0)

thresh = cv2.adaptiveThreshold(
    blur,
    255,
    cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
    cv2.THRESH_BINARY_INV,
    11,
    2
)

# =========================================================
# FIND LARGEST CONTOUR
# =========================================================

contours, _ = cv2.findContours(
    thresh,
    cv2.RETR_EXTERNAL,
    cv2.CHAIN_APPROX_SIMPLE
)

largest_contour = max(contours, key=cv2.contourArea)

# =========================================================
# DETECT OUTER GRID BOX
# =========================================================

x, y, w, h = cv2.boundingRect(largest_contour)

# =========================================================
# MANUAL ADJUSTMENTS
# =========================================================

x = x + LEFT_ADJUST
y = y + TOP_ADJUST

w = w - LEFT_ADJUST - RIGHT_ADJUST
h = h - TOP_ADJUST - BOTTOM_ADJUST

# =========================================================
# DRAW DETECTED OUTER BOX
# =========================================================

debug_box = original.copy()

cv2.rectangle(
    debug_box,
    (x, y),
    (x + w, y + h),
    (0, 255, 0),
    4
)

cv2.imwrite(
    "outputs/01_detected_outer_box.jpg",
    debug_box
)

print("Saved: outputs/01_detected_outer_box.jpg")

# =========================================================
# CROP GRID AREA
# =========================================================

grid = original[y:y+h, x:x+w]

# =========================================================
# COMPUTE CELL SIZE
# =========================================================

cell_width = w // COLS
cell_height = h // ROWS

print(f"\nCell Width  : {cell_width}")
print(f"Cell Height : {cell_height}")

# =========================================================
# DRAW GRID LINES FOR DEBUGGING
# =========================================================

debug_grid = grid.copy()

# Vertical lines
for col in range(COLS + 1):

    x_pos = col * cell_width

    cv2.line(
        debug_grid,
        (x_pos, 0),
        (x_pos, h),
        (0, 255, 0),
        2
    )

# Horizontal lines
for row in range(ROWS + 1):

    y_pos = row * cell_height

    cv2.line(
        debug_grid,
        (0, y_pos),
        (w, y_pos),
        (0, 255, 0),
        2
    )

cv2.imwrite(
    "outputs/02_grid_split_debug.jpg",
    debug_grid
)

print("Saved: outputs/02_grid_split_debug.jpg")

# =========================================================
# EXTRACT CELLS
# =========================================================

counter = 1

for row in range(ROWS):

    for col in range(COLS):

        # Cell coordinates
        x1 = col * cell_width
        y1 = row * cell_height

        x2 = x1 + cell_width
        y2 = y1 + cell_height

        # Crop cell
        cell = grid[y1:y2, x1:x2]

        # Remove borders
        cell = cell[
            CELL_PADDING:-CELL_PADDING,
            CELL_PADDING:-CELL_PADDING
        ]

        # Convert to grayscale
        gray_cell = cv2.cvtColor(
            cell,
            cv2.COLOR_BGR2GRAY
        )

        # Binary threshold
        _, binary = cv2.threshold(
            gray_cell,
            180,
            255,
            cv2.THRESH_BINARY
        )

        # Count ink pixels
        non_white_pixels = np.sum(binary < 250)

        # Skip empty cells
        if non_white_pixels < MIN_PIXEL_THRESHOLD:
            continue

        # Save image
        filename = f"ka_{counter:03d}.jpg"

        save_path = os.path.join(
            OUTPUT_DIR,
            filename
        )

        cv2.imwrite(save_path, binary)

        counter += 1

# =========================================================
# DONE
# =========================================================

print(f"\nSaved {counter - 1} character images")

print("\nCheck these debug images:")
print("outputs/01_detected_outer_box.jpg")
print("outputs/02_grid_split_debug.jpg")