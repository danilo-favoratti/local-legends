/**
 * 🎮 Local Legends - San Diego Edition - API Service
 * Handles communication with the FastAPI backend
 */

class GameAPI {
    constructor() {
        // Use relative URL since frontend is now served from the same server
        this.baseURL = '/api';
        this.sessionId = this.getOrCreateSession();
        this.npcs = new Map(); // Cache for NPC data
    }

    /**
     * 🔑 Session Management
     */
    getOrCreateSession() {
        let sessionId = localStorage.getItem('sdcg_session_id');
        if (!sessionId) {
            sessionId = this.generateSessionId();
            localStorage.setItem('sdcg_session_id', sessionId);
        }
        return sessionId;
    }

    generateSessionId() {
        return 'player-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 🔄 Reset session - starts game from scratch
     */
    resetSession() {
        const newSessionId = this.generateSessionId();
        localStorage.setItem('sdcg_session_id', newSessionId);
        this.sessionId = newSessionId;
        console.log('🔄 Session reset! New session:', newSessionId);
        return newSessionId;
    }

    /**
     * 🎯 Initialize session with backend
     */
    async initializeSession() {
        try {
            const response = await fetch(`${this.baseURL}/session/init?session_id=${this.sessionId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Session initialized:', data);
            return data;
        } catch (error) {
            console.error('❌ Failed to initialize session:', error);
            throw error;
        }
    }

    /**
     * 👥 Get all NPCs from backend
     */
    async getNPCs() {
        try {
            const response = await fetch(`${this.baseURL}/npcs`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Cache NPCs for quick access
            data.npcs.forEach(npc => {
                this.npcs.set(npc.name, npc);
            });

            console.log(`👥 Loaded ${data.total} NPCs from backend`);
            return data.npcs;
        } catch (error) {
            console.error('❌ Failed to load NPCs:', error);
            throw error;
        }
    }

    /**
     * 💬 Send message to NPC and get AI response
     */
    async interactWithNPC(npcName, message) {
        try {
            const response = await fetch(`${this.baseURL}/npc/${npcName}/interact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    session_id: this.sessionId,
                    message: message
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log(`💬 NPC Response from ${npcName}:`, data);
            return data;
        } catch (error) {
            console.error(`❌ Failed to interact with ${npcName}:`, error);
            throw error;
        }
    }

    /**
     * 📚 Get conversation history for current session
     */
    async getConversationHistory() {
        try {
            const response = await fetch(`${this.baseURL}/session/${this.sessionId}/conversations`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('📚 Conversation history loaded:', data);
            return data;
        } catch (error) {
            console.error('❌ Failed to load conversation history:', error);
            throw error;
        }
    }

    /**
     * 🎭 Get cached NPC data
     */
    getNPCData(npcName) {
        return this.npcs.get(npcName);
    }

    /**
     * 🔍 Check if backend is available
     */
    async checkBackendHealth() {
        try {
            const response = await fetch('/health');
            const data = await response.json();
            console.log('🏥 Backend health check:', data.message);
            return true;
        } catch (error) {
            console.warn('⚠️ Backend not available:', error.message);
            return false;
        }
    }

    /**
     * 🛠️ Get current session info
     */
    getSessionInfo() {
        return {
            sessionId: this.sessionId,
            backendURL: this.baseURL,
            npcCount: this.npcs.size
        };
    }
}

// Export for use in other files
window.GameAPI = GameAPI;

console.log('🔌 GameAPI loaded successfully!');
