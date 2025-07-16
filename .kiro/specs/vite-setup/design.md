# Design Document

## Overview

The Katamari-JS game has been refactored from a working single-file implementation to a modular structure, but this refactoring introduced critical bugs affecting physics simulation and performance. The main issues identified are:

1. **Physics Bodies Not Falling**: Items are hovering in the air instead of falling due to improper physics body management
2. **Performance Degradation**: Low FPS caused by inefficient physics body activation/deactivation and resource management
3. **Collision Detection Issues**: Items not properly interacting with the katamari or ground
4. **Resource Management Problems**: Physics bodies and visual meshes not being properly cleaned up

The design focuses on fixing these core issues while maintaining the modular architecture benefits.

## Architecture

### Core Problem Analysis

Based on examination of the modular code vs the working backup, the key issues are:

1. **Physics Body Lifecycle Management**: The modular version has inconsistent physics body creation, activation, and cleanup
2. **Instanced Mesh Synchronization**: Physics bodies and visual meshes are not properly synchronized
3. **Ground Collision**: Missing or improperly configured ground physics body
4. **Performance Bottlenecks**: Inefficient physics body management causing frame drops

### Solution Architecture

The fix will maintain the modular structure but address the core physics and performance issues through:

1. **Centralized Physics Body Management**: Ensure consistent lifecycle management
2. **Proper Ground Physics**: Implement working ground collision system
3. **Optimized Item Management**: Fix physics body activation/deactivation logic
4. **Resource Cleanup**: Proper disposal of physics bodies and visual resources

## Components and Interfaces

### 1. Physics System Fixes (`src/game/core/physics.js`)

**Issues Identified:**
- Physics bodies may not be properly added to the world
- Ground physics body missing or misconfigured
- Body activation/deactivation logic not working correctly

**Fixes Required:**
- Ensure ground physics body is created and added to world
- Fix physics body tracking and management
- Implement proper body activation based on distance from katamari
- Add collision event handling for ground interactions

### 2. Items System Fixes (`src/game/entities/items.js`)

**Issues Identified:**
- Physics bodies created but not properly positioned or activated
- Instanced mesh synchronization problems
- Items not falling due to missing physics world integration

**Fixes Required:**
- Ensure physics bodies are properly added to the physics world
- Fix initial positioning of physics bodies (items should start above ground)
- Implement proper physics-visual synchronization
- Fix instanced mesh matrix updates

### 3. Katamari Entity Fixes (`src/game/entities/katamari.js`)

**Issues Identified:**
- Collision detection may not be working properly
- Physics body updates not synchronized with visual representation

**Fixes Required:**
- Ensure collision event handlers are properly registered
- Fix physics body position synchronization
- Implement proper collision response for item collection

### 4. Scene Management Fixes (`src/game/core/scene.js`)

**Issues Identified:**
- Ground mesh and physics body may not be properly created
- Instanced mesh management issues

**Fixes Required:**
- Ensure ground physics body is created and added to physics world
- Fix instanced mesh initialization and management
- Implement proper resource cleanup

## Data Models

### Physics Body State Management

```javascript
// Enhanced physics body tracking
const physicsBodyState = {
    bodies: Map<string, CANNON.Body>, // Track all physics bodies by ID
    activeDistance: number,           // Distance for activation
    groundBody: CANNON.Body,         // Reference to ground physics body
    katamariBody: CANNON.Body        // Reference to katamari physics body
}
```

### Item State Synchronization

```javascript
// Item state that ensures physics-visual sync
const itemState = {
    threeMesh: THREE.Mesh,           // Visual representation
    cannonBody: CANNON.Body,         // Physics body
    isActive: boolean,               // Whether physics is active
    lastSyncTime: number,            // Last physics-visual sync
    isGrounded: boolean              // Whether item has hit ground
}
```

## Error Handling

### Physics World Integrity

1. **Ground Physics Body Validation**: Ensure ground body exists and is properly configured
2. **Body Addition Verification**: Verify physics bodies are actually added to the world
3. **Collision Event Registration**: Ensure collision handlers are properly attached
4. **Position Synchronization**: Validate physics and visual positions match

### Performance Monitoring

1. **FPS Tracking**: Monitor frame rate and identify performance bottlenecks
2. **Physics Body Count**: Track active physics bodies to prevent overload
3. **Memory Usage**: Monitor for memory leaks in physics body management
4. **Collision Detection**: Ensure collision detection is working efficiently

### Resource Management

1. **Physics Body Cleanup**: Proper removal of physics bodies from world
2. **Visual Mesh Disposal**: Dispose of geometries and materials
3. **Event Listener Cleanup**: Remove collision event listeners
4. **Instanced Mesh Management**: Proper handling of instanced mesh instances

## Testing Strategy

### Unit Testing Approach

1. **Physics System Tests**
   - Verify ground physics body creation and configuration
   - Test physics body addition/removal from world
   - Validate collision detection setup
   - Test body activation/deactivation logic

2. **Items System Tests**
   - Test item physics body creation and positioning
   - Verify physics-visual synchronization
   - Test instanced mesh management
   - Validate item cleanup procedures

3. **Integration Tests**
   - Test katamari-item collision detection
   - Verify item falling behavior
   - Test performance under load
   - Validate resource cleanup

### Performance Testing

1. **FPS Benchmarking**
   - Measure FPS with various numbers of active items
   - Test physics body activation/deactivation performance
   - Monitor memory usage over time

2. **Physics Simulation Testing**
   - Verify items fall properly under gravity
   - Test collision detection accuracy
   - Validate physics body synchronization

### Regression Testing

1. **Compare Against Working Backup**
   - Verify all functionality matches the working single-file version
   - Test item collection mechanics
   - Validate katamari growth and physics
   - Ensure audio and visual effects work correctly

### Manual Testing Scenarios

1. **Basic Physics Behavior**
   - Items should fall to the ground when spawned
   - Katamari should roll realistically on the ground
   - Items should be collectible when katamari is large enough

2. **Performance Validation**
   - Game should maintain 60 FPS with multiple items
   - No stuttering or frame drops during gameplay
   - Smooth item generation and cleanup

3. **Edge Cases**
   - Large numbers of items (stress testing)
   - Rapid katamari movement
   - Boundary conditions (map edges)
   - Resource cleanup when restarting levels