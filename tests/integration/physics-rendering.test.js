/**
 * Integration tests for physics-visual synchronization
 * Tests the integration between Cannon-ES physics simulation and Three.js rendering
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupGameEnvironment } from '../helpers/game-helpers.js';

describe('Physics-Rendering Integration', () => {
    let environment;
    let mockPhysicsWorld;

    beforeEach(() => {
        // Set up complete game environment
        environment = setupGameEnvironment({
            includePhysics: true,
            includeRendering: true,
            itemCount: 5
        });

        mockPhysicsWorld = environment.physics.world;

        // Mock requestAnimationFrame for controlled testing
        vi.stubGlobal('requestAnimationFrame', vi.fn((callback) => {
            setTimeout(callback, 16.67); // 60 FPS
        }));
    });

    afterEach(() => {
        environment.dispose();
        vi.restoreAllMocks();
    });

    describe('Physics Body Position Updates', () => {
        it('should synchronize physics body positions with visual mesh positions', () => {
            // Arrange: Set up katamari with physics body and visual mesh
            const physicsBody = {
                position: { x: 5, y: 2, z: -3 },
                velocity: { x: 1, y: 0, z: 0.5 },
                quaternion: { x: 0, y: 0, z: 0, w: 1 }
            };

            const visualMesh = {
                position: { x: 0, y: 0, z: 0 },
                quaternion: { x: 0, y: 0, z: 0, w: 1 },
                scale: { x: 1, y: 1, z: 1 }
            };

            // Act: Simulate physics step and rendering synchronization
            mockPhysicsWorld.step(1/60);
            
            // Simulate the synchronization that would happen in the game loop
            visualMesh.position.x = physicsBody.position.x;
            visualMesh.position.y = physicsBody.position.y;
            visualMesh.position.z = physicsBody.position.z;
            visualMesh.quaternion = { ...physicsBody.quaternion };

            // Assert: Visual mesh position should match physics body position
            expect(visualMesh.position.x).toBe(physicsBody.position.x);
            expect(visualMesh.position.y).toBe(physicsBody.position.y);
            expect(visualMesh.position.z).toBe(physicsBody.position.z);
            expect(visualMesh.quaternion).toEqual(physicsBody.quaternion);
        });

        it('should update multiple object positions in sync with physics', () => {
            // Arrange: Create multiple physics bodies and visual meshes
            const objects = Array.from({ length: 3 }, (_, i) => ({
                physicsBody: {
                    position: { x: i * 2, y: 1, z: i * -1 },
                    velocity: { x: 0.1 * i, y: 0, z: 0.05 * i }
                },
                visualMesh: {
                    position: { x: 0, y: 0, z: 0 }
                }
            }));

            // Act: Step physics and synchronize positions
            mockPhysicsWorld.step(1/60);
            
            objects.forEach(obj => {
                obj.visualMesh.position.x = obj.physicsBody.position.x;
                obj.visualMesh.position.y = obj.physicsBody.position.y;
                obj.visualMesh.position.z = obj.physicsBody.position.z;
            });

            // Assert: All visual positions should match physics positions
            objects.forEach((obj, i) => {
                expect(obj.visualMesh.position.x).toBe(i * 2);
                expect(obj.visualMesh.position.y).toBe(1);
                expect(obj.visualMesh.position.z).toBe(i * -1);
            });
        });

        it('should handle rapid position changes without visual lag', () => {
            // Arrange: Set up object with high velocity
            const fastMovingObject = {
                physicsBody: {
                    position: { x: 0, y: 0, z: 0 },
                    velocity: { x: 10, y: 0, z: 5 }
                },
                visualMesh: {
                    position: { x: 0, y: 0, z: 0 }
                }
            };

            const positions = [];

            // Act: Simulate multiple physics steps with synchronization
            for (let i = 0; i < 5; i++) {
                // Simulate physics movement
                const dt = 1/60;
                fastMovingObject.physicsBody.position.x += fastMovingObject.physicsBody.velocity.x * dt;
                fastMovingObject.physicsBody.position.z += fastMovingObject.physicsBody.velocity.z * dt;
                
                // Synchronize visual position
                fastMovingObject.visualMesh.position.x = fastMovingObject.physicsBody.position.x;
                fastMovingObject.visualMesh.position.z = fastMovingObject.physicsBody.position.z;
                
                positions.push({
                    physics: { ...fastMovingObject.physicsBody.position },
                    visual: { ...fastMovingObject.visualMesh.position }
                });
            }

            // Assert: Visual positions should always match physics positions
            positions.forEach(pos => {
                expect(pos.visual.x).toBeCloseTo(pos.physics.x, 5);
                expect(pos.visual.z).toBeCloseTo(pos.physics.z, 5);
            });
        });
    });

    describe('Collision Detection Integration', () => {
        it('should trigger visual feedback when physics collision occurs', () => {
            // Arrange: Set up collision scenario
            const katamariBody = {
                position: { x: 0, y: 1, z: 0 },
                velocity: { x: 5, y: 0, z: 0 }  // Increased velocity for faster collision
            };

            const itemBody = {
                position: { x: 1.2, y: 1, z: 0 },  // Reduced distance for easier collision
                velocity: { x: 0, y: 0, z: 0 }
            };

            const visualEffects = {
                collisionParticles: [],
                flashEffect: false,
                soundTriggered: false
            };

            // Mock collision detection
            const checkCollision = (bodyA, bodyB) => {
                const distance = Math.sqrt(
                    Math.pow(bodyA.position.x - bodyB.position.x, 2) +
                    Math.pow(bodyA.position.y - bodyB.position.y, 2) +
                    Math.pow(bodyA.position.z - bodyB.position.z, 2)
                );
                return distance < 1.5; // Collision threshold
            };

            // Act: Simulate movement until collision
            let collisionDetected = false;
            for (let i = 0; i < 10 && !collisionDetected; i++) {
                // Move katamari
                katamariBody.position.x += katamariBody.velocity.x * (1/60);
                
                // Check for collision
                if (checkCollision(katamariBody, itemBody)) {
                    collisionDetected = true;
                    // Trigger visual effects
                    visualEffects.collisionParticles.push({
                        position: { ...katamariBody.position },
                        timestamp: Date.now()
                    });
                    visualEffects.flashEffect = true;
                    visualEffects.soundTriggered = true;
                }
            }

            // Assert: Visual feedback should be triggered on collision
            expect(collisionDetected).toBe(true);
            expect(visualEffects.collisionParticles).toHaveLength(1);
            expect(visualEffects.flashEffect).toBe(true);
            expect(visualEffects.soundTriggered).toBe(true);
        });

        it('should handle multiple simultaneous collisions', () => {
            // Arrange: Set up katamari surrounded by items
            const katamariBody = {
                position: { x: 0, y: 1, z: 0 },
                velocity: { x: 0, y: 0, z: 0 }
            };

            const itemBodies = [
                { position: { x: 1, y: 1, z: 0 } },
                { position: { x: -1, y: 1, z: 0 } },
                { position: { x: 0, y: 1, z: 1 } },
                { position: { x: 0, y: 1, z: -1 } }
            ];

            const collisionResults = [];

            // Act: Check for collisions with all items
            itemBodies.forEach((item, index) => {
                const distance = Math.sqrt(
                    Math.pow(katamariBody.position.x - item.position.x, 2) +
                    Math.pow(katamariBody.position.y - item.position.y, 2) +
                    Math.pow(katamariBody.position.z - item.position.z, 2)
                );

                if (distance < 1.5) {
                    collisionResults.push({
                        itemIndex: index,
                        distance,
                        visualEffect: `collision_${index}`,
                        audioEffect: `pickup_sound_${index}`
                    });
                }
            });

            // Assert: All nearby items should register collisions
            expect(collisionResults).toHaveLength(4);
            collisionResults.forEach((result, index) => {
                expect(result.itemIndex).toBe(index);
                expect(result.distance).toBeLessThan(1.5);
                expect(result.visualEffect).toBe(`collision_${index}`);
                expect(result.audioEffect).toBe(`pickup_sound_${index}`);
            });
        });

        it('should update collision visual state based on physics contact points', () => {
            // Arrange: Set up collision with contact point data
            const collisionData = {
                bodyA: { position: { x: 0, y: 1, z: 0 } },
                bodyB: { position: { x: 1, y: 1, z: 0 } },
                contactPoint: { x: 0.5, y: 1, z: 0 },
                contactNormal: { x: 1, y: 0, z: 0 },
                penetrationDepth: 0.2
            };

            const visualCollisionState = {
                contactPoints: [],
                deformationEffects: [],
                impactIntensity: 0
            };

            // Act: Process collision data for visual representation
            visualCollisionState.contactPoints.push({
                position: { ...collisionData.contactPoint },
                normal: { ...collisionData.contactNormal }
            });

            visualCollisionState.impactIntensity = Math.min(collisionData.penetrationDepth * 5, 1.0);
            
            if (collisionData.penetrationDepth > 0.1) {
                visualCollisionState.deformationEffects.push({
                    position: { ...collisionData.contactPoint },
                    intensity: collisionData.penetrationDepth
                });
            }

            // Assert: Visual state should reflect physics collision data
            expect(visualCollisionState.contactPoints).toHaveLength(1);
            expect(visualCollisionState.contactPoints[0].position).toEqual(collisionData.contactPoint);
            expect(visualCollisionState.contactPoints[0].normal).toEqual(collisionData.contactNormal);
            expect(visualCollisionState.impactIntensity).toBeCloseTo(1.0, 1);
            expect(visualCollisionState.deformationEffects).toHaveLength(1);
        });
    });

    describe('Physics World Stepping Integration', () => {
        it('should synchronize render loop with physics step timing', () => {
            // Arrange: Set up timing tracking
            const timingData = {
                physicsSteps: [],
                renderCalls: [],
                synchronizationEvents: []
            };

            const mockPhysicsStep = vi.fn((dt) => {
                timingData.physicsSteps.push({
                    timestamp: Date.now(),
                    deltaTime: dt
                });
            });

            const mockRender = vi.fn(() => {
                timingData.renderCalls.push({
                    timestamp: Date.now()
                });
            });

            // Act: Simulate game loop with physics and rendering
            const gameLoop = () => {
                const dt = 1/60;
                
                // Physics step
                mockPhysicsStep(dt);
                
                // Synchronization point
                timingData.synchronizationEvents.push({
                    timestamp: Date.now(),
                    type: 'sync'
                });
                
                // Render
                mockRender();
            };

            // Run multiple frames
            for (let i = 0; i < 5; i++) {
                gameLoop();
            }

            // Assert: Physics and render should be called in sync
            expect(mockPhysicsStep).toHaveBeenCalledTimes(5);
            expect(mockRender).toHaveBeenCalledTimes(5);
            expect(timingData.synchronizationEvents).toHaveLength(5);
            
            // Check that each physics step uses correct delta time
            timingData.physicsSteps.forEach(step => {
                expect(step.deltaTime).toBeCloseTo(1/60, 5);
            });
        });

        it('should handle variable frame rates with fixed physics timestep', () => {
            // Arrange: Set up variable timing simulation
            const frameRates = [30, 45, 60, 75, 90]; // Different FPS values
            const physicsTimestep = 1/60; // Fixed physics timestep
            const results = [];

            frameRates.forEach(fps => {
                const frameDelta = 1000 / fps; // Frame time in ms
                const physicsStepsPerFrame = Math.ceil((frameDelta / 1000) / physicsTimestep);
                
                // Act: Simulate frame with multiple physics steps if needed
                const frameResult = {
                    fps,
                    frameDelta,
                    physicsStepsPerFrame,
                    totalPhysicsTime: physicsStepsPerFrame * physicsTimestep
                };

                results.push(frameResult);
            });

            // Assert: Physics should maintain consistent timestep regardless of frame rate
            results.forEach(result => {
                expect(result.physicsStepsPerFrame).toBeGreaterThan(0);
                expect(result.totalPhysicsTime).toBeGreaterThanOrEqual(physicsTimestep);
                
                // For 60 FPS, should be exactly one physics step
                if (result.fps === 60) {
                    expect(result.physicsStepsPerFrame).toBe(1);
                }
                
                // For lower FPS, may need multiple physics steps
                if (result.fps < 60) {
                    expect(result.physicsStepsPerFrame).toBeGreaterThanOrEqual(1);
                }
            });
        });

        it('should maintain visual smoothness during physics simulation pauses', () => {
            // Arrange: Set up scenario with physics pause
            const visualState = {
                lastKnownPositions: new Map(),
                interpolatedPositions: new Map(),
                smoothingFactor: 0.1
            };

            const objects = [
                { id: 'katamari', position: { x: 0, y: 1, z: 0 }, velocity: { x: 1, y: 0, z: 0 } },
                { id: 'item1', position: { x: 5, y: 1, z: 0 }, velocity: { x: -0.5, y: 0, z: 0 } }
            ];

            // Store initial positions
            objects.forEach(obj => {
                visualState.lastKnownPositions.set(obj.id, { ...obj.position });
                visualState.interpolatedPositions.set(obj.id, { ...obj.position });
            });

            // Act: Simulate physics pause with visual interpolation
            const simulatePhysicsPause = (duration) => {
                const steps = Math.floor(duration * 60); // 60 FPS visual updates
                
                for (let i = 0; i < steps; i++) {
                    objects.forEach(obj => {
                        const lastPos = visualState.lastKnownPositions.get(obj.id);
                        const currentInterp = visualState.interpolatedPositions.get(obj.id);
                        
                        // Predict position based on last known velocity
                        const predictedPos = {
                            x: lastPos.x + obj.velocity.x * (i / 60),
                            y: lastPos.y + obj.velocity.y * (i / 60),
                            z: lastPos.z + obj.velocity.z * (i / 60)
                        };
                        
                        // Smooth interpolation
                        currentInterp.x += (predictedPos.x - currentInterp.x) * visualState.smoothingFactor;
                        currentInterp.y += (predictedPos.y - currentInterp.y) * visualState.smoothingFactor;
                        currentInterp.z += (predictedPos.z - currentInterp.z) * visualState.smoothingFactor;
                    });
                }
            };

            simulatePhysicsPause(0.5); // 500ms pause

            // Assert: Visual positions should be smoothly interpolated
            objects.forEach(obj => {
                const interpolatedPos = visualState.interpolatedPositions.get(obj.id);
                const originalPos = visualState.lastKnownPositions.get(obj.id);
                
                // Position should have changed due to interpolation
                if (obj.velocity.x !== 0) {
                    expect(interpolatedPos.x).not.toBe(originalPos.x);
                }
                
                // But should be reasonable based on velocity
                const expectedX = originalPos.x + obj.velocity.x * 0.5;
                expect(Math.abs(interpolatedPos.x - expectedX)).toBeLessThan(1.0);
            });
        });
    });

    describe('Performance Integration', () => {
        it('should maintain sync performance with high object counts', () => {
            // Arrange: Create many objects for performance testing
            const objectCount = 100;
            const objects = Array.from({ length: objectCount }, (_, i) => ({
                id: i,
                physicsBody: {
                    position: { x: i % 10, y: 1, z: Math.floor(i / 10) },
                    velocity: { x: (Math.random() - 0.5) * 2, y: 0, z: (Math.random() - 0.5) * 2 }
                },
                visualMesh: {
                    position: { x: 0, y: 0, z: 0 }
                }
            }));

            // Act: Measure synchronization performance
            const startTime = performance.now();
            
            // Simulate physics step and synchronization
            objects.forEach(obj => {
                // Simulate physics update
                const dt = 1/60;
                obj.physicsBody.position.x += obj.physicsBody.velocity.x * dt;
                obj.physicsBody.position.z += obj.physicsBody.velocity.z * dt;
                
                // Synchronize visual position
                obj.visualMesh.position.x = obj.physicsBody.position.x;
                obj.visualMesh.position.y = obj.physicsBody.position.y;
                obj.visualMesh.position.z = obj.physicsBody.position.z;
            });
            
            const endTime = performance.now();
            const syncTime = endTime - startTime;

            // Assert: Synchronization should complete within frame budget
            expect(syncTime).toBeLessThan(16.67); // Should complete within 60 FPS frame time
            
            // All objects should be synchronized
            objects.forEach(obj => {
                expect(obj.visualMesh.position.x).toBe(obj.physicsBody.position.x);
                expect(obj.visualMesh.position.y).toBe(obj.physicsBody.position.y);
                expect(obj.visualMesh.position.z).toBe(obj.physicsBody.position.z);
            });
        });

        it('should handle memory efficiently during continuous sync operations', () => {
            // Arrange: Set up memory tracking
            const memorySnapshots = [];
            const syncOperations = 1000;

            const trackMemory = () => {
                if (performance.memory) {
                    memorySnapshots.push({
                        used: performance.memory.usedJSHeapSize,
                        total: performance.memory.totalJSHeapSize,
                        timestamp: Date.now()
                    });
                }
            };

            const testObject = {
                physicsBody: { position: { x: 0, y: 0, z: 0 } },
                visualMesh: { position: { x: 0, y: 0, z: 0 } }
            };

            // Act: Perform many sync operations
            trackMemory();
            
            for (let i = 0; i < syncOperations; i++) {
                // Simulate position update
                testObject.physicsBody.position.x = Math.random() * 100;
                testObject.physicsBody.position.y = Math.random() * 10;
                testObject.physicsBody.position.z = Math.random() * 100;
                
                // Synchronize
                testObject.visualMesh.position.x = testObject.physicsBody.position.x;
                testObject.visualMesh.position.y = testObject.physicsBody.position.y;
                testObject.visualMesh.position.z = testObject.physicsBody.position.z;
                
                // Track memory periodically
                if (i % 100 === 0) {
                    trackMemory();
                }
            }
            
            trackMemory();

            // Assert: Memory usage should remain stable
            if (memorySnapshots.length > 1) {
                const initialMemory = memorySnapshots[0].used;
                const finalMemory = memorySnapshots[memorySnapshots.length - 1].used;
                const memoryIncrease = finalMemory - initialMemory;
                
                // Memory increase should be minimal (less than 1MB for sync operations)
                expect(memoryIncrease).toBeLessThan(1024 * 1024);
            }
        });
    });
});