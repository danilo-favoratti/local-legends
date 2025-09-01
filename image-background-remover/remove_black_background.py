#!/usr/bin/env python3
"""
🎨 Black Background Removal Script
Removes black backgrounds from JPG images and saves them as PNG with transparency.
"""

import os
from PIL import Image
import numpy as np

def remove_black_background(input_path, output_path, threshold=30):
    """
    Remove black background from an image and save as PNG with transparency.
    
    Args:
        input_path (str): Path to input JPG file
        output_path (str): Path to output PNG file
        threshold (int): Threshold for considering a pixel as "black" (0-255)
    """
    try:
        # Open the image
        img = Image.open(input_path)
        img = img.convert("RGBA")
        
        # Convert to numpy array for easier manipulation
        data = np.array(img)
        
        # Create a mask for black pixels (all RGB values below threshold)
        # This handles near-black pixels too, not just pure black
        black_mask = (data[:, :, 0] <= threshold) & \
                     (data[:, :, 1] <= threshold) & \
                     (data[:, :, 2] <= threshold)
        
        # Set alpha channel to 0 (transparent) for black pixels
        data[black_mask, 3] = 0
        
        # Convert back to PIL Image
        result_img = Image.fromarray(data, 'RGBA')
        
        # Save as PNG
        result_img.save(output_path, 'PNG')
        print(f"✅ Processed: {os.path.basename(input_path)} -> {os.path.basename(output_path)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error processing {input_path}: {str(e)}")
        return False

def process_directory(input_dir, output_dir=None, threshold=30):
    """
    Process all JPG files in a directory.
    
    Args:
        input_dir (str): Directory containing JPG files
        output_dir (str): Output directory (if None, uses input_dir)
        threshold (int): Threshold for black pixel detection
    """
    if output_dir is None:
        output_dir = input_dir
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Find all JPG files
    jpg_files = []
    for file in os.listdir(input_dir):
        if file.lower().endswith(('.jpg', '.jpeg')):
            jpg_files.append(file)
    
    if not jpg_files:
        print(f"⚠️  No JPG files found in {input_dir}")
        return
    
    print(f"🎨 Found {len(jpg_files)} JPG files to process")
    print(f"📁 Input directory: {input_dir}")
    print(f"📁 Output directory: {output_dir}")
    print(f"🎯 Black threshold: {threshold}")
    print("-" * 50)
    
    successful = 0
    failed = 0
    
    for jpg_file in jpg_files:
        input_path = os.path.join(input_dir, jpg_file)
        
        # Create output filename (replace .jpg with .png)
        png_file = os.path.splitext(jpg_file)[0] + '.png'
        output_path = os.path.join(output_dir, png_file)
        
        if remove_black_background(input_path, output_path, threshold):
            successful += 1
        else:
            failed += 1
    
    print("-" * 50)
    print(f"🎉 Processing complete!")
    print(f"✅ Successful: {successful}")
    print(f"❌ Failed: {failed}")

def main():
    """Main function with command line interface."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Remove black backgrounds from JPG images and save as PNG"
    )
    parser.add_argument(
        "input_dir", 
        help="Directory containing JPG files"
    )
    parser.add_argument(
        "-o", "--output", 
        help="Output directory (default: same as input)"
    )
    parser.add_argument(
        "-t", "--threshold", 
        type=int, 
        default=30,
        help="Black pixel threshold (0-255, default: 30)"
    )
    
    args = parser.parse_args()
    
    if not os.path.exists(args.input_dir):
        print(f"❌ Input directory does not exist: {args.input_dir}")
        return
    
    process_directory(args.input_dir, args.output, args.threshold)

if __name__ == "__main__":
    # Quick usage examples
    print("🎨 Black Background Removal Script")
    print("=" * 50)
    
    # Check if we're being run directly with arguments
    import sys
    if len(sys.argv) > 1:
        main()
    else:
        # Interactive mode for quick usage
        print("📁 Quick usage:")
        print("1. Place this script in your project root")
        print("2. Run one of these commands:")
        print()
        print("   # Process frontend/images directory:")
        print("   python3 remove_black_background.py frontend/images")
        print()
        print("   # Process with custom output directory:")
        print("   python3 remove_black_background.py frontend/images -o frontend/images_png")
        print()
        print("   # Process with custom threshold (more sensitive):")
        print("   python3 remove_black_background.py frontend/images -t 50")
        print()
        
        # Try to auto-detect images directory
        possible_dirs = ["frontend/images", "images", "./images"]
        for dir_path in possible_dirs:
            if os.path.exists(dir_path):
                print(f"🔍 Found images directory: {dir_path}")
                response = input(f"Process {dir_path}? (y/n): ").lower().strip()
                if response == 'y':
                    process_directory(dir_path)
                break
        else:
            print("⚠️  No images directory found automatically.")
            print("Please specify the path manually:")
            print("python3 remove_black_background.py /path/to/images")
