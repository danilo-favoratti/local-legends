#!/usr/bin/env python3
"""
📐 PNG Image Resizer
Resizes all PNG images (except map.png) to 256x256 pixels.
"""

import os
from PIL import Image, ImageOps
import argparse

def resize_image(input_path, output_path, target_size=(256, 256), quality='high'):
    """
    Resize an image to target size while maintaining aspect ratio.
    
    Args:
        input_path (str): Path to input PNG file
        output_path (str): Path to output PNG file
        target_size (tuple): Target size (width, height)
        quality (str): Resize quality ('high', 'medium', 'fast')
    """
    try:
        # Open the image
        img = Image.open(input_path)
        
        # Convert to RGBA to preserve transparency
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # Get original size
        original_size = img.size
        
        # Choose resampling filter based on quality
        if quality == 'high':
            resample = Image.LANCZOS  # Best quality, slower
        elif quality == 'medium':
            resample = Image.BILINEAR  # Good quality, faster
        else:  # fast
            resample = Image.NEAREST  # Fastest, pixelated
        
        # Resize with aspect ratio preservation
        # This will fit the image within the target size, maintaining aspect ratio
        img.thumbnail(target_size, resample)
        
        # Create a new transparent image with target size
        resized_img = Image.new('RGBA', target_size, (0, 0, 0, 0))
        
        # Calculate position to center the image
        x = (target_size[0] - img.width) // 2
        y = (target_size[1] - img.height) // 2
        
        # Paste the resized image onto the transparent background
        resized_img.paste(img, (x, y), img)
        
        # Save the result
        resized_img.save(output_path, 'PNG', optimize=True)
        
        print(f"✅ Resized: {os.path.basename(input_path)} ({original_size[0]}x{original_size[1]}) -> ({target_size[0]}x{target_size[1]})")
        return True
        
    except Exception as e:
        print(f"❌ Error processing {input_path}: {str(e)}")
        return False

def should_skip_file(filename, exclusions):
    """
    Check if a file should be skipped based on exclusion list.
    
    Args:
        filename (str): Name of the file
        exclusions (list): List of filenames to exclude
    
    Returns:
        bool: True if file should be skipped
    """
    return filename.lower() in [exc.lower() for exc in exclusions]

def process_directory(input_dir, output_dir=None, target_size=(256, 256), 
                     quality='high', exclusions=None, in_place=False):
    """
    Process all PNG files in a directory.
    
    Args:
        input_dir (str): Directory containing PNG files
        output_dir (str): Output directory (if None, uses input_dir)
        target_size (tuple): Target size (width, height)
        quality (str): Resize quality
        exclusions (list): List of filenames to exclude
        in_place (bool): Whether to overwrite original files
    """
    if exclusions is None:
        exclusions = ['map.png']  # Default exclusion
    
    if output_dir is None or in_place:
        output_dir = input_dir
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Find all PNG files
    png_files = []
    for file in os.listdir(input_dir):
        if file.lower().endswith('.png'):
            if not should_skip_file(file, exclusions):
                png_files.append(file)
            else:
                print(f"⏭️  Skipping excluded file: {file}")
    
    if not png_files:
        print(f"⚠️  No PNG files found in {input_dir} (excluding {exclusions})")
        return
    
    print(f"📐 Found {len(png_files)} PNG files to resize")
    print(f"📁 Input directory: {input_dir}")
    print(f"📁 Output directory: {output_dir}")
    print(f"🎯 Target size: {target_size[0]}x{target_size[1]}")
    print(f"🎨 Quality: {quality}")
    print(f"🚫 Exclusions: {', '.join(exclusions)}")
    if in_place:
        print("⚠️  IN-PLACE MODE: Original files will be overwritten!")
    print("-" * 60)
    
    successful = 0
    failed = 0
    skipped = 0
    
    for png_file in png_files:
        input_path = os.path.join(input_dir, png_file)
        
        if in_place:
            output_path = input_path
        else:
            output_path = os.path.join(output_dir, png_file)
        
        # Skip if file already exists and has correct size (unless in-place)
        if not in_place and os.path.exists(output_path):
            try:
                with Image.open(output_path) as existing_img:
                    if existing_img.size == target_size:
                        print(f"⏭️  Skipping (already correct size): {png_file}")
                        skipped += 1
                        continue
            except:
                pass  # If we can't check, proceed with resize
        
        if resize_image(input_path, output_path, target_size, quality):
            successful += 1
        else:
            failed += 1
    
    print("-" * 60)
    print(f"🎉 Processing complete!")
    print(f"✅ Successful: {successful}")
    print(f"⏭️  Skipped: {skipped}")
    print(f"❌ Failed: {failed}")

def main():
    """Main function with command line interface."""
    parser = argparse.ArgumentParser(
        description="Resize PNG images to 256x256 (excludes map.png by default)"
    )
    parser.add_argument(
        "input_dir", 
        help="Directory containing PNG files"
    )
    parser.add_argument(
        "-o", "--output", 
        help="Output directory (default: same as input)"
    )
    parser.add_argument(
        "-s", "--size", 
        nargs=2, 
        type=int, 
        default=[256, 256],
        help="Target size as width height (default: 256 256)"
    )
    parser.add_argument(
        "-q", "--quality", 
        choices=['high', 'medium', 'fast'],
        default='high',
        help="Resize quality (default: high)"
    )
    parser.add_argument(
        "-e", "--exclude", 
        nargs='*',
        default=['map.png'],
        help="Files to exclude (default: map.png)"
    )
    parser.add_argument(
        "--in-place", 
        action='store_true',
        help="Overwrite original files (CAUTION: No backup!)"
    )
    parser.add_argument(
        "--preview", 
        action='store_true',
        help="Preview what would be processed without actually resizing"
    )
    
    args = parser.parse_args()
    
    if not os.path.exists(args.input_dir):
        print(f"❌ Input directory does not exist: {args.input_dir}")
        return
    
    target_size = tuple(args.size)
    
    # Preview mode
    if args.preview:
        print("🔍 PREVIEW MODE - No files will be modified")
        png_files = [f for f in os.listdir(args.input_dir) 
                    if f.lower().endswith('.png') and 
                    not should_skip_file(f, args.exclude)]
        
        print(f"📐 Would resize {len(png_files)} PNG files to {target_size[0]}x{target_size[1]}")
        print(f"🚫 Would exclude: {', '.join(args.exclude)}")
        print("Files to process:")
        for f in png_files:
            print(f"  - {f}")
        return
    
    # Confirm in-place operation
    if args.in_place:
        response = input("⚠️  This will overwrite original files. Continue? (y/N): ").lower().strip()
        if response != 'y':
            print("Operation cancelled.")
            return
    
    process_directory(
        args.input_dir, 
        args.output, 
        target_size, 
        args.quality, 
        args.exclude,
        args.in_place
    )

if __name__ == "__main__":
    # Check if we're being run directly with arguments
    import sys
    if len(sys.argv) > 1:
        main()
    else:
        # Interactive mode for quick usage
        print("📐 PNG Image Resizer")
        print("=" * 50)
        print("📁 Quick usage:")
        print("1. Place this script in your project root")
        print("2. Run one of these commands:")
        print()
        print("   # Resize images in frontend/images (excludes map.png):")
        print("   python3 resizer/resize_images.py frontend/images")
        print()
        print("   # Custom output directory:")
        print("   python3 resizer/resize_images.py frontend/images -o frontend/images_resized")
        print()
        print("   # Custom size (512x512):")
        print("   python3 resizer/resize_images.py frontend/images -s 512 512")
        print()
        print("   # Preview mode (see what would be processed):")
        print("   python3 resizer/resize_images.py frontend/images --preview")
        print()
        print("   # In-place (overwrite originals - CAUTION!):")
        print("   python3 resizer/resize_images.py frontend/images --in-place")
        print()
        
        # Try to auto-detect images directory
        possible_dirs = ["frontend/images", "images", "./images"]
        for dir_path in possible_dirs:
            if os.path.exists(dir_path):
                print(f"🔍 Found images directory: {dir_path}")
                response = input(f"Process {dir_path} to 256x256? (y/n): ").lower().strip()
                if response == 'y':
                    process_directory(dir_path, target_size=(256, 256))
                break
        else:
            print("⚠️  No images directory found automatically.")
            print("Please specify the path manually:")
            print("python3 resizer/resize_images.py /path/to/images")
