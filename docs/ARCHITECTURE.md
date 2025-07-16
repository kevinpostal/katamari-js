# Architecture Documentation

This document provides a comprehensive overview of the Katamari-JS architecture, design patterns, and technical decisions.

## 🏗️ System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser Environment                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Input     │  │     UI      │  │   Audio     │         │
│  │  Handler    │  │  Manager    │  │  System     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │    Game     │  │   Scene     │  │  Physics    │         │
│  │    Loop     │  │  Manager    │  │   World     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Katamari   │  │    Items    │  │Performance  │         │
│  │   Entity    │  │   System    │  │  Monitor    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│           Three.js │ Cannon-ES │ Tone.js                   │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

#### 1. Game Loop (`src/main.js`)
The central orchestrator that coordinates all systems:

```javascript
const gameLoop = (currentTime) => {
    const deltaTime = (currentTime - lastTime) / 1000;
    
    // Update systems in order
    updatePhysics(deltaTime);
    updateKatamari(katamari, deltaTime);
    updateItems(deltaTime);
    updateAudio();
    updateUI();
    
    // Render frame
    renderScene();
    
    // Performance monitoring
    updatePerformanceMonitoring();
    
    requestAnimationFrame(gameLoop);
};
```

#### 2. Scene Management (`src/game/core/scene.js`)
Manages Three.js scene, camera, and rendering:

```javascript
// Scene hierarchy
Scene
├── Camera (PerspectiveCamera)
├── Lighting
│   ├── AmbientLight
│   └── DirectionalLight
├── Katamari (Mesh + Physics Body)
├── Items (InstancedMesh for performance)
└── Environment Objects
```

#### 3. Physics System (`src/game/core/physics.js`)
Cannon-ES integration with optimization:

```javascript
// Physics world structure
World
├── Gravity: -9.82 m/s²
├── Broadphase: NaiveBroadphase
├── Bodies
│   ├── Katamari (Sphere)
│   ├── Items (Various shapes)
│   └── Ground (Plane)
└── Constraints (if any)
```

## 🎯 Design Patterns

### 1. Module Pattern
Each system is encapsulated in its own module:

```javascript
// Example: Audio System
const AudioSystem = (() => {
    let context, synthesizers, effects;
    
    const init = () => { /* private initialization */ };
    const play = (sound) => { /* private method */ };
    
    return {
        initialize: init,
        playSound: play,
        // Only expose public API
    };
})();
```

### 2. Entity-Component System (Simplified)
Game objects are composed of data and behavior:

```javascript
const createKatamari = (scene, world) => ({
    // Data components
    mesh: new THREE.Mesh(geometry, material),
    body: new CANNON.Body({ mass: 1 }),
    size: KATAMARI.INITIAL_SIZE,
    collectedItems: [],
    
    // Behavior components
    update: function(deltaTime) {
        this.updatePhysics(deltaTime);
        this.updateVisuals();
        this.checkCollisions();
    },
    
    grow: function(amount) {
        this.size *= amount;
        this.updateScale();
    }
});
```

### 3. Observer Pattern
Event-driven communication between systems:

```javascript
// Event dispatcher
const EventBus = {
    events: {},
    
    on(event, callback) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(callback);
    },
    
    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback(data));
        }
    }
};

// Usage
EventBus.on('katamari:grow', (data) => {
    updateUI(data.newSize);
    playGrowthSound(data.growthAmount);
});
```

### 4. Object Pool Pattern
Efficient memory management for frequently created objects:

```javascript
class ObjectPool {
    constructor(createFn, resetFn, initialSize = 10) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
        this.active = [];
        
        // Pre-populate pool
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
        }
    }
    
    acquire() {
        const obj = this.pool.pop() || this.createFn();
        this.active.push(obj);
        return obj;
    }
    
    release(obj) {
        const index = this.active.indexOf(obj);
        if (index > -1) {
            this.active.splice(index, 1);
            this.resetFn(obj);
            this.pool.push(obj);
        }
    }
}
```

## 🔄 Data Flow

### 1. Input Processing
```
User Input → Input Handler → Game State → Physics/Rendering
```

### 2. Physics Update
```
Physics Step → Collision Detection → Entity Updates → Audio Triggers
```

### 3. Rendering Pipeline
```
Scene Update → Frustum Culling → Instanced Rendering → Post-processing
```

### 4. Audio Processing
```
Game Events → Audio Synthesis → Spatial Processing → Output
```

## 🎮 Game Systems

### Katamari System
Manages the player's rolling ball:

```javascript
class KatamariSystem {
    constructor(scene, world) {
        this.entity = this.createKatamari(scene, world);
        this.controls = new Controls();
        this.physics = new KatamariPhysics();
    }
    
    update(deltaTime) {
        // Process input
        const input = this.controls.getInput();
        
        // Apply forces
        this.physics.applyMovementForce(this.entity.body, input);
        
        // Update size based on collected items
        this.updateSize();
        
        // Sync visual with physics
        this.syncMeshWithBody();
    }
}
```

### Items System
Manages collectible objects with procedural generation:

```javascript
class ItemsSystem {
    constructor(scene, world) {
        this.items = [];
        this.instancedMesh = this.createInstancedMesh();
        this.generator = new ProceduralGenerator();
    }
    
    update(deltaTime, katamariPosition) {
        // Generate new items around katamari
        this.generateItems(katamariPosition);
        
        // Update item animations
        this.updateAnimations(deltaTime);
        
        // Clean up distant items
        this.cleanup(katamariPosition);
        
        // Update instanced mesh
        this.updateInstancedMesh();
    }
}
```

### Audio System
Dynamic audio synthesis based on game state:

```javascript
class AudioSystem {
    constructor() {
        this.context = new Tone.Context();
        this.synthesizers = this.createSynthesizers();
        this.effects = this.createEffects();
    }
    
    update(gameState) {
        // Update rolling sound based on velocity
        this.updateRollingSound(gameState.katamari.velocity);
        
        // Update ambient based on environment
        this.updateAmbient(gameState.environment);
        
        // Process spatial audio
        this.updateSpatialAudio(gameState.camera.position);
    }
}
```

## 🚀 Performance Architecture

### 1. Rendering Optimizations

#### Instanced Rendering
```javascript
// Single draw call for multiple objects
const instancedMesh = new THREE.InstancedMesh(
    geometry, 
    material, 
    MAX_INSTANCES
);

// Update matrices for all instances
for (let i = 0; i < activeItems.length; i++) {
    matrix.setPosition(items[i].position);
    instancedMesh.setMatrixAt(i, matrix);
}
instancedMesh.instanceMatrix.needsUpdate = true;
```

#### Frustum Culling
```javascript
const frustum = new THREE.Frustum();
frustum.setFromProjectionMatrix(
    camera.projectionMatrix.clone().multiply(camera.matrixWorldInverse)
);

// Only render visible objects
const visibleItems = items.filter(item => 
    frustum.containsPoint(item.position)
);
```

### 2. Physics Optimizations

#### Spatial Partitioning
```javascript
class SpatialGrid {
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.grid = new Map();
    }
    
    insert(object) {
        const cell = this.getCell(object.position);
        if (!this.grid.has(cell)) this.grid.set(cell, []);
        this.grid.get(cell).push(object);
    }
    
    getNearby(position, radius) {
        const cells = this.getCellsInRadius(position, radius);
        return cells.flatMap(cell => this.grid.get(cell) || []);
    }
}
```

#### Dynamic Body Activation
```javascript
const managePhysicsBodyActivation = (katamariPosition) => {
    physicsWorld.bodies.forEach(body => {
        const distance = body.position.distanceTo(katamariPosition);
        
        if (distance > ACTIVATION_DISTANCE) {
            body.sleep(); // Deactivate distant bodies
        } else if (body.sleepState === CANNON.Body.SLEEPING) {
            body.wakeUp(); // Reactivate nearby bodies
        }
    });
};
```

### 3. Memory Management

#### Object Pooling
```javascript
class ItemPool {
    constructor() {
        this.available = [];
        this.active = [];
    }
    
    acquire() {
        return this.available.pop() || this.createNew();
    }
    
    release(item) {
        this.active.splice(this.active.indexOf(item), 1);
        this.reset(item);
        this.available.push(item);
    }
}
```

#### Garbage Collection Optimization
```javascript
// Minimize object creation in game loop
const tempVector = new THREE.Vector3();
const tempMatrix = new THREE.Matrix4();

const updateLoop = () => {
    // Reuse temporary objects instead of creating new ones
    tempVector.copy(katamari.position);
    tempMatrix.makeTranslation(tempVector.x, tempVector.y, tempVector.z);
};
```

## 🔧 Configuration Architecture

### Constants Management
```javascript
// src/game/utils/constants.js
export const PHYSICS = {
    GRAVITY: -9.82,
    TIMESTEP: 1/60,
    MAX_SUB_STEPS: 3
};

export const KATAMARI = {
    INITIAL_SIZE: 2.0,
    GROWTH_RATE: 1.1,
    MAX_SPEED: 50.0
};

export const PERFORMANCE = {
    MAX_INSTANCES: 1000,
    CLEANUP_DISTANCE: 200,
    TARGET_FPS: 60
};
```

### Environment Configuration
```javascript
const ENVIRONMENTS = {
    earth: {
        gravity: -9.82,
        itemTypes: ['rock', 'tree', 'animal'],
        backgroundColor: 0x87CEEB,
        fogColor: 0xCCCCCC
    },
    space: {
        gravity: -1.62, // Moon gravity
        itemTypes: ['asteroid', 'satellite', 'debris'],
        backgroundColor: 0x000011,
        fogColor: 0x000033
    }
};
```

## 🧪 Testing Architecture

### Unit Testing Structure
```javascript
// tests/physics.test.js
describe('Physics System', () => {
    let world, katamari;
    
    beforeEach(() => {
        world = initializePhysicsWorld();
        katamari = createKatamari(scene, world);
    });
    
    test('katamari should fall under gravity', () => {
        const initialY = katamari.body.position.y;
        updatePhysics(1/60); // One physics step
        expect(katamari.body.position.y).toBeLessThan(initialY);
    });
});
```

### Integration Testing
```javascript
// tests/integration.test.js
describe('Game Integration', () => {
    test('collecting item should increase katamari size', async () => {
        const initialSize = katamari.size;
        
        // Simulate collision with item
        simulateCollision(katamari, testItem);
        
        expect(katamari.size).toBeGreaterThan(initialSize);
        expect(katamari.collectedItems).toContain(testItem);
    });
});
```

## 📊 Monitoring Architecture

### Performance Metrics
```javascript
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            fps: 0,
            frameTime: 0,
            renderTime: 0,
            physicsTime: 0,
            memoryUsage: 0
        };
    }
    
    startFrame() {
        this.frameStart = performance.now();
    }
    
    endFrame() {
        const frameTime = performance.now() - this.frameStart;
        this.updateMetrics(frameTime);
    }
    
    updateMetrics(frameTime) {
        this.metrics.fps = 1000 / frameTime;
        this.metrics.frameTime = frameTime;
        this.metrics.memoryUsage = this.getMemoryUsage();
    }
}
```

### Debug System
```javascript
class DebugSystem {
    constructor() {
        this.enabled = false;
        this.panels = [];
    }
    
    toggle() {
        this.enabled = !this.enabled;
        this.updateVisibility();
    }
    
    addPanel(name, updateFn) {
        this.panels.push({ name, updateFn, element: this.createElement(name) });
    }
    
    update() {
        if (!this.enabled) return;
        
        this.panels.forEach(panel => {
            panel.element.textContent = panel.updateFn();
        });
    }
}
```

## 🔮 Future Architecture Considerations

### Scalability
- **Web Workers**: Move physics simulation to separate thread
- **WebAssembly**: Optimize critical performance paths
- **Streaming**: Load assets on-demand for larger worlds

### Modularity
- **Plugin System**: Allow third-party extensions
- **Asset Pipeline**: Automated asset optimization
- **Configuration System**: Runtime configuration changes

### Performance
- **Level-of-Detail**: Reduce complexity for distant objects
- **Occlusion Culling**: Skip rendering of hidden objects
- **Temporal Upsampling**: Render at lower resolution and upscale

This architecture provides a solid foundation for the current game while allowing for future enhancements and optimizations.