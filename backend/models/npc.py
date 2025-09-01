from pydantic import BaseModel
from typing import List, Optional, Dict


class NPCPosition(BaseModel):
    x: int
    y: int


class NPC(BaseModel):
    name: str
    image: str
    neighborhood: str
    area_color: str
    position: NPCPosition
    char_description: str
    style_of_communication: str


class NPCResponse(BaseModel):
    text: str
    options: List[str]


class InteractionRequest(BaseModel):
    session_id: str
    message: str


class InteractionResponse(BaseModel):
    npc_name: str
    response: NPCResponse
    session_id: str
