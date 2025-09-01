# 📐 PNG Image Resizer

This script resizes all PNG images (except map.png) to 256x256 pixels while maintaining aspect ratio and transparency.

## 🚀 Quick Setup

### Option 1: Automatic Setup
```bash
./resizer/resize_images.sh
```

### Option 2: Manual Setup
```bash
# Install dependencies
pip3 install -r resizer/requirements.txt

# Resize images
python3 resizer/resize_images.py frontend/images
```

## 🎯 Usage Examples

### Basic Usage
```bash
# Resize all PNGs in frontend/images to 256x256 (excludes map.png)
python3 resizer/resize_images.py frontend/images
```

### Advanced Usage
```bash
# Custom output directory
python3 resizer/resize_images.py frontend/images -o frontend/images_256x256

# Custom size (512x512)
python3 resizer/resize_images.py frontend/images -s 512 512

# Different quality settings
python3 resizer/resize_images.py frontend/images -q medium  # faster
python3 resizer/resize_images.py frontend/images -q fast    # fastest

# Exclude additional files
python3 resizer/resize_images.py frontend/images -e map.png background.png

# Preview mode (see what would be processed)
python3 resizer/resize_images.py frontend/images --preview

# In-place mode (CAUTION: overwrites originals!)
python3 resizer/resize_images.py frontend/images --in-place

# Help
python3 resizer/resize_images.py --help
```

## ⚙️ How It Works

1. **Finds PNG files**: Scans directory for all PNG files
2. **Excludes map.png**: Automatically skips map.png (and any other specified exclusions)
3. **Maintains aspect ratio**: Resizes while preserving proportions
4. **Centers image**: Places resized image in center of 256x256 canvas
5. **Preserves transparency**: Maintains alpha channel for transparent backgrounds
6. **High quality**: Uses LANCZOS resampling for best quality by default

## 🎛️ Parameters

- **`input_dir`**: Directory containing PNG files
- **`-o, --output`**: Output directory (default: same as input)
- **`-s, --size`**: Target size as width height (default: 256 256)
- **`-q, --quality`**: Resize quality - high/medium/fast (default: high)
- **`-e, --exclude`**: Files to exclude (default: map.png)
- **`--in-place`**: Overwrite original files (CAUTION!)
- **`--preview`**: Preview what would be processed without resizing

## 📁 File Structure After Processing

```
frontend/images/
├── map.png                    # EXCLUDED (unchanged)
├── la_jolla.png              # Resized to 256x256
├── la_jolla_avatar.png       # Resized to 256x256
├── main_char_front.png       # Resized to 256x256
└── ... (all other PNGs resized)
```

## 🎨 Quality Settings

- **high**: LANCZOS resampling (best quality, slower)
- **medium**: BILINEAR resampling (good quality, faster)
- **fast**: NEAREST resampling (fastest, pixelated)

## ⚠️ Important Notes

- **Preserves originals**: Creates new files unless `--in-place` is used
- **Maintains transparency**: Alpha channel is preserved
- **Aspect ratio**: Images are resized proportionally and centered
- **Smart exclusions**: Automatically excludes map.png
- **Skip existing**: Won't re-process files that already have correct size

## 🔧 Dependencies

- **Pillow**: Python imaging library for PNG processing

## 💡 Tips

- Use `--preview` first to see what will be processed
- Start with default settings - they work well for game sprites
- Use `--in-place` only if you have backups
- The script is safe to run multiple times (skips already processed files)
