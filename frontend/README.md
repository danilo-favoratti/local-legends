# 🌟 Local Legends - San Diego Edition

A modern web-based 2D game featuring character movement on a custom map using HTML5 Canvas and JavaScript.

## 🚀 Features

- **🎮 Smooth Character Movement**: WASD or Arrow keys for fluid movement
- **🖱️ Click-to-Move**: Click anywhere on the map to move your character
- **🗺️ Custom Map Integration**: Uses your San Diego city map as the game world
- **🚧 Collision Detection**: Prevents movement through walls and obstacles
- **⚡ Speed Boost**: Toggle between normal and boost speed
- **📱 Responsive Design**: Works on desktop and mobile devices
- **🎨 Modern UI**: Beautiful gradient design with smooth animations

## 🎯 Controls

| Input | Action |
|-------|--------|
| `W` or `↑` | Move Up |
| `S` or `↓` | Move Down |
| `A` or `←` | Move Left |
| `D` or `→` | Move Right |
| `Mouse Click` | Move to clicked location |
| `Reset Button` | Return to center |
| `Speed Button` | Toggle speed boost |

## 🛠️ Technical Implementation

### Core Components

1. **HTML Structure** (`index.html`)
   - Canvas element for game rendering
   - UI controls and information display
   - Responsive layout

2. **Styling** (`styles.css`)
   - Modern gradient backgrounds
   - Responsive design
   - Smooth animations and transitions

3. **Game Engine** (`game.js`)
   - Character movement system
   - Collision detection
   - Map rendering
   - Input handling
   - Game loop

### Key Features

#### Character Movement
- Real-time input handling for WASD/Arrow keys
- Smooth click-to-move with easing animations
- Boundary collision detection
- Speed boost functionality

#### Map Integration
- Automatic map loading and scaling
- Fallback map if image fails to load
- Pixel-based collision detection
- Responsive canvas sizing

#### User Interface
- Real-time position tracking
- Speed indicator
- Compass navigation
- Modern button controls

## 🚀 Getting Started

1. **Clone or Download** the project files
2. **Open** `index.html` in a web browser
3. **Start Playing** immediately!

### File Structure
```
san-diego-city/
├── index.html          # Main game page
├── styles.css          # Game styling
├── game.js            # Game engine and logic
├── images/
│   └── map.png        # Your San Diego city map
└── README.md          # This file
```

## 🎮 Game Architecture

### Game Class
The main `Game` class handles:
- Canvas initialization and map loading
- Player state management
- Input event handling
- Collision detection
- Rendering pipeline
- Game loop execution

### Player Object
```javascript
player: {
    x: 100,           // X position
    y: 100,           // Y position  
    width: 20,        // Character width
    height: 20,       // Character height
    speed: 3,         // Movement speed
    color: '#ff4757'  // Character color
}
```

## 🔧 Customization

### Modify Character Appearance
Edit the `drawPlayer()` method in `game.js`:
```javascript
// Change character color
this.player.color = '#your-color';

// Modify character size
this.player.width = 25;
this.player.height = 25;
```

### Adjust Movement Speed
```javascript
// In the Game constructor
this.player.speed = 5; // Increase for faster movement
```

### Add Custom Collision Areas
Extend the `checkCollision()` method:
```javascript
checkCollision(x, y) {
    // Add your custom collision logic here
    // Example: Check specific map areas, colors, etc.
}
```

## 🌟 Advanced Features

- **Pixel-perfect collision detection** based on map colors
- **Smooth animation system** with easing functions
- **Responsive canvas scaling** that maintains aspect ratio
- **Performance-optimized rendering** using requestAnimationFrame
- **Cross-browser compatibility** with modern web standards

## 🎯 Future Enhancements

Potential additions you could implement:
- Multiple characters/NPCs
- Sound effects and background music
- Inventory system
- Mini-games and quests
- Multiplayer functionality
- Mobile touch controls
- Gamepad support

## 🐛 Troubleshooting

**Map not loading?**
- Ensure `images/map.png` exists and is accessible
- Check browser console for error messages
- Fallback map will display if image fails

**Controls not working?**
- Click on the game canvas to focus it
- Check browser console for JavaScript errors

**Performance issues?**
- Try reducing canvas size in the CSS
- Close other browser tabs
- Use a modern browser with hardware acceleration

## 📄 License

This project is open source. Feel free to modify and distribute as needed.

---

**🎮 Happy Gaming!** Meet the Local Legends of San Diego and have fun with your custom 2D game!
