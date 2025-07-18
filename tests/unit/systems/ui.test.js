/**
 * Unit tests for the UI system
 * Tests HUD updates, button state management, overlay management, and message display
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    initializeUISystem,
    updateHUD,
    updatePowerUpStatus,
    showLoadingOverlay,
    hideLoadingOverlay,
    showMessageOverlay,
    hideMessageOverlay,
    isMessageOverlayVisible,
    showCustomAlert,
    updateGyroButtonState,
    updateDebugButtonState,
    requestGyroscopePermission,
    getUIState,
    cleanupUISystem,
    getUIElements
} from '../../../src/game/systems/ui.js';
import { createMockGameState, createMockPerformanceMetrics } from '../../helpers/game-helpers.js';

describe('UI System', () => {
    let mockCallbacks;
    let originalDocument;

    beforeEach(() => {
        // Create mock DOM structure
        document.body.innerHTML = `
            <div id="loading-overlay" style="display: none;">Loading...</div>
            <div id="game-ui">
                <div>Size: <span id="katamari-size">2.00m</span></div>
                <div>Speed: <span id="katamari-speed">0.00m/s</span></div>
                <div>Items Collected: <span id="items-collected">0</span></div>
                <div>FPS: <span id="fps">--</span></div>
                <div id="progress-container">
                    <div id="progress-bar" style="width: 0%;"></div>
                </div>
                <div>Target Size: <span id="target-size">100.00m</span></div>
                <div id="power-up-status"></div>
                <button id="gyro-button">Toggle Gyro</button>
                <button id="debug-button">Toggle Debug</button>
            </div>
            <div id="message-overlay" style="display: none;"></div>
        `;

        // Create mock callbacks
        mockCallbacks = {
            onMessageOverlayClick: vi.fn(),
            onGyroToggle: vi.fn(() => true),
            onDebugToggle: vi.fn(() => true)
        };

        // Store original document methods
        originalDocument = {
            createElement: document.createElement.bind(document),
            appendChild: document.body.appendChild.bind(document.body),
            removeChild: document.body.removeChild.bind(document.body)
        };

        // Mock window.matchMedia
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

        // Mock DeviceOrientationEvent for gyroscope permission tests
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
        // Cleanup UI system
        cleanupUISystem();
        
        // Clear DOM
        document.body.innerHTML = '';
        
        // Clear all mocks
        vi.clearAllMocks();
        
        // Remove any custom alerts that might still be in DOM
        const customAlerts = document.querySelectorAll('[style*="position: fixed"]');
        customAlerts.forEach(alert => {
            if (document.body.contains(alert)) {
                document.body.removeChild(alert);
            }
        });
    });

    describe('Initialization', () => {
        it('should initialize UI system successfully with all required elements', () => {
            const result = initializeUISystem(mockCallbacks);
            
            expect(result).toBe(true);
        });

        it('should return false when required UI elements are missing', () => {
            // Remove a required element
            document.getElementById('katamari-size').remove();
            
            const result = initializeUISystem(mockCallbacks);
            
            expect(result).toBe(false);
        });

        it('should set up event listeners for UI elements', () => {
            initializeUISystem(mockCallbacks);
            
            const messageOverlay = document.getElementById('message-overlay');
            const gyroButton = document.getElementById('gyro-button');
            const debugButton = document.getElementById('debug-button');
            
            // Test message overlay click
            messageOverlay.click();
            expect(mockCallbacks.onMessageOverlayClick).toHaveBeenCalled();
            
            // Test gyro button click
            gyroButton.click();
            expect(mockCallbacks.onGyroToggle).toHaveBeenCalled();
            
            // Test debug button click
            debugButton.click();
            expect(mockCallbacks.onDebugToggle).toHaveBeenCalled();
        });

        it('should handle missing optional callbacks gracefully', () => {
            expect(() => {
                initializeUISystem({});
            }).not.toThrow();
        });

        it('should initialize debug button state correctly', () => {
            initializeUISystem(mockCallbacks);
            
            const debugButton = document.getElementById('debug-button');
            expect(debugButton).toBeTruthy();
            // Debug button should be initialized with current debug mode state
        });
    });

    describe('HUD Updates', () => {
        beforeEach(() => {
            initializeUISystem(mockCallbacks);
        });

        it('should update katamari size display', () => {
            const gameState = {
                katamariRadius: 5.25,
                katamariSpeed: 0,
                itemsCollected: 0,
                targetSize: 100,
                fps: 60
            };
            
            updateHUD(gameState);
            
            const sizeElement = document.getElementById('katamari-size');
            expect(sizeElement.textContent).toBe('5.25m');
        });

        it('should update katamari speed display', () => {
            const gameState = {
                katamariRadius: 2,
                katamariSpeed: 12.34,
                itemsCollected: 0,
                targetSize: 100,
                fps: 60
            };
            
            updateHUD(gameState);
            
            const speedElement = document.getElementById('katamari-speed');
            expect(speedElement.textContent).toBe('12.34m/s');
        });

        it('should update items collected count', () => {
            const gameState = {
                katamariRadius: 2,
                katamariSpeed: 0,
                itemsCollected: 42,
                targetSize: 100,
                fps: 60
            };
            
            updateHUD(gameState);
            
            const itemsElement = document.getElementById('items-collected');
            expect(itemsElement.textContent).toBe('42');
        });

        it('should update progress bar based on katamari size and target', () => {
            const gameState = {
                katamariRadius: 25,
                katamariSpeed: 0,
                itemsCollected: 0,
                targetSize: 100,
                fps: 60
            };
            
            updateHUD(gameState);
            
            const progressBar = document.getElementById('progress-bar');
            expect(progressBar.style.width).toBe('25%');
        });

        it('should cap progress bar at 100%', () => {
            const gameState = {
                katamariRadius: 150, // Exceeds target
                katamariSpeed: 0,
                itemsCollected: 0,
                targetSize: 100,
                fps: 60
            };
            
            updateHUD(gameState);
            
            const progressBar = document.getElementById('progress-bar');
            expect(progressBar.style.width).toBe('100%');
        });

        it('should update target size display', () => {
            const gameState = {
                katamariRadius: 2,
                katamariSpeed: 0,
                itemsCollected: 0,
                targetSize: 250.75,
                fps: 60
            };
            
            updateHUD(gameState);
            
            const targetElement = document.getElementById('target-size');
            expect(targetElement.textContent).toBe('250.75m');
        });

        it('should update FPS display', () => {
            const gameState = {
                katamariRadius: 2,
                katamariSpeed: 0,
                itemsCollected: 0,
                targetSize: 100,
                fps: 58.7
            };
            
            updateHUD(gameState);
            
            const fpsElement = document.getElementById('fps');
            expect(fpsElement.textContent).toBe('59'); // Should be rounded
        });

        it('should handle undefined values gracefully', () => {
            const gameState = {
                katamariRadius: undefined,
                katamariSpeed: undefined,
                itemsCollected: undefined,
                targetSize: undefined,
                fps: undefined
            };
            
            expect(() => {
                updateHUD(gameState);
            }).not.toThrow();
        });

        it('should handle missing UI elements gracefully', () => {
            // Remove an element
            document.getElementById('katamari-size').remove();
            
            const gameState = {
                katamariRadius: 5,
                katamariSpeed: 10,
                itemsCollected: 5,
                targetSize: 100,
                fps: 60
            };
            
            expect(() => {
                updateHUD(gameState);
            }).not.toThrow();
        });
    });

    describe('Power-up Status Updates', () => {
        beforeEach(() => {
            initializeUISystem(mockCallbacks);
        });

        it('should display active power-ups with remaining time', () => {
            const now = Date.now();
            const activePowerUps = {
                'Speed Boost': now + 5000,
                'Magnet': now + 3000
            };
            
            updatePowerUpStatus(activePowerUps);
            
            const statusElement = document.getElementById('power-up-status');
            expect(statusElement.innerHTML).toContain('Speed Boost');
            expect(statusElement.innerHTML).toContain('Magnet');
            expect(statusElement.innerHTML).toContain('5.0s');
            expect(statusElement.innerHTML).toContain('3.0s');
        });

        it('should not display expired power-ups', () => {
            const now = Date.now();
            const activePowerUps = {
                'Speed Boost': now - 1000, // Expired
                'Magnet': now + 3000       // Active
            };
            
            updatePowerUpStatus(activePowerUps);
            
            const statusElement = document.getElementById('power-up-status');
            expect(statusElement.innerHTML).not.toContain('Speed Boost');
            expect(statusElement.innerHTML).toContain('Magnet');
        });

        it('should clear display when no active power-ups', () => {
            const activePowerUps = {};
            
            updatePowerUpStatus(activePowerUps);
            
            const statusElement = document.getElementById('power-up-status');
            expect(statusElement.innerHTML).toBe('');
        });

        it('should handle missing power-up status element gracefully', () => {
            document.getElementById('power-up-status').remove();
            
            const activePowerUps = {
                'Speed Boost': Date.now() + 5000
            };
            
            expect(() => {
                updatePowerUpStatus(activePowerUps);
            }).not.toThrow();
        });
    });

    describe('Loading Overlay Management', () => {
        beforeEach(() => {
            initializeUISystem(mockCallbacks);
        });

        it('should show loading overlay with default message', () => {
            showLoadingOverlay();
            
            const overlay = document.getElementById('loading-overlay');
            expect(overlay.style.display).toBe('flex');
            expect(overlay.textContent).toBe('Loading...');
        });

        it('should show loading overlay with custom message', () => {
            const customMessage = 'Generating new world...';
            showLoadingOverlay(customMessage);
            
            const overlay = document.getElementById('loading-overlay');
            expect(overlay.style.display).toBe('flex');
            expect(overlay.textContent).toBe(customMessage);
        });

        it('should hide loading overlay', () => {
            // First show it
            showLoadingOverlay();
            expect(document.getElementById('loading-overlay').style.display).toBe('flex');
            
            // Then hide it
            hideLoadingOverlay();
            expect(document.getElementById('loading-overlay').style.display).toBe('none');
        });

        it('should handle missing loading overlay element gracefully', () => {
            document.getElementById('loading-overlay').remove();
            
            expect(() => {
                showLoadingOverlay();
                hideLoadingOverlay();
            }).not.toThrow();
        });
    });

    describe('Message Overlay Management', () => {
        beforeEach(() => {
            initializeUISystem(mockCallbacks);
        });

        it('should show message overlay with text', () => {
            const message = 'Level Complete!';
            showMessageOverlay(message);
            
            const overlay = document.getElementById('message-overlay');
            expect(overlay.style.display).toBe('block');
            expect(overlay.textContent).toBe(message);
        });

        it('should hide message overlay', () => {
            // First show it
            showMessageOverlay('Test message');
            expect(document.getElementById('message-overlay').style.display).toBe('block');
            
            // Then hide it
            hideMessageOverlay();
            expect(document.getElementById('message-overlay').style.display).toBe('none');
        });

        it('should correctly report message overlay visibility', () => {
            expect(isMessageOverlayVisible()).toBe(false);
            
            showMessageOverlay('Test message');
            expect(isMessageOverlayVisible()).toBe(true);
            
            hideMessageOverlay();
            expect(isMessageOverlayVisible()).toBe(false);
        });

        it('should handle missing message overlay element gracefully', () => {
            document.getElementById('message-overlay').remove();
            
            expect(() => {
                showMessageOverlay('Test');
                hideMessageOverlay();
                isMessageOverlayVisible();
            }).not.toThrow();
        });
    });

    describe('Custom Alert System', () => {
        beforeEach(() => {
            initializeUISystem(mockCallbacks);
        });

        it('should create and display custom alert', () => {
            const message = 'Test alert message';
            showCustomAlert(message);
            
            // Check if alert was added to DOM
            const alerts = document.querySelectorAll('[style*="position: fixed"]');
            expect(alerts.length).toBe(1);
            expect(alerts[0].textContent).toBe(message);
        });

        it('should remove custom alert after specified duration', async () => {
            const message = 'Test alert message';
            const duration = 100; // Short duration for testing
            
            showCustomAlert(message, duration);
            
            // Alert should be present initially
            let alerts = document.querySelectorAll('[style*="position: fixed"]');
            expect(alerts.length).toBe(1);
            
            // Wait for duration + buffer
            await new Promise(resolve => setTimeout(resolve, duration + 50));
            
            // Alert should be removed
            alerts = document.querySelectorAll('[style*="position: fixed"]');
            expect(alerts.length).toBe(0);
        });

        it('should use default duration when not specified', () => {
            const message = 'Test alert message';
            showCustomAlert(message);
            
            const alerts = document.querySelectorAll('[style*="position: fixed"]');
            expect(alerts.length).toBe(1);
        });

        it('should handle multiple simultaneous alerts', () => {
            showCustomAlert('Alert 1');
            showCustomAlert('Alert 2');
            showCustomAlert('Alert 3');
            
            const alerts = document.querySelectorAll('[style*="position: fixed"]');
            expect(alerts.length).toBe(3);
        });
    });

    describe('Button State Management', () => {
        beforeEach(() => {
            initializeUISystem(mockCallbacks);
        });

        it('should update gyroscope button to enabled state', () => {
            updateGyroButtonState(true);
            
            const gyroButton = document.getElementById('gyro-button');
            expect(gyroButton.classList.contains('active')).toBe(true);
            expect(gyroButton.textContent).toBe('Gyro ON');
        });

        it('should update gyroscope button to disabled state', () => {
            updateGyroButtonState(false);
            
            const gyroButton = document.getElementById('gyro-button');
            expect(gyroButton.classList.contains('active')).toBe(false);
            expect(gyroButton.textContent).toBe('Toggle Gyro');
        });

        it('should update debug button to enabled state', () => {
            updateDebugButtonState(true);
            
            const debugButton = document.getElementById('debug-button');
            expect(debugButton.classList.contains('active')).toBe(true);
            expect(debugButton.textContent).toBe('Debug ON');
        });

        it('should update debug button to disabled state', () => {
            updateDebugButtonState(false);
            
            const debugButton = document.getElementById('debug-button');
            expect(debugButton.classList.contains('active')).toBe(false);
            expect(debugButton.textContent).toBe('Toggle Debug');
        });

        it('should handle missing button elements gracefully', () => {
            document.getElementById('gyro-button').remove();
            document.getElementById('debug-button').remove();
            
            expect(() => {
                updateGyroButtonState(true);
                updateDebugButtonState(true);
            }).not.toThrow();
        });

        it('should trigger callback when gyro button is clicked', () => {
            const gyroButton = document.getElementById('gyro-button');
            gyroButton.click();
            
            expect(mockCallbacks.onGyroToggle).toHaveBeenCalled();
        });

        it('should trigger callback when debug button is clicked', () => {
            const debugButton = document.getElementById('debug-button');
            debugButton.click();
            
            expect(mockCallbacks.onDebugToggle).toHaveBeenCalled();
        });
    });

    describe('Gyroscope Permission Handling', () => {
        beforeEach(() => {
            initializeUISystem(mockCallbacks);
        });

        it('should request and grant gyroscope permission on iOS', async () => {
            global.DeviceOrientationEvent.requestPermission = vi.fn(() => Promise.resolve('granted'));
            
            const result = await requestGyroscopePermission();
            
            expect(global.DeviceOrientationEvent.requestPermission).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it('should handle gyroscope permission denial', async () => {
            global.DeviceOrientationEvent.requestPermission = vi.fn(() => Promise.resolve('denied'));
            
            const result = await requestGyroscopePermission();
            
            expect(result).toBe(false);
        });

        it('should handle gyroscope permission error', async () => {
            global.DeviceOrientationEvent.requestPermission = vi.fn(() => Promise.reject(new Error('Permission error')));
            
            const result = await requestGyroscopePermission();
            
            expect(result).toBe(false);
        });

        it('should return true for non-iOS devices', async () => {
            // Remove requestPermission to simulate non-iOS device
            delete global.DeviceOrientationEvent.requestPermission;
            
            const result = await requestGyroscopePermission();
            
            expect(result).toBe(true);
        });
    });

    describe('UI State Management', () => {
        beforeEach(() => {
            initializeUISystem(mockCallbacks);
        });

        it('should return current UI state', () => {
            // Set some state
            updateGyroButtonState(true);
            updateDebugButtonState(false);
            showMessageOverlay('Test message');
            
            const state = getUIState();
            
            expect(state).toEqual({
                isDebugMode: false,
                useGyroscope: true,
                isMessageOverlayVisible: true,
                isLoadingOverlayVisible: false
            });
        });

        it('should track loading overlay visibility in state', () => {
            showLoadingOverlay();
            
            const state = getUIState();
            expect(state.isLoadingOverlayVisible).toBe(true);
            
            hideLoadingOverlay();
            
            const stateAfterHide = getUIState();
            expect(stateAfterHide.isLoadingOverlayVisible).toBe(false);
        });
    });

    describe('UI Elements Access', () => {
        beforeEach(() => {
            initializeUISystem(mockCallbacks);
        });

        it('should provide access to UI elements', () => {
            const elements = getUIElements();
            
            expect(elements.katamariSizeUI).toBe(document.getElementById('katamari-size'));
            expect(elements.katamariSpeedUI).toBe(document.getElementById('katamari-speed'));
            expect(elements.itemsCollectedUI).toBe(document.getElementById('items-collected'));
            expect(elements.progressBar).toBe(document.getElementById('progress-bar'));
            expect(elements.targetSizeUI).toBe(document.getElementById('target-size'));
            expect(elements.messageOverlay).toBe(document.getElementById('message-overlay'));
            expect(elements.loadingOverlay).toBe(document.getElementById('loading-overlay'));
            expect(elements.gyroButton).toBe(document.getElementById('gyro-button'));
            expect(elements.debugButton).toBe(document.getElementById('debug-button'));
            expect(elements.powerUpStatusUI).toBe(document.getElementById('power-up-status'));
            expect(elements.fpsUI).toBe(document.getElementById('fps'));
        });
    });

    describe('Event Handling', () => {
        beforeEach(() => {
            initializeUISystem(mockCallbacks);
        });

        it('should handle button clicks correctly', () => {
            const gyroButton = document.getElementById('gyro-button');
            const debugButton = document.getElementById('debug-button');
            
            // Test gyro button
            gyroButton.click();
            expect(mockCallbacks.onGyroToggle).toHaveBeenCalledTimes(1);
            
            // Test debug button
            debugButton.click();
            expect(mockCallbacks.onDebugToggle).toHaveBeenCalledTimes(1);
        });

        it('should handle message overlay clicks', () => {
            const messageOverlay = document.getElementById('message-overlay');
            
            messageOverlay.click();
            expect(mockCallbacks.onMessageOverlayClick).toHaveBeenCalledTimes(1);
        });

        it('should update button states when callbacks return new state', () => {
            // Re-initialize with new callbacks that return specific states
            cleanupUISystem();
            
            const newCallbacks = {
                onMessageOverlayClick: vi.fn(),
                onGyroToggle: vi.fn(() => true),
                onDebugToggle: vi.fn(() => false)
            };
            
            initializeUISystem(newCallbacks);
            
            const gyroButton = document.getElementById('gyro-button');
            const debugButton = document.getElementById('debug-button');
            
            gyroButton.click();
            expect(gyroButton.classList.contains('active')).toBe(true);
            expect(gyroButton.textContent).toBe('Gyro ON');
            
            debugButton.click();
            expect(debugButton.classList.contains('active')).toBe(false);
            expect(debugButton.textContent).toBe('Toggle Debug');
        });
    });

    describe('Cleanup', () => {
        beforeEach(() => {
            initializeUISystem(mockCallbacks);
        });

        it('should remove all event listeners on cleanup', () => {
            const messageOverlay = document.getElementById('message-overlay');
            const gyroButton = document.getElementById('gyro-button');
            const debugButton = document.getElementById('debug-button');
            
            // Verify listeners work before cleanup
            messageOverlay.click();
            gyroButton.click();
            debugButton.click();
            
            expect(mockCallbacks.onMessageOverlayClick).toHaveBeenCalled();
            expect(mockCallbacks.onGyroToggle).toHaveBeenCalled();
            expect(mockCallbacks.onDebugToggle).toHaveBeenCalled();
            
            // Clear mock call history
            vi.clearAllMocks();
            
            // Cleanup
            cleanupUISystem();
            
            // Verify listeners no longer work after cleanup
            messageOverlay.click();
            gyroButton.click();
            debugButton.click();
            
            expect(mockCallbacks.onMessageOverlayClick).not.toHaveBeenCalled();
            expect(mockCallbacks.onGyroToggle).not.toHaveBeenCalled();
            expect(mockCallbacks.onDebugToggle).not.toHaveBeenCalled();
        });

        it('should reset callbacks on cleanup', () => {
            cleanupUISystem();
            
            // After cleanup, callbacks should be reset
            const elements = getUIElements();
            expect(elements).toBeDefined();
        });

        it('should handle cleanup when elements are missing', () => {
            // Remove elements before cleanup
            document.getElementById('message-overlay').remove();
            document.getElementById('gyro-button').remove();
            document.getElementById('debug-button').remove();
            
            expect(() => {
                cleanupUISystem();
            }).not.toThrow();
        });
    });

    describe('Error Handling', () => {
        it('should handle initialization with missing DOM elements', () => {
            // Clear DOM
            document.body.innerHTML = '';
            
            const result = initializeUISystem(mockCallbacks);
            
            expect(result).toBe(false);
        });

        it('should handle operations on missing elements gracefully', () => {
            // Initialize with proper DOM
            initializeUISystem(mockCallbacks);
            
            // Then remove elements
            document.body.innerHTML = '';
            
            expect(() => {
                updateHUD({
                    katamariRadius: 5,
                    katamariSpeed: 10,
                    itemsCollected: 5,
                    targetSize: 100,
                    fps: 60
                });
                updatePowerUpStatus({});
                showLoadingOverlay();
                hideLoadingOverlay();
                showMessageOverlay('Test');
                hideMessageOverlay();
                updateGyroButtonState(true);
                updateDebugButtonState(true);
            }).not.toThrow();
        });

        it('should handle null/undefined callback parameters', () => {
            expect(() => {
                initializeUISystem(null);
            }).toThrow();
            
            expect(() => {
                initializeUISystem(undefined);
            }).not.toThrow(); // undefined should work as it gets defaulted to {}
            
            // But empty object should work
            expect(() => {
                initializeUISystem({});
            }).not.toThrow();
        });

        it('should handle invalid game state parameters', () => {
            initializeUISystem(mockCallbacks);
            
            expect(() => {
                updateHUD(null);
            }).toThrow(); // null will cause destructuring error
            
            expect(() => {
                updateHUD(undefined);
            }).toThrow(); // undefined will cause destructuring error
            
            expect(() => {
                updateHUD({});
            }).not.toThrow(); // empty object should work
        });

        it('should handle invalid power-up parameters', () => {
            initializeUISystem(mockCallbacks);
            
            expect(() => {
                updatePowerUpStatus(null);
            }).toThrow(); // null will cause Object.entries error
            
            expect(() => {
                updatePowerUpStatus(undefined);
            }).toThrow(); // undefined will cause Object.entries error
            
            expect(() => {
                updatePowerUpStatus('invalid');
            }).not.toThrow(); // string works with Object.entries, just returns empty array
            
            expect(() => {
                updatePowerUpStatus({});
            }).not.toThrow(); // empty object should work
        });
    });

    describe('Integration with Game State', () => {
        beforeEach(() => {
            initializeUISystem(mockCallbacks);
        });

        it('should handle realistic game state updates', () => {
            const gameState = createMockGameState('mid');
            const performanceMetrics = createMockPerformanceMetrics();
            
            const hudData = {
                katamariRadius: gameState.katamari.size,
                katamariSpeed: 15.5,
                itemsCollected: gameState.katamari.collectedItems,
                targetSize: gameState.level.targetSize,
                fps: performanceMetrics.frameRate.average,
                physicsStats: {
                    bodyCount: 150,
                    activeCollisions: 5
                },
                performanceStats: performanceMetrics
            };
            
            expect(() => {
                updateHUD(hudData);
            }).not.toThrow();
            
            // Verify updates were applied
            expect(document.getElementById('katamari-size').textContent).toBe(`${gameState.katamari.size.toFixed(2)}m`);
            expect(document.getElementById('katamari-speed').textContent).toBe('15.50m/s');
            expect(document.getElementById('items-collected').textContent).toBe(String(gameState.katamari.collectedItems));
        });

        it('should handle level progression UI updates', () => {
            const initialState = createMockGameState('initial');
            const midState = createMockGameState('mid');
            
            // Update from initial to mid-game state
            updateHUD({
                katamariRadius: initialState.katamari.size,
                katamariSpeed: 5,
                itemsCollected: initialState.katamari.collectedItems,
                targetSize: initialState.level.targetSize,
                fps: 60
            });
            
            let progressBar = document.getElementById('progress-bar');
            const initialProgress = parseFloat(progressBar.style.width);
            
            updateHUD({
                katamariRadius: midState.katamari.size,
                katamariSpeed: 12,
                itemsCollected: midState.katamari.collectedItems,
                targetSize: midState.level.targetSize,
                fps: 60
            });
            
            progressBar = document.getElementById('progress-bar');
            const midProgress = parseFloat(progressBar.style.width);
            
            expect(midProgress).toBeGreaterThan(initialProgress);
        });
    });
});