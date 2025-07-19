---
inclusion: always
---

# Project Structure & Architecture

### Required Structure Order

1. **HTML** - Game UI, overlays, control instructions
2. **CSS** - Responsive styling, animations, touch-friendly buttons
3. **JavaScript** - IIFE-wrapped game logic with these sections:
   - Initialization (scene, physics, audio setup)
   - Game loop (fixed timestep)
   - Input handling (keyboard, touch, gyroscope)
   - Physics integration (Cannon-ES)
   - Rendering (Three.js with instancing)
   - Audio system (Tone.js synthesizers)

## Mandatory Code Conventions

- **Indentation**: 4 spaces consistently
- **Variables**: `const` for immutable, `let` for mutable
- **Logging**: Use `debugLog()`, `debugWarn()`, `debugError()` only
- **Physics naming**: Prefix bodies with descriptive names for debugging
- **Comments**: Group related functionality with clear section headers
- **Performance**: Always consider 60 FPS impact when adding features

## Architecture Patterns

- **Module isolation**: Wrap all game code in IIFE to avoid global pollution
- **State management**: Use descriptive variable names for game state
- **Event handling**: Centralized input system supporting desktop and mobile
- **Resource management**: Dynamic cleanup of distant objects and physics bodies
