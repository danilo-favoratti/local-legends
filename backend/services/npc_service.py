import json
import os
from typing import List, Optional
from openai import OpenAI
from models.npc import NPC, NPCResponse
from models.session import ConversationMessage


class NPCService:
    def __init__(self, npcs_file: str = "data/npcs.json", openai_api_key: Optional[str] = None):
        self.npcs_file = npcs_file
        self.npcs = self._load_npcs()
        
        # Initialize OpenAI client only if API key is available
        api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
        if api_key and api_key != "your_openai_api_key_here" and api_key.strip():
            try:
                self.client = OpenAI(api_key=api_key)
                print("✅ OpenAI client initialized successfully")
            except Exception as e:
                print(f"❌ Failed to initialize OpenAI client: {e}")
                self.client = None
        else:
            self.client = None
            print("⚠️  OpenAI API key not configured. NPC responses will not work until you set OPENAI_API_KEY in .env file")

    def _load_npcs(self) -> List[NPC]:
        """Load NPCs from JSON file"""
        try:
            with open(self.npcs_file, 'r', encoding='utf-8') as f:
                npcs_data = json.load(f)
            return [NPC(**npc_data) for npc_data in npcs_data]
        except Exception as e:
            print(f"Error loading NPCs: {e}")
            return []

    def get_npc_by_name(self, name: str) -> Optional[NPC]:
        """Get NPC by name"""
        return next((npc for npc in self.npcs if npc.name.lower() == name.lower()), None)

    def get_all_npcs(self) -> List[NPC]:
        """Get all available NPCs"""
        return self.npcs

    def _build_system_prompt(self, npc: NPC) -> str:
        """Build the system prompt for the NPC"""
        return f"""You are {npc.name}, a real person living in San Diego. 

Character Description: {npc.char_description}

Communication Style: {npc.style_of_communication}

You're having a natural conversation with someone who has approached you. Respond as this character would in real life - be authentic, friendly, and true to your personality and communication style. You live in this San Diego neighborhood and know the area well.

IMPORTANT: You must respond with valid JSON in exactly this format:
{{
  "text": "your natural conversational response here",
  "options": ["option 1", "option 2", "option 3", "[Type your own response]"]
}}

The options should be natural conversation choices that make sense based on your response and personality. Always include "[Type your own response]" as the last option."""

    def _build_conversation_history(self, messages: List[ConversationMessage]) -> str:
        """Build conversation history string"""
        if not messages:
            return "This is the start of your conversation."
        
        history = []
        for msg in messages[-10:]:  # Last 10 messages for context
            if msg.role == "user":
                history.append(f"Visitor: {msg.content}")
            else:
                history.append(f"You: {msg.content}")
        
        return "Previous conversation:\n" + "\n".join(history)

    async def generate_response(self, npc_name: str, user_message: str, 
                              conversation_history: List[ConversationMessage]) -> Optional[NPCResponse]:
        """Generate NPC response using OpenAI"""
        npc = self.get_npc_by_name(npc_name)
        if not npc:
            return None
        
        # Check if OpenAI client is available
        if not self.client:
            return NPCResponse(
                text=f"*{npc.name} looks confused* Sorry, I can't talk right now. The system isn't configured properly.",
                options=["Try again later", "[Type your own response]"]
            )

        try:
            system_prompt = self._build_system_prompt(npc)
            history_context = self._build_conversation_history(conversation_history)
            
            user_prompt = f"{history_context}\n\nVisitor: {user_message}\n\nRespond as {npc.name}:"

            response = self.client.chat.completions.create(
                model="gpt-4o",  # Using latest GPT-4 model
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.8,
                max_tokens=300
            )

            # Parse JSON response
            content = response.choices[0].message.content.strip()
            
            # Handle potential markdown formatting
            if content.startswith("```json"):
                content = content.replace("```json", "").replace("```", "").strip()
            
            response_data = json.loads(content)
            
            return NPCResponse(
                text=response_data["text"],
                options=response_data["options"]
            )
            
        except json.JSONDecodeError as e:
            print(f"JSON parsing error for {npc_name}: {e}")
            # Fallback response
            return NPCResponse(
                text=f"*{npc.name} seems a bit confused and doesn't know what to say*",
                options=["Try talking to them again", "[Type your own response]"]
            )
        except Exception as e:
            print(f"Error generating response for {npc_name}: {e}")
            return None
