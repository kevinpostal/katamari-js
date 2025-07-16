/**
 * Performance monitoring system for the Katamari game
 * Provides FPS monitoring, physics performance metrics, and performance alerts
 */

import { debugLog, debugWarn, debugError, debugInfo } from './debug.js';

// Performance monitoring state
let performanceState = {
    // FPS monitoring
    fps: 0,
    frameCount: 0,
    lastFpsUpdate: 0,
    fpsHistory: [],
    maxFpsHistoryLength: 60, // Keep 60 seconds of FPS data
    targetFps: 60,
    lowFpsThreshold: 45,
    criticalFpsThreshold: 30,
    
    // Frame timing
    lastFrameTime: 0,
    frameTime: 0,
    averageFrameTime: 0,
    maxFrameTime: 0,
    frameTimeHistory: [],
    
    // Physics performance
    physicsStepTime: 0,
    averagePhysicsStepTime: 0,
    maxPhysicsStepTime: 0,
    physicsStepCount: 0,
    physicsTimeHistory: [],
    
    // Render performance
    renderTime: 0,
    averageRenderTime: 0,
    maxRenderTime: 0,
    renderTimeHistory: [],
    
    // Memory monitoring
    memoryUsage: 0,
    maxMemoryUsage: 0,
    memoryHistory: [],
    
    // Performance alerts
    alertHistory: [],
    maxAlertHistory: 50,
    lastAlertTime: 0,
    alertCooldown: 5000, // 5 seconds between similar alerts
    
    // Monitoring settings
    isMonitoring: true,
    logInterval: 10000, // Log performance stats every 10 seconds
    lastLogTime: 0,
    
    // Performance degradation detection
    performanceDegradationThreshold: 0.8, // Alert if performance drops below 80% of target
    consecutiveLowFrames: 0,
    maxConsecutiveLowFrames: 30 // Alert after 30 consecutive low frames (0.5 seconds at 60fps)
};

/**
 * Initialize performance monitoring system
 * @param {Object} options - Configuration options
 */
export function initializePerformanceMonitoring(options = {}) {
    performanceState.targetFps = options.targetFps || 60;
    performanceState.lowFpsThreshold = options.lowFpsThreshold || 45;
    performanceState.criticalFpsThreshold = options.criticalFpsThreshold || 30;
    performanceState.isMonitoring = options.enabled !== false;
    
    if (performanceState.isMonitoring) {
        debugInfo("[PERFORMANCE] Performance monitoring initialized");
        debugInfo(`[PERFORMANCE] Target FPS: ${performanceState.targetFps}, Low FPS threshold: ${performanceState.lowFpsThreshold}, Critical FPS threshold: ${performanceState.criticalFpsThreshold}`);
    }
}

/**
 * Update FPS monitoring - should be called every frame
 * @param {number} currentTime - Current timestamp from performance.now()
 */
export function updateFpsMonitoring(currentTime) {
    if (!performanceState.isMonitoring) return;
    
    // Calculate frame time
    if (performanceState.lastFrameTime > 0) {
        performanceState.frameTime = currentTime - performanceState.lastFrameTime;
        
        // Update average frame time
        if (performanceState.frameCount === 0) {
            performanceState.averageFrameTime = performanceState.frameTime;
        } else {
            performanceState.averageFrameTime = (performanceState.averageFrameTime * 0.95) + (performanceState.frameTime * 0.05);
        }
        
        // Track maximum frame time
        if (performanceState.frameTime > performanceState.maxFrameTime) {
            performanceState.maxFrameTime = performanceState.frameTime;
        }
        
        // Add to frame time history
        performanceState.frameTimeHistory.push({
            timestamp: currentTime,
            frameTime: performanceState.frameTime
        });
        
        // Maintain history size
        if (performanceState.frameTimeHistory.length > performanceState.maxFpsHistoryLength) {
            performanceState.frameTimeHistory.shift();
        }
    }
    
    performanceState.lastFrameTime = currentTime;
    performanceState.frameCount++;
    
    // Calculate FPS every second
    if (currentTime - performanceState.lastFpsUpdate >= 1000) {
        const timeDelta = currentTime - performanceState.lastFpsUpdate;
        performanceState.fps = Math.round((performanceState.frameCount * 1000) / timeDelta);
        
        // Add to FPS history
        performanceState.fpsHistory.push({
            timestamp: currentTime,
            fps: performanceState.fps
        });
        
        // Maintain history size
        if (performanceState.fpsHistory.length > performanceState.maxFpsHistoryLength) {
            performanceState.fpsHistory.shift();
        }
        
        // Check for performance issues
        checkFpsPerformance();
        
        // Reset counters
        performanceState.frameCount = 0;
        performanceState.lastFpsUpdate = currentTime;
    }
}

/**
 * Record physics step performance
 * @param {number} stepTime - Time taken for physics step in milliseconds
 */
export function recordPhysicsStepTime(stepTime) {
    if (!performanceState.isMonitoring) return;
    
    performanceState.physicsStepTime = stepTime;
    performanceState.physicsStepCount++;
    
    // Update average physics step time
    if (performanceState.physicsStepCount === 1) {
        performanceState.averagePhysicsStepTime = stepTime;
    } else {
        performanceState.averagePhysicsStepTime = (performanceState.averagePhysicsStepTime * 0.95) + (stepTime * 0.05);
    }
    
    // Track maximum physics step time
    if (stepTime > performanceState.maxPhysicsStepTime) {
        performanceState.maxPhysicsStepTime = stepTime;
    }
    
    // Add to physics time history
    performanceState.physicsTimeHistory.push({
        timestamp: performance.now(),
        stepTime: stepTime
    });
    
    // Maintain history size
    if (performanceState.physicsTimeHistory.length > performanceState.maxFpsHistoryLength) {
        performanceState.physicsTimeHistory.shift();
    }
    
    // Check for physics performance issues
    checkPhysicsPerformance(stepTime);
}

/**
 * Record render performance
 * @param {number} renderTime - Time taken for rendering in milliseconds
 */
export function recordRenderTime(renderTime) {
    if (!performanceState.isMonitoring) return;
    
    performanceState.renderTime = renderTime;
    
    // Update average render time
    if (performanceState.renderTimeHistory.length === 0) {
        performanceState.averageRenderTime = renderTime;
    } else {
        performanceState.averageRenderTime = (performanceState.averageRenderTime * 0.95) + (renderTime * 0.05);
    }
    
    // Track maximum render time
    if (renderTime > performanceState.maxRenderTime) {
        performanceState.maxRenderTime = renderTime;
    }
    
    // Add to render time history
    performanceState.renderTimeHistory.push({
        timestamp: performance.now(),
        renderTime: renderTime
    });
    
    // Maintain history size
    if (performanceState.renderTimeHistory.length > performanceState.maxFpsHistoryLength) {
        performanceState.renderTimeHistory.shift();
    }
}

/**
 * Record memory usage
 * @param {number} memoryUsage - Current memory usage in MB (optional, will use performance.memory if available)
 */
export function recordMemoryUsage(memoryUsage = null) {
    if (!performanceState.isMonitoring) return;
    
    // Use provided memory usage or try to get from performance.memory
    if (memoryUsage === null && performance.memory) {
        memoryUsage = performance.memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
    }
    
    if (memoryUsage !== null) {
        performanceState.memoryUsage = memoryUsage;
        
        // Track maximum memory usage
        if (memoryUsage > performanceState.maxMemoryUsage) {
            performanceState.maxMemoryUsage = memoryUsage;
        }
        
        // Add to memory history
        performanceState.memoryHistory.push({
            timestamp: performance.now(),
            memoryUsage: memoryUsage
        });
        
        // Maintain history size
        if (performanceState.memoryHistory.length > performanceState.maxFpsHistoryLength) {
            performanceState.memoryHistory.shift();
        }
    }
}

/**
 * Check FPS performance and generate alerts if needed
 */
function checkFpsPerformance() {
    const currentFps = performanceState.fps;
    
    // Check for low FPS
    if (currentFps < performanceState.lowFpsThreshold) {
        performanceState.consecutiveLowFrames++;
        
        if (currentFps < performanceState.criticalFpsThreshold) {
            createPerformanceAlert('critical_fps', `Critical FPS detected: ${currentFps} (target: ${performanceState.targetFps})`);
        } else {
            createPerformanceAlert('low_fps', `Low FPS detected: ${currentFps} (target: ${performanceState.targetFps})`);
        }
        
        // Alert on consecutive low frames
        if (performanceState.consecutiveLowFrames >= performanceState.maxConsecutiveLowFrames) {
            createPerformanceAlert('sustained_low_fps', `Sustained low FPS: ${performanceState.consecutiveLowFrames} consecutive frames below ${performanceState.lowFpsThreshold}`);
            performanceState.consecutiveLowFrames = 0; // Reset to avoid spam
        }
    } else {
        performanceState.consecutiveLowFrames = 0;
    }
    
    // Check for performance degradation
    const targetPerformance = performanceState.targetFps * performanceState.performanceDegradationThreshold;
    if (currentFps < targetPerformance) {
        const degradationPercent = Math.round(((performanceState.targetFps - currentFps) / performanceState.targetFps) * 100);
        createPerformanceAlert('performance_degradation', `Performance degraded by ${degradationPercent}%: ${currentFps}fps (target: ${performanceState.targetFps}fps)`);
    }
}

/**
 * Check physics performance and generate alerts if needed
 * @param {number} stepTime - Current physics step time
 */
function checkPhysicsPerformance(stepTime) {
    // Alert if physics step takes too long (more than half the frame budget)
    const frameTimeBudget = 1000 / performanceState.targetFps; // ms per frame
    const physicsTimeBudget = frameTimeBudget * 0.5; // Physics should use max 50% of frame time
    
    if (stepTime > physicsTimeBudget) {
        createPerformanceAlert('slow_physics', `Physics step taking too long: ${stepTime.toFixed(2)}ms (budget: ${physicsTimeBudget.toFixed(2)}ms)`);
    }
    
    // Alert if average physics time is consistently high
    if (performanceState.averagePhysicsStepTime > physicsTimeBudget * 0.8) {
        createPerformanceAlert('high_avg_physics', `Average physics step time high: ${performanceState.averagePhysicsStepTime.toFixed(2)}ms (budget: ${physicsTimeBudget.toFixed(2)}ms)`);
    }
}

/**
 * Create a performance alert
 * @param {string} type - Type of alert
 * @param {string} message - Alert message
 */
function createPerformanceAlert(type, message) {
    const now = performance.now();
    
    // Check cooldown to prevent spam
    const lastSimilarAlert = performanceState.alertHistory.find(alert => 
        alert.type === type && (now - alert.timestamp) < performanceState.alertCooldown
    );
    
    if (lastSimilarAlert) {
        return; // Skip this alert due to cooldown
    }
    
    const alert = {
        timestamp: now,
        type: type,
        message: message
    };
    
    performanceState.alertHistory.push(alert);
    
    // Maintain alert history size
    if (performanceState.alertHistory.length > performanceState.maxAlertHistory) {
        performanceState.alertHistory.shift();
    }
    
    // Log the alert
    if (type === 'critical_fps' || type === 'sustained_low_fps') {
        debugError(`[PERFORMANCE ALERT] ${message}`);
    } else {
        debugWarn(`[PERFORMANCE ALERT] ${message}`);
    }
}

/**
 * Update performance monitoring - should be called periodically
 * @param {number} currentTime - Current timestamp
 */
export function updatePerformanceMonitoring(currentTime) {
    if (!performanceState.isMonitoring) return;
    
    // Update FPS monitoring
    updateFpsMonitoring(currentTime);
    
    // Record memory usage if available
    recordMemoryUsage();
    
    // Log performance stats periodically
    if (currentTime - performanceState.lastLogTime >= performanceState.logInterval) {
        logPerformanceStats();
        performanceState.lastLogTime = currentTime;
    }
}

/**
 * Log comprehensive performance statistics
 */
export function logPerformanceStats() {
    if (!performanceState.isMonitoring) return;
    
    const avgFps = performanceState.fpsHistory.length > 0 
        ? Math.round(performanceState.fpsHistory.reduce((sum, entry) => sum + entry.fps, 0) / performanceState.fpsHistory.length)
        : 0;
    
    debugInfo(`[PERFORMANCE STATS] Performance Summary:
        - Current FPS: ${performanceState.fps}
        - Average FPS (last ${performanceState.fpsHistory.length}s): ${avgFps}
        - Frame Time: ${performanceState.frameTime.toFixed(2)}ms (avg: ${performanceState.averageFrameTime.toFixed(2)}ms, max: ${performanceState.maxFrameTime.toFixed(2)}ms)
        - Physics Step: ${performanceState.physicsStepTime.toFixed(2)}ms (avg: ${performanceState.averagePhysicsStepTime.toFixed(2)}ms, max: ${performanceState.maxPhysicsStepTime.toFixed(2)}ms)
        - Render Time: ${performanceState.renderTime.toFixed(2)}ms (avg: ${performanceState.averageRenderTime.toFixed(2)}ms, max: ${performanceState.maxRenderTime.toFixed(2)}ms)
        - Memory Usage: ${performanceState.memoryUsage.toFixed(2)}MB (max: ${performanceState.maxMemoryUsage.toFixed(2)}MB)
        - Consecutive Low Frames: ${performanceState.consecutiveLowFrames}
        - Total Alerts: ${performanceState.alertHistory.length}`);
    
    // Reset max values after logging
    performanceState.maxFrameTime = 0;
    performanceState.maxPhysicsStepTime = 0;
    performanceState.maxRenderTime = 0;
}

/**
 * Get current performance statistics
 * @returns {Object} Current performance stats
 */
export function getPerformanceStats() {
    return {
        fps: performanceState.fps,
        frameTime: performanceState.frameTime,
        averageFrameTime: performanceState.averageFrameTime,
        physicsStepTime: performanceState.physicsStepTime,
        averagePhysicsStepTime: performanceState.averagePhysicsStepTime,
        renderTime: performanceState.renderTime,
        averageRenderTime: performanceState.averageRenderTime,
        memoryUsage: performanceState.memoryUsage,
        maxMemoryUsage: performanceState.maxMemoryUsage,
        consecutiveLowFrames: performanceState.consecutiveLowFrames,
        alertCount: performanceState.alertHistory.length,
        isMonitoring: performanceState.isMonitoring
    };
}

/**
 * Get performance history data
 * @param {string} type - Type of history ('fps', 'frameTime', 'physics', 'render', 'memory')
 * @param {number} maxEntries - Maximum number of entries to return
 * @returns {Array} History data
 */
export function getPerformanceHistory(type, maxEntries = 60) {
    let history = [];
    
    switch (type) {
        case 'fps':
            history = performanceState.fpsHistory;
            break;
        case 'frameTime':
            history = performanceState.frameTimeHistory;
            break;
        case 'physics':
            history = performanceState.physicsTimeHistory;
            break;
        case 'render':
            history = performanceState.renderTimeHistory;
            break;
        case 'memory':
            history = performanceState.memoryHistory;
            break;
        default:
            debugWarn(`[PERFORMANCE] Unknown history type: ${type}`);
            return [];
    }
    
    return history.slice(-maxEntries);
}

/**
 * Get recent performance alerts
 * @param {number} maxEntries - Maximum number of alerts to return
 * @returns {Array} Recent alerts
 */
export function getPerformanceAlerts(maxEntries = 10) {
    return performanceState.alertHistory.slice(-maxEntries);
}

/**
 * Clear performance history and reset statistics
 */
export function resetPerformanceStats() {
    performanceState.fps = 0;
    performanceState.frameCount = 0;
    performanceState.lastFpsUpdate = 0;
    performanceState.fpsHistory = [];
    performanceState.frameTimeHistory = [];
    performanceState.physicsTimeHistory = [];
    performanceState.renderTimeHistory = [];
    performanceState.memoryHistory = [];
    performanceState.alertHistory = [];
    performanceState.consecutiveLowFrames = 0;
    performanceState.maxFrameTime = 0;
    performanceState.maxPhysicsStepTime = 0;
    performanceState.maxRenderTime = 0;
    performanceState.maxMemoryUsage = 0;
    
    debugInfo("[PERFORMANCE] Performance statistics reset");
}

/**
 * Enable or disable performance monitoring
 * @param {boolean} enabled - Whether to enable monitoring
 */
export function setPerformanceMonitoring(enabled) {
    performanceState.isMonitoring = enabled;
    debugInfo(`[PERFORMANCE] Performance monitoring ${enabled ? 'enabled' : 'disabled'}`);
}

/**
 * Check if performance monitoring is enabled
 * @returns {boolean} Whether monitoring is enabled
 */
export function isPerformanceMonitoringEnabled() {
    return performanceState.isMonitoring;
}

/**
 * Generate a performance report
 * @returns {Object} Comprehensive performance report
 */
export function generatePerformanceReport() {
    const now = performance.now();
    const recentAlerts = performanceState.alertHistory.filter(alert => 
        (now - alert.timestamp) < 60000 // Last minute
    );
    
    const avgFps = performanceState.fpsHistory.length > 0 
        ? performanceState.fpsHistory.reduce((sum, entry) => sum + entry.fps, 0) / performanceState.fpsHistory.length
        : 0;
    
    const report = {
        timestamp: now,
        summary: {
            currentFps: performanceState.fps,
            averageFps: Math.round(avgFps),
            targetFps: performanceState.targetFps,
            performanceRating: avgFps >= performanceState.targetFps * 0.9 ? 'Excellent' :
                              avgFps >= performanceState.targetFps * 0.8 ? 'Good' :
                              avgFps >= performanceState.targetFps * 0.6 ? 'Fair' : 'Poor'
        },
        timing: {
            frameTime: performanceState.frameTime,
            averageFrameTime: performanceState.averageFrameTime,
            physicsStepTime: performanceState.physicsStepTime,
            averagePhysicsStepTime: performanceState.averagePhysicsStepTime,
            renderTime: performanceState.renderTime,
            averageRenderTime: performanceState.averageRenderTime
        },
        memory: {
            currentUsage: performanceState.memoryUsage,
            maxUsage: performanceState.maxMemoryUsage
        },
        issues: {
            consecutiveLowFrames: performanceState.consecutiveLowFrames,
            recentAlerts: recentAlerts.length,
            totalAlerts: performanceState.alertHistory.length
        },
        alerts: recentAlerts
    };
    
    debugInfo(`[PERFORMANCE REPORT] Generated performance report: ${report.summary.performanceRating} performance (${report.summary.currentFps}fps)`);
    
    return report;
}