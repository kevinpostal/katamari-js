---
inclusion: always
---

# Product Overview

**Katamari-JS** is a browser-based 3D physics game inspired by Katamari Damacy. Players control a rolling ball that grows by collecting objects in procedurally generated worlds.

## Core Game Mechanics

- **Physics-based rolling** - Use Cannon-ES for realistic ball physics and object interactions
- **Progressive growth system** - Ball size increases based on collected object mass/volume
- **Collection mechanics** - Objects stick to ball when collision size threshold is met
- **Procedural generation** - Dynamic item spawning based on player distance and current size

## Level Design Principles

- **Themed environments** - Earth (natural objects), Urban (man-made items), Space (cosmic debris)
- **Size progression** - Start small (paperclips, coins) → medium (furniture, cars) → large (buildings, planets)
- **Spatial awareness** - Items should feel appropriately sized relative to current ball size

## Control Standards

- **Desktop** - WASD/Arrow keys for movement, smooth directional input
- **Mobile** - Touch drag for direction, gyroscope tilt as optional enhancement
- **Responsiveness** - All controls should feel immediate and precise for satisfying physics interaction

## Audio Design

- **Dynamic synthesis** - Use Tone.js to generate sounds based on game state
- **Collection feedback** - Distinct audio cues for different object types and sizes
- **Ambient soundscape** - Background audio that adapts to current level theme

## Performance Requirements

- **60 FPS target** - Maintain smooth physics simulation and rendering
- **Instanced rendering** - Use for repeated objects (MAX_INSTANCES = 1000)
- **Dynamic optimization** - Activate/deactivate physics bodies based on relevance
- **Memory management** - Clean up distant objects to prevent memory leaks
