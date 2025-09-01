# 🎨 Black Background Removal Script

This script removes black backgrounds from JPG images and saves them as PNG files with transparency.

## 📦 Quick Setup

### Option 1: Automatic Setup
```bash
./process_images.sh
```

### Option 2: Manual Setup
```bash
# Install dependencies
pip3 install -r requirements_image_processing.txt

# Process images
python3 remove_black_background.py frontend/images
```

## 🎯 Usage Examples

### Basic Usage
```bash
# Process all JPGs in frontend/images
python3 remove_black_background.py frontend/images
```

### Advanced Usage
```bash
# Custom output directory
python3 remove_black_background.py frontend/images -o frontend/images_png

# Custom threshold (more sensitive to dark pixels)
python3 remove_black_background.py frontend/images -t 50

# Help
python3 remove_black_background.py --help
```

## ⚙️ How It Works

1. **Detects black pixels**: Uses a threshold to identify black/dark pixels
2. **Creates transparency**: Converts black pixels to transparent
3. **Preserves size**: Maintains original image dimensions
4. **Batch processing**: Processes all JPG files in a directory

## 🎛️ Parameters

- **`input_dir`**: Directory containing JPG files
- **`-o, --output`**: Output directory (default: same as input)
- **`-t, --threshold`**: Black pixel threshold 0-255 (default: 30)
  - Lower values = only pure black becomes transparent
  - Higher values = more dark colors become transparent

## 📁 File Structure After Processing

```
frontend/images/
├── la_jolla.jpg           # Original
├── la_jolla.png           # With transparency
├── la_jolla_avatar.jpg    # Original
├── la_jolla_avatar.png    # With transparency
└── ... (all other images)
```

## 🔧 Dependencies

- **Pillow**: Image processing library
- **NumPy**: Array operations for pixel manipulation

## ⚠️ Notes

- The script preserves original JPG files
- PNG files will be larger due to transparency data
- Adjust threshold if too much or too little is being removed
- Works best with images that have solid black backgrounds
