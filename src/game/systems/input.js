/**
 * Input Management System
 * Handles keyboard, touch, and gyroscope input for the Katamari game
 * Maintains IIFE encapsulation pattern through module exports
 */

import * as THREE from 'three';
import { debugInfo, debugWarn, debugError } from '../utils/debug.js';
import { INPUT } from '../utils/constants.js';

// Input state management
const inputState = {
    keys: {},
    touchInput: {
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        active: false
    },
    gyro: { 
        alpha: 0, 
        beta: 0, 
        gamma: 0,
        normalizedGamma: 0,
        normalizedBeta: 0
    },
    useGyroscope: false,
    touchDeadZone: 0
};

// Event handlers
let eventHandlers = {
    onKeyDown: null,
    onKeyUp: null,
    onTouchStart: null,
    onTouchMove: null,
    onTouchEnd: null,
    onDeviceOrientation: null,
    onWindowResize: null
};

// UI elements
let gyroButton = null;
let messageOverlay = null;

/**
 * Initialize the input management system
 * @param {Object} callbacks - Callback functions for input events
 */
function initializeInputSystem(callbacks = {}) {
    debugInfo("Initializing input management system...");
    
    // Get UI elements
    gyroButton = document.getElementById('gyro-button');
    messageOverlay = document.getElementById('message-overlay');
    
    // Calculate touch dead zone based on screen size
    inputState.touchDeadZone = Math.min(30, window.innerWidth * INPUT.TOUCH_DEAD_ZONE_FACTOR);
    
    // Store callbacks
    eventHandlers = { ...eventHandlers, ...callbacks };
    
    // Set up event listeners
    setupEventListeners();
    
    // Set up gyroscope button visibility
    setupGyroButtonVisibility();
    
    debugInfo("Input management system initialized");
}

/**
 * Set up all event listeners for input handling
 */
function setupEventListeners() {
    // Keyboard events
    const handleKeyDown = (e) => {
        inputState.keys[e.key.toLowerCase()] = true;
        
        // Handle special keys
        if (e.key.toLowerCase() === ' ') {
            if (eventHandlers.onSpaceKey) eventHandlers.onSpaceKey();
        } else if (e.key.toLowerCase() === 'r') {
            if (eventHandlers.onResetKey) eventHandlers.onResetKey();
        }
        
        if (eventHandlers.onKeyDown) eventHandlers.onKeyDown(e);
    };
    
    const handleKeyUp = (e) => {
        inputState.keys[e.key.toLowerCase()] = false;
        if (eventHandlers.onKeyUp) eventHandlers.onKeyUp(e);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Touch events - need to get renderer from scene module
    // For now, we'll set up a method to register the canvas element
    
    // Button events
    if (gyroButton) {
        gyroButton.addEventListener('click', toggleGyroscope);
    }
    
    // Window events
    window.addEventListener('resize', onWindowResize);
    
    if (messageOverlay) {
        messageOverlay.addEventListener('click', () => {
            if (eventHandlers.onMessageOverlayClick) eventHandlers.onMessageOverlayClick();
        });
    }
}

/**
 * Register the canvas element for touch events
 * @param {HTMLCanvasElement} canvas - The canvas element to register touch events on
 */
function registerTouchCanvas(canvas) {
    if (!canvas) {
        debugWarn("No canvas provided for touch event registration");
        return;
    }
    
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);
    
    debugInfo("Touch events registered on canvas");
}

/**
 * Touch input handlers
 */
function onTouchStart(event) {
    event.preventDefault();
    inputState.touchInput.active = true;
    inputState.touchInput.startX = event.touches[0].clientX;
    inputState.touchInput.startY = event.touches[0].clientY;
    inputState.touchInput.currentX = inputState.touchInput.startX;
    inputState.touchInput.currentY = inputState.touchInput.startY;
    
    if (eventHandlers.onTouchStart) eventHandlers.onTouchStart(event, inputState.touchInput);
}

function onTouchMove(event) {
    event.preventDefault();
    if (inputState.touchInput.active) {
        inputState.touchInput.currentX = event.touches[0].clientX;
        inputState.touchInput.currentY = event.touches[0].clientY;
        
        if (eventHandlers.onTouchMove) eventHandlers.onTouchMove(event, inputState.touchInput);
    }
}

function onTouchEnd(event) {
    inputState.touchInput.active = false;
    inputState.touchInput.x = 0;
    inputState.touchInput.y = 0;
    inputState.touchInput.startX = 0;
    inputState.touchInput.startY = 0;
    inputState.touchInput.currentX = 0;
    inputState.touchInput.currentY = 0;
    
    if (eventHandlers.onTouchEnd) eventHandlers.onTouchEnd(event, inputState.touchInput);
}

/**
 * Get normalized touch input values
 * @returns {Object} Normalized touch input with x and y values between -1 and 1
 */
function getNormalizedTouchInput() {
    if (!inputState.touchInput.active) {
        return { x: 0, y: 0, active: false };
    }
    
    const deltaX = inputState.touchInput.currentX - inputState.touchInput.startX;
    const deltaY = inputState.touchInput.currentY - inputState.touchInput.startY;
    
    // Apply dead zone
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (distance < inputState.touchDeadZone) {
        return { x: 0, y: 0, active: true };
    }
    
    // Normalize to screen size
    const maxDistance = Math.min(window.innerWidth, window.innerHeight) * 0.3;
    const normalizedX = THREE.MathUtils.clamp(deltaX / maxDistance, -1, 1);
    const normalizedY = THREE.MathUtils.clamp(-deltaY / maxDistance, -1, 1); // Invert Y for intuitive controls
    
    return { 
        x: normalizedX, 
        y: normalizedY, 
        active: true,
        distance: distance
    };
}

/**
 * Gyroscope handling
 */
function handleDeviceOrientation(event) {
    inputState.gyro.gamma = event.gamma;
    inputState.gyro.beta = event.beta;
    inputState.gyro.alpha = event.alpha;
    inputState.gyro.normalizedGamma = THREE.MathUtils.clamp(event.gamma / 90, -1, 1);
    inputState.gyro.normalizedBeta = THREE.MathUtils.clamp(event.beta / 90, -1, 1);
    
    if (eventHandlers.onDeviceOrientation) {
        eventHandlers.onDeviceOrientation(event, inputState.gyro);
    }
}

/**
 * Toggle gyroscope controls
 */
function toggleGyroscope() {
    if (inputState.useGyroscope) {
        // Turn off gyroscope
        window.removeEventListener('deviceorientation', handleDeviceOrientation);
        inputState.useGyroscope = false;
        
        if (gyroButton) {
            gyroButton.classList.remove('active');
            gyroButton.textContent = 'Toggle Gyro';
        }
        
        debugInfo("Gyroscope controls OFF");
        
        if (eventHandlers.onGyroscopeToggle) {
            eventHandlers.onGyroscopeToggle(false);
        }
    } else {
        // Turn on gyroscope
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            // iOS 13+ requires permission
            DeviceOrientationEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        enableGyroscope();
                    } else {
                        debugWarn("Permission for device orientation denied.");
                        showCustomAlert("Permission for gyroscope was denied. Please allow motion and orientation access in your device settings for gyroscope controls.");
                    }
                })
                .catch(error => {
                    debugError("Error requesting device orientation permission:", error);
                    showCustomAlert("Could not enable gyroscope. Ensure your device supports it and allows motion and orientation access.");
                });
        } else {
            // No permission needed or not supported
            enableGyroscope();
        }
    }
}

/**
 * Enable gyroscope controls
 */
function enableGyroscope() {
    window.addEventListener('deviceorientation', handleDeviceOrientation);
    inputState.useGyroscope = true;
    
    if (gyroButton) {
        gyroButton.classList.add('active');
        gyroButton.textContent = 'Gyro ON';
    }
    
    debugInfo("Gyroscope controls ON");
    
    if (eventHandlers.onGyroscopeToggle) {
        eventHandlers.onGyroscopeToggle(true);
    }
}

/**
 * Set up gyroscope button visibility based on device capabilities
 */
function setupGyroButtonVisibility() {
    if (!gyroButton) return;
    
    // Show gyro button on touch devices that support device orientation
    if (window.matchMedia("(pointer: coarse)").matches && window.DeviceOrientationEvent) {
        gyroButton.style.display = 'block';
    } else {
        gyroButton.style.display = 'none';
    }
}



/**
 * Show custom alert message
 * @param {string} message - The message to display
 */
function showCustomAlert(message) {
    const customAlert = document.createElement('div');
    customAlert.textContent = message;
    customAlert.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background-color: rgba(0, 0, 0, 0.9); color: white; padding: 20px;
        border-radius: 10px; z-index: 1000; text-align: center;
        box-shadow: 0 0 15px rgba(255,255,255,0.5);
    `;
    document.body.appendChild(customAlert);
    setTimeout(() => {
        if (document.body.contains(customAlert)) {
            document.body.removeChild(customAlert);
        }
    }, 3000);
}

/**
 * Handle window resize
 */
function onWindowResize() {
    // Recalculate touch dead zone
    inputState.touchDeadZone = Math.min(30, window.innerWidth * INPUT.TOUCH_DEAD_ZONE_FACTOR);
    
    // Update gyro button visibility
    setupGyroButtonVisibility();
    
    if (eventHandlers.onWindowResize) {
        eventHandlers.onWindowResize();
    }
}

/**
 * Get current keyboard input state
 * @returns {Object} Current key states
 */
function getKeyboardInput() {
    return { ...inputState.keys };
}

/**
 * Get current touch input state
 * @returns {Object} Current touch input state
 */
function getTouchInput() {
    return { ...inputState.touchInput };
}

/**
 * Get current gyroscope input state
 * @returns {Object} Current gyroscope state
 */
function getGyroscopeInput() {
    return { ...inputState.gyro };
}

/**
 * Check if gyroscope is enabled
 * @returns {boolean} Whether gyroscope is currently enabled
 */
function isGyroscopeEnabled() {
    return inputState.useGyroscope;
}

/**
 * Get movement input from all sources (keyboard, touch, gyroscope)
 * @returns {Object} Normalized movement input with x and y values
 */
function getMovementInput() {
    let x = 0, y = 0;
    
    // Keyboard input
    if (inputState.keys['a'] || inputState.keys['arrowleft']) x -= 1;
    if (inputState.keys['d'] || inputState.keys['arrowright']) x += 1;
    if (inputState.keys['w'] || inputState.keys['arrowup']) y += 1;
    if (inputState.keys['s'] || inputState.keys['arrowdown']) y -= 1;
    
    // Touch input (if active and no keyboard input)
    if (Math.abs(x) < 0.1 && Math.abs(y) < 0.1) {
        const touchInput = getNormalizedTouchInput();
        if (touchInput.active) {
            x = touchInput.x;
            y = touchInput.y;
        }
    }
    
    // Gyroscope input (if enabled and no other input)
    if (Math.abs(x) < 0.1 && Math.abs(y) < 0.1 && inputState.useGyroscope) {
        x = inputState.gyro.normalizedGamma;
        y = inputState.gyro.normalizedBeta;
    }
    
    // Normalize the final input
    const magnitude = Math.sqrt(x * x + y * y);
    if (magnitude > 1) {
        x /= magnitude;
        y /= magnitude;
    }
    
    return { x, y, magnitude };
}

/**
 * Cleanup input system
 */
function cleanupInputSystem() {
    // Remove event listeners
    window.removeEventListener('keydown', eventHandlers.onKeyDown);
    window.removeEventListener('keyup', eventHandlers.onKeyUp);
    window.removeEventListener('resize', onWindowResize);
    
    if (inputState.useGyroscope) {
        window.removeEventListener('deviceorientation', handleDeviceOrientation);
    }
    
    // Reset state
    inputState.keys = {};
    inputState.touchInput = {
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        active: false
    };
    inputState.gyro = { 
        alpha: 0, 
        beta: 0, 
        gamma: 0,
        normalizedGamma: 0,
        normalizedBeta: 0
    };
    inputState.useGyroscope = false;
    
    debugInfo("Input system cleaned up");
}

// Export the input management system
export {
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
};