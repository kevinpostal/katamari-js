# Project Structure

## Root Files
- `index.html` - Main game file containing all HTML, CSS, and JavaScript
- `README.md` - Basic project description and attribution

## Key Directories
- `.git/` - Git version control
- `.github/` - GitHub workflows and templates
- `.kiro/` - Kiro AI assistant configuration and steering rules
- `.vite/` - Vite development server cache (empty, no build system used)
- `.vscode/` - VS Code workspace settings

## Code Organization (within index.html)

### HTML Structure
- Game UI elements (size, speed, progress indicators)
- Loading overlay and message overlays
- Control instructions and buttons

### CSS Styling
- Responsive design for mobile and desktop
- Game UI positioning and styling
- Animation keyframes for visual effects
- Touch-friendly button styling

### JavaScript Architecture
- **IIFE Module Pattern** - Entire game wrapped in immediately invoked function
- **Initialization** - Scene, physics, audio setup
- **Game Loop** - Fixed timestep animation loop
- **Input Handling** - Keyboard, touch, gyroscope event listeners
- **Physics Integration** - Cannon-ES world simulation
- **Rendering** - Three.js scene rendering with instanced meshes
- **Audio System** - Tone.js synthesizers for dynamic sound effects

## Code Conventions
- Use `debugLog`, `debugWarn`, `debugError` for conditional logging
- Prefix physics bodies with descriptive names
- Group related functionality in logical sections with comments
- Use `const` for immutable references, `let` for variables
- Maintain consistent indentation (4 spaces)
- Use descriptive variable names for game state