/**
 * Mock implementation for Browser APIs
 * Provides mocks for DOM, Canvas, WebGL, and device orientation APIs
 */

import { vi } from 'vitest';

// Mock Canvas API
export const mockCanvas = {
    width: 800,
    height: 600,
    
    getContext: vi.fn((contextType) => {
        if (contextType === '2d') {
            return mockCanvas2DContext;
        } else if (contextType === 'webgl' || contextType === 'experimental-webgl') {
            return mockWebGLContext;
        }
        return null;
    }),
    
    toDataURL: vi.fn(() => 'data:image/png;base64,mock-data'),
    toBlob: vi.fn((callback) => {
        const blob = new Blob(['mock-blob'], { type: 'image/png' });
        callback(blob);
    }),
    
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    
    style: {
        width: '800px',
        height: '600px',
        display: 'block'
    }
};

// Mock Canvas 2D Context
export const mockCanvas2DContext = {
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    font: '10px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    
    // Drawing methods
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    clearRect: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    measureText: vi.fn(() => ({ width: 100 })),
    
    // Path methods
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    
    // Transform methods
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    transform: vi.fn(),
    setTransform: vi.fn(),
    
    // Image methods
    drawImage: vi.fn(),
    createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 })),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 })),
    putImageData: vi.fn()
};

// Mock WebGL Context
export const mockWebGLContext = {
    // WebGL constants
    VERTEX_SHADER: 35633,
    FRAGMENT_SHADER: 35632,
    ARRAY_BUFFER: 34962,
    ELEMENT_ARRAY_BUFFER: 34963,
    STATIC_DRAW: 35044,
    DYNAMIC_DRAW: 35048,
    TRIANGLES: 4,
    UNSIGNED_SHORT: 5123,
    FLOAT: 5126,
    DEPTH_TEST: 2929,
    BLEND: 3042,
    CULL_FACE: 2884,
    
    // Canvas properties
    canvas: mockCanvas,
    drawingBufferWidth: 800,
    drawingBufferHeight: 600,
    
    // WebGL methods
    createShader: vi.fn(() => ({})),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    createProgram: vi.fn(() => ({})),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    useProgram: vi.fn(),
    deleteShader: vi.fn(),
    deleteProgram: vi.fn(),
    
    // Buffer methods
    createBuffer: vi.fn(() => ({})),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    deleteBuffer: vi.fn(),
    
    // Texture methods
    createTexture: vi.fn(() => ({})),
    bindTexture: vi.fn(),
    texImage2D: vi.fn(),
    texParameteri: vi.fn(),
    generateMipmap: vi.fn(),
    deleteTexture: vi.fn(),
    
    // Attribute methods
    getAttribLocation: vi.fn(() => 0),
    enableVertexAttribArray: vi.fn(),
    disableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    
    // Uniform methods
    getUniformLocation: vi.fn(() => ({})),
    uniform1f: vi.fn(),
    uniform1i: vi.fn(),
    uniform2f: vi.fn(),
    uniform3f: vi.fn(),
    uniform4f: vi.fn(),
    uniformMatrix4fv: vi.fn(),
    
    // Drawing methods
    viewport: vi.fn(),
    clear: vi.fn(),
    clearColor: vi.fn(),
    clearDepth: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
    depthFunc: vi.fn(),
    blendFunc: vi.fn(),
    cullFace: vi.fn(),
    frontFace: vi.fn(),
    drawArrays: vi.fn(),
    drawElements: vi.fn(),
    
    // State methods
    getParameter: vi.fn((param) => {
        switch (param) {
            case 7938: return 'Mock WebGL Renderer'; // RENDERER
            case 7937: return 'Mock WebGL Vendor'; // VENDOR
            case 7936: return 'Mock WebGL Version'; // VERSION
            default: return null;
        }
    }),
    getShaderParameter: vi.fn(() => true),
    getProgramParameter: vi.fn(() => true),
    getShaderInfoLog: vi.fn(() => ''),
    getProgramInfoLog: vi.fn(() => ''),
    getError: vi.fn(() => 0), // NO_ERROR
    
    // Extension methods
    getExtension: vi.fn((name) => {
        const extensions = {
            'WEBGL_debug_renderer_info': {
                UNMASKED_VENDOR_WEBGL: 37445,
                UNMASKED_RENDERER_WEBGL: 37446
            },
            'OES_element_index_uint': {},
            'WEBGL_lose_context': {
                loseContext: vi.fn(),
                restoreContext: vi.fn()
            }
        };
        return extensions[name] || null;
    }),
    getSupportedExtensions: vi.fn(() => [
        'WEBGL_debug_renderer_info',
        'OES_element_index_uint',
        'WEBGL_lose_context'
    ])
};

// Mock DOM APIs
export const mockDocument = {
    createElement: vi.fn((tagName) => {
        const element = {
            tagName: tagName.toUpperCase(),
            style: {},
            classList: {
                add: vi.fn(),
                remove: vi.fn(),
                contains: vi.fn(() => false),
                toggle: vi.fn()
            },
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
            appendChild: vi.fn(),
            removeChild: vi.fn(),
            getAttribute: vi.fn(),
            setAttribute: vi.fn(),
            removeAttribute: vi.fn(),
            innerHTML: '',
            textContent: '',
            id: '',
            className: ''
        };
        
        // Special handling for canvas elements
        if (tagName.toLowerCase() === 'canvas') {
            Object.assign(element, mockCanvas);
        }
        
        return element;
    }),
    
    getElementById: vi.fn(() => null),
    querySelector: vi.fn(() => null),
    querySelectorAll: vi.fn(() => []),
    
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    
    body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
        contains: vi.fn(() => true),
        style: {},
        classList: {
            add: vi.fn(),
            remove: vi.fn(),
            contains: vi.fn(() => false),
            toggle: vi.fn()
        }
    },
    
    head: {
        appendChild: vi.fn(),
        removeChild: vi.fn()
    }
};

// Mock Window APIs
export const mockWindow = {
    innerWidth: 1024,
    innerHeight: 768,
    devicePixelRatio: 1,
    
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    
    requestAnimationFrame: vi.fn((callback) => {
        const id = setTimeout(callback, 16); // ~60fps
        return id;
    }),
    cancelAnimationFrame: vi.fn((id) => {
        clearTimeout(id);
    }),
    
    setTimeout: vi.fn((callback, delay) => {
        return global.setTimeout(callback, delay);
    }),
    clearTimeout: vi.fn((id) => {
        global.clearTimeout(id);
    }),
    
    setInterval: vi.fn((callback, delay) => {
        return global.setInterval(callback, delay);
    }),
    clearInterval: vi.fn((id) => {
        global.clearInterval(id);
    }),
    
    // Performance API
    performance: {
        now: vi.fn(() => Date.now()),
        mark: vi.fn(),
        measure: vi.fn(),
        getEntriesByType: vi.fn(() => []),
        getEntriesByName: vi.fn(() => [])
    },
    
    // Location API
    location: {
        href: 'http://localhost:3000',
        origin: 'http://localhost:3000',
        pathname: '/',
        search: '',
        hash: '',
        reload: vi.fn()
    },
    
    // Media Query API
    matchMedia: vi.fn((query) => ({
        matches: query.includes('pointer: coarse') ? false : true, // Default to desktop
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
    }))
};

// Mock Device Orientation API
export const mockDeviceOrientationEvent = {
    alpha: 0,
    beta: 0,
    gamma: 0,
    absolute: false,
    
    // Static method to request permission (iOS 13+)
    requestPermission: vi.fn(() => Promise.resolve('granted'))
};

// Mock Touch Events
export const mockTouchEvent = {
    touches: [],
    targetTouches: [],
    changedTouches: [],
    
    preventDefault: vi.fn(),
    stopPropagation: vi.fn()
};

// Mock Touch object
export const createMockTouch = (identifier = 0, clientX = 0, clientY = 0) => ({
    identifier,
    clientX,
    clientY,
    pageX: clientX,
    pageY: clientY,
    screenX: clientX,
    screenY: clientY,
    target: mockDocument.body
});

// Mock Keyboard Event
export const mockKeyboardEvent = {
    key: '',
    code: '',
    keyCode: 0,
    which: 0,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    
    preventDefault: vi.fn(),
    stopPropagation: vi.fn()
};

// Mock Mouse Event
export const mockMouseEvent = {
    clientX: 0,
    clientY: 0,
    pageX: 0,
    pageY: 0,
    screenX: 0,
    screenY: 0,
    button: 0,
    buttons: 0,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    
    preventDefault: vi.fn(),
    stopPropagation: vi.fn()
};

// Mock Audio Context (Web Audio API)
export const mockAudioContext = {
    state: 'running',
    sampleRate: 44100,
    currentTime: 0,
    destination: {
        channelCount: 2,
        channelCountMode: 'explicit',
        channelInterpretation: 'speakers'
    },
    
    createOscillator: vi.fn(() => ({
        frequency: { value: 440 },
        type: 'sine',
        start: vi.fn(),
        stop: vi.fn(),
        connect: vi.fn(),
        disconnect: vi.fn()
    })),
    
    createGain: vi.fn(() => ({
        gain: { value: 1 },
        connect: vi.fn(),
        disconnect: vi.fn()
    })),
    
    createAnalyser: vi.fn(() => ({
        fftSize: 2048,
        frequencyBinCount: 1024,
        getByteFrequencyData: vi.fn(),
        getByteTimeDomainData: vi.fn(),
        connect: vi.fn(),
        disconnect: vi.fn()
    })),
    
    resume: vi.fn(() => Promise.resolve()),
    suspend: vi.fn(() => Promise.resolve()),
    close: vi.fn(() => Promise.resolve())
};

// Mock Geolocation API
export const mockGeolocation = {
    getCurrentPosition: vi.fn((success, error) => {
        const position = {
            coords: {
                latitude: 37.7749,
                longitude: -122.4194,
                accuracy: 10,
                altitude: null,
                altitudeAccuracy: null,
                heading: null,
                speed: null
            },
            timestamp: Date.now()
        };
        success(position);
    }),
    
    watchPosition: vi.fn(() => 1),
    clearWatch: vi.fn()
};

// Setup function to apply all mocks to global objects
export const setupBrowserMocks = () => {
    // Mock global objects
    global.document = mockDocument;
    global.window = mockWindow;
    global.navigator = {
        userAgent: 'Mozilla/5.0 (Test Environment)',
        geolocation: mockGeolocation,
        permissions: {
            query: vi.fn(() => Promise.resolve({ state: 'granted' }))
        }
    };
    
    // Mock constructors
    global.HTMLCanvasElement = vi.fn(() => mockCanvas);
    global.CanvasRenderingContext2D = vi.fn(() => mockCanvas2DContext);
    global.WebGLRenderingContext = vi.fn(() => mockWebGLContext);
    global.AudioContext = vi.fn(() => mockAudioContext);
    global.webkitAudioContext = vi.fn(() => mockAudioContext);
    
    // Mock event constructors
    global.DeviceOrientationEvent = vi.fn(() => mockDeviceOrientationEvent);
    global.DeviceOrientationEvent.requestPermission = mockDeviceOrientationEvent.requestPermission;
    global.TouchEvent = vi.fn(() => mockTouchEvent);
    global.KeyboardEvent = vi.fn(() => mockKeyboardEvent);
    global.MouseEvent = vi.fn(() => mockMouseEvent);
    
    // Mock requestAnimationFrame globally
    global.requestAnimationFrame = mockWindow.requestAnimationFrame;
    global.cancelAnimationFrame = mockWindow.cancelAnimationFrame;
};

// Cleanup function to restore original implementations
export const cleanupBrowserMocks = () => {
    // Reset all mocks
    vi.clearAllMocks();
};

// Export all mocks
export {
    mockCanvas,
    mockCanvas2DContext,
    mockWebGLContext,
    mockDocument,
    mockWindow,
    mockDeviceOrientationEvent,
    mockTouchEvent,
    mockKeyboardEvent,
    mockMouseEvent,
    mockAudioContext,
    mockGeolocation,
    createMockTouch
};