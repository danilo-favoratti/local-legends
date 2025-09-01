class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.mapImage = new Image();
        this.mapLoaded = false;
        
        // Screen dimensions
        this.screenWidth = window.innerWidth;
        this.screenHeight = window.innerHeight;
        
        // Map dimensions - will be set based on actual image proportions
        this.mapWidth = 0;
        this.mapHeight = 0;
        this.mapOffsetX = 0;
        this.mapOffsetY = 0;
        
        // Camera/viewport properties
        this.camera = {
            x: 0,
            y: 0
        };
        
        // Player properties (size will be calculated relative to map)
        this.player = {
            x: this.screenWidth / 2,
            y: this.screenHeight / 2,
            width: 0,  // Will be calculated based on map size
            height: 0, // Will be calculated based on map size
            speed: 3,
            color: '#ff4757',
            image: null // Will hold the character image
        };
        
        // Load player character images for different directions
        this.playerImages = {
            front: new Image(),
            front_left: new Image(),
            front_right: new Image(),
            behind: new Image(),
            behind_left: new Image(),
            behind_right: new Image()
        };
        this.playerImagesLoaded = {
            front: false,
            front_left: false,
            front_right: false,
            behind: false,
            behind_left: false,
            behind_right: false
        };
        this.currentDirection = 'front'; // Default direction
        this.lastMovementDirection = { x: 0, y: 0 }; // Track movement direction
        this.loadPlayerImages();
        
        // Input handling
        this.keys = {};
        this.ctrlPressed = false;
        
        // UI elements
        this.positionElement = document.getElementById('position');
        this.speedElement = document.getElementById('speed');
        this.sessionInfoElement = document.getElementById('sessionInfo');
        this.gameUI = document.querySelector('.game-ui');
        this.debugVisible = false;
        
        // NPCs system
        this.npcs = [];
        this.npcImages = new Map();
        this.nearbyNPC = null; // Currently nearby NPC
        this.interactionDistance = 100; // Base distance, will be updated relative to character size
        this.npcConversationStatus = new Map(); // Track which NPCs have been talked to
        
        // Backend integration
        this.api = new GameAPI();
        this.chatSystem = null; // Will be initialized after API
        this.backendConnected = false;
        
        // UI elements for interaction
        this.interactionPrompt = document.getElementById('interactionPrompt');
        this.npcPromptName = document.getElementById('npcPromptName');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        
        this.init();
    }
    
    async init() {
        this.showLoading(true);
        this.setupCanvas();
        this.loadMap();
        
        // Initialize backend connection
        await this.initializeBackend();
        
        this.setupEventListeners();
        this.gameLoop();
        this.updateUI();
        this.showLoading(false);
    }

    /**
     * 🔌 Initialize backend connection and load NPCs
     */
    async initializeBackend() {
        try {
            console.log('🔌 Initializing backend connection...');
            
            // Check backend health
            this.backendConnected = await this.api.checkBackendHealth();
            
            if (this.backendConnected) {
                // Initialize session
                await this.api.initializeSession();
                
                // Load NPCs from backend
                await this.setupNPCsFromBackend();
                
                // Initialize chat system
                this.chatSystem = new ChatSystem(this, this.api);
                
                // Load existing conversation status
                await this.loadConversationStatus();
                
                // Ensure all characters have consistent sizes after everything is loaded
                if (this.mapLoaded) {
                    this.calculateCharacterSizes();
                }
                
                console.log('✅ Backend connected successfully!');
            } else {
                console.warn('⚠️ Backend not available, using fallback NPCs');
                this.setupNPCsFallback();
            }
            
        } catch (error) {
            console.error('❌ Backend initialization failed:', error);
            this.backendConnected = false;
            this.setupNPCsFallback();
        }
    }

    /**
     * 👥 Setup NPCs from backend data
     */
    async setupNPCsFromBackend() {
        try {
            const npcData = await this.api.getNPCs();
            
            // Create mapping from image name to proper name
            const imageToLocation = {
                'la_jolla.png': { name: 'la_jolla', x: 0.15, y: 0.25 },
                'pacific_beach.png': { name: 'pacific_beach', x: 0.16, y: 0.48 },
                'ocean_beach.png': { name: 'ocean_beach', x: 0.14, y: 0.75 },
                'university_city.png': { name: 'university_city', x: 0.32, y: 0.32 },
                'clairemont.png': { name: 'clairemont', x: 0.28, y: 0.55 },
                'mira_mesa.png': { name: 'mira_mesa', x: 0.55, y: 0.22 },
                'black_montain.png': { name: 'black_montain', x: 0.78, y: 0.26 },
                'miramar.png': { name: 'miramar', x: 0.52, y: 0.38 },
                'serra_mesa.png': { name: 'serra_mesa', x: 0.40, y: 0.68 },
                'scripps_ranch.png': { name: 'scripps_ranch', x: 0.78, y: 0.48 },
                'el_cajon.png': { name: 'el_cajon', x: 0.58, y: 0.65 },
                'east_san_diego.png': { name: 'east_san_diego', x: 0.80, y: 0.65 },
                'chula_vista.png': { name: 'chula_vista', x: 0.55, y: 0.88 },
                'coronado.png': { name: 'coronado', x: 0.28, y: 0.78 }
            };
            
            // Load NPC images and create NPC objects
            npcData.forEach(npc => {
                const locationData = imageToLocation[npc.image];
                if (locationData) {
                    const img = new Image();
                    img.onload = () => {
                        console.log(`📍 NPC loaded: ${npc.name}`);
                    };
                    img.onerror = () => {
                        console.warn(`⚠️ Failed to load NPC image: ${npc.name}`);
                    };
                    img.src = `images/${npc.image}`;
                    this.npcImages.set(npc.name, img);
                    
                    // Create NPC object with backend data
                    const newNPC = {
                        name: npc.name,
                        displayName: npc.name,
                        x: locationData.x,
                        y: locationData.y,
                        image: img,
                        width: this.player.width || 100,  // Use current character size or fallback
                        height: this.player.height || 100, // Use current character size or fallback
                        backendData: npc
                    };
                    
                    this.npcs.push(newNPC);
                }
            });
            
            console.log(`🎮 ${this.npcs.length} NPCs loaded from backend`);
            
            // Ensure all NPCs have correct sizes if map is already loaded
            if (this.mapLoaded) {
                this.calculateCharacterSizes();
            }
            
        } catch (error) {
            console.error('❌ Failed to load NPCs from backend:', error);
            throw error;
        }
    }

    /**
     * 👥 Setup fallback NPCs when backend is unavailable
     */
    setupNPCsFallback() {
        // Use the original hardcoded NPC data as fallback
        const fallbackNPCs = [
            { name: 'la_jolla', x: 0.15, y: 0.25, file: 'la_jolla.png' },
            { name: 'pacific_beach', x: 0.16, y: 0.48, file: 'pacific_beach.png' },
            { name: 'ocean_beach', x: 0.14, y: 0.75, file: 'ocean_beach.png' },
            { name: 'university_city', x: 0.32, y: 0.32, file: 'university_city.png' },
            { name: 'clairemont', x: 0.28, y: 0.55, file: 'clairemont.png' },
            { name: 'mira_mesa', x: 0.55, y: 0.22, file: 'mira_mesa.png' },
            { name: 'black_montain', x: 0.78, y: 0.26, file: 'black_montain.png' },
            { name: 'miramar', x: 0.52, y: 0.38, file: 'miramar.png' },
            { name: 'serra_mesa', x: 0.40, y: 0.68, file: 'serra_mesa.png' },
            { name: 'scripps_ranch', x: 0.78, y: 0.48, file: 'scripps_ranch.png' },
            { name: 'el_cajon', x: 0.58, y: 0.65, file: 'el_cajon.png' },
            { name: 'east_san_diego', x: 0.80, y: 0.65, file: 'east_san_diego.png' },
            { name: 'chula_vista', x: 0.55, y: 0.88, file: 'chula_vista.png' },
            { name: 'coronado', x: 0.28, y: 0.78, file: 'coronado.png' }
        ];
        
        fallbackNPCs.forEach(npc => {
            const img = new Image();
            img.src = `images/${npc.file}`;
            this.npcImages.set(npc.name, img);
            
            const newNPC = {
                name: npc.name,
                displayName: npc.name.replace('_', ' '),
                x: npc.x,
                y: npc.y,
                image: img,
                width: this.player.width || 100,  // Use current character size or fallback
                height: this.player.height || 100, // Use current character size or fallback
                backendData: null
            };
            
            this.npcs.push(newNPC);
        });
        
        console.log(`🎮 ${this.npcs.length} fallback NPCs loaded`);
        
        // Ensure all fallback NPCs have correct sizes if map is already loaded
        if (this.mapLoaded) {
            this.calculateCharacterSizes();
        }
    }
    
    setupCanvas() {
        // Set canvas size to screen size
        this.canvas.width = this.screenWidth;
        this.canvas.height = this.screenHeight;
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.screenWidth = window.innerWidth;
            this.screenHeight = window.innerHeight;
            this.canvas.width = this.screenWidth;
            this.canvas.height = this.screenHeight;
            if (this.mapLoaded) {
                this.calculateMapDimensions(); // This will also recalculate character sizes
            }
        });
    }
    
    loadMap() {
        this.mapImage.onload = () => {
            this.mapLoaded = true;
            console.log('🗺️ Map loaded successfully!');
            
            // Calculate map dimensions maintaining aspect ratio
            this.calculateMapDimensions();
            
            // Center player on map
            this.player.x = this.mapOffsetX + this.mapWidth / 2;
            this.player.y = this.mapOffsetY + this.mapHeight / 2;
            
            // Center camera initially
            this.updateCamera();
            
            console.log(`👤 Player size set to: ${this.player.width}x${this.player.height}px`);
        };
        
        this.mapImage.onerror = () => {
            console.error('❌ Failed to load map image');
            this.drawFallbackMap();
        };
        
        this.mapImage.src = 'images/map.png';
    }

    loadPlayerImages() {
        const imageFiles = {
            front: 'images/main_char_front.png',
            front_left: 'images/main_char_front_left.png',
            front_right: 'images/main_char_front_right.png',
            behind: 'images/main_char_behind.png',
            behind_left: 'images/main_char_behind_left.png',
            behind_right: 'images/main_char_behind_right.png'
        };
        
        Object.keys(imageFiles).forEach(direction => {
            this.playerImages[direction].onload = () => {
                this.playerImagesLoaded[direction] = true;
                console.log(`👤 Player character ${direction} sprite loaded successfully!`);
                
                // Set the current image to the first loaded one
                if (!this.player.image && this.playerImagesLoaded[direction]) {
                    this.player.image = this.playerImages[direction];
                }
            };
            
            this.playerImages[direction].onerror = () => {
                console.warn(`⚠️ Failed to load player character ${direction} sprite`);
                this.playerImagesLoaded[direction] = false;
            };
            
            this.playerImages[direction].src = imageFiles[direction];
        });
    }
    
    /**
     * 🔄 Show/hide loading overlay
     */
    showLoading(show) {
        if (show) {
            this.loadingOverlay.classList.remove('hidden');
        } else {
            this.loadingOverlay.classList.add('hidden');
        }
    }
    
    calculateMapDimensions() {
        // Calculate map size maintaining aspect ratio - 2.4x bigger than screen fit (2x + 20%)
        const imageRatio = this.mapImage.width / this.mapImage.height;
        const screenRatio = this.screenWidth / this.screenHeight;
        const scaleFactor = 2.4; // 2x * 1.2 = 2.4x (20% bigger than previous 2x)
        
        if (imageRatio > screenRatio) {
            // Image is wider - fit to screen width, then scale 2.4x
            this.mapWidth = this.screenWidth * scaleFactor;
            this.mapHeight = (this.screenWidth * scaleFactor) / imageRatio;
        } else {
            // Image is taller - fit to screen height, then scale 2.4x
            this.mapHeight = this.screenHeight * scaleFactor;
            this.mapWidth = (this.screenHeight * scaleFactor) * imageRatio;
        }
        
        // Center the map on screen (will extend beyond screen edges)
        this.mapOffsetX = (this.screenWidth - this.mapWidth) / 2;
        this.mapOffsetY = (this.screenHeight - this.mapHeight) / 2;
        
        // Calculate character sizes relative to map (responsive sizing)
        this.calculateCharacterSizes();
    }

    calculateCharacterSizes() {
        // Don't calculate if map dimensions aren't set yet
        if (!this.mapWidth || !this.mapHeight) {
            console.warn('⚠️ Cannot calculate character sizes - map dimensions not set');
            return;
        }
        
        // Calculate character size as a percentage of the smaller map dimension
        // This ensures characters scale appropriately on different screen sizes
        const baseSize = Math.min(this.mapWidth, this.mapHeight) * 0.08; // 8% of smaller dimension
        const minSize = 40;  // Minimum size for very small screens
        const maxSize = 200; // Maximum size for very large screens
        
        // Clamp the size between min and max
        const characterSize = Math.max(minSize, Math.min(maxSize, baseSize));
        
        // Update player size
        this.player.width = characterSize;
        this.player.height = characterSize;
        
        // Update all NPC sizes (prevent concurrency issues)
        const npcCount = this.npcs.length;
        this.npcs.forEach((npc, index) => {
            if (npc) { // Safety check
                npc.width = characterSize;
                npc.height = characterSize;
            }
        });
        
        // Update interaction distance relative to character size
        this.interactionDistance = characterSize * 1.5;
        
        console.log(`📏 Character sizes updated: ${Math.round(characterSize)}px`);
        console.log(`👤 Player: ${this.player.width}x${this.player.height}px`);
        console.log(`👥 NPCs: ${npcCount} characters updated to ${Math.round(characterSize)}px`);
        console.log(`🎯 Interaction distance: ${Math.round(this.interactionDistance)}px`);
    }
    
    drawFallbackMap() {
        // Fill entire screen with black first
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);
        
        // Save current context state
        this.ctx.save();
        
        // Reduce fallback map opacity to be less prominent
        this.ctx.globalAlpha = 0.6;
        
        // Draw a simple fallback map if image fails to load (more muted colors)
        this.ctx.fillStyle = '#27ae60'; // Darker green
        this.ctx.fillRect(this.mapOffsetX - this.camera.x, this.mapOffsetY - this.camera.y, this.mapWidth, this.mapHeight);
        
        // Add some simple terrain features (relative to map coordinates) with muted colors
        this.ctx.fillStyle = '#2980b9'; // Darker blue
        this.ctx.fillRect(100 - this.camera.x, 100 - this.camera.y, 200, 50); // Water
        this.ctx.fillRect(500 - this.camera.x, 300 - this.camera.y, 150, 100); // Water
        
        this.ctx.fillStyle = '#7f8c8d'; // Darker gray
        this.ctx.fillRect(-this.camera.x, -this.camera.y, this.mapWidth, 20); // Top wall
        this.ctx.fillRect(-this.camera.x, -this.camera.y, 20, this.mapHeight); // Left wall
        this.ctx.fillRect(this.mapWidth - 20 - this.camera.x, -this.camera.y, 20, this.mapHeight); // Right wall
        this.ctx.fillRect(-this.camera.x, this.mapHeight - 20 - this.camera.y, this.mapWidth, 20); // Bottom wall
        
        this.ctx.fillStyle = '#2c3e50'; // Darker text
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🗺️ San Diego City Map', this.mapWidth / 2 - this.camera.x, 50 - this.camera.y);
        
        // Restore context state
        this.ctx.restore();
        
        console.log('🎨 Fallback map drawn');
    }
    
    setupEventListeners() {
        // Keyboard input
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            // Track CTRL key for speed boost
            if (e.key === 'Control') {
                this.ctrlPressed = true;
                this.updateUI();
            }
            
            // F8 key to toggle debug menu
            if (e.key === 'F8') {
                e.preventDefault();
                this.toggleDebugMenu();
            }
            
            // E key for NPC interaction (only when not typing in chat)
            if (e.key === 'e' || e.key === 'E') {
                // Don't handle interaction if user is typing in chat input
                const activeElement = document.activeElement;
                const isTypingInChat = activeElement && (
                    activeElement.id === 'messageInput' || 
                    activeElement.tagName === 'INPUT' || 
                    activeElement.tagName === 'TEXTAREA'
                );
                
                if (!isTypingInChat) {
                    e.preventDefault();
                    this.handleNPCInteraction();
                }
            }
            
            // ESC key to close chat
            if (e.key === 'Escape') {
                e.preventDefault();
                if (this.chatSystem && this.chatSystem.isChatOpen()) {
                    this.chatSystem.hideChat();
                }
            }
            
            // Prevent default behavior for arrow keys
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            
            // Track CTRL key release
            if (e.key === 'Control') {
                this.ctrlPressed = false;
                this.updateUI();
            }
        });
        
        // Canvas click to move player
        this.canvas.addEventListener('click', (e) => {
            // Don't move if chat is open
            if (this.chatSystem && this.chatSystem.isChatOpen()) {
                return;
            }
            
            const rect = this.canvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;
            
            // Convert screen coordinates to world coordinates
            const worldX = screenX + this.camera.x;
            const worldY = screenY + this.camera.y;
            
            this.movePlayerTo(worldX, worldY);
        });

        // Debug controls
        const resetButton = document.getElementById('resetSession');
        const checkBackendButton = document.getElementById('checkBackend');

        resetButton.addEventListener('click', async () => {
            if (confirm('Reset your game session? This will clear all conversations.')) {
                await this.resetGameSession();
            }
        });

        checkBackendButton.addEventListener('click', async () => {
            await this.checkBackendStatus();
        });
    }
    
    handleInput() {
        // Don't handle movement input if chat is open
        if (this.chatSystem && this.chatSystem.isChatOpen()) {
            return;
        }
        
        const currentSpeed = this.ctrlPressed ? this.player.speed * 2 : this.player.speed;
        let newX = this.player.x;
        let newY = this.player.y;
        let movementX = 0;
        let movementY = 0;
        
        // WASD and Arrow key movement
        if (this.keys['w'] || this.keys['arrowup']) {
            newY -= currentSpeed;
            movementY = -1;
        }
        if (this.keys['s'] || this.keys['arrowdown']) {
            newY += currentSpeed;
            movementY = 1;
        }
        if (this.keys['a'] || this.keys['arrowleft']) {
            newX -= currentSpeed;
            movementX = -1;
        }
        if (this.keys['d'] || this.keys['arrowright']) {
            newX += currentSpeed;
            movementX = 1;
        }
        
        // Update movement direction and character sprite
        if (movementX !== 0 || movementY !== 0) {
            this.lastMovementDirection = { x: movementX, y: movementY };
            this.updatePlayerDirection(movementX, movementY);
        }
        
        // Apply movement with collision detection
        this.movePlayer(newX, newY);
        
        // Check for nearby NPCs
        this.checkNPCProximity();
    }

    /**
     * 🎭 Update player direction and sprite based on movement
     */
    updatePlayerDirection(movementX, movementY) {
        let newDirection = this.currentDirection;
        
        // Determine direction based on movement
        if (movementY < 0) { // Moving up (behind)
            if (movementX < 0) {
                newDirection = 'behind_left';
            } else if (movementX > 0) {
                newDirection = 'behind_right';
            } else {
                newDirection = 'behind';
            }
        } else if (movementY > 0) { // Moving down (front)
            if (movementX < 0) {
                newDirection = 'front_left';
            } else if (movementX > 0) {
                newDirection = 'front_right';
            } else {
                newDirection = 'front';
            }
        } else if (movementX < 0) { // Moving left only
            newDirection = 'front_left';
        } else if (movementX > 0) { // Moving right only
            newDirection = 'front_right';
        }
        
        // Update direction and sprite if changed
        if (newDirection !== this.currentDirection) {
            this.currentDirection = newDirection;
            
            // Update player image if the new direction sprite is loaded
            if (this.playerImagesLoaded[newDirection]) {
                this.player.image = this.playerImages[newDirection];
            }
        }
    }

    /**
     * 🔍 Check if player is near any NPCs
     */
    checkNPCProximity() {
        let closestNPC = null;
        let closestDistance = Infinity;
        
        this.npcs.forEach(npc => {
            // Convert NPC relative position to world coordinates
            const npcWorldX = this.mapOffsetX + (npc.x * this.mapWidth);
            const npcWorldY = this.mapOffsetY + (npc.y * this.mapHeight);
            
            // Calculate distance to player
            const dx = this.player.x - npcWorldX;
            const dy = this.player.y - npcWorldY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.interactionDistance && distance < closestDistance) {
                closestDistance = distance;
                closestNPC = npc;
            }
        });
        
        // Update nearby NPC
        if (closestNPC !== this.nearbyNPC) {
            this.nearbyNPC = closestNPC;
            this.updateInteractionPrompt();
        }
    }

    /**
     * 💬 Handle NPC interaction (E key pressed)
     */
    async handleNPCInteraction() {
        if (!this.nearbyNPC) return;
        
        if (!this.backendConnected) {
            alert('❌ Backend not connected! Cannot start conversation.');
            return;
        }
        
        if (!this.chatSystem) {
            alert('❌ Chat system not initialized!');
            return;
        }
        
        // Open chat with the nearby NPC
        await this.chatSystem.showChat(this.nearbyNPC.name);
    }

    /**
     * 🎯 Update interaction prompt visibility and position
     */
    updateInteractionPrompt() {
        if (this.nearbyNPC) {
            this.npcPromptName.textContent = this.nearbyNPC.displayName || this.nearbyNPC.name;
            this.interactionPrompt.classList.remove('hidden');
            
            // Position prompt above the player's actual screen position
            this.positionInteractionPrompt();
        } else {
            this.interactionPrompt.classList.add('hidden');
        }
    }

    /**
     * 📍 Position interaction prompt above player character
     */
    positionInteractionPrompt() {
        // Calculate player's actual screen position
        const playerScreenX = this.player.x - this.camera.x;
        const playerScreenY = this.player.y - this.camera.y;
        
        // Position prompt above player character
        const promptX = playerScreenX;
        const promptY = playerScreenY - this.player.height/2 - 60; // 60px above player
        
        // Apply position to the prompt
        this.interactionPrompt.style.left = promptX + 'px';
        this.interactionPrompt.style.top = promptY + 'px';
    }

    /**
     * 🔄 Reset game session
     */
    async resetGameSession() {
        try {
            this.showLoading(true);
            console.log('🔄 Resetting game session...');
            
            // Reset API session
            this.api.resetSession();
            
            // Re-initialize session with backend
            if (this.backendConnected) {
                await this.api.initializeSession();
            }
            
            // Update UI
            this.updateUI();
            
            console.log('✅ Game session reset successfully!');
            
        } catch (error) {
            console.error('❌ Failed to reset session:', error);
            alert('Failed to reset session. Please refresh the page.');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * 🏥 Check backend status
     */
    async checkBackendStatus() {
        try {
            console.log('🏥 Checking backend status...');
            const isHealthy = await this.api.checkBackendHealth();
            
            if (isHealthy) {
                alert('✅ Backend is connected and healthy!');
            } else {
                alert('❌ Backend is not responding. Please check if the server is running.');
            }
            
        } catch (error) {
            console.error('❌ Backend check failed:', error);
            alert('❌ Failed to check backend status.');
        }
    }

    /**
     * 🔧 Ensure all characters have consistent sizes
     */
    ensureConsistentCharacterSizes() {
        if (!this.player.width || this.player.width === 0) {
            console.warn('⚠️ Player size not set, using fallback');
            return;
        }
        
        const targetSize = this.player.width;
        let updatedCount = 0;
        
        this.npcs.forEach(npc => {
            if (npc && (npc.width !== targetSize || npc.height !== targetSize)) {
                npc.width = targetSize;
                npc.height = targetSize;
                updatedCount++;
            }
        });
        
        if (updatedCount > 0) {
            console.log(`🔧 Fixed ${updatedCount} NPCs with inconsistent sizes`);
        }
    }

    /**
     * 📚 Load conversation status for all NPCs
     */
    async loadConversationStatus() {
        try {
            if (!this.api || !this.backendConnected) {
                return;
            }
            
            const history = await this.api.getConversationHistory();
            if (history.conversations) {
                // Update conversation status for each NPC
                Object.keys(history.conversations).forEach(npcName => {
                    if (history.conversations[npcName].length > 0) {
                        this.npcConversationStatus.set(npcName, true);
                    }
                });
            }
        } catch (error) {
            console.warn('Could not load conversation status:', error);
        }
    }

    /**
     * 💬 Mark NPC as having been talked to
     */
    markNPCAsSpokenTo(npcName) {
        this.npcConversationStatus.set(npcName, true);
    }
    
    movePlayer(newX, newY) {
        // Check for collisions before moving
        if (this.checkCollision(newX, newY)) {
            return; // Don't move if collision detected
        }
        
        this.player.x = newX;
        this.player.y = newY;
        this.updateCamera();
        this.updateUI();
    }
    
    updateCamera() {
        // Hybrid camera system: map scrolls until edges are visible, then character moves
        let targetCameraX = this.player.x - this.screenWidth / 2;
        let targetCameraY = this.player.y - this.screenHeight / 2;
        
        // Constrain camera so map edges don't go beyond screen edges
        const minCameraX = this.mapOffsetX;
        const maxCameraX = this.mapOffsetX + this.mapWidth - this.screenWidth;
        const minCameraY = this.mapOffsetY;
        const maxCameraY = this.mapOffsetY + this.mapHeight - this.screenHeight;
        
        // Only constrain if map is larger than screen in that dimension
        if (this.mapWidth > this.screenWidth) {
            this.camera.x = Math.max(minCameraX, Math.min(maxCameraX, targetCameraX));
        } else {
            this.camera.x = this.mapOffsetX;
        }
        
        if (this.mapHeight > this.screenHeight) {
            this.camera.y = Math.max(minCameraY, Math.min(maxCameraY, targetCameraY));
        } else {
            this.camera.y = this.mapOffsetY;
        }
    }
    
    checkCollision(x, y) {
        // Restrict movement to only the visible map area
        const halfWidth = this.player.width / 2;
        const halfHeight = this.player.height / 2;
        
        // Map boundaries
        const minX = this.mapOffsetX + halfWidth;
        const maxX = this.mapOffsetX + this.mapWidth - halfWidth;
        const minY = this.mapOffsetY + halfHeight;
        const maxY = this.mapOffsetY + this.mapHeight - halfHeight;
        
        if (x < minX || x > maxX || y < minY || y > maxY) {
            return true; // Boundary collision - can't walk into black area
        }
        
        // You can add custom collision areas here based on coordinates
        // Example: Define specific rectangular areas as obstacles
        const obstacles = [
            // {x: 100, y: 100, width: 200, height: 50}, // Example obstacle
            // {x: 500, y: 300, width: 150, height: 100}  // Another obstacle
        ];
        
        for (const obstacle of obstacles) {
            if (x >= obstacle.x && x <= obstacle.x + obstacle.width &&
                y >= obstacle.y && y <= obstacle.y + obstacle.height) {
                return true; // Obstacle collision
            }
        }
        
        return false; // No collision
    }
    
    movePlayerTo(x, y) {
        // Smooth movement animation to clicked position
        const targetX = x;
        const targetY = y;
        const duration = 500; // ms
        const startTime = Date.now();
        const startX = this.player.x;
        const startY = this.player.y;
        
        // Calculate movement direction for sprite
        const deltaX = targetX - startX;
        const deltaY = targetY - startY;
        const movementX = deltaX > 0 ? 1 : deltaX < 0 ? -1 : 0;
        const movementY = deltaY > 0 ? 1 : deltaY < 0 ? -1 : 0;
        
        // Update sprite direction based on click movement
        this.updatePlayerDirection(movementX, movementY);
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth movement
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            const newX = startX + (targetX - startX) * easeProgress;
            const newY = startY + (targetY - startY) * easeProgress;
            
            this.movePlayer(newX, newY);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    

    
    toggleDebugMenu() {
        this.debugVisible = !this.debugVisible;
        if (this.debugVisible) {
            this.gameUI.classList.add('debug-visible');
        } else {
            this.gameUI.classList.remove('debug-visible');
        }
        console.log(`🐛 Debug menu: ${this.debugVisible ? 'ON' : 'OFF'}`);
    }
    
    updateUI() {
        this.positionElement.textContent = `X: ${Math.round(this.player.x)}, Y: ${Math.round(this.player.y)}`;
        this.speedElement.textContent = this.ctrlPressed ? 'Boost 🚀' : 'Normal';
        
        // Update session info
        if (this.api) {
            const sessionInfo = this.api.getSessionInfo();
            const shortId = sessionInfo.sessionId.split('-').pop().substr(0, 6);
            const status = this.backendConnected ? '🟢' : '🔴';
            this.sessionInfoElement.textContent = `${status} ${shortId}`;
        }
    }
    
    render() {
        // Fill entire screen with black first to eliminate any white space
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);
        
        // Draw map with reduced opacity to make characters stand out more
        if (this.mapLoaded) {
            // Save current context state
            this.ctx.save();
            
            // Reduce map opacity to make it less prominent
            this.ctx.globalAlpha = 0.7;
            
            // Draw the map maintaining aspect ratio, centered and offset by camera
            this.ctx.drawImage(this.mapImage, 
                this.mapOffsetX - this.camera.x, 
                this.mapOffsetY - this.camera.y, 
                this.mapWidth, 
                this.mapHeight);
            
            // Restore context state
            this.ctx.restore();
        } else {
            this.drawFallbackMap();
        }
        
        // Draw NPCs
        this.drawNPCs();
        
        // Draw player (always centered on screen)
        this.drawPlayer();
        
        // Draw mini-map or additional UI elements
        this.drawMiniUI();
    }
    
    drawNPCs() {
        this.npcs.forEach(npc => {
            // Convert relative position to absolute map coordinates
            const worldX = this.mapOffsetX + (npc.x * this.mapWidth);
            const worldY = this.mapOffsetY + (npc.y * this.mapHeight);
            
            // Convert to screen coordinates
            const screenX = worldX - this.camera.x;
            const screenY = worldY - this.camera.y;
            
            // Only draw if NPC is visible on screen (with some margin)
            const margin = 50;
            if (screenX > -margin && screenX < this.screenWidth + margin &&
                screenY > -margin && screenY < this.screenHeight + margin) {
                
                // Track if nearby for name display (but no interaction circle)
                const isNearby = this.nearbyNPC === npc;
                
                // Draw NPC shadow (smaller)
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.beginPath();
                this.ctx.ellipse(screenX + 2, screenY + npc.height/2 + 2, npc.width/4, npc.height/8, 0, 0, 2 * Math.PI);
                this.ctx.fill();
                
                // Draw NPC image if loaded
                if (npc.image.complete && npc.image.naturalHeight !== 0) {
                    this.ctx.drawImage(npc.image, 
                        screenX - npc.width/2, 
                        screenY - npc.height/2, 
                        npc.width, 
                        npc.height);
                } else {
                    // Fallback: draw colored circle with initial
                    this.ctx.fillStyle = '#4a90e2';
                    this.ctx.beginPath();
                    this.ctx.arc(screenX, screenY, npc.width/2, 0, 2 * Math.PI);
                    this.ctx.fill();
                    
                    this.ctx.strokeStyle = '#2c5282';
                    this.ctx.lineWidth = 2;
                    this.ctx.stroke();
                    
                    // Draw first letter of name
                    this.ctx.fillStyle = 'white';
                    this.ctx.font = '12px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(npc.name.charAt(0).toUpperCase(), screenX, screenY + 4);
                }
                
                // Draw chat indicator only if NPC has actually been talked to
                if (this.backendConnected && this.npcConversationStatus.get(npc.name)) {
                    this.ctx.fillStyle = '#4a90e2';
                    this.ctx.beginPath();
                    this.ctx.arc(screenX + npc.width/2 - 10, screenY - npc.height/2 + 10, 6, 0, 2 * Math.PI);
                    this.ctx.fill();
                    
                    this.ctx.fillStyle = 'white';
                    this.ctx.font = '10px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('💬', screenX + npc.width/2 - 10, screenY - npc.height/2 + 14);
                }
                
                // Draw NPC name label when debug mode is active or when nearby
                if (this.debugVisible || isNearby) {
                    const displayName = npc.displayName || npc.name.replace('_', ' ');
                    const textWidth = this.ctx.measureText(displayName).width + 20;
                    
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                    this.ctx.fillRect(screenX - textWidth/2, screenY + npc.height/2 + 5, textWidth, 20);
                    
                    this.ctx.fillStyle = 'white';
                    this.ctx.font = '12px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(displayName, screenX, screenY + npc.height/2 + 18);
                }
            }
        });
    }
    
    drawPlayer() {
        // Player position on screen depends on camera constraints
        const screenX = this.player.x - this.camera.x;
        const screenY = this.player.y - this.camera.y;
        const { width, height } = this.player;
        
        // Player shadow (smaller)
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(screenX + 2, screenY + height/2 + 2, width/4, height/8, 0, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Draw player character image if loaded
        if (this.playerImagesLoaded[this.currentDirection] && this.player.image) {
            this.ctx.drawImage(
                this.player.image,
                screenX - width/2,
                screenY - height/2,
                width,
                height
            );
        } else {
            // Fallback: draw colored rectangle if image not loaded
            this.ctx.fillStyle = this.player.color;
            this.ctx.fillRect(screenX - width/2, screenY - height/2, width, height);
            
            // Player border
            this.ctx.strokeStyle = '#2f3640';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(screenX - width/2, screenY - height/2, width, height);
            
            // Player direction indicator
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY - height/4, 3, 0, 2 * Math.PI);
            this.ctx.fill();
        }
        
        // Speed boost effect
        if (this.ctrlPressed) {
            this.ctx.strokeStyle = '#f1c40f';
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, width/2 + 15, 0, 2 * Math.PI);
            this.ctx.stroke();
        }
    }
    
    drawMiniUI() {
        // Draw compass
        const compassX = this.screenWidth - 30;
        const compassY = 30;
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(compassX, compassY, 20, 0, 2 * Math.PI);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#34495e';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // North indicator
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('N', compassX, compassY - 10);
    }
    
    gameLoop() {
        this.handleInput();
        this.render();
        
        // Periodically ensure character sizes are consistent (every 60 frames ≈ 1 second)
        if (this.frameCount % 60 === 0) {
            this.ensureConsistentCharacterSizes();
        }
        this.frameCount = (this.frameCount || 0) + 1;
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Starting San Diego City Game...');
    const game = new Game();
});

// Add some fun console messages
console.log(`
🏙️ Welcome to San Diego City Game!
🎮 Controls:
   • WASD or Arrow Keys: Move character
   • Click on map: Move to location
   • Hold CTRL: Move faster
   • E: Talk to nearby NPCs
   • ESC: Close chat
   • F8: Toggle debug menu

🚀 Game features:
   • Real-time character movement with custom sprite
   • 14 AI-powered NPCs with unique personalities
   • Persistent conversations across sessions
   • Map-based collision detection
   • Smooth animations
   • Backend integration with OpenAI GPT-4o
   • Session management with reset capability

🎭 NPCs Available:
   • Tyler (La Jolla) - Surfer dude
   • Brianna (Pacific Beach) - Skater girl  
   • Matheus (Ocean Beach) - Musician
   • Alex (University City) - UCSD student
   • And 10 more unique characters!

Happy exploring and chatting! 🌟
`);
