---
inclusion: always
---

# Technical Standards & Architecture

## Technology Stack

- **Three.js** (v0.153.0) - 3D graphics via ES modules from CDN
- **Cannon-ES** (v0.20.0) - Physics simulation engine
- **Tone.js** (v14.8.49) - Real-time audio synthesis
- **Vanilla JavaScript** - ES6+ modules, no build system

## Mandatory Architecture Rules

- **Single file only**: All code must live in `index.html` - HTML, CSS, and JavaScript combined
- **IIFE module pattern**: Wrap entire game logic to avoid global pollution
- **CDN imports only**: Use ES6 modules from CDN, no build system or local dependencies
- **4-space indentation**: Maintain consistently throughout all code sections

## Code Style Standards

- Use `const` for immutable references, `let` for mutable variables
- Prefix physics bodies with descriptive names for debugging (e.g., `ball_`, `obstacle_`)
- Group related functionality with clear comment section headers
- Use conditional logging functions: `debugLog()`, `debugWarn()`, `debugError()`

## Performance Requirements

- **60 FPS target**: All features must maintain smooth frame rate
- **Instanced rendering**: Use for repeated objects (MAX_INSTANCES = 1000)
- **Dynamic cleanup**: Activate/deactivate physics bodies based on distance/relevance
- **Fixed timestep**: Physics simulation must use consistent timing

## Code Organization (within index.html)

1. HTML structure and game UI
2. CSS styling with responsive design
3. JavaScript wrapped in IIFE containing:
   - Initialization (scene, physics, audio)
   - Game loop with fixed timestep
   - Input handling (keyboard, touch, gyroscope)
   - Physics integration
   - Rendering system
   - Audio synthesis

## Browser Compatibility

- Requires ES6 modules, WebGL, and Web Audio API support
- Optional DeviceOrientationEvent for enhanced mobile controls
