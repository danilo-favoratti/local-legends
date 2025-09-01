from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime


class ConversationMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    options: Optional[List[str]] = None
    timestamp: datetime = datetime.now()


class GameSession(BaseModel):
    session_id: str
    created_at: datetime
    last_active: datetime
    conversations: Dict[str, List[ConversationMessage]] = {}

    def add_message(self, npc_name: str, message: ConversationMessage):
        """Add a message to an NPC's conversation history"""
        if npc_name not in self.conversations:
            self.conversations[npc_name] = []
        self.conversations[npc_name].append(message)
        self.last_active = datetime.now()

    def get_conversation_history(self, npc_name: str) -> List[ConversationMessage]:
        """Get conversation history with a specific NPC"""
        return self.conversations.get(npc_name, [])
