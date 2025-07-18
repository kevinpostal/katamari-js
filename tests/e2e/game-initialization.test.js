/**
 * Snapshot tests for game initialization state
 * Tests game initialization state consistency and configuration snapshots
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMockGameState, setupGameEnvironment, validateGameState } from '../helpers/game-helpers.js';

describe('Game Initialization Snapshots', () => {
    let gameEnvironment;

    beforeEach(() => {
        // Create a clean game environment for each test
        gameEnvironment = setupGameEnvironment({
            includePhysics: true,
            includeRendering: true,
            includeAudio: true,
            itemCount: 0, // Start with empty world for initialization tests
            initialKatamariSize: 1.0
        });
    });

    afterEach(() => {
        if (gameEnvironment?.dispose) {
            gameEnvironment.dispose();
        }
    });

    describe('Initial Game State Snapshots', () => {
        it('should match initial game state snapshot', () => {
            const initialState = createMockGameState('initial');
            
            // Validate state consistency before snapshot
            const validation = validateGameState(initialState);
            expect(validation.valid).toBe(true);
            
            // Snapshot the initial state structure
            expect(initialState).toMatchSnapshot('initial-game-state');
        });

        it('should match initial scene configuration snapshot', () => {
            const sceneConfig = {
                initialized: false,
                objectCount: 0,
                lightingSetup: false,
                background: null,
                fog: null,
                children: [],
                lighting: {
                    ambient: {
                        color: 0x404040,
                        intensity: 0.4
                    },
                    directional: {
                        color: 0xffffff,
                        intensity: 1.0,
                        position: { x: 10, y: 10, z: 5 },
                        castShadow: true
                    },
                    hemisphere: {
                        skyColor: 0x87CEEB,
                        groundColor: 0x362d1d,
                        intensity: 0.6
                    }
                }
            };

            expect(sceneConfig).toMatchSnapshot('initial-scene-configuration');
        });

        it('should match initial physics world configuration snapshot', () => {
            const physicsConfig = {
                worldCreated: false,
                gravity: { x: 0, y: -9.82, z: 0 },
                broadphase: 'NaiveBroadphase',
                solver: {
                    iterations: 10,
                    tolerance: 0.0001
                },
                bodies: [],
                bodyCount: 0,
                activeCollisions: 0,
                contactMaterial: {
                    friction: 0.3,
                    restitution: 0.3,
                    contactEquationStiffness: 1e8,
                    contactEquationRelaxation: 3
                }
            };

            expect(physicsConfig).toMatchSnapshot('initial-physics-configuration');
        });

        it('should match initial katamari configuration snapshot', () => {
            const katamariConfig = {
                position: { x: 0, y: 0, z: 0 },
                size: 1.0,
                velocity: { x: 0, y: 0, z: 0 },
                collectedItems: 0,
                mass: 1.0,
                material: {
                    friction: 0.4,
                    restitution: 0.3
                },
                geometry: {
                    type: 'SphereGeometry',
                    radius: 1.0,
                    widthSegments: 32,
                    heightSegments: 16
                },
                visual: {
                    color: 0x00ff00,
                    metalness: 0.1,
                    roughness: 0.7,
                    castShadow: true,
                    receiveShadow: true
                }
            };

            expect(katamariConfig).toMatchSnapshot('initial-katamari-configuration');
        });

        it('should match initial audio system configuration snapshot', () => {
            const audioConfig = {
                context: {
                    state: 'suspended',
                    sampleRate: 44100,
                    destination: 'speakers'
                },
                synthesizers: {
                    membrane: {
                        type: 'MembraneSynth',
                        volume: -12,
                        envelope: {
                            attack: 0.001,
                            decay: 0.4,
                            sustain: 0.01,
                            release: 1.4
                        },
                        octaves: 10,
                        oscillator: {
                            type: 'sine'
                        }
                    },
                    noise: {
                        type: 'NoiseSynth',
                        volume: -20,
                        envelope: {
                            attack: 0.005,
                            decay: 0.1,
                            sustain: 0.0
                        },
                        noise: {
                            type: 'white'
                        }
                    },
                    basic: {
                        type: 'Synth',
                        volume: -15,
                        envelope: {
                            attack: 0.005,
                            decay: 0.1,
                            sustain: 0.3,
                            release: 1
                        },
                        oscillator: {
                            type: 'triangle'
                        }
                    }
                },
                effects: {
                    reverb: {
                        roomSize: 0.7,
                        dampening: 3000
                    },
                    filter: {
                        frequency: 350,
                        type: 'lowpass'
                    }
                }
            };

            expect(audioConfig).toMatchSnapshot('initial-audio-configuration');
        });
    });

    describe('Default Game Settings Snapshots', () => {
        it('should match default game constants snapshot', () => {
            const gameConstants = {
                PHYSICS: {
                    GRAVITY: -9.82,
                    TIMESTEP: 1/60,
                    MAX_SUBSTEPS: 3,
                    KATAMARI_FRICTION: 0.4,
                    KATAMARI_RESTITUTION: 0.3,
                    ITEM_FRICTION: 0.3,
                    ITEM_RESTITUTION: 0.3
                },
                RENDERING: {
                    FOV: 75,
                    NEAR_PLANE: 0.1,
                    FAR_PLANE: 1000,
                    SHADOW_MAP_SIZE: 2048,
                    MAX_INSTANCES: 1000,
                    FRUSTUM_CULLING: true
                },
                GAMEPLAY: {
                    INITIAL_KATAMARI_SIZE: 1.0,
                    SIZE_GROWTH_FACTOR: 0.1,
                    COLLECTION_THRESHOLD: 0.8,
                    LEVEL_PROGRESSION_MULTIPLIER: 2.0,
                    MAX_ITEMS_PER_LEVEL: 500
                },
                CONTROLS: {
                    KEYBOARD_SENSITIVITY: 1.0,
                    TOUCH_SENSITIVITY: 0.8,
                    GYRO_SENSITIVITY: 0.5,
                    MOVEMENT_DAMPING: 0.9
                },
                AUDIO: {
                    MASTER_VOLUME: 0.7,
                    SFX_VOLUME: 0.8,
                    AMBIENT_VOLUME: 0.5,
                    COLLECTION_SOUND_VARIATION: 0.3
                }
            };

            expect(gameConstants).toMatchSnapshot('default-game-constants');
        });

        it('should match default level configuration snapshot', () => {
            const levelConfig = {
                currentLevel: 1,
                theme: 'earth',
                targetSize: 10.0,
                itemsGenerated: 0,
                themes: {
                    earth: {
                        name: 'Earth',
                        backgroundColor: 0x87CEEB,
                        fogColor: 0x87CEEB,
                        fogNear: 50,
                        fogFar: 200,
                        items: ['leaf', 'stick', 'rock', 'flower', 'mushroom'],
                        itemSizes: [0.1, 0.2, 0.3, 0.15, 0.25],
                        itemColors: [0x228B22, 0x8B4513, 0x696969, 0xFF69B4, 0xDEB887],
                        spawnRadius: 50,
                        itemDensity: 0.8
                    },
                    urban: {
                        name: 'Urban',
                        backgroundColor: 0x708090,
                        fogColor: 0x708090,
                        fogNear: 30,
                        fogFar: 150,
                        items: ['coin', 'paperclip', 'pen', 'book', 'chair'],
                        itemSizes: [0.05, 0.08, 0.12, 0.4, 0.8],
                        itemColors: [0xFFD700, 0xC0C0C0, 0x000080, 0x8B4513, 0x654321],
                        spawnRadius: 40,
                        itemDensity: 1.0
                    },
                    space: {
                        name: 'Space',
                        backgroundColor: 0x000011,
                        fogColor: 0x000011,
                        fogNear: 100,
                        fogFar: 500,
                        items: ['asteroid', 'satellite', 'planet', 'star', 'galaxy'],
                        itemSizes: [0.5, 1.0, 5.0, 0.3, 20.0],
                        itemColors: [0x696969, 0xC0C0C0, 0x4169E1, 0xFFFF00, 0x9370DB],
                        spawnRadius: 100,
                        itemDensity: 0.5
                    }
                },
                progression: {
                    sizeMultipliers: [1, 2.5, 6.25, 15.625, 39.0625],
                    levelThresholds: [10, 25, 62.5, 156.25, 390.625],
                    itemCountMultipliers: [1, 1.5, 2.25, 3.375, 5.0625]
                }
            };

            expect(levelConfig).toMatchSnapshot('default-level-configuration');
        });

        it('should match default input configuration snapshot', () => {
            const inputConfig = {
                keyboard: {
                    enabled: true,
                    keys: {
                        forward: ['KeyW', 'ArrowUp'],
                        backward: ['KeyS', 'ArrowDown'],
                        left: ['KeyA', 'ArrowLeft'],
                        right: ['KeyD', 'ArrowRight'],
                        debug: ['KeyF1'],
                        pause: ['Space', 'Escape']
                    },
                    sensitivity: 1.0,
                    deadzone: 0.1
                },
                touch: {
                    enabled: true,
                    sensitivity: 0.8,
                    deadzone: 0.15,
                    maxDistance: 100,
                    visualFeedback: true
                },
                gyroscope: {
                    enabled: false,
                    sensitivity: 0.5,
                    deadzone: 0.2,
                    calibration: { x: 0, y: 0, z: 0 },
                    smoothing: 0.8
                },
                gamepad: {
                    enabled: true,
                    deadzone: 0.2,
                    sensitivity: 1.0,
                    buttonMapping: {
                        pause: 9, // Start button
                        debug: 8  // Select button
                    }
                }
            };

            expect(inputConfig).toMatchSnapshot('default-input-configuration');
        });
    });

    describe('Game Environment Initialization Snapshots', () => {
        it('should match complete game environment initialization snapshot', () => {
            const environmentSnapshot = {
                scene: {
                    type: 'Scene',
                    children: [],
                    background: null,
                    fog: null,
                    overrideMaterial: null,
                    autoUpdate: true
                },
                camera: {
                    type: 'PerspectiveCamera',
                    fov: 75,
                    aspect: window.innerWidth / window.innerHeight || 1,
                    near: 0.1,
                    far: 1000,
                    position: { x: 0, y: 5, z: 10 },
                    target: { x: 0, y: 0, z: 0 }
                },
                renderer: {
                    type: 'WebGLRenderer',
                    antialias: true,
                    shadowMap: {
                        enabled: true,
                        type: 'PCFSoftShadowMap'
                    },
                    outputEncoding: 'sRGBEncoding',
                    toneMapping: 'ACESFilmicToneMapping',
                    toneMappingExposure: 1.0
                },
                physics: {
                    world: {
                        gravity: { x: 0, y: -9.82, z: 0 },
                        broadphase: 'NaiveBroadphase',
                        solver: {
                            iterations: 10,
                            tolerance: 0.0001
                        }
                    },
                    materials: {
                        katamari: {
                            friction: 0.4,
                            restitution: 0.3
                        },
                        item: {
                            friction: 0.3,
                            restitution: 0.3
                        },
                        ground: {
                            friction: 0.8,
                            restitution: 0.1
                        }
                    }
                },
                audio: {
                    initialized: false,
                    context: null,
                    synthesizers: {},
                    effects: {}
                },
                gameState: gameEnvironment.gameState
            };

            expect(environmentSnapshot).toMatchSnapshot('complete-game-environment-initialization');
        });

        it('should match performance monitoring initialization snapshot', () => {
            const performanceConfig = {
                monitoring: {
                    enabled: true,
                    sampleRate: 60, // samples per second
                    historyLength: 300, // 5 seconds at 60fps
                    thresholds: {
                        frameRate: {
                            minimum: 55,
                            target: 60,
                            warning: 50,
                            critical: 30
                        },
                        memory: {
                            heapWarning: 100 * 1024 * 1024, // 100MB
                            heapCritical: 200 * 1024 * 1024, // 200MB
                            leakDetection: true
                        },
                        physics: {
                            stepTimeWarning: 5.0, // milliseconds
                            stepTimeCritical: 10.0
                        },
                        rendering: {
                            drawCallWarning: 1000,
                            drawCallCritical: 2000,
                            triangleWarning: 100000,
                            triangleCritical: 500000
                        }
                    }
                },
                metrics: {
                    frameRate: {
                        current: 0,
                        average: 0,
                        minimum: Infinity,
                        maximum: 0,
                        history: []
                    },
                    memory: {
                        heapUsed: 0,
                        heapTotal: 0,
                        external: 0,
                        arrayBuffers: 0,
                        history: []
                    },
                    timing: {
                        physicsStep: 0,
                        renderTime: 0,
                        updateTime: 0,
                        totalFrameTime: 0,
                        history: []
                    }
                }
            };

            expect(performanceConfig).toMatchSnapshot('performance-monitoring-initialization');
        });
    });
});