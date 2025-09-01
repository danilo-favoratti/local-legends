#!/usr/bin/env python3
"""
Startup script for Local Legends - San Diego Edition Backend
"""
import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def main():
    # Check if OpenAI API key is set
    if not os.getenv("OPENAI_API_KEY"):
        print("⚠️  WARNING: OPENAI_API_KEY not found in environment variables!")
        print("   Please create a .env file with your OpenAI API key:")
        print("   OPENAI_API_KEY=your_api_key_here")
        print()
    
    print("🎮 Starting Local Legends - San Diego Edition Backend...")
    print("📍 Server will be available at: http://localhost:7070")
    print("📚 API Documentation: http://localhost:7070/docs")
    print("🔄 Press Ctrl+C to stop the server")
    print()
    
    # Start the server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=7070,
        reload=True,  # Auto-reload on code changes
        log_level="info"
    )

if __name__ == "__main__":
    main()
