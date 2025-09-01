import json
import os
import uuid
from datetime import datetime
from typing import Optional
from models.session import GameSession, ConversationMessage


class SessionManager:
    def __init__(self, sessions_dir: str = "data/sessions"):
        self.sessions_dir = sessions_dir
        os.makedirs(sessions_dir, exist_ok=True)

    def _get_session_path(self, session_id: str) -> str:
        """Get the file path for a session"""
        return os.path.join(self.sessions_dir, f"{session_id}.json")

    def load_session(self, session_id: str) -> Optional[GameSession]:
        """Load an existing session from JSON file"""
        session_path = self._get_session_path(session_id)
        
        if not os.path.exists(session_path):
            return None
            
        try:
            with open(session_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Convert datetime strings back to datetime objects
            data['created_at'] = datetime.fromisoformat(data['created_at'])
            data['last_active'] = datetime.fromisoformat(data['last_active'])
            
            # Convert conversation messages
            for npc_name, messages in data.get('conversations', {}).items():
                converted_messages = []
                for msg in messages:
                    msg['timestamp'] = datetime.fromisoformat(msg['timestamp'])
                    converted_messages.append(ConversationMessage(**msg))
                data['conversations'][npc_name] = converted_messages
            
            return GameSession(**data)
        except Exception as e:
            print(f"Error loading session {session_id}: {e}")
            return None

    def save_session(self, session: GameSession) -> bool:
        """Save session to JSON file"""
        try:
            session_path = self._get_session_path(session.session_id)
            
            # Convert to dict for JSON serialization
            data = session.model_dump()
            
            # Convert datetime objects to ISO strings
            data['created_at'] = session.created_at.isoformat()
            data['last_active'] = session.last_active.isoformat()
            
            # Convert conversation messages
            for npc_name, messages in data['conversations'].items():
                converted_messages = []
                for msg in messages:
                    if isinstance(msg, ConversationMessage):
                        msg_dict = msg.model_dump()
                        msg_dict['timestamp'] = msg.timestamp.isoformat()
                        converted_messages.append(msg_dict)
                    else:
                        # Already a dict, just convert timestamp
                        msg['timestamp'] = datetime.fromisoformat(msg['timestamp']).isoformat() if isinstance(msg['timestamp'], str) else msg['timestamp'].isoformat()
                        converted_messages.append(msg)
                data['conversations'][npc_name] = converted_messages
            
            with open(session_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            return True
        except Exception as e:
            print(f"Error saving session {session.session_id}: {e}")
            return False

    def create_session(self, session_id: Optional[str] = None) -> GameSession:
        """Create a new session"""
        if session_id is None:
            session_id = str(uuid.uuid4())
        
        now = datetime.now()
        session = GameSession(
            session_id=session_id,
            created_at=now,
            last_active=now,
            conversations={}
        )
        
        self.save_session(session)
        return session

    def get_or_create_session(self, session_id: Optional[str] = None) -> GameSession:
        """Load existing session or create new one"""
        if session_id:
            existing_session = self.load_session(session_id)
            if existing_session:
                return existing_session
        
        return self.create_session(session_id)
