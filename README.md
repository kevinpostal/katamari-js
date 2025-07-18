# Katamari-JS 🌟

A browser-based 3D physics game inspired by Katamari Damacy, built with modern web technologies. Roll around procedurally generated worlds, collecting objects to grow your katamari from tiny to cosmic proportions.

![CI Status](https://github.com/yourusername/katamari-js/workflows/Continuous%20Integration/badge.svg) ![Coverage](https://codecov.io/gh/yourusername/katamari-js/branch/main/graph/badge.svg) ![Game Preview](https://img.shields.io/badge/Status-Playable-brightgreen) ![Version](https://img.shields.io/badge/Version-1.0.0-blue) ![License](https://img.shields.io/badge/License-MIT-green)

## 🎮 Play Now

Simply open `index.html` in your browser or visit the [live demo](#) to start playing immediately!

<!-- Test deployment workflow - manual trigger test -->

## ✨ Features

### Core Gameplay

- **Physics-Based Rolling** - Realistic ball physics powered by Cannon-ES
- **Progressive Growth System** - Your katamari grows as you collect objects
- **Dynamic Collection** - Objects stick when you're big enough to pick them up
- **Procedural Generation** - Infinite worlds with themed environments

### Technical Highlights

- **60 FPS Performance** - Optimized rendering with instanced meshes
- **Real-Time Audio** - Dynamic sound synthesis with Tone.js
- **Cross-Platform Controls** - Keyboard, touch, and gyroscope support
- **No Build Required** - Pure ES6 modules, runs directly in browser

### Environments

- 🌍 **Earth** - Natural objects (rocks, trees, animals)
- 🏙️ **Urban** - Man-made items (cars, buildings, furniture)
- 🚀 **Space** - Cosmic debris (asteroids, satellites, planets)

## 🚀 Quick Start

### Prerequisites

- Modern web browser with ES6 module support
- Local web server (for development)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/katamari-js.git
   cd katamari-js
   ```

2. **Install dependencies** (for development)

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm run dev
   ```

4. **Or serve statically**

   ```bash
   # Using Python
   python -m http.server 8000

   # Using Node.js
   npx serve .
   ```

5. **Open in browser**
   Navigate to `http://localhost:8000` (or your server's URL)

## 🎯 How to Play

### Controls

**Desktop:**

- `W, A, S, D` or `Arrow Keys` - Move the katamari
- `R` - Reset katamari position
- `Space` - Generate new world
- `G` - Toggle gyroscope (mobile)
- `F` - Toggle debug mode

**Mobile:**

- **Touch & Drag** - Swipe to control direction
- **Gyroscope** - Tilt device for movement (optional)
- **Touch Buttons** - Access game controls

### Gameplay Tips

- Start by collecting small objects (coins, paperclips)
- Your katamari must be larger than objects to collect them
- Momentum helps with rolling uphill
- Watch the progress bar to see your growth toward the next size tier
- Different environments unlock as you grow larger

## 🛠️ Development

### Project Structure

```
katamari-js/
├── index.html              # Main game file (all-in-one)
├── src/
│   ├── main.js            # Game entry point
│   └── game/
│       ├── core/          # Core systems
│       │   ├── scene.js   # Three.js scene management
│       │   ├── physics.js # Cannon-ES physics
│       │   └── audio.js   # Tone.js audio system
│       ├── entities/      # Game objects
│       │   ├── katamari.js
│       │   └── items.js
│       └── utils/         # Utilities
│           ├── constants.js
│           ├── debug.js
│           └── performance.js
├── package.json           # Dependencies and scripts
├── vite.config.js        # Build configuration
└── README.md             # This file
```

### Technology Stack

| Technology    | Version | Purpose                         |
| ------------- | ------- | ------------------------------- |
| **Three.js**  | 0.153.0 | 3D graphics and rendering       |
| **Cannon-ES** | 0.20.0  | Physics simulation              |
| **Tone.js**   | 14.8.49 | Real-time audio synthesis       |
| **Vite**      | 5.0.0   | Development server and bundling |

### Build Scripts

```bash
# Development
npm run dev          # Start dev server with hot reload
npm run preview      # Preview production build

# Production
npm run build        # Build optimized production bundle
npm run build:clean  # Clean and build
npm run build:analyze # Build with bundle analysis

# Testing
npm run build:test   # Build and preview
```

### Code Architecture

The game follows a modular ES6 architecture:

- **IIFE Pattern** - Encapsulated game logic
- **ES6 Modules** - Clean dependency management
- **Performance First** - Instanced rendering, object pooling
- **Debug-Friendly** - Conditional logging, performance monitoring

### Performance Optimizations

- **Instanced Rendering** - Up to 1000 objects efficiently rendered
- **Frustum Culling** - Only render visible objects
- **Physics Optimization** - Dynamic body activation/deactivation
- **Memory Management** - Automatic cleanup of distant objects
- **Bundle Optimization** - Tree-shaking, minification, compression

## 🎵 Audio System

Dynamic audio synthesis creates immersive soundscapes:

- **Rolling Sounds** - Velocity-based audio feedback
- **Collection Audio** - Unique sounds for different object types
- **Ambient Soundscape** - Environment-specific background audio
- **Spatial Audio** - 3D positioned sound effects

## 📱 Mobile Support

Optimized for mobile devices with:

- **Touch Controls** - Intuitive swipe-to-move interface
- **Gyroscope Support** - Optional tilt-based movement
- **Responsive UI** - Adapts to different screen sizes
- **Performance Scaling** - Automatic quality adjustment

## 🔧 Configuration

### Debug Mode

Toggle debug mode to access:

- Performance metrics (FPS, render time, physics stats)
- Physics body visualization
- Object count and memory usage
- Console logging controls

### Performance Tuning

Adjust constants in `src/game/utils/constants.js`:

```javascript
export const PERFORMANCE = {
  MAX_INSTANCES: 1000, // Maximum rendered objects
  CLEANUP_DISTANCE: 200, // Object cleanup threshold
  PHYSICS_STEPS: 60, // Physics simulation rate
  RENDER_DISTANCE: 150, // Maximum render distance
};
```

## 🚀 Deployment

### Static Hosting

The game is designed for simple static hosting:

1. **Build for production**

   ```bash
   npm run build
   ```

2. **Deploy the `dist/` folder** to any static host:
   - GitHub Pages
   - Netlify
   - Vercel
   - AWS S3
   - Any web server

### Single File Deployment

For maximum simplicity, the game can run as a single HTML file with inlined assets.

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Test thoroughly**
5. **Submit a pull request**

### Development Guidelines

- Follow the existing code style (4-space indentation)
- Use `debugLog()`, `debugWarn()`, `debugError()` for logging
- Maintain 60 FPS performance target
- Test on both desktop and mobile
- Update documentation for new features

## 📊 Performance Benchmarks

Target performance metrics:

- **60 FPS** - Consistent frame rate
- **< 100ms** - Input latency
- **< 2MB** - Bundle size
- **< 100MB** - Memory usage

## 🐛 Known Issues

- Gyroscope controls may not work on all mobile browsers
- Physics simulation can become unstable with very large katamari sizes
- Audio context requires user interaction on some browsers

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Katamari Damacy** - Original game inspiration by Namco
- **Three.js Community** - 3D graphics framework
- **Cannon-ES** - Physics simulation engine
- **Tone.js** - Web audio synthesis
- **AI Development** - Built with assistance from various AI agents

## 📞 Support

- **Issues** - Report bugs via [GitHub Issues](https://github.com/yourusername/katamari-js/issues)
- **Discussions** - Join conversations in [GitHub Discussions](https://github.com/yourusername/katamari-js/discussions)
- **Documentation** - Check the [Wiki](https://github.com/yourusername/katamari-js/wiki) for detailed guides

---

**Made with ❤️ and modern web technologies**
