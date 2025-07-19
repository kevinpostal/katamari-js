---
inclusion: always
---

# Product Requirements & Game Design

**Katamari-JS** is a browser-based 3D physics game where players control a rolling ball that grows by collecting objects. All implementations must follow these product specifications.

## Core Mechanics (Required)

- **Physics-based rolling** using Cannon-ES for realistic ball physics and object interactions
- **Progressive growth system** where ball size increases based on collected object mass/volume
- **Collection mechanics** where objects stick to ball when collision size threshold is met
- **Procedural generation** with dynamic item spawning based on player distance and current size

## Level Design Requirements

- **Themed environments**: Earth (natural objects), Urban (man-made items), Space (cosmic debris)
- **Size progression**: Start small (paperclips, coins) → medium (furniture, cars) → large (buildings, planets)
- **Spatial scaling**: Items must feel appropriately sized relative to current ball size

## Control Implementation Standards

- **Desktop**: WASD/Arrow keys for movement with smooth directional input
- **Mobile**: Touch drag for direction, optional gyroscope tilt enhancement
- **Responsiveness**: All controls must feel immediate and precise for satisfying physics interaction

## Audio System Requirements

- **Dynamic synthesis** using Tone.js to generate sounds based on game state
- **Collection feedback** with distinct audio cues for different object types and sizes
- **Ambient soundscape** that adapts to current level theme

## Performance Constraints (Critical)

- **60 FPS target** - All features must maintain smooth physics simulation and rendering
- **Instanced rendering** for repeated objects (MAX_INSTANCES = 1000)
- **Dynamic optimization** - Activate/deactivate physics bodies based on relevance
- **Memory management** - Clean up distant objects to prevent memory leaks

## Implementation Rules

- **Physics naming**: Always prefix physics bodies with descriptive names for debugging
- **Logging**: Use only `debugLog()`, `debugWarn()`, `debugError()` functions
- **Code organization**: Group related functionality with clear comment section headers
- **Variable conventions**: Use `const` for immutable references, `let` for mutable variables
- **Performance-first mindset**: Always consider 60 FPS impact when adding any feature
- **Cross-platform compatibility**: Ensure touch controls work alongside desktop controls
