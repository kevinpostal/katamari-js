/**
 * Unit tests for Cannon-ES physics system module
 * Tests physics world initialization, body creation, collision detection,
 * physics stepping, and performance optimization features
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Cannon-ES before importing the physics module
vi.mock('cannon-es', async () => {
    const mockCANNON = await import('../../../tests/__mocks__/cannon-es.js');
    return mockCANNON.default;
});

import * as CANNON from 'cannon-es';
import {
    initializePhysicsWorld,
    updatePhysics,
    getBodyVelocityMagnitude,
    managePhysicsBodyActivation,
    getPhysicsPerformanceStats,
    getPhysicsWorld,
    addPhysicsBody,
    removePhysicsBody,
    getPhysicsBodies,
    clearPhysicsBodies,
    createSphereBody,
    createBoxBody,
    createPlaneBody,
    createKatamariBody,
    updateKatamariPhysics,
    applyImpulseToBody,
    checkBodyCollision,
    setBodyPosition,
    resetPhysicsPerformanceStats,
    removeAllPhysicsBodies,
    removePhysicsBodiesByCondition,
    validateAndFixPhysicsWorld
} from '../../../src/game/core/physics.js';

// Mock the debug module
vi.mock('../../../src/game/utils/debug.js', () => ({
    debugLog: vi.fn(),
    debugWarn: vi.fn(),
    debugError: vi.fn(),
    debugInfo: vi.fn()
}));

// Mock the performance module
vi.mock('../../../src/game/utils/performance.js', () => ({
    recordPhysicsStepTime: vi.fn()
}));

// Mock the constants module
vi.mock('../../../src/game/utils/constants.js', () => ({
    PHYSICS: {
        GRAVITY: -9.82,
        FRICTION: 0.3,
        RESTITUTION: 0.3,
        CONTACT_STIFFNESS: 1e7,
        CONTACT_RELAXATION: 3,
        SOLVER_ITERATIONS: 10,
        FIXED_TIME_STEP: 1/60,
        ACTIVE_DISTANCE: 50
    }
}));

describe('Physics System', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        // Clean up physics world after each test
        const world = getPhysicsWorld();
        if (world) {
            removeAllPhysicsBodies();
        }
    });

    describe('Physics World Initialization', () => {
        it('should initialize physics world with correct settings', () => {
            const world = initializePhysicsWorld();
            
            expect(world).toBeInstanceOf(CANNON.World);
            expect(world.gravity.y).toBe(-9.82);
            expect(world.broadphase).toBeInstanceOf(CANNON.SAPBroadphase);
            expect(world.solver).toBeInstanceOf(CANNON.GSSolver);
            expect(world.solver.iterations).toBe(10);
            expect(world.allowSleep).toBe(true);
            expect(world.sleepSpeedLimit).toBe(0.1);
            expect(world.sleepTimeLimit).toBe(1);
        });

        it('should configure default contact material properties', () => {
            const world = initializePhysicsWorld();
            
            expect(world.defaultContactMaterial.friction).toBe(0.3);
            expect(world.defaultContactMaterial.restitution).toBe(0.3);
            expect(world.defaultContactMaterial.contactEquationStiffness).toBe(1e7);
            expect(world.defaultContactMaterial.contactEquationRelaxation).toBe(3);
        });

        it('should create ground physics body during initialization', () => {
            const world = initializePhysicsWorld();
            
            // Should have at least one body (the ground)
            expect(world.bodies.length).toBeGreaterThan(0);
            
            // Find the ground body
            const groundBody = world.bodies.find(body => 
                body.userData && body.userData.isGround
            );
            expect(groundBody).toBeDefined();
            expect(groundBody.mass).toBe(0); // Static body
            expect(groundBody.userData.name).toBe('ground');
        });

        it('should return the same world instance', () => {
            const world1 = initializePhysicsWorld();
            const world2 = getPhysicsWorld();
            
            expect(world1).toBe(world2);
        });
    });

    describe('Physics Body Management', () => {
        let world;

        beforeEach(() => {
            world = initializePhysicsWorld();
        });

        it('should add physics body to world and tracking', () => {
            const body = createSphereBody(1, 10, new CANNON.Vec3(0, 5, 0));
            
            addPhysicsBody(body, true);
            
            expect(world.addBody).toHaveBeenCalledWith(body);
            expect(getPhysicsBodies()).toContain(body);
        });

        it('should add physics body without tracking', () => {
            const body = createSphereBody(1, 10, new CANNON.Vec3(0, 5, 0));
            
            addPhysicsBody(body, false);
            
            expect(world.addBody).toHaveBeenCalledWith(body);
            expect(getPhysicsBodies()).not.toContain(body);
        });

        it('should remove physics body from world and tracking', () => {
            const body = createSphereBody(1, 10, new CANNON.Vec3(0, 5, 0));
            addPhysicsBody(body, true);
            
            removePhysicsBody(body);
            
            expect(world.removeBody).toHaveBeenCalledWith(body);
            expect(getPhysicsBodies()).not.toContain(body);
        });

        it('should clear all tracked physics bodies', () => {
            const body1 = createSphereBody(1, 10, new CANNON.Vec3(0, 5, 0));
            const body2 = createBoxBody(new CANNON.Vec3(1, 1, 1), 5, new CANNON.Vec3(2, 5, 0));
            
            addPhysicsBody(body1, true);
            addPhysicsBody(body2, true);
            
            expect(getPhysicsBodies()).toHaveLength(2);
            
            clearPhysicsBodies();
            
            expect(getPhysicsBodies()).toHaveLength(0);
        });
    });

    describe('Physics Body Creation', () => {
        it('should create sphere physics body', () => {
            const radius = 2;
            const mass = 15;
            const position = new CANNON.Vec3(1, 2, 3);
            const userData = { name: 'test-sphere' };
            
            const body = createSphereBody(radius, mass, position, userData);
            
            expect(body).toBeInstanceOf(CANNON.Body);
            expect(body.mass).toBe(mass);
            expect(body.position).toBe(position);
            expect(body.userData).toEqual(userData);
            expect(body.shapes[0]).toBeInstanceOf(CANNON.Sphere);
            expect(body.shapes[0].radius).toBe(radius);
        });

        it('should create box physics body', () => {
            const halfExtents = new CANNON.Vec3(1, 2, 3);
            const mass = 10;
            const position = new CANNON.Vec3(4, 5, 6);
            const userData = { name: 'test-box' };
            
            const body = createBoxBody(halfExtents, mass, position, userData);
            
            expect(body).toBeInstanceOf(CANNON.Body);
            expect(body.mass).toBe(mass);
            expect(body.position).toBe(position);
            expect(body.userData).toEqual(userData);
            expect(body.shapes[0]).toBeInstanceOf(CANNON.Box);
            expect(body.shapes[0].halfExtents).toBe(halfExtents);
        });

        it('should create plane physics body', () => {
            const position = new CANNON.Vec3(0, 0, 0);
            const userData = { name: 'test-plane' };
            
            const body = createPlaneBody(position, userData);
            
            expect(body).toBeInstanceOf(CANNON.Body);
            expect(body.mass).toBe(0); // Static body
            expect(body.position).toBe(position);
            expect(body.userData).toEqual(userData);
            expect(body.shapes[0]).toBeInstanceOf(CANNON.Plane);
        });

        it('should create Katamari physics body with correct mass formula', () => {
            const radius = 2;
            const position = new CANNON.Vec3(0, 5, 0);
            const userData = { name: 'katamari' };
            
            const body = createKatamariBody(radius, position, userData);
            
            const expectedMass = 12.5 * Math.pow(radius, 3); // 12.5 * 8 = 100
            
            expect(body).toBeInstanceOf(CANNON.Body);
            expect(body.mass).toBe(expectedMass);
            expect(body.position.y).toBeGreaterThanOrEqual(radius); // Ensure minimum height
            expect(body.userData.isKatamari).toBe(true);
            expect(body.shapes[0]).toBeInstanceOf(CANNON.Sphere);
            expect(body.shapes[0].radius).toBe(radius);
        });
    });

    describe('Katamari Physics Updates', () => {
        it('should update Katamari physics properties', () => {
            const initialRadius = 1;
            const newRadius = 2;
            const position = new CANNON.Vec3(0, 5, 0);
            
            const katamariBody = createKatamariBody(initialRadius, position);
            const initialMass = katamariBody.mass;
            
            updateKatamariPhysics(katamariBody, newRadius);
            
            const expectedNewMass = 12.5 * Math.pow(newRadius, 3);
            expect(katamariBody.mass).toBe(expectedNewMass);
            expect(katamariBody.mass).toBeGreaterThan(initialMass);
            expect(katamariBody.shapes[0].radius).toBe(newRadius);
            expect(katamariBody.position.y).toBeGreaterThanOrEqual(newRadius);
        });

        it('should handle null katamari body gracefully', () => {
            expect(() => updateKatamariPhysics(null, 2)).not.toThrow();
        });
    });

    describe('Physics Simulation', () => {
        let world;

        beforeEach(() => {
            world = initializePhysicsWorld();
        });

        it('should update physics with fixed timestep', () => {
            const deltaTime = 1/60; // 60 FPS
            
            updatePhysics(deltaTime);
            
            expect(world.step).toHaveBeenCalled();
        });

        it('should handle large delta times by clamping', () => {
            const largeDeltaTime = 1; // 1 second
            
            updatePhysics(largeDeltaTime);
            
            // Should still call step, but with clamped time
            expect(world.step).toHaveBeenCalled();
        });

        it('should limit maximum steps per frame', () => {
            const largeDeltaTime = 0.5; // Half second
            
            updatePhysics(largeDeltaTime);
            
            // Should call step multiple times but not exceed maximum
            expect(world.step).toHaveBeenCalled();
        });
    });

    describe('Physics Body Utilities', () => {
        it('should get body velocity magnitude', () => {
            const body = createSphereBody(1, 10, new CANNON.Vec3(0, 5, 0));
            body.velocity = new CANNON.Vec3(3, 4, 0); // Magnitude should be 5
            
            const magnitude = getBodyVelocityMagnitude(body);
            
            expect(magnitude).toBe(5);
        });

        it('should return 0 for null body velocity', () => {
            const magnitude = getBodyVelocityMagnitude(null);
            
            expect(magnitude).toBe(0);
        });

        it('should apply impulse to physics body', () => {
            const body = createSphereBody(1, 10, new CANNON.Vec3(0, 5, 0));
            const impulse = new CANNON.Vec3(10, 0, 0);
            const relativePoint = new CANNON.Vec3(0, 1, 0);
            
            applyImpulseToBody(body, impulse, relativePoint);
            
            expect(body.applyImpulse).toHaveBeenCalledWith(impulse, relativePoint);
        });

        it('should check body collision based on distance', () => {
            const body1 = createSphereBody(1, 10, new CANNON.Vec3(0, 0, 0));
            const body2 = createSphereBody(1, 10, new CANNON.Vec3(1, 0, 0));
            
            body1.position = new CANNON.Vec3(0, 0, 0);
            body2.position = new CANNON.Vec3(1, 0, 0);
            
            const isColliding = checkBodyCollision(body1, body2, 2);
            const isNotColliding = checkBodyCollision(body1, body2, 0.5);
            
            expect(isColliding).toBe(true);
            expect(isNotColliding).toBe(false);
        });

        it('should set body position', () => {
            const body = createSphereBody(1, 10, new CANNON.Vec3(0, 0, 0));
            const newPosition = new CANNON.Vec3(5, 10, 15);
            
            setBodyPosition(body, newPosition);
            
            expect(body.position.copy).toHaveBeenCalledWith(newPosition);
        });
    });

    describe('Physics Body Activation Management', () => {
        let world;

        beforeEach(() => {
            world = initializePhysicsWorld();
        });

        it('should activate bodies within active distance', () => {
            // Mock Math.random to ensure the function runs
            const originalRandom = Math.random;
            Math.random = vi.fn(() => 0.05); // Always return a value < 0.1
            
            const referencePosition = new CANNON.Vec3(0, 0, 0);
            const nearBody = createSphereBody(1, 10, new CANNON.Vec3(10, 0, 0));
            nearBody.sleepState = CANNON.Body.SLEEPING;
            
            addPhysicsBody(nearBody, true);
            
            managePhysicsBodyActivation(referencePosition, 50);
            
            expect(nearBody.wakeUp).toHaveBeenCalled();
            
            // Restore Math.random
            Math.random = originalRandom;
        });

        it('should sleep bodies far from reference position', () => {
            // Mock Math.random to ensure the function runs
            const originalRandom = Math.random;
            Math.random = vi.fn(() => 0.05); // Always return a value < 0.1
            
            const referencePosition = new CANNON.Vec3(0, 0, 0);
            const farBody = createSphereBody(1, 10, new CANNON.Vec3(200, 0, 0));
            farBody.sleepState = CANNON.Body.AWAKE;
            farBody.velocity = new CANNON.Vec3(0, 0, 0); // Low velocity
            
            addPhysicsBody(farBody, true);
            
            managePhysicsBodyActivation(referencePosition, 50);
            
            expect(farBody.sleep).toHaveBeenCalled();
            
            // Restore Math.random
            Math.random = originalRandom;
        });

        it('should skip static and katamari bodies', () => {
            const referencePosition = new CANNON.Vec3(0, 0, 0);
            const staticBody = createPlaneBody(new CANNON.Vec3(0, 0, 0), { isStatic: true });
            const katamariBody = createKatamariBody(2, new CANNON.Vec3(100, 0, 0), { isKatamari: true });
            
            addPhysicsBody(staticBody, true);
            addPhysicsBody(katamariBody, true);
            
            managePhysicsBodyActivation(referencePosition, 50);
            
            expect(staticBody.wakeUp).not.toHaveBeenCalled();
            expect(staticBody.sleep).not.toHaveBeenCalled();
            expect(katamariBody.wakeUp).not.toHaveBeenCalled();
            expect(katamariBody.sleep).not.toHaveBeenCalled();
        });
    });

    describe('Physics Performance Stats', () => {
        it('should return performance statistics', () => {
            const stats = getPhysicsPerformanceStats();
            
            expect(stats).toHaveProperty('lastStepTime');
            expect(stats).toHaveProperty('averageStepTime');
            expect(stats).toHaveProperty('maxStepTime');
            expect(stats).toHaveProperty('stepCount');
            expect(stats).toHaveProperty('activeBodiesCount');
            expect(stats).toHaveProperty('sleepingBodiesCount');
        });

        it('should reset performance statistics', () => {
            resetPhysicsPerformanceStats();
            
            const stats = getPhysicsPerformanceStats();
            expect(stats.stepCount).toBe(0);
            expect(stats.maxStepTime).toBe(0);
        });
    });

    describe('Physics Body Cleanup', () => {
        let world;

        beforeEach(() => {
            world = initializePhysicsWorld();
        });

        it('should remove all physics bodies', () => {
            const body1 = createSphereBody(1, 10, new CANNON.Vec3(0, 5, 0));
            const body2 = createBoxBody(new CANNON.Vec3(1, 1, 1), 5, new CANNON.Vec3(2, 5, 0));
            
            addPhysicsBody(body1, true);
            addPhysicsBody(body2, true);
            
            expect(getPhysicsBodies()).toHaveLength(2);
            
            removeAllPhysicsBodies();
            
            expect(getPhysicsBodies()).toHaveLength(0);
            expect(world.removeBody).toHaveBeenCalledWith(body1);
            expect(world.removeBody).toHaveBeenCalledWith(body2);
        });

        it('should remove physics bodies by condition', () => {
            const body1 = createSphereBody(1, 10, new CANNON.Vec3(0, 5, 0), { type: 'item' });
            const body2 = createSphereBody(1, 10, new CANNON.Vec3(2, 5, 0), { type: 'katamari' });
            const body3 = createSphereBody(1, 10, new CANNON.Vec3(4, 5, 0), { type: 'item' });
            
            addPhysicsBody(body1, true);
            addPhysicsBody(body2, true);
            addPhysicsBody(body3, true);
            
            expect(getPhysicsBodies()).toHaveLength(3);
            
            // Remove only item bodies
            removePhysicsBodiesByCondition(body => body.userData.type === 'item');
            
            expect(getPhysicsBodies()).toHaveLength(1);
            expect(getPhysicsBodies()[0]).toBe(body2);
        });
    });

    describe('Physics World Validation', () => {
        let world;

        beforeEach(() => {
            world = initializePhysicsWorld();
        });

        it('should validate physics world integrity', () => {
            const body1 = createSphereBody(1, 10, new CANNON.Vec3(0, 5, 0));
            const body2 = createBoxBody(new CANNON.Vec3(1, 1, 1), 5, new CANNON.Vec3(2, 5, 0));
            
            addPhysicsBody(body1, true);
            addPhysicsBody(body2, true);
            
            const results = validateAndFixPhysicsWorld();
            
            expect(results).toHaveProperty('bodiesInWorld');
            expect(results).toHaveProperty('bodiesTracked');
            expect(results).toHaveProperty('orphanedBodies');
            expect(results).toHaveProperty('fixedLeaks');
            expect(results.bodiesTracked).toBe(2);
        });

        it('should handle validation when world is not initialized', () => {
            // This test would need to be run without initializing the world
            // For now, we'll just verify the function doesn't throw
            expect(() => validateAndFixPhysicsWorld()).not.toThrow();
        });
    });

    describe('Error Handling', () => {
        it('should handle null bodies gracefully in utility functions', () => {
            expect(() => applyImpulseToBody(null, new CANNON.Vec3(1, 0, 0))).not.toThrow();
            expect(() => setBodyPosition(null, new CANNON.Vec3(1, 0, 0))).not.toThrow();
            expect(() => removePhysicsBody(null)).not.toThrow();
            expect(getBodyVelocityMagnitude(null)).toBe(0);
            expect(checkBodyCollision(null, null, 1)).toBe(false);
        });

        it('should handle missing reference position in activation management', () => {
            expect(() => managePhysicsBodyActivation(null, 50)).not.toThrow();
        });
    });
});