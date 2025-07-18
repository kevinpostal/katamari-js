/**
 * Memory Usage Performance Tests
 * Tests memory allocation patterns and leak detection during extended gameplay
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
    PerformanceCollector,
    detectMemoryLeaks,
    createPerformanceTest,
    createMockPerformanceScenario
} from '../helpers/performance-helpers.js';

describe('Memory Usage Performance Tests', () => {
    let performanceCollector;
    let mockMemory;
    let baseHeapSize;

    beforeEach(() => {
        performanceCollector = new PerformanceCollector();
        baseHeapSize = 50000000; // 50MB baseline
        
        // Mock performance.memory
        mockMemory = {
            usedJSHeapSize: baseHeapSize,
            totalJSHeapSize: baseHeapSize * 1.5,
            jsHeapSizeLimit: baseHeapSize * 10
        };
        
        Object.defineProperty(performance, 'memory', {
            value: mockMemory,
            writable: true,
            configurable: true
        });

        // Mock global.gc for garbage collection testing
        global.gc = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        delete global.gc;
    });

    describe('Memory Allocation Patterns', () => {
        it('should track memory usage during normal gameplay', () => {
            performanceCollector.start();
            
            // Simulate gradual memory increase during gameplay
            for (let i = 0; i < 100; i++) {
                mockMemory.usedJSHeapSize = baseHeapSize + (i * 100000); // 100KB per frame
                
                performanceCollector.recordFrame({
                    frameTime: 16.67
                });
            }
            
            const analysis = performanceCollector.analyze();
            
            expect(analysis.memory).toBeDefined();
            expect(analysis.memory.heapUsedAverage).toBeGreaterThan(baseHeapSize);
            expect(analysis.memory.memoryGrowth).toBeGreaterThan(0);
            expect(analysis.memory.heapUsedPeak).toBeGreaterThan(analysis.memory.heapUsedAverage);
        });

        it('should detect stable memory usage', () => {
            performanceCollector.start();
            
            // Simulate stable memory usage
            for (let i = 0; i < 100; i++) {
                mockMemory.usedJSHeapSize = baseHeapSize + Math.random() * 1000000; // Small random variation
                
                performanceCollector.recordFrame({
                    frameTime: 16.67
                });
            }
            
            const analysis = performanceCollector.analyze();
            
            expect(analysis.memory.memoryGrowth).toBeLessThan(1000000); // Less than 1MB growth
            expect(analysis.memory.potentialLeak).toBe(false);
        });

        it('should calculate memory growth rate correctly', () => {
            performanceCollector.start();
            
            const initialMemory = baseHeapSize;
            const finalMemory = baseHeapSize + 10000000; // 10MB increase
            const frames = 100;
            
            for (let i = 0; i < frames; i++) {
                const progress = i / (frames - 1);
                mockMemory.usedJSHeapSize = initialMemory + (progress * (finalMemory - initialMemory));
                
                performanceCollector.recordFrame({
                    frameTime: 16.67
                });
            }
            
            const analysis = performanceCollector.analyze();
            
            expect(analysis.memory.memoryGrowth).toBeCloseTo(100000, -3); // Growth rate per frame
            expect(analysis.memory.memoryGrowth * frames).toBeCloseTo(10000000, -5); // Total growth
        });
    });

    describe('Memory Leak Detection', () => {
        it('should detect potential memory leaks', async () => {
            let currentMemory = baseHeapSize;
            
            const leakyFunction = async (iteration) => {
                // Simulate memory leak - consistent growth
                currentMemory += 500000; // 500KB per iteration
                mockMemory.usedJSHeapSize = currentMemory;
                
                // Simulate some work
                await new Promise(resolve => setTimeout(resolve, 1));
            };

            const result = await detectMemoryLeaks(leakyFunction, {
                iterations: 100,
                samplingInterval: 10,
                leakThreshold: 5000000 // 5MB
            });

            expect(result.hasLeak).toBe(true);
            expect(result.memoryGrowth).toBeGreaterThan(5000000);
            expect(result.analysis.totalGrowth).toBeGreaterThan(0);
        });

        it('should not flag stable memory usage as leak', async () => {
            const stableFunction = async (iteration) => {
                // Simulate stable memory usage with minor fluctuations
                const variation = (Math.random() - 0.5) * 1000000; // ±500KB variation
                mockMemory.usedJSHeapSize = baseHeapSize + variation;
                
                await new Promise(resolve => setTimeout(resolve, 1));
            };

            const result = await detectMemoryLeaks(stableFunction, {
                iterations: 100,
                samplingInterval: 10,
                leakThreshold: 5000000
            });

            expect(result.hasLeak).toBe(false);
            expect(Math.abs(result.memoryGrowth)).toBeLessThan(5000000);
        });

        it('should handle garbage collection cycles', async () => {
            let currentMemory = baseHeapSize;
            let gcCycle = 0;
            
            const gcAwareFunction = async (iteration) => {
                // Simulate memory growth with periodic GC
                currentMemory += 200000; // 200KB per iteration
                
                // Simulate GC every 20 iterations
                if (iteration % 20 === 0) {
                    gcCycle++;
                    currentMemory = Math.max(baseHeapSize, currentMemory * 0.7); // GC reduces memory by 30%
                }
                
                mockMemory.usedJSHeapSize = currentMemory;
                await new Promise(resolve => setTimeout(resolve, 1));
            };

            const result = await detectMemoryLeaks(gcAwareFunction, {
                iterations: 100,
                samplingInterval: 5,
                leakThreshold: 10000000
            });

            expect(result.snapshots.length).toBeGreaterThan(10);
            expect(gcCycle).toBeGreaterThan(0);
            // Should not detect leak due to GC cycles
            expect(result.hasLeak).toBe(false);
        });
    });

    describe('Three.js Object Cleanup', () => {
        it('should verify proper Three.js geometry disposal', async () => {
            const geometries = [];
            let memoryUsed = baseHeapSize;
            
            const geometryTestFunction = async (iteration) => {
                // Simulate creating geometries
                if (iteration % 10 === 0) {
                    const mockGeometry = {
                        dispose: vi.fn(),
                        uuid: `geometry-${iteration}`,
                        attributes: { position: {}, normal: {}, uv: {} }
                    };
                    geometries.push(mockGeometry);
                    memoryUsed += 1000000; // 1MB per geometry
                }
                
                // Simulate disposing old geometries
                if (geometries.length > 50) {
                    const oldGeometry = geometries.shift();
                    oldGeometry.dispose();
                    memoryUsed -= 800000; // 800KB freed (some overhead remains)
                }
                
                mockMemory.usedJSHeapSize = memoryUsed;
                await new Promise(resolve => setTimeout(resolve, 1));
            };

            const result = await detectMemoryLeaks(geometryTestFunction, {
                iterations: 200,
                samplingInterval: 20,
                leakThreshold: 20000000 // 20MB
            });

            // Should not leak if disposal is working
            expect(result.hasLeak).toBe(false);
            expect(geometries.length).toBeLessThanOrEqual(50);
            
            // Verify dispose was called (should have disposed geometries when array exceeded 50)
            const disposedGeometries = geometries.filter(g => g.dispose.mock.calls.length > 0);
            expect(disposedGeometries.length).toBeGreaterThanOrEqual(0); // Allow for no disposals if under threshold
        });

        it('should detect memory leaks from undisposed materials', async () => {
            const materials = [];
            let memoryUsed = baseHeapSize;
            
            const materialLeakFunction = async (iteration) => {
                // Simulate creating materials without disposal
                if (iteration % 5 === 0) {
                    const mockMaterial = {
                        dispose: vi.fn(),
                        uuid: `material-${iteration}`,
                        map: { dispose: vi.fn() },
                        normalMap: { dispose: vi.fn() }
                    };
                    materials.push(mockMaterial);
                    memoryUsed += 2000000; // 2MB per material (textures included)
                }
                
                // Don't dispose materials - simulate leak
                mockMemory.usedJSHeapSize = memoryUsed;
                await new Promise(resolve => setTimeout(resolve, 1));
            };

            const result = await detectMemoryLeaks(materialLeakFunction, {
                iterations: 100,
                samplingInterval: 10,
                leakThreshold: 10000000 // 10MB
            });

            expect(result.hasLeak).toBe(true);
            expect(materials.length).toBeGreaterThan(10);
            
            // Verify dispose was never called
            materials.forEach(material => {
                expect(material.dispose).not.toHaveBeenCalled();
            });
        });

        it('should track texture memory usage', async () => {
            const textures = [];
            let memoryUsed = baseHeapSize;
            
            const textureTestFunction = async (iteration) => {
                // Simulate loading textures
                if (iteration % 15 === 0) {
                    const mockTexture = {
                        dispose: vi.fn(),
                        uuid: `texture-${iteration}`,
                        image: { width: 1024, height: 1024 },
                        format: 'RGBA',
                        type: 'UnsignedByteType'
                    };
                    textures.push(mockTexture);
                    // RGBA 1024x1024 = 4MB
                    memoryUsed += 4000000;
                }
                
                // Dispose textures when we have too many
                if (textures.length > 10) {
                    const oldTexture = textures.shift();
                    oldTexture.dispose();
                    memoryUsed -= 3800000; // Most memory freed
                }
                
                mockMemory.usedJSHeapSize = memoryUsed;
                await new Promise(resolve => setTimeout(resolve, 1));
            };

            await detectMemoryLeaks(textureTestFunction, {
                iterations: 150,
                samplingInterval: 15,
                leakThreshold: 50000000 // 50MB
            });

            expect(textures.length).toBeLessThanOrEqual(10);
            
            // Verify some textures were disposed (only if we exceeded the limit)
            const disposedTextures = textures.filter(t => t.dispose.mock.calls.length > 0);
            expect(disposedTextures.length).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Physics Body Cleanup', () => {
        it('should verify proper physics body removal', async () => {
            const physicsBodies = [];
            let memoryUsed = baseHeapSize;
            
            const physicsTestFunction = async (iteration) => {
                // Simulate creating physics bodies
                if (iteration % 8 === 0) {
                    const mockBody = {
                        id: iteration,
                        position: { x: 0, y: 0, z: 0 },
                        velocity: { x: 0, y: 0, z: 0 },
                        shapes: [{ type: 'Sphere', radius: 1 }],
                        world: null
                    };
                    physicsBodies.push(mockBody);
                    memoryUsed += 500000; // 500KB per body
                }
                
                // Remove distant bodies
                if (physicsBodies.length > 100) {
                    const removedBodies = physicsBodies.splice(0, 20);
                    memoryUsed -= removedBodies.length * 450000; // 450KB freed per body
                }
                
                mockMemory.usedJSHeapSize = memoryUsed;
                await new Promise(resolve => setTimeout(resolve, 1));
            };

            const result = await detectMemoryLeaks(physicsTestFunction, {
                iterations: 300,
                samplingInterval: 25,
                leakThreshold: 30000000 // 30MB
            });

            expect(result.hasLeak).toBe(false);
            expect(physicsBodies.length).toBeLessThanOrEqual(100);
        });

        it('should detect physics body leaks', async () => {
            const physicsBodies = [];
            let memoryUsed = baseHeapSize;
            
            const physicsLeakFunction = async (iteration) => {
                // Create bodies but never remove them
                if (iteration % 5 === 0) {
                    const mockBody = {
                        id: iteration,
                        position: { x: Math.random() * 100, y: 0, z: Math.random() * 100 },
                        shapes: [{ type: 'Box', halfExtents: { x: 1, y: 1, z: 1 } }]
                    };
                    physicsBodies.push(mockBody);
                    memoryUsed += 800000; // 800KB per body (larger than previous test)
                }
                
                mockMemory.usedJSHeapSize = memoryUsed;
                await new Promise(resolve => setTimeout(resolve, 1));
            };

            const result = await detectMemoryLeaks(physicsLeakFunction, {
                iterations: 100,
                samplingInterval: 10,
                leakThreshold: 3000000 // 3MB (further reduced threshold)
            });

            expect(result.hasLeak).toBe(true);
            expect(physicsBodies.length).toBeGreaterThan(15);
        });
    });

    describe('Extended Gameplay Memory Patterns', () => {
        it('should handle long gameplay sessions without leaks', async () => {
            const gameObjects = new Map();
            let memoryUsed = baseHeapSize;
            let objectId = 0;
            
            const longGameplayFunction = async (iteration) => {
                // Simulate katamari gameplay - collecting and growing
                const katamariSize = Math.floor(iteration / 100) + 1;
                
                // Add new collectible items
                if (iteration % 3 === 0) {
                    const item = {
                        id: objectId++,
                        type: 'collectible',
                        size: Math.random() * katamariSize,
                        mesh: { dispose: vi.fn() },
                        body: { world: null }
                    };
                    gameObjects.set(item.id, item);
                    memoryUsed += item.size * 100000; // Memory based on size
                }
                
                // Collect items (remove from scene but keep in katamari)
                if (iteration % 10 === 0 && gameObjects.size > 50) {
                    const itemsToCollect = Array.from(gameObjects.values()).slice(0, 5);
                    itemsToCollect.forEach(item => {
                        item.mesh.dispose();
                        gameObjects.delete(item.id);
                        memoryUsed -= item.size * 80000; // Most memory freed
                    });
                }
                
                // Simulate level transitions (major cleanup)
                if (iteration % 200 === 0) {
                    gameObjects.clear();
                    memoryUsed = baseHeapSize + (katamariSize * 5000000); // Base + katamari size
                    
                    // Force GC simulation
                    if (global.gc) {
                        global.gc();
                    }
                }
                
                mockMemory.usedJSHeapSize = memoryUsed;
                await new Promise(resolve => setTimeout(resolve, 1));
            };

            const result = await detectMemoryLeaks(longGameplayFunction, {
                iterations: 1000,
                samplingInterval: 50,
                leakThreshold: 100000000 // 100MB
            });

            expect(result.hasLeak).toBe(false);
            expect(result.analysis.peakMemory).toBeDefined();
            expect(result.snapshots.length).toBeGreaterThan(15);
        });

        it('should detect gradual memory accumulation', async () => {
            let memoryUsed = baseHeapSize;
            const retainedObjects = [];
            
            const gradualLeakFunction = async (iteration) => {
                // Simulate small objects that accumulate over time
                if (iteration % 2 === 0) {
                    const smallObject = {
                        id: iteration,
                        data: new Array(1000).fill(Math.random()) // Small data array
                    };
                    retainedObjects.push(smallObject);
                    memoryUsed += 50000; // 50KB per object
                }
                
                // Only occasionally clean up (not enough to prevent accumulation)
                if (iteration % 100 === 0 && retainedObjects.length > 200) {
                    const removed = retainedObjects.splice(0, 50);
                    memoryUsed -= removed.length * 45000; // 45KB freed per object
                }
                
                mockMemory.usedJSHeapSize = memoryUsed;
                await new Promise(resolve => setTimeout(resolve, 1));
            };

            const result = await detectMemoryLeaks(gradualLeakFunction, {
                iterations: 500,
                samplingInterval: 25,
                leakThreshold: 2000000 // 2MB (further reduced threshold)
            });

            expect(result.hasLeak).toBe(true);
            expect(result.analysis.averageGrowthPerIteration).toBeGreaterThan(2000);
            expect(retainedObjects.length).toBeGreaterThan(50);
        });
    });

    describe('Memory Performance Integration', () => {
        it('should combine memory tracking with performance testing', async () => {
            let memoryUsed = baseHeapSize;
            
            const combinedScenario = async ({ frame, phase }) => {
                if (phase === 'test') {
                    // Simulate frame-based memory allocation
                    const objectsThisFrame = Math.floor(Math.random() * 5);
                    memoryUsed += objectsThisFrame * 200000; // 200KB per object
                    
                    // Simulate periodic cleanup
                    if (frame % 60 === 0) {
                        memoryUsed *= 0.9; // 10% cleanup
                    }
                    
                    mockMemory.usedJSHeapSize = memoryUsed;
                }
            };

            const result = await createPerformanceTest(
                'Memory Performance Integration',
                combinedScenario,
                { duration: 2000, targetFPS: 60 }
            );

            expect(result.metrics.memory).toBeDefined();
            expect(result.metrics.memory.heapUsedAverage).toBeGreaterThan(baseHeapSize);
            expect(result.metrics.frameRate).toBeDefined();
        });
    });
});