#!/bin/bash

# 🎨 Quick Image Processing Script
echo "🎨 Setting up Black Background Removal..."

# Install dependencies
echo "📦 Installing dependencies..."
pip3 install -r requirements_image_processing.txt

# Process frontend images
if [ -d "frontend/images" ]; then
    echo "🖼️  Processing frontend/images..."
    python3 remove_black_background.py frontend/images
else
    echo "⚠️  frontend/images directory not found"
    echo "Please specify the correct path:"
    echo "python3 remove_black_background.py /path/to/images"
fi

echo "✅ Done!"
