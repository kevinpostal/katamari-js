/**
 * Mock implementation for Three.js
 * Provides lightweight mocks for Three.js classes and functions
 */

import { vi } from 'vitest';

// Mock Vector3 class
export class Vector3 {
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
    
    add = vi.fn((vector) => {
        this.x += vector.x;
        this.y += vector.y;
        this.z += vector.z;
        return this;
    });
    
    sub = vi.fn((vector) => {
        this.x -= vector.x;
        this.y -= vector.y;
        this.z -= vector.z;
        return this;
    });
    
    subVectors = vi.fn((a, b) => {
        this.x = a.x - b.x;
        this.y = a.y - b.y;
        this.z = a.z - b.z;
        return this;
    });
    
    crossVectors = vi.fn((a, b) => {
        this.x = a.y * b.z - a.z * b.y;
        this.y = a.z * b.x - a.x * b.z;
        this.z = a.x * b.y - a.y * b.x;
        return this;
    });
    
    multiplyScalar = vi.fn((scalar) => {
        this.x *= scalar;
        this.y *= scalar;
        this.z *= scalar;
        return this;
    });
    
    distanceTo = vi.fn((vector) => {
        const dx = this.x - vector.x;
        const dy = this.y - vector.y;
        const dz = this.z - vector.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    });
    
    applyQuaternion = vi.fn((quaternion) => {
        // Simplified quaternion application
        return this;
    });
    
    applyAxisAngle = vi.fn((axis, angle) => {
        // Simplified axis-angle rotation
        return this;
    });
    
    clone = vi.fn(() => {
        return new Vector3(this.x, this.y, this.z);
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
    
    length = vi.fn(() => Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z));
}

// Mock Scene class
export class Scene {
    constructor() {
        this.children = [];
        this.background = null;
    }
    
    add = vi.fn((object) => {
        this.children.push(object);
    });
    
    remove = vi.fn((object) => {
        const index = this.children.indexOf(object);
        if (index !== -1) {
            this.children.splice(index, 1);
        }
    });
}

// Mock Camera classes
export class PerspectiveCamera {
    constructor(fov = 75, aspect = 1, near = 0.1, far = 1000) {
        this.fov = fov;
        this.aspect = aspect;
        this.near = near;
        this.far = far;
        this.position = new Vector3();
        this.rotation = new Vector3();
    }
    
    updateProjectionMatrix = vi.fn();
    lookAt = vi.fn();
}

// Mock Renderer class
export class WebGLRenderer {
    constructor(parameters = {}) {
        this.domElement = document.createElement('canvas');
        this.shadowMap = {
            enabled: false,
            type: null
        };
    }
    
    setSize = vi.fn();
    setPixelRatio = vi.fn();
    render = vi.fn();
    dispose = vi.fn();
}

// Mock Geometry classes
export class SphereGeometry {
    constructor(radius = 1, widthSegments = 32, heightSegments = 16) {
        this.type = 'SphereGeometry';
        this.parameters = {
            radius,
            widthSegments,
            heightSegments
        };
        this.radius = radius;
        this.widthSegments = widthSegments;
        this.heightSegments = heightSegments;
    }
    
    dispose = vi.fn();
}

export class BoxGeometry {
    constructor(width = 1, height = 1, depth = 1) {
        this.type = 'BoxGeometry';
        this.parameters = {
            width,
            height,
            depth
        };
        this.width = width;
        this.height = height;
        this.depth = depth;
    }
    
    dispose = vi.fn();
}

// Mock Material classes
export class MeshBasicMaterial {
    constructor(parameters = {}) {
        this.color = parameters.color || 0xffffff;
        this.transparent = parameters.transparent || false;
        this.opacity = parameters.opacity || 1;
    }
    
    dispose = vi.fn();
}

export class MeshStandardMaterial {
    constructor(parameters = {}) {
        this.color = parameters.color || 0xffffff;
        this.metalness = parameters.metalness || 0;
        this.roughness = parameters.roughness || 1;
        this.transparent = parameters.transparent || false;
        this.opacity = parameters.opacity || 1;
    }
    
    dispose = vi.fn();
}

// Mock MeshLambertMaterial class
export class MeshLambertMaterial {
    constructor(parameters = {}) {
        this.color = parameters.color || 0xffffff;
        this.map = parameters.map || null;
        this.transparent = parameters.transparent || false;
        this.opacity = parameters.opacity || 1;
    }
    
    dispose = vi.fn();
}

// Mock Quaternion class
export class Quaternion {
    constructor(x = 0, y = 0, z = 0, w = 1) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }
    
    setFromEuler = vi.fn((euler) => {
        // Simplified quaternion from euler conversion
        this.x = euler.x;
        this.y = euler.y;
        this.z = euler.z;
        return this;
    });
    
    multiply = vi.fn((q) => this);
    normalize = vi.fn(() => this);
    copy = vi.fn((q) => {
        if (q) {
            this.x = q.x;
            this.y = q.y;
            this.z = q.z;
            this.w = q.w;
        }
        return this;
    });
    
    clone = vi.fn(() => {
        return new Quaternion(this.x, this.y, this.z, this.w);
    });
    
    invert = vi.fn(() => {
        // Simplified invert
        this.x = -this.x;
        this.y = -this.y;
        this.z = -this.z;
        return this;
    });
}

// Mock Object3D base class
export class Object3D {
    constructor() {
        this.position = new Vector3();
        this.rotation = new Vector3();
        this.scale = new Vector3(1, 1, 1);
        this.quaternion = new Quaternion();
        this.visible = true;
        this.userData = {};
    }
    
    updateMatrix = vi.fn();
    
    dispose = vi.fn();
}

// Mock Group class
export class Group extends Object3D {
    constructor() {
        super();
        this.children = [];
        this.isGroup = true;
    }
    
    add = vi.fn((object) => {
        this.children.push(object);
    });
    
    remove = vi.fn((object) => {
        const index = this.children.indexOf(object);
        if (index !== -1) {
            this.children.splice(index, 1);
        }
    });
    
    traverse = vi.fn((callback) => {
        callback(this);
        this.children.forEach(child => {
            if (child.traverse) {
                child.traverse(callback);
            } else {
                callback(child);
            }
        });
    });
}

// Mock Mesh class
export class Mesh {
    constructor(geometry, material) {
        this.geometry = geometry;
        this.material = material;
        this.position = new Vector3();
        this.rotation = new Vector3();
        this.scale = new Vector3(1, 1, 1);
        this.visible = true;
        this.userData = {};
    }
    
    dispose = vi.fn();
}

// Mock Light classes
export class DirectionalLight {
    constructor(color = 0xffffff, intensity = 1) {
        this.color = color;
        this.intensity = intensity;
        this.position = new Vector3();
        this.castShadow = false;
        this.shadow = {
            camera: {
                top: 50,
                bottom: -50,
                left: -50,
                right: -50
            },
            mapSize: {
                width: 2048,
                height: 2048
            },
            bias: -0.0001
        };
    }
}

export class AmbientLight {
    constructor(color = 0xffffff, intensity = 1) {
        this.color = color;
        this.intensity = intensity;
    }
}

// Mock InstancedMesh class
export class InstancedMesh {
    constructor(geometry, material, count) {
        this.geometry = geometry;
        this.material = material;
        this.count = count;
        this.instanceMatrix = {
            needsUpdate: false,
            setUsage: vi.fn()
        };
        this.instanceColor = {
            setXYZ: vi.fn(),
            needsUpdate: false
        };
        this.castShadow = false;
        this.receiveShadow = false;
        this.userData = {};
    }
    
    setMatrixAt = vi.fn();
    getMatrixAt = vi.fn();
    dispose = vi.fn();
}

// Mock Matrix4 class
export class Matrix4 {
    constructor() {
        this.elements = new Array(16).fill(0);
    }
    
    makeTranslation = vi.fn(() => this);
    makeRotationFromEuler = vi.fn(() => this);
    makeScale = vi.fn(() => this);
    multiply = vi.fn(() => this);
    multiplyMatrices = vi.fn(() => this);
    compose = vi.fn(() => this);
}

// Mock Color class
export class Color {
    constructor(color = 0xffffff) {
        this.r = 1;
        this.g = 1;
        this.b = 1;
        if (typeof color === 'number') {
            this.setHex(color);
        }
    }
    
    setHex = vi.fn((hex) => {
        this.r = ((hex >> 16) & 255) / 255;
        this.g = ((hex >> 8) & 255) / 255;
        this.b = (hex & 255) / 255;
        return this;
    });
    
    clone = vi.fn(() => {
        return new Color().setHex(this.getHex());
    });
    
    lerp = vi.fn((color, alpha) => {
        this.r += (color.r - this.r) * alpha;
        this.g += (color.g - this.g) * alpha;
        this.b += (color.b - this.b) * alpha;
        return this;
    });
    
    getHex = vi.fn(() => {
        return (Math.round(this.r * 255) << 16) + (Math.round(this.g * 255) << 8) + Math.round(this.b * 255);
    });
    
    getHexString = vi.fn(() => {
        return this.getHex().toString(16).padStart(6, '0');
    });
}

// Mock HemisphereLight class
export class HemisphereLight {
    constructor(skyColor = 0xffffff, groundColor = 0x444444, intensity = 1) {
        this.skyColor = skyColor;
        this.groundColor = groundColor;
        this.intensity = intensity;
        this.position = new Vector3();
    }
}

// Mock CylinderGeometry class
export class CylinderGeometry {
    constructor(radiusTop = 1, radiusBottom = 1, height = 1, radialSegments = 8) {
        this.type = 'CylinderGeometry';
        this.parameters = {
            radiusTop,
            radiusBottom,
            height,
            radialSegments
        };
        this.radiusTop = radiusTop;
        this.radiusBottom = radiusBottom;
        this.height = height;
        this.radialSegments = radialSegments;
    }
    
    dispose = vi.fn();
}

// Mock ConeGeometry class
export class ConeGeometry {
    constructor(radius = 1, height = 1, radialSegments = 8) {
        this.type = 'ConeGeometry';
        this.parameters = {
            radius,
            height,
            radialSegments
        };
        this.radius = radius;
        this.height = height;
        this.radialSegments = radialSegments;
    }
    
    dispose = vi.fn();
}

// Mock IcosahedronGeometry class
export class IcosahedronGeometry {
    constructor(radius = 1, detail = 0) {
        this.type = 'IcosahedronGeometry';
        this.parameters = {
            radius,
            detail
        };
        this.radius = radius;
        this.detail = detail;
    }
    
    dispose = vi.fn();
}

// Mock DodecahedronGeometry class
export class DodecahedronGeometry {
    constructor(radius = 1, detail = 0) {
        this.type = 'DodecahedronGeometry';
        this.parameters = {
            radius,
            detail
        };
        this.radius = radius;
        this.detail = detail;
    }
    
    dispose = vi.fn();
}

// Mock OctahedronGeometry class
export class OctahedronGeometry {
    constructor(radius = 1, detail = 0) {
        this.type = 'OctahedronGeometry';
        this.parameters = {
            radius,
            detail
        };
        this.radius = radius;
        this.detail = detail;
    }
    
    dispose = vi.fn();
}

// Mock TorusGeometry class
export class TorusGeometry {
    constructor(radius = 1, tube = 0.4, radialSegments = 8, tubularSegments = 6) {
        this.type = 'TorusGeometry';
        this.parameters = {
            radius,
            tube,
            radialSegments,
            tubularSegments
        };
        this.radius = radius;
        this.tube = tube;
        this.radialSegments = radialSegments;
        this.tubularSegments = tubularSegments;
    }
    
    dispose = vi.fn();
}

// Mock PlaneGeometry class
export class PlaneGeometry {
    constructor(width = 1, height = 1, widthSegments = 1, heightSegments = 1) {
        this.type = 'PlaneGeometry';
        this.parameters = {
            width,
            height,
            widthSegments,
            heightSegments
        };
        this.width = width;
        this.height = height;
        this.widthSegments = widthSegments;
        this.heightSegments = heightSegments;
    }
    
    dispose = vi.fn();
}

// Mock Euler class
export class Euler {
    constructor(x = 0, y = 0, z = 0, order = 'XYZ') {
        this.x = x;
        this.y = y;
        this.z = z;
        this.order = order;
    }
    
    set = vi.fn((x, y, z, order) => {
        this.x = x;
        this.y = y;
        this.z = z;
        if (order !== undefined) this.order = order;
        return this;
    });
    
    copy = vi.fn((euler) => {
        this.x = euler.x;
        this.y = euler.y;
        this.z = euler.z;
        this.order = euler.order;
        return this;
    });
}



// Mock Frustum class
export class Frustum {
    constructor() {
        this.planes = [];
    }
    
    setFromProjectionMatrix = vi.fn((matrix) => this);
    intersectsObject = vi.fn(() => true);
    intersectsBox = vi.fn(() => true);
    intersectsSphere = vi.fn(() => true);
}

// Mock CanvasTexture class
export class CanvasTexture {
    constructor(canvas) {
        this.canvas = canvas;
        this.wrapS = 1000;
        this.wrapT = 1000;
        this.repeat = new Vector3(1, 1, 1);
    }
    
    dispose = vi.fn();
}

// Mock Fog class
export class Fog {
    constructor(color = 0xffffff, near = 1, far = 1000) {
        this.color = color;
        this.near = near;
        this.far = far;
    }
}

// Mock MathUtils
export const MathUtils = {
    lerp: vi.fn((a, b, t) => a + (b - a) * t),
    clamp: vi.fn((value, min, max) => Math.max(min, Math.min(max, value)))
};

// Mock constants
export const PCFSoftShadowMap = 1;
export const DynamicDrawUsage = 35048;
export const RepeatWrapping = 1000;

// Export default object with all classes
export default {
    Vector3,
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    SphereGeometry,
    BoxGeometry,
    CylinderGeometry,
    ConeGeometry,
    IcosahedronGeometry,
    DodecahedronGeometry,
    OctahedronGeometry,
    TorusGeometry,
    PlaneGeometry,
    MeshBasicMaterial,
    MeshStandardMaterial,
    MeshLambertMaterial,
    Object3D,
    Group,
    Mesh,
    DirectionalLight,
    AmbientLight,
    HemisphereLight,
    InstancedMesh,
    Matrix4,
    Color,
    Euler,
    Quaternion,
    Frustum,
    CanvasTexture,
    Fog,
    MathUtils,
    PCFSoftShadowMap,
    DynamicDrawUsage,
    RepeatWrapping
};