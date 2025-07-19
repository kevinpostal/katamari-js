/**
 * UI Management System
 * Handles DOM UI management, HUD updates, overlay management, and button handling
 * Maintains exact behavior from original implementation
 */

import { debugLog, debugWarn, debugError, debugInfo, getDebugMode } from '../utils/debug.js';
import { UI } from '../utils/constants.js';

// UI element references
let katamariSizeUI = null;
let katamariSpeedUI = null;
let itemsCollectedUI = null;
let progressBar = null;
let targetSizeUI = null;
let messageOverlay = null;
let loadingOverlay = null;
let gyroButton = null;
let debugButton = null;
let powerUpStatusUI = null;
let fpsUI = null;

// UI state
let isDebugMode = true;
let useGyroscope = false;

// Callbacks for UI interactions
let callbacks = {
    onMessageOverlayClick: null,
    onGyroToggle: null,
    onDebugToggle: null
};

/**
 * Initialize the UI management system
 * @param {Object} options - Configuration options with callbacks
 */
export function initializeUISystem(options = {}) {
    debugInfo("Initializing UI management system...");
    
    // Store callbacks
    callbacks = {
        onMessageOverlayClick: options.onMessageOverlayClick || null,
        onGyroToggle: options.onGyroToggle || null,
        onDebugToggle: options.onDebugToggle || null
    };

    // Get UI element references
    katamariSizeUI = document.getElementById('katamari-size');
    katamariSpeedUI = document.getElementById('katamari-speed');
    itemsCollectedUI = document.getElementById('items-collected');
    progressBar = document.getElementById('progress-bar');
    targetSizeUI = document.getElementById('target-size');
    messageOverlay = document.getElementById('message-overlay');
    loadingOverlay = document.getElementById('loading-overlay');
    gyroButton = document.getElementById('gyro-button');
    debugButton = document.getElementById('debug-button');
    powerUpStatusUI = document.getElementById('power-up-status');
    fpsUI = document.getElementById('fps');

    // Validate required UI elements
    if (!katamariSizeUI || !katamariSpeedUI || !itemsCollectedUI || !progressBar || 
        !targetSizeUI || !messageOverlay || !loadingOverlay) {
        debugError("Required UI elements not found in DOM");
        return false;
    }

    // Set up event listeners
    setupEventListeners();
    
    // Set up gyroscope button visibility
    setupGyroButtonVisibility();
    
    // Initialize debug button state to match the debug mode
    initializeDebugButtonState();

    debugInfo("UI management system initialized successfully");
    return true;
}

/**
 * Set up event listeners for UI elements
 */
function setupEventListeners() {
    // Message overlay click listener
    if (messageOverlay && callbacks.onMessageOverlayClick) {
        messageOverlay.addEventListener('click', callbacks.onMessageOverlayClick);
    }

    // Gyroscope button listener
    if (gyroButton) {
        gyroButton.addEventListener('click', handleGyroToggle);
    }

    // Debug button listener
    if (debugButton) {
        debugButton.addEventListener('click', handleDebugToggle);
    }
}

/**
 * Update HUD elements with current game state
 * @param {Object} gameState - Current game state
 */
export function updateHUD(gameState) {
    const {
        katamariRadius,
        katamariSpeed,
        itemsCollected,
        targetSize,
        fps
    } = gameState;

    // Update katamari size
    if (katamariSizeUI && katamariRadius !== undefined) {
        katamariSizeUI.textContent = `${katamariRadius.toFixed(UI.DECIMAL_PLACES)}m`;
    }

    // Update katamari speed
    if (katamariSpeedUI && katamariSpeed !== undefined) {
        katamariSpeedUI.textContent = `${katamariSpeed.toFixed(UI.DECIMAL_PLACES)}m/s`;
    }

    // Update items collected count
    if (itemsCollectedUI && itemsCollected !== undefined) {
        itemsCollectedUI.textContent = itemsCollected;
    }

    // Update progress bar
    if (progressBar && katamariRadius !== undefined && targetSize !== undefined) {
        const progress = Math.min(UI.PROGRESS_MAX, (katamariRadius / targetSize) * UI.PROGRESS_MAX);
        progressBar.style.width = `${progress}%`;
    }

    // Update target size
    if (targetSizeUI && targetSize !== undefined) {
        targetSizeUI.textContent = `${targetSize.toFixed(UI.DECIMAL_PLACES)}m`;
    }

    // Update FPS counter
    if (fpsUI && fps !== undefined) {
        fpsUI.textContent = Math.round(fps);
    }
}

/**
 * Update power-up status display
 * @param {Object} activePowerUps - Currently active power-ups with expiry times
 */
export function updatePowerUpStatus(activePowerUps) {
    if (!powerUpStatusUI) return;

    let powerUpStatusHTML = '';
    const now = Date.now();

    for (const [type, expiryTime] of Object.entries(activePowerUps)) {
        if (expiryTime > now) {
            const remainingTime = ((expiryTime - now) / UI.POWER_UP_TIME_DIVISOR).toFixed(UI.POWER_UP_TIME_DECIMAL_PLACES);
            powerUpStatusHTML += `<div>${type}: ${remainingTime}s</div>`;
        }
    }

    powerUpStatusUI.innerHTML = powerUpStatusHTML;
}

/**
 * Show loading overlay with message
 * @param {string} message - Loading message to display
 */
export function showLoadingOverlay(message = 'Loading...') {
    if (loadingOverlay) {
        loadingOverlay.textContent = message;
        loadingOverlay.style.display = 'flex';
    }
}

/**
 * Hide loading overlay
 */
export function hideLoadingOverlay() {
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

/**
 * Show message overlay with text
 * @param {string} message - Message to display
 */
export function showMessageOverlay(message) {
    if (messageOverlay) {
        messageOverlay.textContent = message;
        messageOverlay.style.display = 'block';
    }
}

/**
 * Hide message overlay
 */
export function hideMessageOverlay() {
    if (messageOverlay) {
        messageOverlay.style.display = 'none';
    }
}

/**
 * Check if message overlay is visible
 * @returns {boolean} True if message overlay is visible
 */
export function isMessageOverlayVisible() {
    return messageOverlay && messageOverlay.style.display !== 'none';
}

/**
 * Display custom alert message
 * @param {string} message - Alert message
 * @param {number} duration - Duration to show alert (default: 3000ms)
 */
export function showCustomAlert(message, duration = UI.ALERT_DURATION) {
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
    }, duration);
}

/**
 * Handle gyroscope toggle button click
 */
function handleGyroToggle() {
    if (callbacks.onGyroToggle) {
        const newGyroState = callbacks.onGyroToggle();
        updateGyroButtonState(newGyroState);
    }
}

/**
 * Update gyroscope button state
 * @param {boolean} isEnabled - Whether gyroscope is enabled
 */
export function updateGyroButtonState(isEnabled) {
    useGyroscope = isEnabled;
    if (gyroButton) {
        if (isEnabled) {
            gyroButton.classList.add('active');
            gyroButton.textContent = 'Gyro ON';
        } else {
            gyroButton.classList.remove('active');
            gyroButton.textContent = 'Toggle Gyro';
        }
    }
}

/**
 * Handle debug toggle button click
 */
function handleDebugToggle() {
    if (callbacks.onDebugToggle) {
        const newDebugState = callbacks.onDebugToggle();
        updateDebugButtonState(newDebugState);
    }
}

/**
 * Update debug button state
 * @param {boolean} isEnabled - Whether debug mode is enabled
 */
export function updateDebugButtonState(isEnabled) {
    isDebugMode = isEnabled;
    if (debugButton) {
        if (isEnabled) {
            debugButton.classList.add('active');
            debugButton.textContent = 'Debug ON';
        } else {
            debugButton.classList.remove('active');
            debugButton.textContent = 'Toggle Debug';
        }
    }
}

/**
 * Initialize debug button state to match the current debug mode
 */
function initializeDebugButtonState() {
    if (!debugButton) return;
    
    // Get the actual debug mode state from the debug module
    const currentDebugMode = getDebugMode();
    updateDebugButtonState(currentDebugMode);
    
    debugInfo(`Debug button initialized with state: ${currentDebugMode ? 'ON' : 'OFF'}`);
}

/**
 * Set up gyroscope button visibility based on device capabilities
 */
function setupGyroButtonVisibility() {
    if (!gyroButton) return;

    // Check for touch capability (indicates mobile) AND DeviceOrientationEvent support
    if (window.matchMedia("(pointer: coarse)").matches && window.DeviceOrientationEvent) {
        gyroButton.style.display = 'block';
    } else {
        gyroButton.style.display = 'none';
    }
}

/**
 * Handle gyroscope permission request for iOS 13+
 * @returns {Promise<boolean>} Promise resolving to whether permission was granted
 */
export async function requestGyroscopePermission() {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
            const permissionState = await DeviceOrientationEvent.requestPermission();
            if (permissionState === 'granted') {
                debugInfo("Gyroscope permission granted");
                return true;
            } else {
                debugWarn("Gyroscope permission denied");
                showCustomAlert(
                    "Permission for gyroscope was denied. Please allow motion and orientation access in your device settings for gyroscope controls."
                );
                return false;
            }
        } catch (error) {
            debugError("Error requesting gyroscope permission:", error);
            showCustomAlert(
                "Could not enable gyroscope. Ensure your device supports it and allows motion and orientation access."
            );
            return false;
        }
    }
    
    // For non-iOS 13+ devices, no permission needed
    debugInfo("Gyroscope permission not required for this device");
    return true;
}

/**
 * Get current UI state
 * @returns {Object} Current UI state
 */
export function getUIState() {
    return {
        isDebugMode,
        useGyroscope,
        isMessageOverlayVisible: isMessageOverlayVisible(),
        isLoadingOverlayVisible: loadingOverlay ? loadingOverlay.style.display !== 'none' : false
    };
}

/**
 * Clean up UI system resources
 */
export function cleanupUISystem() {
    debugInfo("Cleaning up UI system...");
    
    // Remove event listeners
    if (messageOverlay && callbacks.onMessageOverlayClick) {
        messageOverlay.removeEventListener('click', callbacks.onMessageOverlayClick);
    }
    
    if (gyroButton) {
        gyroButton.removeEventListener('click', handleGyroToggle);
    }
    
    if (debugButton) {
        debugButton.removeEventListener('click', handleDebugToggle);
    }

    // Reset callbacks
    callbacks = {
        onMessageOverlayClick: null,
        onGyroToggle: null,
        onDebugToggle: null
    };

    debugInfo("UI system cleanup completed");
}

// Export UI element getters for backward compatibility
export function getUIElements() {
    return {
        katamariSizeUI,
        katamariSpeedUI,
        itemsCollectedUI,
        progressBar,
        targetSizeUI,
        messageOverlay,
        loadingOverlay,
        gyroButton,
        debugButton,
        powerUpStatusUI,
        fpsUI
    };
}