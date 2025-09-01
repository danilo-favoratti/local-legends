/**
 * 💬 San Diego City Game - Chat System
 * Handles NPC conversations and chat UI
 */

class ChatSystem {
    constructor(game, api) {
        this.game = game;
        this.api = api;
        this.activeNPC = null;
        this.isOpen = false;
        
        // UI Elements
        this.chatModal = document.getElementById('chatModal');
        this.npcAvatar = document.getElementById('npcAvatar');
        this.npcName = document.getElementById('npcName');
        this.npcLocation = document.getElementById('npcLocation');
        this.messageHistory = document.getElementById('messageHistory');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendMessage');
        this.closeButton = document.getElementById('closeChat');
        this.responseOptions = document.getElementById('responseOptions');
        
        this.setupEventListeners();
        console.log('💬 Chat system initialized');
    }

    setupEventListeners() {
        // Close chat modal
        this.closeButton.addEventListener('click', () => this.hideChat());
        
        // Send message on button click
        this.sendButton.addEventListener('click', () => this.handleSendMessage());
        
        // Send message on Enter key
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });

        // Close chat when clicking outside modal
        this.chatModal.addEventListener('click', (e) => {
            if (e.target === this.chatModal) {
                this.hideChat();
            }
        });
    }

    /**
     * 🎭 Open chat with specific NPC
     */
    async showChat(npcName) {
        try {
            console.log(`💬 Opening chat with ${npcName}`);
            
            this.activeNPC = npcName;
            this.isOpen = true;
            
            // Get NPC data from backend
            const npcData = this.api.getNPCData(npcName);
            if (!npcData) {
                throw new Error(`NPC data not found for ${npcName}`);
            }

            // Update chat header
            this.updateChatHeader(npcData);
            
            // Show modal
            this.chatModal.classList.remove('hidden');
            
            // Load conversation history
            await this.loadConversationHistory(npcName);
            
            // Focus input
            this.messageInput.focus();
            
        } catch (error) {
            console.error('❌ Failed to open chat:', error);
            this.showError('Failed to start conversation. Please try again.');
        }
    }

    /**
     * 🚪 Close chat modal
     */
    hideChat() {
        console.log('💬 Closing chat');
        this.isOpen = false;
        this.activeNPC = null;
        this.chatModal.classList.add('hidden');
        this.clearResponseOptions();
        
        // Return focus to game
        this.game.canvas.focus();
    }

    /**
     * 📝 Update chat header with NPC info
     */
    updateChatHeader(npcData) {
        this.npcAvatar.src = `images/${npcData.image}`;
        this.npcAvatar.alt = `${npcData.name} avatar`;
        this.npcName.textContent = npcData.name;
        
        // Extract location from image name (e.g., "la_jolla.png" -> "La Jolla")
        const location = npcData.image.replace('.png', '').replace(/_/g, ' ')
            .split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        this.npcLocation.textContent = location;
    }

    /**
     * 📚 Load conversation history
     */
    async loadConversationHistory(npcName) {
        try {
            this.showLoadingMessage();
            
            const history = await this.api.getConversationHistory();
            const npcHistory = history.conversations[npcName] || [];
            
            this.clearMessageHistory();
            
            if (npcHistory.length === 0) {
                this.showWelcomeMessage(npcName);
            } else {
                npcHistory.forEach(message => {
                    this.addMessageToHistory(message.role, message.content, message.options);
                });
                this.scrollToBottom();
            }
            
        } catch (error) {
            console.error('❌ Failed to load conversation history:', error);
            this.clearMessageHistory();
            this.showWelcomeMessage(npcName);
        }
    }

    /**
     * 👋 Show welcome message for new conversations
     */
    showWelcomeMessage(npcName) {
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'loading-message';
        welcomeDiv.innerHTML = `<span>Start a conversation with ${npcName}!</span>`;
        this.messageHistory.appendChild(welcomeDiv);
    }

    /**
     * ⏳ Show loading message
     */
    showLoadingMessage() {
        this.messageHistory.innerHTML = '<div class="loading-message"><span>Loading conversation...</span></div>';
    }

    /**
     * 🧹 Clear message history
     */
    clearMessageHistory() {
        this.messageHistory.innerHTML = '';
    }

    /**
     * 💌 Handle sending a message
     */
    async handleSendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || !this.activeNPC) return;

        try {
            // Disable input while sending
            this.setInputEnabled(false);
            
            // Add user message to history
            this.addMessageToHistory('user', message);
            this.messageInput.value = '';
            this.clearResponseOptions();
            
            // Send to backend and get AI response
            const response = await this.api.interactWithNPC(this.activeNPC, message);
            
            // Add AI response to history
            this.addMessageToHistory('assistant', response.response.text, response.response.options);
            
            // Show response options
            this.showResponseOptions(response.response.options);
            
            // Mark NPC as having been talked to
            if (this.game && this.game.markNPCAsSpokenTo) {
                this.game.markNPCAsSpokenTo(this.activeNPC);
            }
            
        } catch (error) {
            console.error('❌ Failed to send message:', error);
            this.showError('Failed to send message. Please try again.');
        } finally {
            this.setInputEnabled(true);
        }
    }

    /**
     * 💬 Add message to chat history
     */
    addMessageToHistory(role, content, options = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        // Format content for better readability
        const formattedContent = this.formatMessageContent(content);
        messageDiv.textContent = formattedContent;
        
        this.messageHistory.appendChild(messageDiv);
        this.scrollToBottom();
    }

    /**
     * 📝 Format message content for better readability
     */
    formatMessageContent(content) {
        // Add line breaks after sentences (periods, exclamation marks, question marks)
        let formatted = content
            .replace(/\. /g, '.\n')      // Period + space
            .replace(/\! /g, '!\n')     // Exclamation + space  
            .replace(/\? /g, '?\n')     // Question + space
            .replace(/\.\n$/, '.')      // Don't add break at very end
            .replace(/\!\n$/, '!')      // Don't add break at very end
            .replace(/\?\n$/, '?');     // Don't add break at very end
        
        return formatted;
    }

    /**
     * 🎯 Show response options
     */
    showResponseOptions(options) {
        this.clearResponseOptions();
        
        if (!options || options.length === 0) return;
        
        options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.textContent = option;
            
            button.addEventListener('click', () => {
                if (option === '[Type your own response]') {
                    this.messageInput.focus();
                } else {
                    this.handleOptionClick(option);
                }
            });
            
            this.responseOptions.appendChild(button);
        });
        
        this.responseOptions.classList.remove('hidden');
    }

    /**
     * 🎯 Handle response option click
     */
    async handleOptionClick(option) {
        // Treat option click like typing and sending the message
        this.messageInput.value = option;
        await this.handleSendMessage();
    }

    /**
     * 🧹 Clear response options
     */
    clearResponseOptions() {
        this.responseOptions.innerHTML = '';
        this.responseOptions.classList.add('hidden');
    }

    /**
     * 📜 Scroll to bottom of message history
     */
    scrollToBottom() {
        this.messageHistory.scrollTop = this.messageHistory.scrollHeight;
    }

    /**
     * 🔧 Enable/disable input controls
     */
    setInputEnabled(enabled) {
        this.messageInput.disabled = !enabled;
        this.sendButton.disabled = !enabled;
        
        if (enabled) {
            this.messageInput.focus();
        }
    }

    /**
     * ❌ Show error message
     */
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message assistant';
        errorDiv.style.background = '#ffebee';
        errorDiv.style.color = '#c62828';
        errorDiv.textContent = `❌ ${message}`;
        
        this.messageHistory.appendChild(errorDiv);
        this.scrollToBottom();
    }

    /**
     * 🔍 Check if chat is currently open
     */
    isChatOpen() {
        return this.isOpen;
    }

    /**
     * 👤 Get current active NPC
     */
    getActiveNPC() {
        return this.activeNPC;
    }
}

// Export for use in other files
window.ChatSystem = ChatSystem;

console.log('💬 ChatSystem loaded successfully!');
