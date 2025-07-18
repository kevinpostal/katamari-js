/**
 * Mock helper utilities for creating standardized mock objects
 * Provides consistent mock implementations for testing
 */

import { vi } from 'vitest';

/**
 * Creates a comprehensive mock for Three.js objects
 * @param {string} type - Type of Three.js object to mock
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock Three.js object
 */
export function createThreeJsMock(type, overrides = {}) {
    const baseMock = {
        uuid: `mock-${type}-${Math.random().toString(36).substr(2, 9)}`,
        name: '',
        type: type,
        parent: null,
        children: [],
        up: { x: 0, y: 1, z: 0 },
        position: { x: 0, y: 0, z: 0, set: vi.fn(), copy: vi.fn() },
        rotation: { x: 0, y: 0, z: 0, set: vi.fn(), copy: vi.fn() },
        quaternion: { x: 0, y: 0, z: 0, w: 1, set: vi.fn(), copy: vi.fn() },
        scale: { x: 1, y: 1, z: 1, set: vi.fn(), copy: vi.fn() },
        matrix: { elements: new Array(16).fill(0) },
        matrixWorld: { elements: new Array(16).fill(0) },
        matrixAutoUpdate: true,
        matrixWorldNeedsUpdate: false,
        visible: true,
        castShadow: false,
        receiveShadow: false,
        frustumCulled: true,
        renderOrder: 0,
        userData: {},
        add: vi.fn(function(object) { 
            this.children.push(object); 
            object.parent = this; 
        }),
        remove: vi.fn(function(object) { 
            const index = this.children.indexOf(object);
            if (index !== -1) {
                this.children.splice(index, 1);
                object.parent = null;
            }
        }),
        removeFromParent: vi.fn(),
        clear: vi.fn(function() { this.children.length = 0; }),
        getObjectById: vi.fn(),
        getObjectByName: vi.fn(),
        getObjectByProperty: vi.fn(),
        getWorldPosition: vi.fn(),
        getWorldQuaternion: vi.fn(),
        getWorldScale: vi.fn(),
        getWorldDirection: vi.fn(),
        raycast: vi.fn(),
        traverse: vi.fn(),
        traverseVisible: vi.fn(),
        traverseAncestors: vi.fn(),
        updateMatrix: vi.fn(),
        updateMatrixWorld: vi.fn(),
        updateWorldMatrix: vi.fn(),
        toJSON: vi.fn(),
        clone: vi.fn(() => createThreeJsMock(type, overrides)),
        copy: vi.fn(),
        addEventListener: vi.fn(),
        hasEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
    };

    // Type-specific mocks
    switch (type) {
        case 'Scene':
            return {
                ...baseMock,
                isScene: true,
                background: null,
                environment: null,
                fog: null,
                overrideMaterial: null,
                autoUpdate: true,
                ...overrides
            };

        case 'PerspectiveCamera':
            return {
                ...baseMock,
                isPerspectiveCamera: true,
                fov: 50,
                zoom: 1,
                near: 0.1,
                far: 2000,
                focus: 10,
                aspect: 1,
                view: null,
                filmGauge: 35,
                filmOffset: 0,
                updateProjectionMatrix: vi.fn(),
                getEffectiveFOV: vi.fn(),
                getFilmWidth: vi.fn(),
                getFilmHeight: vi.fn(),
                setViewOffset: vi.fn(),
                clearViewOffset: vi.fn(),
                setFocalLength: vi.fn(),
                getFocalLength: vi.fn(),
                lookAt: vi.fn(),
                ...overrides
            };

        case 'WebGLRenderer':
            return {
                domElement: document.createElement('canvas'),
                context: {},
                autoClear: true,
                autoClearColor: true,
                autoClearDepth: true,
                autoClearStencil: true,
                sortObjects: true,
                clippingPlanes: [],
                localClippingEnabled: false,
                gammaFactor: 2.0,
                outputEncoding: 3000,
                physicallyCorrectLights: false,
                toneMapping: 0,
                toneMappingExposure: 1.0,
                shadowMap: {
                    enabled: false,
                    autoUpdate: true,
                    needsUpdate: false,
                    type: 1
                },
                setSize: vi.fn(),
                setPixelRatio: vi.fn(),
                setViewport: vi.fn(),
                setScissor: vi.fn(),
                setScissorTest: vi.fn(),
                getClearColor: vi.fn(),
                setClearColor: vi.fn(),
                getClearAlpha: vi.fn(),
                setClearAlpha: vi.fn(),
                clear: vi.fn(),
                clearColor: vi.fn(),
                clearDepth: vi.fn(),
                clearStencil: vi.fn(),
                render: vi.fn(),
                renderBufferDirect: vi.fn(),
                compile: vi.fn(),
                compileAsync: vi.fn(),
                dispose: vi.fn(),
                forceContextLoss: vi.fn(),
                forceContextRestore: vi.fn(),
                getPixelRatio: vi.fn(() => 1),
                getSize: vi.fn(() => ({ width: 1024, height: 768 })),
                ...overrides
            };

        case 'Mesh':
            return {
                ...baseMock,
                isMesh: true,
                geometry: createThreeJsMock('BufferGeometry'),
                material: createThreeJsMock('MeshBasicMaterial'),
                drawMode: 0,
                updateMorphTargets: vi.fn(),
                raycast: vi.fn(),
                ...overrides
            };

        case 'BufferGeometry':
            return {
                ...baseMock,
                isBufferGeometry: true,
                index: null,
                attributes: {},
                morphAttributes: {},
                morphTargetsRelative: false,
                groups: [],
                boundingBox: null,
                boundingSphere: null,
                drawRange: { start: 0, count: Infinity },
                userData: {},
                setIndex: vi.fn(),
                getAttribute: vi.fn(),
                setAttribute: vi.fn(),
                deleteAttribute: vi.fn(),
                hasAttribute: vi.fn(),
                addGroup: vi.fn(),
                clearGroups: vi.fn(),
                setDrawRange: vi.fn(),
                applyMatrix4: vi.fn(),
                applyQuaternion: vi.fn(),
                rotateX: vi.fn(),
                rotateY: vi.fn(),
                rotateZ: vi.fn(),
                translate: vi.fn(),
                scale: vi.fn(),
                lookAt: vi.fn(),
                center: vi.fn(),
                setFromPoints: vi.fn(),
                computeBoundingBox: vi.fn(),
                computeBoundingSphere: vi.fn(),
                computeTangents: vi.fn(),
                computeVertexNormals: vi.fn(),
                merge: vi.fn(),
                normalizeNormals: vi.fn(),
                dispose: vi.fn(),
                ...overrides
            };

        case 'MeshBasicMaterial':
            return {
                ...baseMock,
                isMeshBasicMaterial: true,
                color: { r: 1, g: 1, b: 1 },
                map: null,
                lightMap: null,
                lightMapIntensity: 1,
                aoMap: null,
                aoMapIntensity: 1,
                specularMap: null,
                alphaMap: null,
                envMap: null,
                combine: 0,
                reflectivity: 1,
                refractionRatio: 0.98,
                wireframe: false,
                wireframeLinewidth: 1,
                wireframeLinecap: 'round',
                wireframeLinejoin: 'round',
                fog: true,
                setValues: vi.fn(),
                dispose: vi.fn(),
                ...overrides
            };

        default:
            return { ...baseMock, ...overrides };
    }
}

/**
 * Creates a comprehensive mock for Cannon-ES physics objects
 * @param {string} type - Type of Cannon-ES object to mock
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock Cannon-ES object
 */
export function createCannonMock(type, overrides = {}) {
    const baseMock = {
        id: Math.floor(Math.random() * 1000000),
        type: type
    };

    switch (type) {
        case 'World':
            return {
                ...baseMock,
                gravity: { x: 0, y: -9.82, z: 0 },
                broadphase: {},
                solver: {},
                bodies: [],
                contacts: [],
                contactmaterials: [],
                time: 0,
                stepnumber: 0,
                default_contact_material: {},
                allowSleep: false,
                collisionMatrix: {},
                collisionMatrixPrevious: {},
                bodyOverlapKeeper: {},
                shapeOverlapKeeper: {},
                materials: [],
                contactPointPool: [],
                frictionEquationPool: [],
                narrowPhase: {},
                addBody: vi.fn(function(body) { 
                    this.bodies.push(body); 
                    body.world = this;
                }),
                removeBody: vi.fn(function(body) { 
                    const index = this.bodies.indexOf(body);
                    if (index !== -1) {
                        this.bodies.splice(index, 1);
                        body.world = null;
                    }
                }),
                addContactMaterial: vi.fn(),
                removeContactMaterial: vi.fn(),
                step: vi.fn(function(dt) { 
                    this.time += dt; 
                    this.stepnumber++; 
                }),
                rayTest: vi.fn(),
                raycastAll: vi.fn(),
                raycastAny: vi.fn(),
                raycastClosest: vi.fn(),
                ...overrides
            };

        case 'Body':
            return {
                ...baseMock,
                position: { x: 0, y: 0, z: 0, set: vi.fn(), copy: vi.fn() },
                previousPosition: { x: 0, y: 0, z: 0 },
                interpolatedPosition: { x: 0, y: 0, z: 0 },
                initPosition: { x: 0, y: 0, z: 0 },
                velocity: { x: 0, y: 0, z: 0, set: vi.fn(), copy: vi.fn() },
                initVelocity: { x: 0, y: 0, z: 0 },
                force: { x: 0, y: 0, z: 0 },
                mass: 0,
                invMass: 0,
                material: null,
                linearDamping: 0.01,
                type: 1,
                allowSleep: true,
                sleepState: 0,
                sleepSpeedLimit: 0.1,
                sleepTimeLimit: 1,
                timeLastSleepy: 0,
                wakeUpAfterNarrowphase: false,
                torque: { x: 0, y: 0, z: 0 },
                quaternion: { x: 0, y: 0, z: 0, w: 1, set: vi.fn(), copy: vi.fn() },
                initQuaternion: { x: 0, y: 0, z: 0, w: 1 },
                previousQuaternion: { x: 0, y: 0, z: 0, w: 1 },
                interpolatedQuaternion: { x: 0, y: 0, z: 0, w: 1 },
                angularVelocity: { x: 0, y: 0, z: 0 },
                initAngularVelocity: { x: 0, y: 0, z: 0 },
                shapes: [],
                shapeOffsets: [],
                shapeOrientations: [],
                inertia: { x: 0, y: 0, z: 0 },
                invInertia: { x: 0, y: 0, z: 0 },
                invInertiaWorld: {},
                invMassSolve: 0,
                invInertiaSolve: { x: 0, y: 0, z: 0 },
                invInertiaWorldSolve: {},
                fixedRotation: false,
                angularDamping: 0.01,
                linearFactor: { x: 1, y: 1, z: 1 },
                angularFactor: { x: 1, y: 1, z: 1 },
                aabb: {},
                aabbNeedsUpdate: true,
                boundingRadius: 0,
                wlambda: { x: 0, y: 0, z: 0 },
                isTrigger: false,
                world: null,
                addShape: vi.fn(function(shape) { 
                    this.shapes.push(shape); 
                }),
                removeShape: vi.fn(),
                updateBoundingRadius: vi.fn(),
                updateAABB: vi.fn(),
                updateInertiaWorld: vi.fn(),
                applyForce: vi.fn(),
                applyLocalForce: vi.fn(),
                applyTorque: vi.fn(),
                applyImpulse: vi.fn(),
                applyLocalImpulse: vi.fn(),
                updateMassProperties: vi.fn(),
                getVelocityAtWorldPoint: vi.fn(),
                integrate: vi.fn(),
                ...overrides
            };

        case 'Sphere':
            return {
                ...baseMock,
                radius: 1,
                type: 1,
                calculateLocalInertia: vi.fn(),
                volume: vi.fn(() => (4/3) * Math.PI * Math.pow(this.radius, 3)),
                updateBoundingSphereRadius: vi.fn(),
                calculateWorldAABB: vi.fn(),
                ...overrides
            };

        case 'Box':
            return {
                ...baseMock,
                halfExtents: { x: 1, y: 1, z: 1 },
                type: 2,
                calculateLocalInertia: vi.fn(),
                getSideNormals: vi.fn(),
                volume: vi.fn(() => 8 * this.halfExtents.x * this.halfExtents.y * this.halfExtents.z),
                updateBoundingSphereRadius: vi.fn(),
                calculateWorldAABB: vi.fn(),
                ...overrides
            };

        default:
            return { ...baseMock, ...overrides };
    }
}

/**
 * Creates a comprehensive mock for Tone.js audio objects
 * @param {string} type - Type of Tone.js object to mock
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock Tone.js object
 */
export function createToneMock(type, overrides = {}) {
    const baseMock = {
        name: type,
        input: {},
        output: {},
        context: {
            state: 'running',
            sampleRate: 44100,
            currentTime: 0,
            resume: vi.fn(() => Promise.resolve())
        },
        disposed: false,
        connect: vi.fn(),
        disconnect: vi.fn(),
        toDestination: vi.fn(),
        dispose: vi.fn(function() { this.disposed = true; }),
        get: vi.fn(),
        set: vi.fn()
    };

    switch (type) {
        case 'MembraneSynth':
            return {
                ...baseMock,
                oscillator: {
                    type: 'sine',
                    frequency: { value: 440 }
                },
                envelope: {
                    attack: 0.001,
                    decay: 0.4,
                    sustain: 0.01,
                    release: 1.4,
                    attackCurve: 'exponential'
                },
                octaves: 10,
                pitchDecay: 0.05,
                volume: { value: -12 },
                triggerAttack: vi.fn(),
                triggerRelease: vi.fn(),
                triggerAttackRelease: vi.fn((note, duration, time, velocity) => {
                    // Simulate attack and release
                    setTimeout(() => {
                        // Mock attack phase
                    }, 0);
                    setTimeout(() => {
                        // Mock release phase
                    }, duration * 1000 || 100);
                }),
                setNote: vi.fn(),
                ...overrides
            };

        case 'NoiseSynth':
            return {
                ...baseMock,
                noise: {
                    type: 'white',
                    playbackRate: 1
                },
                envelope: {
                    attack: 0.005,
                    decay: 0.1,
                    sustain: 0.0,
                    release: 0.1
                },
                volume: { value: -12 },
                triggerAttack: vi.fn(),
                triggerRelease: vi.fn(),
                triggerAttackRelease: vi.fn((duration, time, velocity) => {
                    setTimeout(() => {
                        // Mock noise generation
                    }, 0);
                }),
                ...overrides
            };

        case 'Synth':
            return {
                ...baseMock,
                oscillator: {
                    type: 'triangle',
                    frequency: { value: 440 }
                },
                envelope: {
                    attack: 0.005,
                    decay: 0.1,
                    sustain: 0.3,
                    release: 1
                },
                volume: { value: -12 },
                triggerAttack: vi.fn(),
                triggerRelease: vi.fn(),
                triggerAttackRelease: vi.fn((note, duration, time, velocity) => {
                    setTimeout(() => {
                        // Mock synthesis
                    }, 0);
                }),
                setNote: vi.fn(),
                ...overrides
            };

        case 'Player':
            return {
                ...baseMock,
                buffer: null,
                loop: false,
                loopStart: 0,
                loopEnd: 0,
                autostart: false,
                playbackRate: 1,
                reverse: false,
                volume: { value: -12 },
                state: 'stopped',
                start: vi.fn(function(time, offset, duration) {
                    this.state = 'started';
                }),
                stop: vi.fn(function(time) {
                    this.state = 'stopped';
                }),
                restart: vi.fn(),
                seek: vi.fn(),
                load: vi.fn(() => Promise.resolve()),
                ...overrides
            };

        default:
            return { ...baseMock, ...overrides };
    }
}

/**
 * Creates mock browser API objects
 * @param {string} api - API name to mock
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock browser API object
 */
export function createBrowserAPIMock(api, overrides = {}) {
    switch (api) {
        case 'localStorage':
            const storage = new Map();
            return {
                getItem: vi.fn((key) => storage.get(key) || null),
                setItem: vi.fn((key, value) => storage.set(key, String(value))),
                removeItem: vi.fn((key) => storage.delete(key)),
                clear: vi.fn(() => storage.clear()),
                key: vi.fn((index) => Array.from(storage.keys())[index] || null),
                get length() { return storage.size; },
                ...overrides
            };

        case 'sessionStorage':
            const sessionStorage = new Map();
            return {
                getItem: vi.fn((key) => sessionStorage.get(key) || null),
                setItem: vi.fn((key, value) => sessionStorage.set(key, String(value))),
                removeItem: vi.fn((key) => sessionStorage.delete(key)),
                clear: vi.fn(() => sessionStorage.clear()),
                key: vi.fn((index) => Array.from(sessionStorage.keys())[index] || null),
                get length() { return sessionStorage.size; },
                ...overrides
            };

        case 'location':
            return {
                href: 'http://localhost:3000/',
                origin: 'http://localhost:3000',
                protocol: 'http:',
                host: 'localhost:3000',
                hostname: 'localhost',
                port: '3000',
                pathname: '/',
                search: '',
                hash: '',
                assign: vi.fn(),
                replace: vi.fn(),
                reload: vi.fn(),
                toString: vi.fn(() => 'http://localhost:3000/'),
                ...overrides
            };

        case 'navigator':
            return {
                userAgent: 'Mozilla/5.0 (Test Environment)',
                platform: 'Test',
                language: 'en-US',
                languages: ['en-US', 'en'],
                cookieEnabled: true,
                onLine: true,
                geolocation: {
                    getCurrentPosition: vi.fn(),
                    watchPosition: vi.fn(),
                    clearWatch: vi.fn()
                },
                permissions: {
                    query: vi.fn(() => Promise.resolve({ state: 'granted' }))
                },
                ...overrides
            };

        default:
            return { ...overrides };
    }
}

/**
 * Creates a mock event object
 * @param {string} type - Event type
 * @param {Object} properties - Event properties
 * @returns {Object} Mock event object
 */
export function createMockEvent(type, properties = {}) {
    return {
        type,
        target: null,
        currentTarget: null,
        bubbles: false,
        cancelable: false,
        defaultPrevented: false,
        eventPhase: 0,
        isTrusted: false,
        timeStamp: Date.now(),
        preventDefault: vi.fn(function() { this.defaultPrevented = true; }),
        stopPropagation: vi.fn(),
        stopImmediatePropagation: vi.fn(),
        ...properties
    };
}

/**
 * Creates a collection of related mocks for a specific system
 * @param {string} system - System name ('physics', 'rendering', 'audio')
 * @returns {Object} Collection of related mocks
 */
export function createSystemMocks(system) {
    switch (system) {
        case 'physics':
            return {
                world: createCannonMock('World'),
                katamariBody: createCannonMock('Body', { mass: 1 }),
                itemBodies: Array.from({ length: 10 }, () => createCannonMock('Body', { mass: 0.1 })),
                sphereShape: createCannonMock('Sphere', { radius: 1 }),
                boxShape: createCannonMock('Box', { halfExtents: { x: 0.5, y: 0.5, z: 0.5 } })
            };

        case 'rendering':
            return {
                scene: createThreeJsMock('Scene'),
                camera: createThreeJsMock('PerspectiveCamera'),
                renderer: createThreeJsMock('WebGLRenderer'),
                katamariMesh: createThreeJsMock('Mesh'),
                itemMeshes: Array.from({ length: 10 }, () => createThreeJsMock('Mesh')),
                geometry: createThreeJsMock('BufferGeometry'),
                material: createThreeJsMock('MeshBasicMaterial')
            };

        case 'audio':
            return {
                membrane: createToneMock('MembraneSynth'),
                noise: createToneMock('NoiseSynth'),
                synth: createToneMock('Synth'),
                player: createToneMock('Player'),
                context: {
                    state: 'running',
                    resume: vi.fn(() => Promise.resolve())
                }
            };

        default:
            return {};
    }
}