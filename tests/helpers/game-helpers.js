/**
 * Game-specific test helper functions
 * Provides utilities for setting up and testing game components
 */

import { vi } from 'vitest';
import { initialGameState, midGameState, endGameState } from '../__fixtures__/game-states.js';

/**
 * Creates a mock game state for testing
 * @param {string} stateType - Type of state ('initial', 'mid', 'end')
 * @returns {Object} Mock game state object
 */
export function createMockGameState(stateType = 'initial') {
    const states = {
        initial: initialGameState,
        mid: midGameState,
        end: endGameState
    };
    
    return JSON.parse(JSON.stringify(states[stateType] || states.initial));
}

/**
 * Creates a mock Three.js scene setup
 * @returns {Object} Mock scene, camera, and renderer
 */
export function createMockThreeJsSetup() {
    const scene = {
        children: [],
        add: vi.fn((object) => scene.children.push(object)),
        remove: vi.fn((object) => {
            const index = scene.children.indexOf(object);
            if (index !== -1) scene.children.splice(index, 1);
        })
    };
    
    const camera = {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        fov: 75,
        aspect: 1,
        near: 0.1,
        far: 1000,
        updateProjectionMatrix: vi.fn(),
        lookAt: vi.fn()
    };
    
    const renderer = {
        domElement: document.createElement('canvas'),
        setSize: vi.fn(),
        setPixelRatio: vi.fn(),
        render: vi.fn(),
        dispose: vi.fn()
    };
    
    return { scene, camera, renderer };
}

/**
 * Creates a mock Cannon-ES physics setup
 * @returns {Object} Mock world and body creation utilities
 */
export function createMockPhysicsSetup() {
    const world = {
        gravity: { x: 0, y: -9.82, z: 0 },
        bodies: [],
        addBody: vi.fn((body) => world.bodies.push(body)),
        removeBody: vi.fn((body) => {
            const index = world.bodies.indexOf(body);
            if (index !== -1) world.bodies.splice(index, 1);
        }),
        step: vi.fn()
    };
    
    const createBody = (options = {}) => ({
        mass: options.mass || 0,
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        shapes: [],
        addShape: vi.fn(),
        removeShape: vi.fn()
    });
    
    return { world, createBody };
}

/**
 * Creates a mock audio system setup
 * @returns {Object} Mock synthesizers and audio utilities
 */
export function createMockAudioSetup() {
    const createSynth = (type = 'basic') => ({
        type,
        volume: { value: -12 },
        triggerAttack: vi.fn(),
        triggerRelease: vi.fn(),
        triggerAttackRelease: vi.fn(),
        toDestination: vi.fn(),
        connect: vi.fn(),
        disconnect: vi.fn(),
        dispose: vi.fn()
    });
    
    return {
        membrane: createSynth('membrane'),
        noise: createSynth('noise'),
        basic: createSynth('basic'),
        context: {
            state: 'running',
            resume: vi.fn(() => Promise.resolve())
        }
    };
}

/**
 * Creates a mock katamari object for testing
 * @param {Object} options - Configuration options
 * @returns {Object} Mock katamari object
 */
export function createMockKatamari(options = {}) {
    return {
        position: options.position || { x: 0, y: 0, z: 0 },
        size: options.size || 1.0,
        velocity: options.velocity || { x: 0, y: 0, z: 0 },
        collectedItems: options.collectedItems || 0,
        mesh: {
            position: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            visible: true
        },
        body: {
            position: { x: 0, y: 0, z: 0 },
            velocity: { x: 0, y: 0, z: 0 },
            mass: options.mass || 1.0
        },
        update: vi.fn(),
        grow: vi.fn(),
        dispose: vi.fn()
    };
}

/**
 * Creates mock input event objects
 * @param {string} type - Event type ('keyboard', 'touch', 'gyro')
 * @param {Object} data - Event data
 * @returns {Object} Mock event object
 */
export function createMockInputEvent(type, data = {}) {
    const baseEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
    };
    
    switch (type) {
        case 'keyboard':
            return {
                ...baseEvent,
                type: 'keydown',
                key: data.key || 'ArrowUp',
                code: data.code || 'ArrowUp',
                keyCode: data.keyCode || 38
            };
            
        case 'touch':
            return {
                ...baseEvent,
                type: 'touchstart',
                touches: [{
                    clientX: data.x || 0,
                    clientY: data.y || 0,
                    identifier: 0
                }],
                changedTouches: [{
                    clientX: data.x || 0,
                    clientY: data.y || 0,
                    identifier: 0
                }]
            };
            
        case 'gyro':
            return {
                ...baseEvent,
                type: 'deviceorientation',
                alpha: data.alpha || 0,
                beta: data.beta || 0,
                gamma: data.gamma || 0,
                absolute: data.absolute || false
            };
            
        default:
            return baseEvent;
    }
}

/**
 * Simulates a game loop iteration for testing
 * @param {Object} gameState - Current game state
 * @param {number} deltaTime - Time since last frame
 * @returns {Object} Updated game state
 */
export function simulateGameLoop(gameState, deltaTime = 16.67) {
    const newState = { ...gameState };
    
    // Simulate physics step
    if (newState.physics.worldCreated) {
        newState.physics.activeCollisions = Math.floor(Math.random() * 10);
    }
    
    // Simulate katamari movement
    if (newState.katamari.velocity.x !== 0 || newState.katamari.velocity.z !== 0) {
        newState.katamari.position.x += newState.katamari.velocity.x * deltaTime / 1000;
        newState.katamari.position.z += newState.katamari.velocity.z * deltaTime / 1000;
    }
    
    return newState;
}

/**
 * Waits for a specified number of animation frames
 * @param {number} frames - Number of frames to wait
 * @returns {Promise} Promise that resolves after the frames
 */
export function waitForFrames(frames = 1) {
    return new Promise(resolve => {
        let count = 0;
        function frame() {
            count++;
            if (count >= frames) {
                resolve();
            } else {
                requestAnimationFrame(frame);
            }
        }
        requestAnimationFrame(frame);
    });
}

/**
 * Creates a mock performance metrics object
 * @param {Object} overrides - Values to override in the metrics
 * @returns {Object} Mock performance metrics
 */
export function createMockPerformanceMetrics(overrides = {}) {
    return {
        frameRate: {
            average: 60.0,
            minimum: 58.0,
            maximum: 62.0,
            consistency: 0.95,
            ...overrides.frameRate
        },
        memory: {
            heapUsed: 25000000,
            heapTotal: 50000000,
            external: 1000000,
            arrayBuffers: 500000,
            ...overrides.memory
        },
        timing: {
            physicsStep: 2.0,
            renderTime: 12.0,
            updateTime: 1.5,
            totalFrameTime: 16.0,
            ...overrides.timing
        }
    };
}

/**
 * Sets up a complete game environment for testing
 * @param {Object} options - Setup options
 * @returns {Object} Complete game environment mock
 */
export function setupGameEnvironment(options = {}) {
    const {
        includePhysics = true,
        includeRendering = true,
        includeAudio = true,
        itemCount = 10,
        initialKatamariSize = 1.0
    } = options;

    const environment = {
        gameState: createMockGameState('initial'),
        cleanup: []
    };

    if (includeRendering) {
        environment.rendering = createMockThreeJsSetup();
        environment.cleanup.push(() => {
            environment.rendering.renderer.dispose();
        });
    }

    if (includePhysics) {
        environment.physics = createMockPhysicsSetup();
        environment.cleanup.push(() => {
            environment.physics.world.bodies.length = 0;
        });
    }

    if (includeAudio) {
        environment.audio = createMockAudioSetup();
        environment.cleanup.push(() => {
            Object.values(environment.audio).forEach(synth => {
                if (synth.dispose) synth.dispose();
            });
        });
    }

    // Create mock items
    environment.items = Array.from({ length: itemCount }, (_, i) => ({
        id: i,
        position: { 
            x: (Math.random() - 0.5) * 20, 
            y: Math.random() * 5, 
            z: (Math.random() - 0.5) * 20 
        },
        size: Math.random() * 0.5 + 0.1,
        type: ['leaf', 'stick', 'rock'][Math.floor(Math.random() * 3)],
        collected: false,
        mesh: includeRendering ? createMockThreeJsSetup().scene.children[0] : null,
        body: includePhysics ? environment.physics.createBody({ mass: 0.1 }) : null
    }));

    // Create mock katamari
    environment.katamari = createMockKatamari({
        size: initialKatamariSize,
        position: { x: 0, y: 1, z: 0 }
    });

    // Cleanup function
    environment.dispose = () => {
        environment.cleanup.forEach(cleanupFn => cleanupFn());
        environment.cleanup.length = 0;
    };

    return environment;
}

/**
 * Simulates item collection for testing
 * @param {Object} environment - Game environment
 * @param {number} itemIndex - Index of item to collect
 * @returns {Object} Collection result
 */
export function simulateItemCollection(environment, itemIndex) {
    const item = environment.items[itemIndex];
    if (!item || item.collected) {
        return { success: false, reason: 'Item not available' };
    }

    // Mark item as collected
    item.collected = true;
    
    // Update katamari size
    const sizeIncrease = item.size * 0.1;
    environment.katamari.size += sizeIncrease;
    environment.katamari.collectedItems++;

    // Update game state
    environment.gameState.katamari.size = environment.katamari.size;
    environment.gameState.katamari.collectedItems = environment.katamari.collectedItems;

    return {
        success: true,
        item,
        sizeIncrease,
        newKatamariSize: environment.katamari.size
    };
}

/**
 * Simulates level progression for testing
 * @param {Object} environment - Game environment
 * @returns {Object} Level progression result
 */
export function simulateLevelProgression(environment) {
    const currentLevel = environment.gameState.level.currentLevel;
    const targetSize = environment.gameState.level.targetSize;
    const katamariSize = environment.gameState.katamari.size;

    if (katamariSize >= targetSize) {
        // Level completed
        environment.gameState.level.currentLevel++;
        environment.gameState.level.targetSize *= 2; // Double target for next level
        
        // Change theme
        const themes = ['earth', 'urban', 'space'];
        const currentThemeIndex = themes.indexOf(environment.gameState.level.theme);
        const nextThemeIndex = (currentThemeIndex + 1) % themes.length;
        environment.gameState.level.theme = themes[nextThemeIndex];

        return {
            levelCompleted: true,
            previousLevel: currentLevel,
            newLevel: environment.gameState.level.currentLevel,
            newTheme: environment.gameState.level.theme,
            newTargetSize: environment.gameState.level.targetSize
        };
    }

    return {
        levelCompleted: false,
        progress: katamariSize / targetSize,
        remainingSize: targetSize - katamariSize
    };
}

/**
 * Creates a test scenario with specific conditions
 * @param {string} scenarioType - Type of scenario to create
 * @param {Object} options - Scenario options
 * @returns {Object} Test scenario setup
 */
export function createTestScenario(scenarioType, options = {}) {
    switch (scenarioType) {
        case 'empty-world':
            return setupGameEnvironment({
                itemCount: 0,
                ...options
            });

        case 'crowded-world':
            return setupGameEnvironment({
                itemCount: 100,
                ...options
            });

        case 'large-katamari':
            return setupGameEnvironment({
                initialKatamariSize: 10.0,
                ...options
            });

        case 'performance-stress':
            return setupGameEnvironment({
                itemCount: 500,
                includePhysics: true,
                includeRendering: true,
                includeAudio: true,
                ...options
            });

        case 'minimal-setup':
            return setupGameEnvironment({
                includePhysics: false,
                includeRendering: false,
                includeAudio: false,
                itemCount: 0,
                ...options
            });

        default:
            return setupGameEnvironment(options);
    }
}

/**
 * Validates game state consistency
 * @param {Object} gameState - Game state to validate
 * @returns {Object} Validation result
 */
export function validateGameState(gameState) {
    const errors = [];
    const warnings = [];

    // Check required properties
    if (!gameState.scene) errors.push('Missing scene state');
    if (!gameState.physics) errors.push('Missing physics state');
    if (!gameState.katamari) errors.push('Missing katamari state');
    if (!gameState.level) errors.push('Missing level state');

    // Check katamari consistency
    if (gameState.katamari) {
        if (gameState.katamari.size <= 0) {
            errors.push('Katamari size must be positive');
        }
        if (gameState.katamari.collectedItems < 0) {
            errors.push('Collected items count cannot be negative');
        }
    }

    // Check level consistency
    if (gameState.level) {
        if (gameState.level.currentLevel < 1) {
            errors.push('Level must be at least 1');
        }
        if (gameState.level.targetSize <= 0) {
            errors.push('Target size must be positive');
        }
        if (gameState.katamari && gameState.katamari.size > gameState.level.targetSize) {
            warnings.push('Katamari size exceeds target - level should progress');
        }
    }

    // Check physics consistency
    if (gameState.physics) {
        if (gameState.physics.bodyCount < 0) {
            errors.push('Body count cannot be negative');
        }
        if (gameState.physics.activeCollisions < 0) {
            errors.push('Active collisions cannot be negative');
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}