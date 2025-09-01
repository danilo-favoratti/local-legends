#!/bin/bash

# San Diego City Game Backend Setup Script

echo "🎮 Setting up San Diego City Game Backend..."

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv .venv
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source .venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file and add your OpenAI API key:"
echo "   OPENAI_API_KEY=your_actual_api_key_here"
echo ""
echo "2. Activate the virtual environment:"
echo "   source .venv/bin/activate"
echo ""
echo "3. Test the setup:"
echo "   python3 test_setup.py"
echo ""
echo "4. Start the server:"
echo "   python3 start.py"
echo ""
echo "🌐 Server will be available at: http://localhost:8000"
