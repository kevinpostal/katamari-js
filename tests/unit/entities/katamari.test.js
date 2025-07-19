/**
 * Unit tests for Katamari entity class
 * Tests katamari creation, initialization, disposal, movement handling,
 * size updates, collision detection, and position management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Katamari } from '../../../src/game/entities/katamari.js';

// Mock the dependencies
vi.mock('three', () => import('../../__mocks__/three.js'));
vi.mock('cannon-es', () => import('../../__mocks__/cannon-es.js'));

// Mock the physics module
vi.mock('../../../src/game/core/physics.js', () => ({
    createKatamariBody: vi.fn(() => {
        const body = {
            position: { x: 0, y: 2, z: 0 },
            velocity: { 
                x: 0, y: 0, z: 0,
                length: vi.fn(() => 0),
                scale: vi.fn()
            },
            angularVelocity: { 
                x: 0, y: 0, z: 0,
                length: vi.fn(() => 0),
                scale: vi.fn()
            },
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            applyTorque: vi.fn(),
            applyImpulse: vi.fn(),
            mass: 1
        };
        
        // Make damping properties writable
        Object.defineProperty(body, 'linearDamping', {
            value: 0.05,
            writable: true,
            configurable: true
        });
        
        Object.defineProperty(body, 'angularDamping', {
            value: 0.1,
            writable: true,
            configurable: true
        });
        
        return body;
    }),
    updateKatamariPhysics: vi.fn(),
    removePhysicsBody: vi.fn(),
    addPhysicsBody: vi.fn()
}));

// Mock the debug module
vi.mock('../../../src/game/utils/debug.js', () => ({
    debugInfo: vi.fn(),
    debugWarn: vi.fn(),
    debugError: vi.fn(),
    debugLog: vi.fn()
}));

// Mock the constants module
vi.mock('../../../src/game/utils/constants.js', () => ({
    VISUAL: {
        KATAMARI_GEOMETRY_SEGMENTS: 32,
        KATAMARI_MATERIAL_ROUGHNESS: 0.6,
        KATAMARI_MATERIAL_METALNESS: 0.1
    },
    KATAMARI: {
        INITIAL_RADIUS: 2,
        BASE_SUCK_RANGE_FACTOR: 1.5,
        GROWTH_RATE: 0.1,
        VOLUME_CONTRIBUTION_FACTOR: 0.3,
        DIFFICULTY_SCALE_FACTOR: 0.02,
        SIZE_RATIO_MULTIPLIER: 2.0,
        MIN_DIFFICULTY_SCALE: 0.1
    },
    COLLECTION: {
        BASE_THRESHOLD: 0.9,
        PROGRESSIVE_SCALING: 0.02,
        MAX_THRESHOLD: 1.3,
        ATTRACTION_FORCE: 0.08,
        MIN_ATTRACTION_RANGE_FACTOR: 1.2,
        MAX_ATTRACTION_RANGE_FACTOR: 3.0,
        ATTRACTION_RANGE_GROWTH_RATE: 0.1,
        VOLUME_CONTRIBUTION_FACTOR: 0.8,
        GROWTH_RATE_REDUCTION: 0.3,
        DIFFICULTY_SCALE_RATE: 0.02,
        SIZE_RATIO_MULTIPLIER: 2.0,
        COMPRESSION_RATE: 0.008,
        MIN_COMPRESSION_SCALE: 0.6,
        ATTACHMENT_SCALE: 0.85,
        SURFACE_DISTANCE_FACTOR: 0.15,
        ORBITAL_SPEED_RANGE: [0.2, 0.7]
    },
    MOVEMENT: {
        BASE_ACCELERATION: 80,
        MAX_ACCELERATION: 200,
        ACCELERATION_RADIUS_MULTIPLIER: 2,
        ACTIVE_LINEAR_DAMPING: 0.05,
        ACTIVE_ANGULAR_DAMPING: 0.05,
        IDLE_LINEAR_DAMPING: 0.9,
        IDLE_ANGULAR_DAMPING: 0.9,
        GYRO_SENSITIVITY: 0.8,
        GYRO_THRESHOLD: 0.1,
        TORQUE_MULTIPLIER: 0.5
    }
}));

describe('Katamari Entity', () => {
    let mockScene;
    let mockWorld;
    let katamari;

    beforeEach(() => {
        // Create mock scene
        mockScene = {
            add: vi.fn(),
            remove: vi.fn(),
            children: []
        };

        // Create mock world
        mockWorld = {
            addBody: vi.fn(),
            removeBody: vi.fn(),
            bodies: []
        };

        // Create katamari instance
        katamari = new Katamari(mockScene, mockWorld);
    });

    afterEach(() => {
        if (katamari) {
            katamari.dispose();
        }
        vi.clearAllMocks();
    });

    describe('Creation and Initialization', () => {
        it('should create katamari with correct initial properties', () => {
            expect(katamari.scene).toBe(mockScene);
            expect(katamari.world).toBe(mockWorld);
            expect(katamari.radius).toBe(2.0);
            expect(katamari.targetRadius).toBe(2.0);
            expect(katamari.itemsCollectedCount).toBe(0);
            expect(katamari.isMovingInput).toBe(false);
            expect(katamari.currentAcceleration).toBe(0);
        });

        it('should initialize visual representation', () => {
            expect(katamari.group).toBeDefined();
            expect(katamari.coreBall).toBeDefined();
            expect(mockScene.add).toHaveBeenCalledWith(katamari.group);
        });

        it('should initialize physics body', () => {
            expect(katamari.body).toBeDefined();
            expect(katamari.body.addEventListener).toHaveBeenCalledWith('collide', expect.any(Function));
        });

        it('should set correct initial position', () => {
            expect(katamari.group.position.y).toBe(katamari.radius);
        });
    });

    describe('Movement Handling', () => {
        let mockCamera;
        let mockMovementInput;

        beforeEach(() => {
            mockCamera = {
                getWorldDirection: vi.fn(() => ({ x: 0, y: 0, z: -1, normalize: vi.fn() }))
            };

            mockMovementInput = {
                keys: {},
                touchInput: { active: false },
                gyro: {}
            };
        });

        it('should handle keyboard input correctly', () => {
            mockMovementInput.keys = { 'w': true };
            
            katamari.handleMovement(mockMovementInput, mockCamera, false);
            
            expect(katamari.isMovingInput).toBe(true);
            expect(katamari.body.applyTorque).toHaveBeenCalled();
        });

        it('should handle multiple key combinations', () => {
            mockMovementInput.keys = { 'w': true, 'd': true };
            
            katamari.handleMovement(mockMovementInput, mockCamera, false);
            
            expect(katamari.isMovingInput).toBe(true);
            expect(katamari.body.applyTorque).toHaveBeenCalled();
        });

        it('should handle touch input when active', () => {
            mockMovementInput.touchInput = {
                active: true,
                startX: 100,
                startY: 100,
                currentX: 150,
                currentY: 120
            };
            
            katamari.handleMovement(mockMovementInput, mockCamera, false);
            
            expect(katamari.isMovingInput).toBe(true);
            expect(katamari.body.applyTorque).toHaveBeenCalled();
        });

        it('should handle gyroscope input when enabled', () => {
            mockMovementInput.gyro = {
                normalizedGamma: 0.5,
                normalizedBeta: 0.3
            };
            
            katamari.handleMovement(mockMovementInput, mockCamera, true);
            
            expect(katamari.isMovingInput).toBe(true);
            expect(katamari.body.applyTorque).toHaveBeenCalled();
        });

        it('should not move when no input is provided', () => {
            katamari.handleMovement(mockMovementInput, mockCamera, false);
            
            expect(katamari.isMovingInput).toBe(false);
            expect(katamari.body.linearDamping).toBe(0.9);
            expect(katamari.body.angularDamping).toBe(0.9);
        });

        it('should adjust damping when moving', () => {
            mockMovementInput.keys = { 'w': true };
            
            katamari.handleMovement(mockMovementInput, mockCamera, false);
            
            expect(katamari.body.linearDamping).toBe(0.05);
            expect(katamari.body.angularDamping).toBe(0.05);
        });
    });

    describe('Size Updates and Growth', () => {
        it('should collect items and increase target size', () => {
            const initialRadius = katamari.radius;
            const itemSize = 1.0;
            
            katamari.collectItem(itemSize);
            
            expect(katamari.targetRadius).toBeGreaterThan(initialRadius);
            expect(katamari.itemsCollectedCount).toBe(1);
        });

        it('should calculate new radius based on volume with authentic growth formula', () => {
            const initialRadius = 2.0;
            const itemSize = 1.0;
            const volumeContributionFactor = 0.8;
            
            katamari.collectItem(itemSize, volumeContributionFactor);
            
            // Calculate expected radius using the new authentic formula
            const itemVolume = Math.pow(itemSize, 3);
            const katamariVolume = Math.pow(initialRadius, 3);
            const difficultyScale = Math.max(0.1, 1.0 - (initialRadius * 0.02));
            const sizeRatio = itemSize / initialRadius;
            const contributionMultiplier = Math.min(1.0, sizeRatio * 2.0);
            const volumeContribution = itemVolume * volumeContributionFactor * difficultyScale * contributionMultiplier * 0.3;
            const expectedNewVolume = katamariVolume + volumeContribution;
            const expectedNewRadius = Math.cbrt(expectedNewVolume);
            
            expect(katamari.targetRadius).toBeCloseTo(expectedNewRadius, 2);
        });

        it('should animate size growth smoothly', () => {
            katamari.targetRadius = 3.0;
            const initialRadius = katamari.radius;
            
            katamari.update(100); // mapBoundary = 100
            
            expect(katamari.radius).toBeGreaterThan(initialRadius);
            expect(katamari.radius).toBeLessThanOrEqual(katamari.targetRadius);
        });

        it('should snap to target radius when very close', () => {
            katamari.targetRadius = katamari.radius + 0.005; // Very small difference
            
            katamari.update(100);
            
            expect(katamari.radius).toBe(katamari.targetRadius);
        });
    });

    describe('Collision Detection', () => {
        let mockCollisionEvent;
        let mockOtherBody;
        let mockItemMesh;

        beforeEach(() => {
            mockItemMesh = {
                userData: {
                    size: 1.0,
                    isCollectible: true,
                    isCollected: false
                },
                position: { 
                    x: 5, y: 2, z: 5, 
                    clone: vi.fn(() => ({ x: 5, y: 2, z: 5 })),
                    copy: vi.fn()
                },
                scale: { set: vi.fn() },
                rotation: { x: 0, y: 0, z: 0 }
            };

            mockOtherBody = {
                userData: {
                    threeMesh: mockItemMesh,
                    name: 'test-item',
                    isGround: false
                }
            };

            mockCollisionEvent = {
                contact: {},
                target: katamari.body,
                body: mockOtherBody
            };
        });

        it('should collect items when katamari is large enough', () => {
            katamari.radius = 2.0; // Large enough to collect 1.0 size item
            
            katamari.handleCollision(mockCollisionEvent);
            
            expect(mockItemMesh.userData.isCollected).toBe(true);
            expect(katamari.itemsCollectedCount).toBe(1);
        });

        it('should not collect items when katamari is too small', () => {
            katamari.radius = 0.4; // Too small to collect 1.0 size item (needs >= 0.5)
            
            katamari.handleCollision(mockCollisionEvent);
            
            expect(mockItemMesh.userData.isCollected).toBe(false);
            expect(katamari.body.applyImpulse).toHaveBeenCalled(); // Should bounce
        });

        it('should ignore collisions with ground', () => {
            mockOtherBody.userData.isGround = true;
            
            katamari.handleCollision(mockCollisionEvent);
            
            expect(mockItemMesh.userData.isCollected).toBe(false);
        });

        it('should ignore already collected items', () => {
            mockItemMesh.userData.isCollected = true;
            
            katamari.handleCollision(mockCollisionEvent);
            
            expect(katamari.itemsCollectedCount).toBe(0);
        });

        it('should ignore non-collectible items', () => {
            mockItemMesh.userData.isCollectible = false;
            
            katamari.handleCollision(mockCollisionEvent);
            
            expect(katamari.itemsCollectedCount).toBe(0);
        });
    });

    describe('Position Management', () => {
        it('should update visual position to match physics body', () => {
            katamari.body.position = { x: 10, y: 5, z: -3 };
            
            katamari.update(100);
            
            expect(katamari.group.position.copy).toHaveBeenCalledWith(katamari.body.position);
        });

        it('should clamp position within map boundaries', () => {
            const mapBoundary = 50;
            katamari.body.position = { x: 60, y: 5, z: -60 }; // Outside boundaries
            
            katamari.update(mapBoundary);
            
            expect(katamari.body.position.x).toBeLessThanOrEqual(mapBoundary - katamari.radius);
            expect(katamari.body.position.z).toBeGreaterThanOrEqual(-mapBoundary + katamari.radius);
        });

        it('should reset position correctly', () => {
            katamari.body.position = { x: 10, y: 5, z: 10, set: vi.fn() };
            katamari.body.velocity = { x: 5, y: 0, z: 5, set: vi.fn() };
            katamari.body.angularVelocity = { x: 1, y: 1, z: 1, set: vi.fn() };
            
            katamari.resetPosition();
            
            expect(katamari.body.position.set).toHaveBeenCalledWith(0, katamari.radius, 0);
            expect(katamari.body.velocity.set).toHaveBeenCalledWith(0, 0, 0);
            expect(katamari.body.angularVelocity.set).toHaveBeenCalledWith(0, 0, 0);
        });
    });

    describe('Item Attachment', () => {
        let mockItemMesh;
        let mockWorldPosition;

        beforeEach(() => {
            mockItemMesh = {
                userData: {
                    size: 1.0,
                    isInstanced: false
                },
                position: { 
                    copy: vi.fn(),
                    x: 0, y: 0, z: 0
                },
                scale: { set: vi.fn() },
                rotation: { x: 0, y: 0, z: 0 }
            };

            mockWorldPosition = { x: 5, y: 2, z: 5 };
        });

        it('should attach items to katamari group', () => {
            katamari.attachItem(mockItemMesh, mockWorldPosition);
            
            expect(katamari.group.add).toHaveBeenCalledWith(mockItemMesh);
            expect(mockItemMesh.userData.isAttachedToKatamari).toBe(true);
        });

        it('should set correct attachment properties', () => {
            katamari.attachItem(mockItemMesh, mockWorldPosition);
            
            expect(mockItemMesh.userData.initialLocalPosition).toBeDefined();
            expect(mockItemMesh.userData.rotationSpeed).toBeDefined();
            expect(mockItemMesh.userData.currentOrbitalAngle).toBe(0);
        });

        it('should apply compression scaling to attached items', () => {
            katamari.attachItem(mockItemMesh, mockWorldPosition);
            
            expect(mockItemMesh.scale.set).toHaveBeenCalled();
            const scaleCall = mockItemMesh.scale.set.mock.calls[0];
            expect(scaleCall[0]).toBeLessThan(1); // Should be compressed
        });
    });

    describe('Utility Methods', () => {
        it('should return correct velocity magnitude', () => {
            katamari.body.velocity = { length: vi.fn(() => 5.5) };
            
            const velocity = katamari.getVelocityMagnitude();
            
            expect(velocity).toBe(5.5);
        });

        it('should return correct position', () => {
            const mockPosition = { x: 1, y: 2, z: 3 };
            katamari.body.position = mockPosition;
            
            const position = katamari.getPosition();
            
            expect(position).toBe(mockPosition);
        });

        it('should return correct Three.js position', () => {
            const mockPosition = { x: 1, y: 2, z: 3 };
            katamari.group.position = mockPosition;
            
            const position = katamari.getThreePosition();
            
            expect(position).toBe(mockPosition);
        });

        it('should calculate collection threshold correctly with authentic PlayStation game logic', () => {
            katamari.radius = 2.0;
            
            // With actual formula: progressiveThreshold = min(1.3, 0.9 + (2.0 * 0.02)) = min(1.3, 0.94) = 0.94
            // So katamari needs to be >= itemSize * 0.94
            expect(katamari.canCollectItem(1.5)).toBe(true); // 2.0 >= 1.5 * 0.94 (1.41)
            expect(katamari.canCollectItem(2.2)).toBe(false); // 2.0 < 2.2 * 0.94 (2.068)
        });

        it('should calculate attraction range based on radius', () => {
            katamari.radius = 3.0;
            
            const attractionRange = katamari.getAttractionRange();
            
            expect(attractionRange).toBeGreaterThan(katamari.radius);
            expect(attractionRange).toBeLessThanOrEqual(katamari.radius * 3.0); // Max factor
        });
    });

    describe('Disposal', () => {
        it('should properly dispose of resources', () => {
            const mockGeometry = { dispose: vi.fn() };
            const mockMaterial = { dispose: vi.fn() };
            
            katamari.coreBall = {
                geometry: mockGeometry,
                material: mockMaterial
            };
            
            katamari.group.traverse = vi.fn((callback) => {
                callback({ geometry: mockGeometry, material: mockMaterial });
            });
            
            katamari.dispose();
            
            expect(mockScene.remove).toHaveBeenCalledWith(katamari.group);
            expect(mockGeometry.dispose).toHaveBeenCalled();
            expect(mockMaterial.dispose).toHaveBeenCalled();
        });

        it('should remove collision event listener', () => {
            katamari.dispose();
            
            expect(katamari.body.removeEventListener).toHaveBeenCalledWith('collide', katamari.collisionHandler);
        });

        it('should handle disposal when body is null', () => {
            katamari.body = null;
            
            expect(() => katamari.dispose()).not.toThrow();
        });
    });
});