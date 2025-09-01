"""
🎭 San Diego City Game - NPC Agent System
AI-powered NPC conversation system using openai-agents
"""

import asyncio
import json
import uuid
from typing import Optional, List, Dict, Any
import logging
from datetime import datetime

from pydantic import BaseModel, Field
from agents import Agent, Runner, RunContextWrapper, function_tool, RunResult

from models.npc import NPC, NPCResponse
from models.session import ConversationMessage

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Global storage for tool responses (to avoid complex result parsing)
_tool_responses = {}


class NPCConversationContext(BaseModel):
    """Context for NPC conversation agent."""
    session_id: str
    npc_name: str
    npc_data: NPC
    conversation_history: List[ConversationMessage] = Field(default_factory=list)
    current_user_message: str = ""
    response_generated: bool = False
    
    class Config:
        arbitrary_types_allowed = True


def create_npc_system_prompt(npc: NPC) -> str:
    """Create the system prompt for a specific NPC."""
    # Extract neighborhood name from image filename
    neighborhood = npc.image.replace('.png', '').replace('_', ' ').title()
    
    return f"""You are {npc.name}, a real person living in {neighborhood}, San Diego. 

Character Description: {npc.char_description}

Communication Style: {npc.style_of_communication}

Your Neighborhood: {neighborhood} - This is YOUR area of expertise. You know this neighborhood well but don't know much about other San Diego areas.

You're having a natural conversation with someone who has approached you in your neighborhood. Respond as this character would in real life - be authentic, friendly, and true to your personality and communication style.

IMPORTANT LOCATION RULE: You live specifically in {neighborhood} and should ONLY talk about {neighborhood}. You are a local expert of {neighborhood}, not other parts of San Diego.

CRITICAL: You MUST use the generate_response_tool function to respond. DO NOT return JSON directly in your message.

Call the generate_response_tool with:
- text: Your natural conversational response as this character
- options: 2-3 natural responses the visitor might give back

The options should be realistic things someone would say next in the conversation. Examples:
- If you ask where they're from: ["I'm from here", "I'm visiting", "I'm new to the area"]  
- If you mention local spots: ["That sounds interesting", "I'd love to check it out", "Where exactly is that?"]
- If you ask what brings them here: ["Just exploring", "I'm looking for something", "Meeting someone"]

REMEMBER: Always use the generate_response_tool function. Never return raw JSON or text responses.

Guidelines:
- Stay in character at all times
- ONLY discuss {neighborhood} - you are NOT a San Diego tour guide
- If asked about La Jolla, Pacific Beach, or any other area: "I don't really know much about that area, but here in {neighborhood}..."
- Focus exclusively on local spots, businesses, and experiences in {neighborhood} only
- Share personal experiences and stories from {neighborhood} only
- Keep responses conversational and engaging
- Be helpful about {neighborhood} but redirect away from other areas
- You are a {neighborhood} resident, not a city-wide expert
- Use short sentences and break long responses into multiple lines for better readability
- Add line breaks between different thoughts or topics

Remember: You have deep knowledge of {neighborhood} only. You rarely visit or know details about other San Diego areas."""


@function_tool
async def generate_response_tool(
    ctx: RunContextWrapper[NPCConversationContext],
    text: str,
    options: List[str]
) -> str:
    """
    Generate the NPC's response with conversation options.
    
    Args:
        text: The NPC's conversational response
        options: List of natural response options the player can give (2-3 contextual responses)
    """
    context = ctx.context
    
    # Validate options
    if not options or len(options) < 2:
        return "Error: Must provide at least 2 conversation options"
    
    # Limit to 3 options maximum (no "[Type your own response]" needed)
    if len(options) > 3:
        options = options[:3]
    
    # Store the response in context and global storage
    context.response_generated = True
    
    # Store in global storage for easy extraction
    _tool_responses[context.session_id] = {
        "text": text,
        "options": options
    }
    
    logger.info(f"NPC {context.npc_name} generated response: {text[:50]}... with {len(options)} options")
    
    return f"Response generated successfully: '{text[:50]}...' with {len(options)} conversation options."


@function_tool
async def recall_conversation_tool(
    ctx: RunContextWrapper[NPCConversationContext]
) -> str:
    """
    Recall the conversation history to maintain context.
    """
    context = ctx.context
    
    if not context.conversation_history:
        return "This is the start of your conversation with this person."
    
    # Get last 10 messages for context
    recent_history = context.conversation_history[-10:]
    history_text = []
    
    for msg in recent_history:
        if msg.role == "user":
            history_text.append(f"Visitor: {msg.content}")
        else:
            history_text.append(f"You: {msg.content}")
    
    history_summary = "Previous conversation:\n" + "\n".join(history_text)
    
    logger.info(f"NPC {context.npc_name} recalled {len(recent_history)} messages from conversation history")
    
    return history_summary


def create_npc_agent(npc: NPC) -> Agent[NPCConversationContext]:
    """
    Create an NPC conversation agent for a specific character.
    
    Args:
        npc: The NPC data including personality and communication style
        
    Returns:
        Configured Agent for NPC conversations
    """
    tools = [
        generate_response_tool,
        recall_conversation_tool,
    ]
    
    return Agent(
        model="gpt-4o",
        name=f"npc_{npc.name.lower()}",
        instructions=create_npc_system_prompt(npc),
        tools=tools,
    )


class NPCAgentService:
    """Service for managing NPC conversations using AI agents."""
    
    def __init__(self, npcs_file: str = "data/npcs.json"):
        self.npcs_file = npcs_file
        self.npcs: List[NPC] = []
        self.agents: Dict[str, Agent[NPCConversationContext]] = {}
        
        self._load_npcs()
        self._initialize_agents()
        
        logger.info(f"NPCAgentService initialized with {len(self.npcs)} NPCs")
    
    def _load_npcs(self) -> None:
        """Load NPCs from JSON file."""
        try:
            with open(self.npcs_file, 'r', encoding='utf-8') as f:
                npcs_data = json.load(f)
            self.npcs = [NPC(**npc_data) for npc_data in npcs_data]
            logger.info(f"Loaded {len(self.npcs)} NPCs from {self.npcs_file}")
        except Exception as e:
            logger.error(f"Error loading NPCs: {e}")
            self.npcs = []
    
    def _initialize_agents(self) -> None:
        """Initialize AI agents for each NPC."""
        for npc in self.npcs:
            try:
                agent = create_npc_agent(npc)
                self.agents[npc.name] = agent
                logger.info(f"Initialized agent for NPC: {npc.name}")
            except Exception as e:
                logger.error(f"Failed to initialize agent for {npc.name}: {e}")
    
    def get_npc_by_name(self, name: str) -> Optional[NPC]:
        """Get NPC by name."""
        return next((npc for npc in self.npcs if npc.name.lower() == name.lower()), None)
    
    def get_all_npcs(self) -> List[NPC]:
        """Get all available NPCs."""
        return self.npcs
    
    async def generate_response(
        self, 
        npc_name: str, 
        user_message: str, 
        conversation_history: List[ConversationMessage]
    ) -> Optional[NPCResponse]:
        """
        Generate NPC response using AI agent.
        
        Args:
            npc_name: Name of the NPC
            user_message: User's message
            conversation_history: Previous conversation messages
            
        Returns:
            NPCResponse with text and options, or None if failed
        """
        npc = self.get_npc_by_name(npc_name)
        if not npc:
            logger.error(f"NPC not found: {npc_name}")
            return None
        
        if npc_name not in self.agents:
            logger.error(f"Agent not found for NPC: {npc_name}")
            return None
        
        try:
            # Create conversation context
            context = NPCConversationContext(
                session_id=str(uuid.uuid4()),
                npc_name=npc_name,
                npc_data=npc,
                conversation_history=conversation_history,
                current_user_message=user_message,
                response_generated=False
            )
            
            # Build conversation prompt
            conversation_prompt = self._build_conversation_prompt(user_message, conversation_history, npc)
            
            # Run the agent using the correct Runner syntax (3 parameters like your example)
            result = await Runner.run(
                self.agents[npc_name],
                input=conversation_prompt,
                context=context
            )
            
            # Extract response from agent's tool calls
            response_data = await self._extract_response_from_result(result, npc_name, context.session_id)
            
            if response_data:
                return NPCResponse(
                    text=response_data["text"],
                    options=response_data["options"]
                )
            else:
                # Fallback response
                logger.warning(f"Agent {npc_name} didn't generate proper response, using fallback")
                return NPCResponse(
                    text=f"*{npc.name} seems a bit confused and doesn't know what to say*",
                    options=["Try again", "Ask something else", "Say hello"]
                )
                
        except Exception as e:
            logger.error(f"Error generating response for {npc_name}: {e}", exc_info=True)
            return None
    
    def _build_conversation_prompt(
        self, 
        user_message: str, 
        conversation_history: List[ConversationMessage],
        npc: NPC
    ) -> str:
        """Build the conversation prompt for the agent."""
        prompt_parts = []
        
        # Add conversation history if exists
        if conversation_history:
            prompt_parts.append("Previous conversation context:")
            recent_history = conversation_history[-10:]  # Last 10 messages
            for msg in recent_history:
                if msg.role == "user":
                    prompt_parts.append(f"Visitor: {msg.content}")
                else:
                    prompt_parts.append(f"You: {msg.content}")
            prompt_parts.append("")
        else:
            prompt_parts.append("This is the start of your conversation with a visitor.")
            prompt_parts.append("")
        
        # Add current user message
        prompt_parts.append(f"Visitor: {user_message}")
        prompt_parts.append("")
        prompt_parts.append(f"Respond as {npc.name} by calling the generate_response_tool function with your conversational response and 2-3 natural reply options.")
        
        return "\n".join(prompt_parts)
    
    async def _extract_response_from_result(self, result: RunResult, npc_name: str, session_id: str) -> Optional[Dict[str, Any]]:
        """Extract the response data from the agent's run result."""
        try:
            logger.info(f"Extracting response for {npc_name}")
            
            # PRIORITY 1: Check global tool response storage (cleanest approach)
            if session_id in _tool_responses:
                response_data = _tool_responses.pop(session_id)  # Remove after use
                logger.info(f"Successfully extracted response from tool storage for {npc_name}")
                return response_data
            
            # PRIORITY 2: Look for tool calls in result messages
            if hasattr(result, 'messages') and result.messages:
                for message in result.messages:
                    if hasattr(message, 'tool_calls') and message.tool_calls:
                        for tool_call in message.tool_calls:
                            if tool_call.function.name == "generate_response_tool":
                                args = json.loads(tool_call.function.arguments)
                                logger.info(f"Extracted response from tool call for {npc_name}")
                                return {
                                    "text": args.get("text", ""),
                                    "options": args.get("options", [])
                                }
            
            # PRIORITY 3: Use final_output as last resort (avoid JSON parsing)
            if hasattr(result, 'final_output') and result.final_output:
                logger.warning(f"Using final_output fallback for {npc_name}")
                return {
                    "text": result.final_output,
                    "options": ["Tell me more", "That's interesting", "I see"]
                }
            
            logger.error(f"No valid response found for {npc_name}")
            return None
            
        except Exception as e:
            logger.error(f"Error extracting response for {npc_name}: {e}", exc_info=True)
            return None
