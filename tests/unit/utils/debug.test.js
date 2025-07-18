/**
 * Unit tests for debug utilities
 * Tests debug logging functions, conditional output, mode toggling, and state management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    debugLogger,
    debugLog,
    debugWarn,
    debugError,
    debugInfo,
    toggleDebugMode,
    getDebugMode,
    setDebugMode
} from '../../../src/game/utils/debug.js';

describe('Debug Utilities', () => {
    let consoleSpy;
    let originalConsole;

    beforeEach(() => {
        // Reset debug mode to default state
        setDebugMode(true);
        
        // Mock console methods
        originalConsole = {
            log: console.log,
            warn: console.warn,
            error: console.error
        };
        
        consoleSpy = {
            log: vi.spyOn(console, 'log').mockImplementation(() => {}),
            warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
            error: vi.spyOn(console, 'error').mockImplementation(() => {})
        };
    });

    afterEach(() => {
        // Restore console methods
        vi.restoreAllMocks();
    });

    describe('Debug Mode State Management', () => {
        it('should initialize with debug mode enabled by default', () => {
            expect(getDebugMode()).toBe(true);
        });

        it('should toggle debug mode correctly', () => {
            const initialState = getDebugMode();
            const newState = toggleDebugMode();
            
            expect(newState).toBe(!initialState);
            expect(getDebugMode()).toBe(newState);
            
            // Toggle back
            const toggledBack = toggleDebugMode();
            expect(toggledBack).toBe(initialState);
            expect(getDebugMode()).toBe(initialState);
        });

        it('should set debug mode to specific state', () => {
            setDebugMode(false);
            expect(getDebugMode()).toBe(false);
            
            setDebugMode(true);
            expect(getDebugMode()).toBe(true);
        });

        it('should return current state when toggling', () => {
            setDebugMode(true);
            expect(toggleDebugMode()).toBe(false);
            expect(toggleDebugMode()).toBe(true);
        });
    });

    describe('Debug Logging Functions', () => {
        describe('when debug mode is enabled', () => {
            beforeEach(() => {
                setDebugMode(true);
            });

            it('should log debug messages with proper formatting', () => {
                const testMessage = 'Test debug message';
                debugLog(testMessage);
                
                expect(consoleSpy.log).toHaveBeenCalledTimes(1);
                const call = consoleSpy.log.mock.calls[0];
                expect(call[0]).toMatch(/^\%c\[\d{2}:\d{2}:\d{2}\] \[DEBUG\]$/);
                expect(call[1]).toBe('color: #2196F3; font-weight: bold;');
                expect(call[2]).toBe(testMessage);
            });

            it('should log info messages with proper formatting', () => {
                const testMessage = 'Test info message';
                debugInfo(testMessage);
                
                expect(consoleSpy.log).toHaveBeenCalledTimes(1);
                const call = consoleSpy.log.mock.calls[0];
                expect(call[0]).toMatch(/^\%c\[\d{2}:\d{2}:\d{2}\] \[INFO\]$/);
                expect(call[1]).toBe('color: #4CAF50; font-weight: bold;');
                expect(call[2]).toBe(testMessage);
            });

            it('should log warning messages with proper formatting', () => {
                const testMessage = 'Test warning message';
                debugWarn(testMessage);
                
                expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
                const call = consoleSpy.warn.mock.calls[0];
                expect(call[0]).toMatch(/^\%c\[\d{2}:\d{2}:\d{2}\] \[WARN\]$/);
                expect(call[1]).toBe('color: #FFC107; font-weight: bold;');
                expect(call[2]).toBe(testMessage);
            });

            it('should log error messages with proper formatting', () => {
                const testMessage = 'Test error message';
                debugError(testMessage);
                
                expect(consoleSpy.error).toHaveBeenCalledTimes(1);
                const call = consoleSpy.error.mock.calls[0];
                expect(call[0]).toMatch(/^\%c\[\d{2}:\d{2}:\d{2}\] \[ERROR\]$/);
                expect(call[1]).toBe('color: #F44336; font-weight: bold;');
                expect(call[2]).toBe(testMessage);
            });

            it('should handle multiple arguments in log messages', () => {
                const arg1 = 'First argument';
                const arg2 = { key: 'value' };
                const arg3 = 42;
                
                debugLog(arg1, arg2, arg3);
                
                expect(consoleSpy.log).toHaveBeenCalledTimes(1);
                const call = consoleSpy.log.mock.calls[0];
                expect(call.length).toBe(5); // format string, style, and 3 arguments
                expect(call[2]).toBe(arg1);
                expect(call[3]).toBe(arg2);
                expect(call[4]).toBe(arg3);
            });

            it('should include timestamp in log messages', () => {
                debugLog('Test message');
                
                const call = consoleSpy.log.mock.calls[0];
                const timestampMatch = call[0].match(/\[(\d{2}:\d{2}:\d{2})\]/);
                expect(timestampMatch).toBeTruthy();
                
                // Verify timestamp format (HH:MM:SS)
                const timestamp = timestampMatch[1];
                expect(timestamp).toMatch(/^\d{2}:\d{2}:\d{2}$/);
            });
        });

        describe('when debug mode is disabled', () => {
            beforeEach(() => {
                setDebugMode(false);
            });

            it('should not log debug messages when disabled', () => {
                debugLog('This should not be logged');
                expect(consoleSpy.log).not.toHaveBeenCalled();
            });

            it('should not log info messages when disabled', () => {
                debugInfo('This should not be logged');
                expect(consoleSpy.log).not.toHaveBeenCalled();
            });

            it('should not log warning messages when disabled', () => {
                debugWarn('This should not be logged');
                expect(consoleSpy.warn).not.toHaveBeenCalled();
            });

            it('should not log error messages when disabled', () => {
                debugError('This should not be logged');
                expect(consoleSpy.error).not.toHaveBeenCalled();
            });
        });
    });

    describe('Debug Logger Object', () => {
        beforeEach(() => {
            setDebugMode(true);
        });

        it('should provide debug method through debugLogger object', () => {
            const testMessage = 'Test via debugLogger.debug';
            debugLogger.debug(testMessage);
            
            expect(consoleSpy.log).toHaveBeenCalledTimes(1);
            const call = consoleSpy.log.mock.calls[0];
            expect(call[0]).toMatch(/^\%c\[\d{2}:\d{2}:\d{2}\] \[DEBUG\]$/);
            expect(call[2]).toBe(testMessage);
        });

        it('should provide info method through debugLogger object', () => {
            const testMessage = 'Test via debugLogger.info';
            debugLogger.info(testMessage);
            
            expect(consoleSpy.log).toHaveBeenCalledTimes(1);
            const call = consoleSpy.log.mock.calls[0];
            expect(call[0]).toMatch(/^\%c\[\d{2}:\d{2}:\d{2}\] \[INFO\]$/);
            expect(call[2]).toBe(testMessage);
        });

        it('should provide warn method through debugLogger object', () => {
            const testMessage = 'Test via debugLogger.warn';
            debugLogger.warn(testMessage);
            
            expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
            const call = consoleSpy.warn.mock.calls[0];
            expect(call[0]).toMatch(/^\%c\[\d{2}:\d{2}:\d{2}\] \[WARN\]$/);
            expect(call[2]).toBe(testMessage);
        });

        it('should provide error method through debugLogger object', () => {
            const testMessage = 'Test via debugLogger.error';
            debugLogger.error(testMessage);
            
            expect(consoleSpy.error).toHaveBeenCalledTimes(1);
            const call = consoleSpy.error.mock.calls[0];
            expect(call[0]).toMatch(/^\%c\[\d{2}:\d{2}:\d{2}\] \[ERROR\]$/);
            expect(call[2]).toBe(testMessage);
        });

        it('should respect debug mode state for all debugLogger methods', () => {
            setDebugMode(false);
            
            debugLogger.debug('debug message');
            debugLogger.info('info message');
            debugLogger.warn('warn message');
            debugLogger.error('error message');
            
            expect(consoleSpy.log).not.toHaveBeenCalled();
            expect(consoleSpy.warn).not.toHaveBeenCalled();
            expect(consoleSpy.error).not.toHaveBeenCalled();
        });
    });

    describe('Debug Information Formatting', () => {
        beforeEach(() => {
            setDebugMode(true);
        });

        it('should format complex objects correctly', () => {
            const complexObject = {
                nested: { value: 42 },
                array: [1, 2, 3],
                string: 'test'
            };
            
            debugLog('Complex object:', complexObject);
            
            expect(consoleSpy.log).toHaveBeenCalledTimes(1);
            const call = consoleSpy.log.mock.calls[0];
            expect(call[2]).toBe('Complex object:');
            expect(call[3]).toBe(complexObject);
        });

        it('should handle null and undefined values', () => {
            debugLog('Null value:', null, 'Undefined value:', undefined);
            
            expect(consoleSpy.log).toHaveBeenCalledTimes(1);
            const call = consoleSpy.log.mock.calls[0];
            expect(call[2]).toBe('Null value:');
            expect(call[3]).toBe(null);
            expect(call[4]).toBe('Undefined value:');
            expect(call[5]).toBe(undefined);
        });

        it('should handle empty arguments gracefully', () => {
            debugLog();
            
            expect(consoleSpy.log).toHaveBeenCalledTimes(1);
            const call = consoleSpy.log.mock.calls[0];
            expect(call.length).toBe(2); // Only format string and style
        });

        it('should maintain consistent color coding across log levels', () => {
            debugLog('debug');
            debugInfo('info');
            debugWarn('warn');
            debugError('error');
            
            // Check debug color
            expect(consoleSpy.log.mock.calls[0][1]).toBe('color: #2196F3; font-weight: bold;');
            // Check info color
            expect(consoleSpy.log.mock.calls[1][1]).toBe('color: #4CAF50; font-weight: bold;');
            // Check warn color
            expect(consoleSpy.warn.mock.calls[0][1]).toBe('color: #FFC107; font-weight: bold;');
            // Check error color
            expect(consoleSpy.error.mock.calls[0][1]).toBe('color: #F44336; font-weight: bold;');
        });
    });

    describe('Edge Cases and Error Handling', () => {
        beforeEach(() => {
            setDebugMode(true);
        });

        it('should handle rapid debug mode toggling', () => {
            const initialState = getDebugMode();
            
            // Rapid toggling
            for (let i = 0; i < 10; i++) {
                toggleDebugMode();
            }
            
            // Should end up in opposite state (even number of toggles)
            expect(getDebugMode()).toBe(initialState);
        });

        it('should handle setting debug mode to same state multiple times', () => {
            setDebugMode(true);
            setDebugMode(true);
            setDebugMode(true);
            
            expect(getDebugMode()).toBe(true);
            
            setDebugMode(false);
            setDebugMode(false);
            setDebugMode(false);
            
            expect(getDebugMode()).toBe(false);
        });

        it('should handle console method failures gracefully', () => {
            // Mock console.log to throw an error
            consoleSpy.log.mockImplementation(() => {
                throw new Error('Console error');
            });
            
            // The debug system doesn't currently catch console errors,
            // so this test verifies the current behavior
            expect(() => {
                debugLog('This might fail');
            }).toThrow('Console error');
        });

        it('should maintain state consistency across multiple operations', () => {
            // Test state consistency with mixed operations
            setDebugMode(true);
            debugLog('test1');
            
            toggleDebugMode();
            debugLog('test2'); // Should not log
            
            toggleDebugMode();
            debugLog('test3');
            
            expect(getDebugMode()).toBe(true);
            expect(consoleSpy.log).toHaveBeenCalledTimes(2); // Only test1 and test3
        });
    });
});