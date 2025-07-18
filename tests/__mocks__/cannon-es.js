/**
 * Mock implementation for Cannon-ES physics engine
 * Provides lightweight mocks for physics simulation without actual computation
 */

import { vi } from 'vitest';

// Mock Vec3 class
export class Vec3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    
    set = vi.fn((x, y, z) => {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    });
    
    copy = vi.fn((vector) => {
        this.x = vector.x;
        this.y = vector.y;
        this.z = vector.z;
        return this;
    });
    
    vadd = vi.fn((vector) => {
        this.x += vector.x;
        this.y += vector.y;
        this.z += vector.z;
        return this;
    });
    
    length = vi.fn(() => Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z));
    
    distanceTo = vi.fn((vector) => {
        const dx = this.x - vector.x;
        const dy = this.y - vector.y;
        const dz = this.z - vector.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    });
    
    normalize = vi.fn(() => {
        const length = this.length();
        if (length > 0) {
            this.x /= length;
            this.y /= length;
            this.z /= length;
        }
        return this;
    });
    
    scale = vi.fn((scalar, target) => {
        if (target) {
            target.x = this.x * scalar;
            target.y = this.y * scalar;
            target.z = this.z * scalar;
            return target;
        } else {
            this.x *= scalar;
            this.y *= scalar;
            this.z *= scalar;
            return this;
        }
    });
    
    cross = vi.fn((vector, target) => {
        const ax = this.x, ay = this.y, az = this.z;
        const bx = vector.x, by = vector.y, bz = vector.z;
        
        if (target) {
            target.x = ay * bz - az * by;
            target.y = az * bx - ax * bz;
            target.z = ax * by - ay * bx;
            return target;
        } else {
            this.x = ay * bz - az * by;
            this.y = az * bx - ax * bz;
            this.z = ax * by - ay * bx;
            return this;
        }
    });
}

// Mock World class
export class World {
    constructor() {
        this.gravity = new Vec3(0, -9.82, 0);
        this.bodies = [];
        this.contacts = [];
        this.time = 0;
        this.dt = 1/60;
        this.broadphase = null;
        this.solver = null;
        this.allowSleep = false;
        this.sleepSpeedLimit = 0.1;
        this.sleepTimeLimit = 1;
        this.defaultContactMaterial = {
            friction: 0.3,
            restitution: 0.3,
            contactEquationStiffness: 1e7,
            contactEquationRelaxation: 3
        };
        this.quatNormalizeSkip = 0;
        this.quatNormalizeFast = false;
    }
    
    addBody = vi.fn((body) => {
        this.bodies.push(body);
    });
    
    removeBody = vi.fn((body) => {
        const index = this.bodies.indexOf(body);
        if (index !== -1) {
            this.bodies.splice(index, 1);
        }
    });
    
    step = vi.fn((dt) => {
        this.time += dt || this.dt;
    });
}

// Mock Body class
export class Body {
    constructor(options = {}) {
        this.mass = options.mass || 0;
        this.position = options.position || new Vec3();
        this.velocity = new Vec3();
        this.angularVelocity = new Vec3();
        this.quaternion = new Quaternion();
        this.shapes = options.shape ? [options.shape] : [];
        this.shapeOffsets = [new Vec3(0, 0, 0)];
        this.shapeOrientations = [new Quaternion(0, 0, 0, 1)];
        this.type = options.type || Body.DYNAMIC;
        this.material = options.material || null;
        this.sleepState = Body.AWAKE;
    }
    
    addShape = vi.fn((shape) => {
        this.shapes.push(shape);
    });
    
    removeShape = vi.fn((shape) => {
        const index = this.shapes.indexOf(shape);
        if (index !== -1) {
            this.shapes.splice(index, 1);
        }
    });
    
    wakeUp = vi.fn();
    sleep = vi.fn();
    applyImpulse = vi.fn();
    updateMassProperties = vi.fn();
    addEventListener = vi.fn();
    removeEventListener = vi.fn();
    
    static DYNAMIC = 1;
    static STATIC = 2;
    static KINEMATIC = 4;
    static AWAKE = 0;
    static SLEEPY = 1;
    static SLEEPING = 2;
}

// Mock Shape classes
export class Sphere {
    constructor(radius = 1) {
        this.radius = radius;
        this.type = Sphere.SPHERE;
    }
    
    static SPHERE = 1;
}

export class Box {
    constructor(halfExtents = new Vec3(1, 1, 1)) {
        this.halfExtents = halfExtents;
        this.type = Box.BOX;
    }
    
    static BOX = 2;
}

export class Plane {
    constructor() {
        this.type = Plane.PLANE;
    }
    
    static PLANE = 4;
}

export class Cylinder {
    constructor(radiusTop = 1, radiusBottom = 1, height = 1, numSegments = 8) {
        this.radiusTop = radiusTop;
        this.radiusBottom = radiusBottom;
        this.height = height;
        this.numSegments = numSegments;
        this.type = Cylinder.CYLINDER;
    }
    
    static CYLINDER = 8;
}

// Mock Material class
export class Material {
    constructor(options = {}) {
        this.friction = options.friction || 0.3;
        this.restitution = options.restitution || 0.3;
    }
}

// Mock ContactMaterial class
export class ContactMaterial {
    constructor(materialA, materialB, options = {}) {
        this.materialA = materialA;
        this.materialB = materialB;
        this.friction = options.friction || 0.3;
        this.restitution = options.restitution || 0.3;
    }
}

// Mock Quaternion class
export class Quaternion {
    constructor(x = 0, y = 0, z = 0, w = 1) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }
    
    setFromAxisAngle = vi.fn((axis, angle) => {
        // Simplified quaternion from axis-angle conversion
        const halfAngle = angle * 0.5;
        const s = Math.sin(halfAngle);
        this.x = axis.x * s;
        this.y = axis.y * s;
        this.z = axis.z * s;
        this.w = Math.cos(halfAngle);
        return this;
    });
    
    multiply = vi.fn((q) => this);
    normalize = vi.fn(() => this);
}

// Mock Broadphase classes
export class SAPBroadphase {
    constructor(world) {
        this.world = world;
        this.useBoundingBoxes = false;
    }
}

// Mock Solver classes
export class GSSolver {
    constructor() {
        this.iterations = 10;
        this.tolerance = 1e-7;
    }
}

// Export default object with all classes
export default {
    Vec3,
    World,
    Body,
    Sphere,
    Box,
    Plane,
    Cylinder,
    Material,
    ContactMaterial,
    Quaternion,
    SAPBroadphase,
    GSSolver
};