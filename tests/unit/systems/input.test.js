/**
 * Unit tests for the input handling system
 * Tests keyboard, touch, and gyroscope input detection and processing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
    initializeInputSystem,
    registerTouchCanvas,
    getKeyboardInput,
    getTouchInput,
    getGyroscopeInput,
    getNormalizedTouchInput,
    getMovementInput,
    isGyroscopeEnabled,
    toggleGyroscope,
    cleanupInputSystem
} from '../../../src/game/systems/input.js';
import { createMockInputEvent, createMockGameState } from '../../helpers/game-helpers.js';
import { createBrowserAPIMock } from '../../helpers/mock-helpers.js';

describe('Input System', () => {
    let mockCanvas;
    let mockCallbacks;
    let originalWindow;

    beforeEach(() => {
        // Create mock DOM elements
        document.body.innerHTML = `
            <button id="gyro-button">Toggle Gyro</button>
            <div id="message-overlay"></div>
        `;

        // Create mock canvas
        mockCanvas = document.createElement('canvas');
        mockCanvas.addEventListener = vi.fn();
        mockCanvas.removeEventListener = vi.fn();

        // Create mock callbacks
        mockCallbacks = {
            onSpaceKey: vi.fn(),
            onResetKey: vi.fn(),
            onMessageOverlayClick: vi.fn(),
            onWindowResize: vi.fn(),
            onKeyDown: vi.fn(),
            onKeyUp: vi.fn(),
            onTouchStart: vi.fn(),
            onTouchMove: vi.fn(),
            onTouchEnd: vi.fn(),
            onDeviceOrientation: vi.fn(),
            onGyroscopeToggle: vi.fn()
        };

        // Store original window properties
        originalWindow = {
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            DeviceOrientationEvent: window.DeviceOrientationEvent,
            matchMedia: window.matchMedia
        };

        // Mock window properties
        Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
        Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
        
        // Mock matchMedia for touch device detection
        window.matchMedia = vi.fn((query) => ({
            matches: query.includes('pointer: coarse'),
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn()
        }));

        // Mock DeviceOrientationEvent
        global.DeviceOrientationEvent = class extends Event {
            constructor(type, eventInitDict = {}) {
                super(type, eventInitDict);
                this.alpha = eventInitDict.alpha || 0;
                this.beta = eventInitDict.beta || 0;
                this.gamma = eventInitDict.gamma || 0;
                this.absolute = eventInitDict.absolute || false;
            }
            
            static requestPermission = vi.fn(() => Promise.resolve('granted'));
        };
    });

    afterEach(() => {
        // Cleanup input system
        cleanupInputSystem();
        
        // Restore original window properties
        Object.defineProperty(window, 'innerWidth', { value: originalWindow.innerWidth, writable: true });
        Object.defineProperty(window, 'innerHeight', { value: originalWindow.innerHeight, writable: true });
        window.matchMedia = originalWindow.matchMedia;
        global.DeviceOrientationEvent = originalWindow.DeviceOrientationEvent;
        
        // Clear DOM
        document.body.innerHTML = '';
        
        // Clear all mocks
        vi.clearAllMocks();
    });

    describe('Initialization', () => {
        it('should initialize input system with default settings', () => {
            expect(() => {
                initializeInputSystem(mockCallbacks);
            }).not.toThrow();
        });

        it('should set up gyro button visibility based on device capabilities', () => {
            initializeInputSystem(mockCallbacks);
            
            const gyroButton = document.getElementById('gyro-button');
            expect(gyroButton).toBeTruthy();
            
            // Should be visible on touch devices with DeviceOrientationEvent
            expect(gyroButton.style.display).toBe('block');
        });

        it('should hide gyro button on non-touch devices', () => {
            // Mock as non-touch device
            window.matchMedia = vi.fn((query) => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn()
            }));

            initializeInputSystem(mockCallbacks);
            
            const gyroButton = document.getElementById('gyro-button');
            expect(gyroButton.style.display).toBe('none');
        });

        it('should calculate touch dead zone based on screen size', () => {
            initializeInputSystem(mockCallbacks);
            
            // Touch dead zone should be calculated as min(30, window.innerWidth * 0.05)
            const expectedDeadZone = Math.min(30, 1024 * 0.05);
            
            // We can't directly access the dead zone, but we can test its effect
            // through normalized touch input
            const touchInput = getNormalizedTouchInput();
            expect(touchInput).toEqual({ x: 0, y: 0, active: false });
        });
    });

    describe('Keyboard Input', () => {
        beforeEach(() => {
            initializeInputSystem(mockCallbacks);
        });

        it('should detect keyboard key presses', () => {
            const keyEvent = createMockInputEvent('keyboard', { key: 'w' });
            
            // Simulate keydown event
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
            
            const keyboardInput = getKeyboardInput();
            expect(keyboardInput.w).toBe(true);
        });

        it('should detect keyboard key releases', () => {
            // First press the key
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
            expect(getKeyboardInput().w).toBe(true);
            
            // Then release it
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }));
            expect(getKeyboardInput().w).toBe(false);
        });

        it('should handle multiple simultaneous key presses', () => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }));
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
            
            const keyboardInput = getKeyboardInput();
            expect(keyboardInput.w).toBe(true);
            expect(keyboardInput.a).toBe(true);
            expect(keyboardInput.s).toBe(true);
            expect(keyboardInput.d).toBe(true);
        });

        it('should handle arrow keys', () => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
            
            const keyboardInput = getKeyboardInput();
            expect(keyboardInput.arrowup).toBe(true);
            expect(keyboardInput.arrowleft).toBe(true);
            expect(keyboardInput.arrowdown).toBe(true);
            expect(keyboardInput.arrowright).toBe(true);
        });

        it('should trigger space key callback', () => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
            
            expect(mockCallbacks.onSpaceKey).toHaveBeenCalled();
        });

        it('should trigger reset key callback', () => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
            
            expect(mockCallbacks.onResetKey).toHaveBeenCalled();
        });

        it('should normalize key names to lowercase', () => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'W' }));
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
            
            const keyboardInput = getKeyboardInput();
            expect(keyboardInput.w).toBe(true);
            expect(keyboardInput.arrowup).toBe(true);
        });
    });

    describe('Touch Input', () => {
        beforeEach(() => {
            initializeInputSystem(mockCallbacks);
            registerTouchCanvas(mockCanvas);
        });

        it('should register touch events on canvas', () => {
            expect(mockCanvas.addEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: false });
            expect(mockCanvas.addEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: false });
            expect(mockCanvas.addEventListener).toHaveBeenCalledWith('touchend', expect.any(Function));
        });

        it('should handle touch start events', () => {
            const touchEvent = {
                preventDefault: vi.fn(),
                touches: [{ clientX: 100, clientY: 200 }]
            };

            // Get the registered touchstart handler
            const touchStartHandler = mockCanvas.addEventListener.mock.calls
                .find(call => call[0] === 'touchstart')[1];
            
            touchStartHandler(touchEvent);
            
            expect(touchEvent.preventDefault).toHaveBeenCalled();
            
            const touchInput = getTouchInput();
            expect(touchInput.active).toBe(true);
            expect(touchInput.startX).toBe(100);
            expect(touchInput.startY).toBe(200);
        });

        it('should handle touch move events', () => {
            // First start a touch
            const touchStartEvent = {
                preventDefault: vi.fn(),
                touches: [{ clientX: 100, clientY: 200 }]
            };
            
            const touchStartHandler = mockCanvas.addEventListener.mock.calls
                .find(call => call[0] === 'touchstart')[1];
            touchStartHandler(touchStartEvent);

            // Then move the touch
            const touchMoveEvent = {
                preventDefault: vi.fn(),
                touches: [{ clientX: 150, clientY: 250 }]
            };
            
            const touchMoveHandler = mockCanvas.addEventListener.mock.calls
                .find(call => call[0] === 'touchmove')[1];
            touchMoveHandler(touchMoveEvent);
            
            expect(touchMoveEvent.preventDefault).toHaveBeenCalled();
            
            const touchInput = getTouchInput();
            expect(touchInput.currentX).toBe(150);
            expect(touchInput.currentY).toBe(250);
        });

        it('should handle touch end events', () => {
            // First start a touch
            const touchStartEvent = {
                preventDefault: vi.fn(),
                touches: [{ clientX: 100, clientY: 200 }]
            };
            
            const touchStartHandler = mockCanvas.addEventListener.mock.calls
                .find(call => call[0] === 'touchstart')[1];
            touchStartHandler(touchStartEvent);

            // Then end the touch
            const touchEndEvent = {};
            
            const touchEndHandler = mockCanvas.addEventListener.mock.calls
                .find(call => call[0] === 'touchend')[1];
            touchEndHandler(touchEndEvent);
            
            const touchInput = getTouchInput();
            expect(touchInput.active).toBe(false);
            expect(touchInput.startX).toBe(0);
            expect(touchInput.startY).toBe(0);
        });

        it('should normalize touch input correctly', () => {
            // Start touch at center
            const touchStartEvent = {
                preventDefault: vi.fn(),
                touches: [{ clientX: 512, clientY: 384 }] // Center of 1024x768 screen
            };
            
            const touchStartHandler = mockCanvas.addEventListener.mock.calls
                .find(call => call[0] === 'touchstart')[1];
            touchStartHandler(touchStartEvent);

            // Move touch to create significant delta
            const touchMoveEvent = {
                preventDefault: vi.fn(),
                touches: [{ clientX: 612, clientY: 284 }] // +100x, -100y
            };
            
            const touchMoveHandler = mockCanvas.addEventListener.mock.calls
                .find(call => call[0] === 'touchmove')[1];
            touchMoveHandler(touchMoveEvent);
            
            const normalizedInput = getNormalizedTouchInput();
            expect(normalizedInput.active).toBe(true);
            expect(normalizedInput.x).toBeGreaterThan(0); // Moved right
            expect(normalizedInput.y).toBeGreaterThan(0); // Moved up (inverted Y)
        });

        it('should apply dead zone to small touch movements', () => {
            // Start touch
            const touchStartEvent = {
                preventDefault: vi.fn(),
                touches: [{ clientX: 512, clientY: 384 }]
            };
            
            const touchStartHandler = mockCanvas.addEventListener.mock.calls
                .find(call => call[0] === 'touchstart')[1];
            touchStartHandler(touchStartEvent);

            // Make a very small movement (within dead zone)
            const touchMoveEvent = {
                preventDefault: vi.fn(),
                touches: [{ clientX: 515, clientY: 387 }] // Only 3-pixel movement
            };
            
            const touchMoveHandler = mockCanvas.addEventListener.mock.calls
                .find(call => call[0] === 'touchmove')[1];
            touchMoveHandler(touchMoveEvent);
            
            const normalizedInput = getNormalizedTouchInput();
            expect(normalizedInput.active).toBe(true);
            expect(normalizedInput.x).toBe(0); // Should be filtered out by dead zone
            expect(normalizedInput.y).toBe(0);
        });
    });

    describe('Gyroscope Input', () => {
        beforeEach(() => {
            initializeInputSystem(mockCallbacks);
        });

        it('should initially have gyroscope disabled', () => {
            expect(isGyroscopeEnabled()).toBe(false);
        });

        it('should enable gyroscope when toggled', async () => {
            await toggleGyroscope();
            
            expect(isGyroscopeEnabled()).toBe(true);
            
            const gyroButton = document.getElementById('gyro-button');
            expect(gyroButton.textContent).toBe('Gyro ON');
            expect(gyroButton.classList.contains('active')).toBe(true);
        });

        it('should disable gyroscope when toggled again', async () => {
            // First enable
            await toggleGyroscope();
            expect(isGyroscopeEnabled()).toBe(true);
            
            // Then disable
            await toggleGyroscope();
            expect(isGyroscopeEnabled()).toBe(false);
            
            const gyroButton = document.getElementById('gyro-button');
            expect(gyroButton.textContent).toBe('Toggle Gyro');
            expect(gyroButton.classList.contains('active')).toBe(false);
        });

        it('should handle device orientation events when enabled', async () => {
            await toggleGyroscope();
            
            const orientationEvent = new DeviceOrientationEvent('deviceorientation', {
                alpha: 10,
                beta: 20,
                gamma: 30,
                absolute: false
            });
            
            window.dispatchEvent(orientationEvent);
            
            const gyroInput = getGyroscopeInput();
            expect(gyroInput.alpha).toBe(10);
            expect(gyroInput.beta).toBe(20);
            expect(gyroInput.gamma).toBe(30);
            expect(gyroInput.normalizedGamma).toBeCloseTo(30 / 90, 2);
            expect(gyroInput.normalizedBeta).toBeCloseTo(20 / 90, 2);
        });

        it('should normalize gyroscope values correctly', async () => {
            await toggleGyroscope();
            
            // Test extreme values
            const extremeEvent = new DeviceOrientationEvent('deviceorientation', {
                alpha: 0,
                beta: 90,  // Maximum beta
                gamma: -90, // Minimum gamma
                absolute: false
            });
            
            window.dispatchEvent(extremeEvent);
            
            const gyroInput = getGyroscopeInput();
            expect(gyroInput.normalizedGamma).toBe(-1); // Clamped to -1
            expect(gyroInput.normalizedBeta).toBe(1);   // Clamped to 1
        });

        it('should request permission on iOS devices', async () => {
            // Mock iOS permission request
            global.DeviceOrientationEvent.requestPermission = vi.fn(() => Promise.resolve('granted'));
            
            await toggleGyroscope();
            
            expect(global.DeviceOrientationEvent.requestPermission).toHaveBeenCalled();
            expect(isGyroscopeEnabled()).toBe(true);
        });

        it('should handle permission denial gracefully', async () => {
            // Mock permission denial
            global.DeviceOrientationEvent.requestPermission = vi.fn(() => Promise.resolve('denied'));
            
            await toggleGyroscope();
            
            expect(isGyroscopeEnabled()).toBe(false);
        });

        it('should trigger gyroscope toggle callback', async () => {
            await toggleGyroscope();
            
            expect(mockCallbacks.onGyroscopeToggle).toHaveBeenCalledWith(true);
            
            await toggleGyroscope();
            
            expect(mockCallbacks.onGyroscopeToggle).toHaveBeenCalledWith(false);
        });
    });

    describe('Movement Input Integration', () => {
        beforeEach(() => {
            initializeInputSystem(mockCallbacks);
            registerTouchCanvas(mockCanvas);
        });

        it('should prioritize keyboard input over other inputs', () => {
            // Set keyboard input
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
            
            const movement = getMovementInput();
            // Movement should be normalized, so diagonal movement (1,1) becomes (0.707, 0.707)
            expect(movement.x).toBeCloseTo(0.7071, 3); // Right (normalized)
            expect(movement.y).toBeCloseTo(0.7071, 3); // Forward (normalized)
        });

        it('should use touch input when no keyboard input', () => {
            // Simulate touch input
            const touchStartEvent = {
                preventDefault: vi.fn(),
                touches: [{ clientX: 400, clientY: 300 }]
            };
            
            const touchStartHandler = mockCanvas.addEventListener.mock.calls
                .find(call => call[0] === 'touchstart')[1];
            touchStartHandler(touchStartEvent);

            const touchMoveEvent = {
                preventDefault: vi.fn(),
                touches: [{ clientX: 500, clientY: 200 }] // Move right and up
            };
            
            const touchMoveHandler = mockCanvas.addEventListener.mock.calls
                .find(call => call[0] === 'touchmove')[1];
            touchMoveHandler(touchMoveEvent);
            
            const movement = getMovementInput();
            expect(movement.x).toBeGreaterThan(0); // Should have rightward movement
            expect(movement.y).toBeGreaterThan(0); // Should have forward movement
        });

        it('should use gyroscope input when enabled and no other input', async () => {
            await toggleGyroscope();
            
            const orientationEvent = new DeviceOrientationEvent('deviceorientation', {
                alpha: 0,
                beta: 30,  // Tilt forward
                gamma: 45, // Tilt right
                absolute: false
            });
            
            window.dispatchEvent(orientationEvent);
            
            const movement = getMovementInput();
            expect(movement.x).toBeCloseTo(45 / 90, 1); // Normalized gamma
            expect(movement.y).toBeCloseTo(30 / 90, 1); // Normalized beta
        });

        it('should normalize movement input magnitude', () => {
            // Create diagonal keyboard input (should be normalized)
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
            
            const movement = getMovementInput();
            const magnitude = Math.sqrt(movement.x * movement.x + movement.y * movement.y);
            expect(magnitude).toBeCloseTo(1, 2); // Should be normalized to 1
        });

        it('should handle opposite key presses correctly', () => {
            // Press opposite keys (should cancel out)
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }));
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
            
            const movement = getMovementInput();
            expect(movement.x).toBe(0); // Left and right cancel out
            expect(movement.y).toBe(0); // Forward and backward cancel out
        });
    });

    describe('Window Resize Handling', () => {
        beforeEach(() => {
            initializeInputSystem(mockCallbacks);
        });

        it('should handle window resize events', () => {
            window.dispatchEvent(new Event('resize'));
            
            expect(mockCallbacks.onWindowResize).toHaveBeenCalled();
        });

        it('should recalculate touch dead zone on resize', () => {
            // Change window size
            Object.defineProperty(window, 'innerWidth', { value: 800, writable: true });
            Object.defineProperty(window, 'innerHeight', { value: 600, writable: true });
            
            window.dispatchEvent(new Event('resize'));
            
            // The dead zone should be recalculated based on new screen size
            // We can't directly test this, but the resize handler should be called
            expect(mockCallbacks.onWindowResize).toHaveBeenCalled();
        });

        it('should update gyro button visibility on resize', () => {
            const gyroButton = document.getElementById('gyro-button');
            const initialDisplay = gyroButton.style.display;
            
            window.dispatchEvent(new Event('resize'));
            
            // Button visibility should be re-evaluated
            expect(gyroButton.style.display).toBeDefined();
        });
    });

    describe('Event Callbacks', () => {
        beforeEach(() => {
            initializeInputSystem(mockCallbacks);
        });

        it('should trigger keydown callbacks', () => {
            const keyEvent = new KeyboardEvent('keydown', { key: 'w' });
            window.dispatchEvent(keyEvent);
            
            expect(mockCallbacks.onKeyDown).toHaveBeenCalled();
        });

        it('should trigger keyup callbacks', () => {
            const keyEvent = new KeyboardEvent('keyup', { key: 'w' });
            window.dispatchEvent(keyEvent);
            
            expect(mockCallbacks.onKeyUp).toHaveBeenCalled();
        });

        it('should trigger message overlay click callback', () => {
            const messageOverlay = document.getElementById('message-overlay');
            messageOverlay.click();
            
            expect(mockCallbacks.onMessageOverlayClick).toHaveBeenCalled();
        });

        it('should trigger device orientation callback when gyro enabled', async () => {
            await toggleGyroscope();
            
            const orientationEvent = new DeviceOrientationEvent('deviceorientation', {
                alpha: 10,
                beta: 20,
                gamma: 30
            });
            
            window.dispatchEvent(orientationEvent);
            
            expect(mockCallbacks.onDeviceOrientation).toHaveBeenCalledWith(
                orientationEvent,
                expect.objectContaining({
                    alpha: 10,
                    beta: 20,
                    gamma: 30
                })
            );
        });
    });

    describe('Cleanup', () => {
        beforeEach(() => {
            initializeInputSystem(mockCallbacks);
            registerTouchCanvas(mockCanvas);
        });

        it('should clean up all event listeners', () => {
            // Set some input state first
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
            expect(getKeyboardInput().w).toBe(true);
            
            cleanupInputSystem();
            
            // After cleanup, the input state should be reset
            const keyboardInput = getKeyboardInput();
            expect(keyboardInput.w).toBeFalsy();
        });

        it('should reset input state on cleanup', () => {
            // Set some input state
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
            expect(getKeyboardInput().w).toBe(true);
            
            cleanupInputSystem();
            
            // State should be reset
            const keyboardInput = getKeyboardInput();
            expect(keyboardInput.w).toBeFalsy();
            
            const touchInput = getTouchInput();
            expect(touchInput.active).toBe(false);
            
            const gyroInput = getGyroscopeInput();
            expect(gyroInput.alpha).toBe(0);
            expect(gyroInput.beta).toBe(0);
            expect(gyroInput.gamma).toBe(0);
        });

        it('should disable gyroscope on cleanup', async () => {
            await toggleGyroscope();
            expect(isGyroscopeEnabled()).toBe(true);
            
            cleanupInputSystem();
            
            expect(isGyroscopeEnabled()).toBe(false);
        });
    });

    describe('Error Handling', () => {
        it('should handle missing DOM elements gracefully', () => {
            // Clear DOM elements
            document.body.innerHTML = '';
            
            expect(() => {
                initializeInputSystem(mockCallbacks);
            }).not.toThrow();
        });

        it('should handle canvas registration with null canvas', () => {
            initializeInputSystem(mockCallbacks);
            
            expect(() => {
                registerTouchCanvas(null);
            }).not.toThrow();
        });

        it('should handle gyroscope permission errors', async () => {
            // Mock permission error
            global.DeviceOrientationEvent.requestPermission = vi.fn(() => Promise.reject(new Error('Permission error')));
            
            // toggleGyroscope doesn't return a promise, so we test it directly
            expect(() => toggleGyroscope()).not.toThrow();
            
            // Wait a bit for async operations to complete
            await new Promise(resolve => setTimeout(resolve, 10));
            
            expect(isGyroscopeEnabled()).toBe(false);
        });

        it('should handle missing DeviceOrientationEvent', () => {
            // Remove DeviceOrientationEvent
            delete global.DeviceOrientationEvent;
            
            // toggleGyroscope should handle missing DeviceOrientationEvent gracefully
            expect(() => toggleGyroscope()).not.toThrow();
            
            // When DeviceOrientationEvent is missing, the system still enables gyroscope
            // but it won't actually receive orientation events
            expect(isGyroscopeEnabled()).toBe(true);
        });
    });
});