#!/bin/bash

# 📐 Quick Image Resizing Script
echo "📐 Setting up PNG Image Resizer..."

# Install dependencies
echo "📦 Installing dependencies..."
pip3 install -r resizer/requirements.txt

# Process frontend images
if [ -d "frontend/images" ]; then
    echo "🖼️  Processing frontend/images to 256x256..."
    echo "⚠️  This will exclude map.png automatically"
    
    # Ask for confirmation
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        python3 resizer/resize_images.py frontend/images
    else
        echo "Operation cancelled."
    fi
else
    echo "⚠️  frontend/images directory not found"
    echo "Please specify the correct path:"
    echo "python3 resizer/resize_images.py /path/to/images"
fi

echo "✅ Done!"
