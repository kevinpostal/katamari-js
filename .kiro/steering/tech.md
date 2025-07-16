---
inclusion: always
---

# Technical Standards & Architecture

## Technology Stack

- **Three.js** (v0.153.0) - 3D graphics via ES modules from CDN
- **Cannon-ES** (v0.20.0) - Physics simulation engine
- **Tone.js** (v14.8.49) - Real-time audio synthesis
- **Vanilla JavaScript** - ES6+ modules, no build system

## Code Architecture Rules

- Single HTML file containing all HTML, CSS, and JavaScript
- Use IIFE module pattern to wrap entire game logic
- Import dependencies via ES6 modules from CDN only
- Maintain 4-space indentation consistently
- Use `const` for immutable references, `let` for variables

## Logging Standards

- Use `debugLog()`, `debugWarn()`, `debugError()` for conditional logging
- Prefix physics bodies with descriptive names for debugging
- Group related functionality with clear comment sections

## Performance Requirements

- Target 60 FPS with fixed timestep physics simulation
- Use instanced rendering for repeated objects (MAX_INSTANCES = 1000)
- Implement frustum culling and dynamic object cleanup
- Activate/deactivate physics bodies based on distance/relevance

## Development Workflow

- Serve locally with static file server (no build process)
- Debug via browser dev tools and in-game debug toggle
- Deploy by copying files to static hosting

## Browser Support

- Requires ES6 modules, WebGL, and Web Audio API
- Optional DeviceOrientationEvent for gyroscope controls
