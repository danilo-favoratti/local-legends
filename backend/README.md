# 🎮 San Diego City Game Backend

Backend server for a 2D web game featuring AI-powered NPCs using OpenAI Agents framework with GPT-4.

## 🚀 Features

- **14 Unique NPCs** from different San Diego neighborhoods
- **Persistent Sessions** - conversations saved per session
- **AI-Powered Conversations** with dynamic response options
- **RESTful API** with FastAPI
- **Real-time NPC Interactions** with context awareness

## 📋 NPCs Available

Your game includes 14 characters from San Diego areas:
- **Tyler** (La Jolla) - Laid-back surfer dude
- **Brianna** (Pacific Beach) - Energetic skater girl  
- **Matheus** (Ocean Beach) - Free-spirited musician
- **Alex** (University City) - UCSD student
- **Megan** (Clairemont) - Outdoorsy mom
- **Jason** (Mira Mesa) - Tech-savvy community guy
- **Marcus** (Miramar) - Friendly military person
- **David** (Serra Mesa) - Community organizer
- **Sofia** (Black Mountain) - Nature-loving hiker
- **Rachel** (Scripps Ranch) - Family-oriented poet
- **Jose** (East San Diego) - Community-driven local
- **Marisol** (Chula Vista) - Energetic soccer enthusiast
- **Ana** (El Cajon) - Hardworking family woman
- **Katherine** (Coronado) - Elegant coastal resident

## 🛠️ Setup

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set OpenAI API Key**
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key:
   # OPENAI_API_KEY=your_actual_api_key_here
   ```

3. **Run the Server**
   ```bash
   python3 start.py
   ```

## 🤖 AI Agent System

The backend now uses the `openai-agents` framework for more sophisticated NPC conversations:

- **Individual AI Agents**: Each NPC has its own dedicated AI agent with unique personality
- **Context Awareness**: Agents maintain conversation history and character consistency
- **Tool-Based Responses**: Agents use function tools to generate structured responses
- **Robust Error Handling**: Graceful fallbacks if agent responses fail

## 📡 API Endpoints

- `POST /api/session/init?session_id=abc123` - Initialize/load session
- `GET /api/npcs` - List all NPCs  
- `POST /api/npc/{npc_name}/interact` - Chat with NPC
- `GET /api/session/{session_id}/conversations` - Get conversation history

## 🎯 Usage Example

```bash
# 1. Initialize session
curl -X POST "http://localhost:8000/api/session/init?session_id=player-123"

# 2. Talk to Tyler
curl -X POST "http://localhost:8000/api/npc/Tyler/interact" \
  -H "Content-Type: application/json" \
  -d '{"session_id": "player-123", "message": "Hey Tyler, what's up?"}'
```

## 📁 Project Structure

```
backend/
├── main.py                 # FastAPI application
├── start.py               # Startup script
├── models/
│   ├── session.py         # Session data models
│   └── npc.py            # NPC models
├── services/
│   ├── session_manager.py # Session persistence
│   └── npc_agent.py      # OpenAI Agents integration
├── data/
│   ├── npcs.json         # NPC definitions
│   └── sessions/         # Session files
└── requirements.txt
```

## 🔧 Development

- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/
- **Auto-reload**: Enabled in development mode
