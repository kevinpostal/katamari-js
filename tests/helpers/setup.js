/**
 * Global test setup file for Vitest
 * This file runs before all tests and sets up the testing environment
 */

import { vi } from 'vitest';

// Mock browser APIs that aren't available in jsdom
global.ResizeObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = vi.fn((id) => clearTimeout(id));

// Mock performance API
global.performance = global.performance || {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByName: vi.fn(() => []),
    getEntriesByType: vi.fn(() => []),
};

// Mock console methods for cleaner test output
global.console = {
    ...console,
    // Suppress debug logs during tests unless explicitly needed
    debug: vi.fn(),
    log: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
};

// Mock WebGL context for Three.js
const mockWebGLContext = {
    canvas: {},
    drawingBufferWidth: 1024,
    drawingBufferHeight: 768,
    getExtension: vi.fn(),
    getParameter: vi.fn((param) => {
        // Mock common WebGL parameters that Three.js checks
        if (param === 7938) return 'WebGL 2.0'; // VERSION
        if (param === 7937) return 'WebGL GLSL ES 3.00'; // SHADING_LANGUAGE_VERSION
        if (param === 7936) return 'Mock WebGL Vendor'; // VENDOR
        if (param === 7939) return 'Mock WebGL Renderer'; // RENDERER
        // Return default values for other parameters
        return 'WebGL 2.0';
    }),
    getShaderParameter: vi.fn(),
    getProgramParameter: vi.fn(),
    createShader: vi.fn(),
    createProgram: vi.fn(),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    useProgram: vi.fn(),
    getAttribLocation: vi.fn(),
    getUniformLocation: vi.fn(),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    uniform1f: vi.fn(),
    uniform2f: vi.fn(),
    uniform3f: vi.fn(),
    uniform4f: vi.fn(),
    uniformMatrix4fv: vi.fn(),
    createBuffer: vi.fn(),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    createTexture: vi.fn(),
    bindTexture: vi.fn(),
    texImage2D: vi.fn(),
    texParameteri: vi.fn(),
    generateMipmap: vi.fn(),
    viewport: vi.fn(),
    clear: vi.fn(),
    clearColor: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
    depthFunc: vi.fn(),
    blendFunc: vi.fn(),
    drawArrays: vi.fn(),
    drawElements: vi.fn(),
};

// Mock HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = vi.fn((contextType) => {
    if (contextType === 'webgl' || contextType === 'webgl2') {
        return mockWebGLContext;
    }
    if (contextType === '2d') {
        return {
            fillRect: vi.fn(),
            clearRect: vi.fn(),
            getImageData: vi.fn(() => ({
                data: new Uint8ClampedArray(1024 * 1024 * 4),
                width: 1024,
                height: 1024
            })),
            putImageData: vi.fn(),
            createImageData: vi.fn(),
            setTransform: vi.fn(),
            drawImage: vi.fn(),
            save: vi.fn(),
            restore: vi.fn(),
            beginPath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            closePath: vi.fn(),
            stroke: vi.fn(),
            fill: vi.fn(),
            arc: vi.fn(),
            rect: vi.fn(),
            translate: vi.fn(),
            rotate: vi.fn(),
            scale: vi.fn(),
            createLinearGradient: vi.fn(() => ({
                addColorStop: vi.fn()
            })),
            createRadialGradient: vi.fn(() => ({
                addColorStop: vi.fn()
            })),
            fillStyle: '#000000',
            strokeStyle: '#000000',
            lineWidth: 1,
            font: '10px sans-serif',
            textAlign: 'start',
            textBaseline: 'alphabetic'
        };
    }
    return null;
});

// Mock DeviceOrientationEvent for gyroscope testing
global.DeviceOrientationEvent = class DeviceOrientationEvent extends Event {
    constructor(type, eventInitDict = {}) {
        super(type, eventInitDict);
        this.alpha = eventInitDict.alpha || 0;
        this.beta = eventInitDict.beta || 0;
        this.gamma = eventInitDict.gamma || 0;
        this.absolute = eventInitDict.absolute || false;
    }
    
    static requestPermission = vi.fn(() => Promise.resolve('granted'));
};

// Mock AudioContext for Tone.js
global.AudioContext = vi.fn(() => ({
    createOscillator: vi.fn(),
    createGain: vi.fn(),
    createAnalyser: vi.fn(),
    createBiquadFilter: vi.fn(),
    createBuffer: vi.fn(),
    createBufferSource: vi.fn(),
    createMediaElementSource: vi.fn(),
    createMediaStreamSource: vi.fn(),
    createScriptProcessor: vi.fn(),
    decodeAudioData: vi.fn(),
    destination: {},
    sampleRate: 44100,
    currentTime: 0,
    listener: {},
    state: 'running',
    suspend: vi.fn(),
    resume: vi.fn(),
    close: vi.fn(),
}));

global.webkitAudioContext = global.AudioContext;

// Mock WebGLRenderingContext for Three.js
global.WebGLRenderingContext = vi.fn();
global.WebGL2RenderingContext = vi.fn();

// Mock URL.createObjectURL for file handling
global.URL.createObjectURL = vi.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = vi.fn();

// Mock Blob for file operations
global.Blob = vi.fn((content, options) => ({
    size: content ? content.length : 0,
    type: options?.type || '',
    arrayBuffer: vi.fn(() => Promise.resolve(new ArrayBuffer(0))),
    text: vi.fn(() => Promise.resolve('')),
    stream: vi.fn()
}));

// Mock File for file uploads
global.File = vi.fn((bits, name, options) => ({
    ...new global.Blob(bits, options),
    name,
    lastModified: Date.now(),
    webkitRelativePath: ''
}));

// Mock fetch for network requests
global.fetch = vi.fn(() => 
    Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map(),
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
        blob: () => Promise.resolve(new Blob()),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0))
    })
);

// Mock IntersectionObserver for visibility detection
global.IntersectionObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    root: null,
    rootMargin: '',
    thresholds: []
}));

// Mock MutationObserver for DOM changes
global.MutationObserver = vi.fn(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn(() => [])
}));

// Enhanced error handling for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Setup cleanup after each test
afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
});

// Setup cleanup after all tests
afterAll(() => {
    vi.restoreAllMocks();
});