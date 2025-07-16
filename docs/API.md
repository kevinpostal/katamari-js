# Katamari-JS API Documentation

This document provides detailed API documentation for the Katamari-JS game engine components.

## Table of Contents

- [Core Systems](#core-systems)
- [Game Entities](#game-entities)
- [Utilities](#utilities)
- [Constants](#constants)
- [Events](#events)

## Core Systems

### Scene Management (`src/game/core/scene.js`)

#### `initializeScene()`
Initializes the Three.js scene, camera, and renderer.

**Returns:** `void`

```javascript
initializeScene();
```

#### `setupLighting()`
Configures ambient and directional lighting for the scene.

**Returns:** `void`

#### `renderScene()`
Renders the current frame.

**Returns:** `void`

#### `getScene()`
Returns the Three.js scene instance.

**Returns:** `THREE.Scene`

#### `getCamera()`
Returns the Three.js camera instance.

**Returns:** `THREE.PerspectiveCamera`

#### `getRenderer()`
Returns the Three.js WebGL renderer.

**Returns:** `THREE.WebGLRenderer`

#### `getInstancedMesh()`
Returns the instanced mesh used for efficient object rendering.

**Returns:** `THREE.InstancedMesh`

### Physics System (`src/game/core/physics.js`)

#### `initializePhysicsWorld()`
Initializes the Cannon-ES physics world with gravity and collision detection.

**Returns:** `CANNON.World`

```javascript
const world = initializePhysicsWorld();
```

#### `updatePhysics(deltaTime)`
Steps the physics simulation forward.

**Parameters:**
- `deltaTime` (number): Time elapsed since last update in seconds

**Returns:** `void`

#### `getBodyVelocityMagnitude(body)`
Calculates the velocity magnitude of a physics body.

**Parameters:**
- `body` (CANNON.Body): Physics body to measure

**Returns:** `number` - Velocity magnitude in m/s

#### `managePhysicsBodyActivation()`
Optimizes performance by activating/deactivating physics bodies based on distance.

**Returns:** `void`

#### `getPhysicsPerformanceStats()`
Returns current physics performance metrics.

**Returns:** `Object`
```javascript
{
    activeBodies: number,
    totalBodies: number,
    stepTime: number
}
```

### Audio System (`src/game/core/audio.js`)

#### `initializeAudio()`
Initializes the Tone.js audio context and synthesizers.

**Returns:** `Promise<void>`

#### `playRollingSound(velocity)`
Plays rolling sound based on katamari velocity.

**Parameters:**
- `velocity` (number): Current velocity magnitude

**Returns:** `void`

#### `stopRollingSound()`
Stops the rolling sound effect.

**Returns:** `void`

#### `playCollectionSound(objectType, size)`
Plays collection sound when an object is picked up.

**Parameters:**
- `objectType` (string): Type of collected object
- `size` (number): Size of the collected object

**Returns:** `void`

#### `updateAttractionHum(intensity)`
Updates the attraction hum audio effect.

**Parameters:**
- `intensity` (number): Hum intensity (0-1)

**Returns:** `void`

## Game Entities

### Katamari (`src/game/entities/katamari.js`)

#### `createKatamari(scene, world)`
Creates and initializes the katamari entity.

**Parameters:**
- `scene` (THREE.Scene): Three.js scene
- `world` (CANNON.World): Physics world

**Returns:** `Object` - Katamari entity
```javascript
{
    mesh: THREE.Mesh,
    body: CANNON.Body,
    size: number,
    collectedItems: Array,
    update: Function
}
```

#### `updateKatamari(katamari, deltaTime)`
Updates katamari physics and rendering.

**Parameters:**
- `katamari` (Object): Katamari entity
- `deltaTime` (number): Time since last update

**Returns:** `void`

#### `growKatamari(katamari, amount)`
Increases katamari size and updates physics.

**Parameters:**
- `katamari` (Object): Katamari entity
- `amount` (number): Growth amount

**Returns:** `void`

### Items System (`src/game/entities/items.js`)

#### `initializeItemsSystem(scene, world)`
Initializes the item generation and management system.

**Parameters:**
- `scene` (THREE.Scene): Three.js scene
- `world` (CANNON.World): Physics world

**Returns:** `void`

#### `generateItemsAroundKatamari(katamari, count)`
Generates items around the katamari based on its current size and environment.

**Parameters:**
- `katamari` (Object): Katamari entity
- `count` (number): Number of items to generate

**Returns:** `Array<Object>` - Generated items

#### `updateItemFadeIn(deltaTime)`
Updates item fade-in animations.

**Parameters:**
- `deltaTime` (number): Time since last update

**Returns:** `void`

#### `cleanupOldItems(katamariPosition, maxDistance)`
Removes items that are too far from the katamari.

**Parameters:**
- `katamariPosition` (THREE.Vector3): Current katamari position
- `maxDistance` (number): Maximum distance before cleanup

**Returns:** `number` - Number of items cleaned up

## Utilities

### Debug System (`src/game/utils/debug.js`)

#### `debugLog(message, ...args)`
Conditional logging for development.

**Parameters:**
- `message` (string): Log message
- `...args` (any): Additional arguments

**Returns:** `void`

#### `debugWarn(message, ...args)`
Conditional warning logging.

**Parameters:**
- `message` (string): Warning message
- `...args` (any): Additional arguments

**Returns:** `void`

#### `debugError(message, ...args)`
Conditional error logging.

**Parameters:**
- `message` (string): Error message
- `...args` (any): Additional arguments

**Returns:** `void`

#### `toggleDebugMode()`
Toggles debug mode on/off.

**Returns:** `boolean` - New debug mode state

### Performance Monitoring (`src/game/utils/performance.js`)

#### `initializePerformanceMonitoring()`
Initializes performance tracking systems.

**Returns:** `void`

#### `updatePerformanceMonitoring()`
Updates performance metrics.

**Returns:** `void`

#### `recordRenderTime(startTime, endTime)`
Records frame render time.

**Parameters:**
- `startTime` (number): Frame start timestamp
- `endTime` (number): Frame end timestamp

**Returns:** `void`

#### `getPerformanceStats()`
Returns current performance statistics.

**Returns:** `Object`
```javascript
{
    fps: number,
    frameTime: number,
    renderTime: number,
    memoryUsage: number,
    objectCount: number
}
```

#### `logPerformanceStats()`
Logs performance statistics to console.

**Returns:** `void`

## Constants

### Physics Constants (`PHYSICS`)
```javascript
export const PHYSICS = {
    GRAVITY: -9.82,
    TIMESTEP: 1/60,
    MAX_SUB_STEPS: 3,
    WORLD_SIZE: 1000,
    COLLISION_GROUPS: {
        KATAMARI: 1,
        ITEMS: 2,
        GROUND: 4
    }
};
```

### Katamari Constants (`KATAMARI`)
```javascript
export const KATAMARI = {
    INITIAL_SIZE: 2.0,
    MAX_SIZE: 1000.0,
    GROWTH_RATE: 1.1,
    MIN_ROLLING_SPEED: 0.1,
    MAX_SPEED: 50.0,
    COLLECTION_THRESHOLD: 0.8
};
```

### Performance Constants (`PERFORMANCE`)
```javascript
export const PERFORMANCE = {
    MAX_INSTANCES: 1000,
    CLEANUP_DISTANCE: 200,
    PHYSICS_STEPS: 60,
    RENDER_DISTANCE: 150,
    TARGET_FPS: 60
};
```

### Item Constants (`ITEMS`)
```javascript
export const ITEMS = {
    GENERATION_RADIUS: 100,
    MAX_ITEMS: 500,
    FADE_IN_TIME: 1.0,
    SIZE_CATEGORIES: {
        TINY: { min: 0.1, max: 1.0 },
        SMALL: { min: 1.0, max: 5.0 },
        MEDIUM: { min: 5.0, max: 20.0 },
        LARGE: { min: 20.0, max: 100.0 }
    }
};
```

## Events

### Custom Events

The game uses a custom event system for communication between components:

#### `katamari:grow`
Fired when the katamari grows in size.

**Event Data:**
```javascript
{
    oldSize: number,
    newSize: number,
    growthAmount: number
}
```

#### `item:collected`
Fired when an item is collected.

**Event Data:**
```javascript
{
    item: Object,
    katamariSize: number,
    collectionTime: number
}
```

#### `environment:change`
Fired when the environment changes.

**Event Data:**
```javascript
{
    oldEnvironment: string,
    newEnvironment: string,
    trigger: string
}
```

#### `performance:warning`
Fired when performance drops below acceptable levels.

**Event Data:**
```javascript
{
    fps: number,
    frameTime: number,
    severity: string
}
```

### Event Usage Example

```javascript
// Listen for katamari growth
document.addEventListener('katamari:grow', (event) => {
    const { oldSize, newSize } = event.detail;
    console.log(`Katamari grew from ${oldSize}m to ${newSize}m`);
});

// Dispatch custom event
const growthEvent = new CustomEvent('katamari:grow', {
    detail: {
        oldSize: 2.0,
        newSize: 2.5,
        growthAmount: 0.5
    }
});
document.dispatchEvent(growthEvent);
```

## Error Handling

### Common Error Types

#### `PhysicsError`
Thrown when physics simulation encounters issues.

#### `AudioError`
Thrown when audio system fails to initialize or play sounds.

#### `RenderError`
Thrown when Three.js rendering encounters problems.

### Error Handling Example

```javascript
try {
    initializeAudio();
} catch (error) {
    if (error instanceof AudioError) {
        debugWarn('Audio initialization failed:', error.message);
        // Fallback to silent mode
    } else {
        debugError('Unexpected error:', error);
        throw error;
    }
}
```

## Integration Examples

### Adding a New Item Type

```javascript
// 1. Define item properties
const newItemType = {
    name: 'CustomItem',
    size: 3.0,
    mass: 2.5,
    color: 0xff6600,
    sound: 'metallic'
};

// 2. Register with items system
registerItemType(newItemType);

// 3. Add to generation pool
addToGenerationPool('urban', newItemType, 0.1); // 10% spawn rate
```

### Custom Audio Effect

```javascript
// 1. Create synthesizer
const customSynth = new Tone.Synth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.1, decay: 0.2, sustain: 0.3, release: 0.4 }
});

// 2. Connect to audio system
customSynth.connect(getAudioDestination());

// 3. Play on event
document.addEventListener('item:collected', (event) => {
    if (event.detail.item.type === 'CustomItem') {
        customSynth.triggerAttackRelease('C4', '8n');
    }
});
```

This API documentation provides the foundation for extending and modifying the Katamari-JS game engine. For more specific implementation details, refer to the source code and inline documentation.