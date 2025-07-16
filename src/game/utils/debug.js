/**
 * Debug logging system for the Katamari game
 * Provides conditional logging with timestamps and color coding
 */

let isDebugMode = true; // Debug mode flag

// Enhanced debug logging system
const debugLogger = {
    info: (...args) => {
        if (isDebugMode) {
            const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
            console.log(`%c[${timestamp}] [INFO]`, 'color: #4CAF50; font-weight: bold;', ...args);
        }
    },
    warn: (...args) => {
        if (isDebugMode) {
            const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
            console.warn(`%c[${timestamp}] [WARN]`, 'color: #FFC107; font-weight: bold;', ...args);
        }
    },
    error: (...args) => {
        if (isDebugMode) {
            const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
            console.error(`%c[${timestamp}] [ERROR]`, 'color: #F44336; font-weight: bold;', ...args);
        }
    },
    debug: (...args) => {
        if (isDebugMode) {
            const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
            console.log(`%c[${timestamp}] [DEBUG]`, 'color: #2196F3; font-weight: bold;', ...args);
        }
    }
};

// Alias for common usage
const debugLog = debugLogger.debug;
const debugWarn = debugLogger.warn;
const debugError = debugLogger.error;
const debugInfo = debugLogger.info;

// Function to toggle debug mode
function toggleDebugMode() {
    isDebugMode = !isDebugMode;
    return isDebugMode;
}

// Function to get current debug mode state
function getDebugMode() {
    return isDebugMode;
}

// Function to set debug mode
function setDebugMode(enabled) {
    isDebugMode = enabled;
}

// Export the debug system maintaining IIFE-like encapsulation
export {
    debugLogger,
    debugLog,
    debugWarn,
    debugError,
    debugInfo,
    toggleDebugMode,
    getDebugMode,
    setDebugMode
};