from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from typing import Optional
import os
from dotenv import load_dotenv

from models.npc import InteractionRequest, InteractionResponse, NPCResponse
from models.session import ConversationMessage
from services.session_manager import SessionManager
from services.npc_agent import NPCAgentService

# Load environment variables
load_dotenv()

app = FastAPI(title="Local Legends - San Diego Edition Backend", version="1.0.0")

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
session_manager = SessionManager()
npc_service = NPCAgentService()

# Mount static files for data access
app.mount("/static", StaticFiles(directory="data"), name="static")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"message": "Local Legends - San Diego Edition Backend is running! 🎮"}


@app.post("/api/session/init")
async def initialize_session(session_id: Optional[str] = Query(None)):
    """Initialize or load a game session"""
    try:
        session = session_manager.get_or_create_session(session_id)
        return {
            "session_id": session.session_id,
            "created_at": session.created_at,
            "last_active": session.last_active,
            "message": "Session initialized successfully! 🎯"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error initializing session: {str(e)}")


@app.get("/api/npcs")
async def get_npcs():
    """Get all available NPCs"""
    try:
        npcs = npc_service.get_all_npcs()
        return {
            "npcs": [
                {
                    "name": npc.name,
                    "image": npc.image,
                    "neighborhood": npc.neighborhood,
                    "area_color": npc.area_color,
                    "position": npc.position,
                    "description": npc.char_description[:200] + "..." if len(npc.char_description) > 200 else npc.char_description
                } 
                for npc in npcs
            ],
            "total": len(npcs)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching NPCs: {str(e)}")


@app.post("/api/npc/{npc_name}/interact")
async def interact_with_npc(npc_name: str, request: InteractionRequest):
    """Send message to NPC and get response"""
    try:
        # Load session
        session = session_manager.load_session(request.session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        # Verify NPC exists
        npc = npc_service.get_npc_by_name(npc_name)
        if not npc:
            raise HTTPException(status_code=404, detail=f"NPC '{npc_name}' not found")

        # Get conversation history
        conversation_history = session.get_conversation_history(npc_name)

        # Add user message to history
        user_message = ConversationMessage(role="user", content=request.message)
        session.add_message(npc_name, user_message)

        # Generate NPC response
        npc_response = await npc_service.generate_response(
            npc_name, 
            request.message, 
            conversation_history
        )

        if not npc_response:
            raise HTTPException(status_code=500, detail="Failed to generate NPC response")

        # Add NPC response to history
        assistant_message = ConversationMessage(
            role="assistant", 
            content=npc_response.text,
            options=npc_response.options
        )
        session.add_message(npc_name, assistant_message)

        # Save session
        session_manager.save_session(session)

        return InteractionResponse(
            npc_name=npc_name,
            response=npc_response,
            session_id=request.session_id
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during interaction: {str(e)}")


@app.get("/api/session/{session_id}/conversations")
async def get_session_conversations(session_id: str):
    """Get all conversations for a session"""
    try:
        session = session_manager.load_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        conversations = {}
        for npc_name, messages in session.conversations.items():
            conversations[npc_name] = [
                {
                    "role": msg.role,
                    "content": msg.content,
                    "options": msg.options,
                    "timestamp": msg.timestamp
                }
                for msg in messages
            ]

        return {
            "session_id": session_id,
            "conversations": conversations,
            "total_npcs_talked_to": len(conversations)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching conversations: {str(e)}")


# Mount frontend as root - this must be last to catch all remaining routes
app.mount("/", StaticFiles(directory="../frontend", html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7070)
