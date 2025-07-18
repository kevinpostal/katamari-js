/**
 * Performance testing helper functions
 * Provides utilities for measuring and analyzing game performance
 */

import { vi } from 'vitest';

/**
 * Performance metrics collector class
 */
export class PerformanceCollector {
    constructor() {
        this.metrics = {
            frameRate: [],
            memory: [],
            timing: [],
            physics: [],
            rendering: []
        };
        this.startTime = 0;
        this.frameCount = 0;
        this.isCollecting = false;
    }

    /**
     * Start collecting performance metrics
     */
    start() {
        this.isCollecting = true;
        this.startTime = performance.now();
        this.frameCount = 0;
        this.metrics = {
            frameRate: [],
            memory: [],
            timing: [],
            physics: [],
            rendering: []
        };
    }

    /**
     * Stop collecting performance metrics
     */
    stop() {
        this.isCollecting = false;
    }

    /**
     * Record a frame's performance data
     * @param {Object} frameData - Frame performance data
     */
    recordFrame(frameData = {}) {
        if (!this.isCollecting) return;

        const now = performance.now();
        const frameTime = frameData.frameTime || 16.67;
        
        this.frameCount++;
        
        // Record frame rate
        this.metrics.frameRate.push({
            timestamp: now,
            fps: 1000 / frameTime,
            frameTime: frameTime
        });

        // Record memory usage if available
        if (performance.memory) {
            this.metrics.memory.push({
                timestamp: now,
                heapUsed: performance.memory.usedJSHeapSize,
                heapTotal: performance.memory.totalJSHeapSize,
                heapLimit: performance.memory.jsHeapSizeLimit
            });
        }

        // Record timing data
        this.metrics.timing.push({
            timestamp: now,
            physicsStep: frameData.physicsStep || 0,
            renderTime: frameData.renderTime || 0,
            updateTime: frameData.updateTime || 0,
            totalFrameTime: frameTime
        });

        // Record physics performance
        if (frameData.physics) {
            this.metrics.physics.push({
                timestamp: now,
                bodyCount: frameData.physics.bodyCount || 0,
                collisionCount: frameData.physics.collisionCount || 0,
                stepTime: frameData.physics.stepTime || 0
            });
        }

        // Record rendering performance
        if (frameData.rendering) {
            this.metrics.rendering.push({
                timestamp: now,
                drawCalls: frameData.rendering.drawCalls || 0,
                triangles: frameData.rendering.triangles || 0,
                renderTime: frameData.rendering.renderTime || 0
            });
        }
    }

    /**
     * Analyze collected performance data
     * @returns {Object} Performance analysis results
     */
    analyze() {
        const duration = performance.now() - this.startTime;
        
        return {
            duration,
            frameCount: this.frameCount,
            averageFPS: this.frameCount / (duration / 1000),
            frameRate: this.analyzeFrameRate(),
            memory: this.analyzeMemory(),
            timing: this.analyzeTiming(),
            physics: this.analyzePhysics(),
            rendering: this.analyzeRendering()
        };
    }

    /**
     * Analyze frame rate metrics
     * @returns {Object} Frame rate analysis
     */
    analyzeFrameRate() {
        if (this.metrics.frameRate.length === 0) return null;

        const fps = this.metrics.frameRate.map(f => f.fps);
        const frameTimes = this.metrics.frameRate.map(f => f.frameTime);

        return {
            average: this.calculateAverage(fps),
            minimum: Math.min(...fps),
            maximum: Math.max(...fps),
            consistency: this.calculateConsistency(fps),
            frameTimeAverage: this.calculateAverage(frameTimes),
            frameTimeVariance: this.calculateVariance(frameTimes)
        };
    }

    /**
     * Analyze memory usage metrics
     * @returns {Object} Memory analysis
     */
    analyzeMemory() {
        if (this.metrics.memory.length === 0) return null;

        const heapUsed = this.metrics.memory.map(m => m.heapUsed);
        const heapTotal = this.metrics.memory.map(m => m.heapTotal);

        return {
            heapUsedAverage: this.calculateAverage(heapUsed),
            heapUsedPeak: Math.max(...heapUsed),
            heapTotalAverage: this.calculateAverage(heapTotal),
            memoryGrowth: this.calculateGrowthRate(heapUsed),
            potentialLeak: this.detectMemoryLeak(heapUsed)
        };
    }

    /**
     * Analyze timing metrics
     * @returns {Object} Timing analysis
     */
    analyzeTiming() {
        if (this.metrics.timing.length === 0) return null;

        const physicsSteps = this.metrics.timing.map(t => t.physicsStep);
        const renderTimes = this.metrics.timing.map(t => t.renderTime);
        const updateTimes = this.metrics.timing.map(t => t.updateTime);

        return {
            physicsStepAverage: this.calculateAverage(physicsSteps),
            renderTimeAverage: this.calculateAverage(renderTimes),
            updateTimeAverage: this.calculateAverage(updateTimes),
            physicsStepMax: Math.max(...physicsSteps),
            renderTimeMax: Math.max(...renderTimes)
        };
    }

    /**
     * Analyze physics performance metrics
     * @returns {Object} Physics analysis
     */
    analyzePhysics() {
        if (this.metrics.physics.length === 0) return null;

        const bodyCounts = this.metrics.physics.map(p => p.bodyCount);
        const stepTimes = this.metrics.physics.map(p => p.stepTime);

        return {
            averageBodyCount: this.calculateAverage(bodyCounts),
            maxBodyCount: Math.max(...bodyCounts),
            averageStepTime: this.calculateAverage(stepTimes),
            maxStepTime: Math.max(...stepTimes),
            performanceRatio: this.calculateAverage(stepTimes) / this.calculateAverage(bodyCounts)
        };
    }

    /**
     * Analyze rendering performance metrics
     * @returns {Object} Rendering analysis
     */
    analyzeRendering() {
        if (this.metrics.rendering.length === 0) return null;

        const drawCalls = this.metrics.rendering.map(r => r.drawCalls);
        const triangles = this.metrics.rendering.map(r => r.triangles);
        const renderTimes = this.metrics.rendering.map(r => r.renderTime);

        return {
            averageDrawCalls: this.calculateAverage(drawCalls),
            maxDrawCalls: Math.max(...drawCalls),
            averageTriangles: this.calculateAverage(triangles),
            maxTriangles: Math.max(...triangles),
            averageRenderTime: this.calculateAverage(renderTimes),
            renderEfficiency: this.calculateAverage(triangles) / this.calculateAverage(renderTimes)
        };
    }

    /**
     * Calculate average of an array
     * @param {number[]} values - Array of numbers
     * @returns {number} Average value
     */
    calculateAverage(values) {
        if (values.length === 0) return 0;
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    /**
     * Calculate variance of an array
     * @param {number[]} values - Array of numbers
     * @returns {number} Variance value
     */
    calculateVariance(values) {
        if (values.length === 0) return 0;
        const avg = this.calculateAverage(values);
        const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
        return this.calculateAverage(squaredDiffs);
    }

    /**
     * Calculate consistency score (1 - coefficient of variation)
     * @param {number[]} values - Array of numbers
     * @returns {number} Consistency score (0-1)
     */
    calculateConsistency(values) {
        if (values.length === 0) return 0;
        const avg = this.calculateAverage(values);
        const variance = this.calculateVariance(values);
        const stdDev = Math.sqrt(variance);
        const coefficientOfVariation = stdDev / avg;
        return Math.max(0, 1 - coefficientOfVariation);
    }

    /**
     * Calculate growth rate of values over time
     * @param {number[]} values - Array of numbers
     * @returns {number} Growth rate per sample
     */
    calculateGrowthRate(values) {
        if (values.length < 2) return 0;
        const first = values[0];
        const last = values[values.length - 1];
        return (last - first) / values.length;
    }

    /**
     * Detect potential memory leak
     * @param {number[]} heapValues - Array of heap usage values
     * @returns {boolean} True if potential leak detected
     */
    detectMemoryLeak(heapValues) {
        if (heapValues.length < 10) return false;
        
        // Check if memory consistently grows over time
        const growthRate = this.calculateGrowthRate(heapValues);
        const threshold = 1000000; // 1MB growth per sample
        
        return growthRate > threshold;
    }
}

/**
 * Create a performance test scenario
 * @param {string} name - Test scenario name
 * @param {Function} testFunction - Function to test
 * @param {Object} options - Test options
 * @returns {Promise<Object>} Performance test results
 */
export async function createPerformanceTest(name, testFunction, options = {}) {
    const {
        duration = 5000, // 5 seconds
        targetFPS = 60,
        warmupFrames = 60,
        cooldownFrames = 30
    } = options;

    const collector = new PerformanceCollector();
    const results = {
        name,
        success: false,
        error: null,
        metrics: null,
        thresholds: {
            targetFPS,
            maxFrameTime: 1000 / targetFPS * 1.5, // 50% tolerance
            maxMemoryGrowth: 10000000 // 10MB
        }
    };

    try {
        // Warmup phase
        for (let i = 0; i < warmupFrames; i++) {
            await testFunction({ frame: i, phase: 'warmup' });
            await new Promise(resolve => setTimeout(resolve, 16));
        }

        // Test phase
        collector.start();
        const startTime = performance.now();
        let frame = 0;

        while (performance.now() - startTime < duration) {
            const frameStart = performance.now();
            
            await testFunction({ frame, phase: 'test' });
            
            const frameEnd = performance.now();
            const frameTime = frameEnd - frameStart;

            collector.recordFrame({
                frameTime,
                physicsStep: Math.random() * 5, // Mock physics time
                renderTime: Math.random() * 10, // Mock render time
                updateTime: Math.random() * 2   // Mock update time
            });

            frame++;
            await new Promise(resolve => setTimeout(resolve, Math.max(0, 16 - frameTime)));
        }

        collector.stop();

        // Cooldown phase
        for (let i = 0; i < cooldownFrames; i++) {
            await testFunction({ frame: i, phase: 'cooldown' });
            await new Promise(resolve => setTimeout(resolve, 16));
        }

        results.metrics = collector.analyze();
        results.success = validatePerformanceThresholds(results.metrics, results.thresholds);

    } catch (error) {
        results.error = error.message;
        results.success = false;
    }

    return results;
}

/**
 * Validate performance metrics against thresholds
 * @param {Object} metrics - Performance metrics
 * @param {Object} thresholds - Performance thresholds
 * @returns {boolean} True if all thresholds are met
 */
export function validatePerformanceThresholds(metrics, thresholds) {
    if (!metrics) return false;

    const checks = [];

    // Check frame rate
    if (metrics.frameRate) {
        checks.push(metrics.frameRate.average >= thresholds.targetFPS * 0.9);
        checks.push(metrics.frameRate.minimum >= thresholds.targetFPS * 0.8);
        checks.push(metrics.frameRate.consistency >= 0.8);
    }

    // Check memory growth
    if (metrics.memory) {
        checks.push(metrics.memory.memoryGrowth < thresholds.maxMemoryGrowth);
        checks.push(!metrics.memory.potentialLeak);
    }

    // Check frame time consistency
    if (metrics.frameRate) {
        checks.push(metrics.frameRate.frameTimeAverage <= thresholds.maxFrameTime);
    }

    return checks.every(check => check === true);
}

/**
 * Create a mock performance scenario for testing
 * @param {Object} options - Scenario options
 * @returns {Function} Mock performance test function
 */
export function createMockPerformanceScenario(options = {}) {
    const {
        objectCount = 100,
        physicsEnabled = true,
        audioEnabled = true,
        targetFPS = 60
    } = options;

    return async function mockScenario({ frame, phase }) {
        // Simulate object creation/destruction
        if (frame % 60 === 0 && phase === 'test') {
            // Simulate adding objects every second
            const newObjects = Math.floor(Math.random() * 10);
            // Mock object creation time
            await new Promise(resolve => setTimeout(resolve, newObjects * 0.1));
        }

        // Simulate physics computation
        if (physicsEnabled) {
            const physicsTime = objectCount * 0.01; // Simulate physics overhead
            await new Promise(resolve => setTimeout(resolve, physicsTime));
        }

        // Simulate audio processing
        if (audioEnabled) {
            const audioTime = Math.random() * 2; // Random audio processing time
            await new Promise(resolve => setTimeout(resolve, audioTime));
        }

        // Simulate rendering
        const renderTime = objectCount * 0.05; // Simulate render overhead
        await new Promise(resolve => setTimeout(resolve, renderTime));
    };
}

/**
 * Memory leak detection utility
 * @param {Function} testFunction - Function to test for memory leaks
 * @param {Object} options - Test options
 * @returns {Promise<Object>} Memory leak test results
 */
export async function detectMemoryLeaks(testFunction, options = {}) {
    const {
        iterations = 100,
        samplingInterval = 10,
        leakThreshold = 5000000 // 5MB
    } = options;

    const memorySnapshots = [];
    
    // Force garbage collection if available
    if (global.gc) {
        global.gc();
    }

    for (let i = 0; i < iterations; i++) {
        await testFunction(i);

        // Take memory snapshot every samplingInterval iterations
        if (i % samplingInterval === 0) {
            if (global.gc) {
                global.gc(); // Force GC before measurement
            }
            
            if (performance.memory) {
                memorySnapshots.push({
                    iteration: i,
                    heapUsed: performance.memory.usedJSHeapSize,
                    heapTotal: performance.memory.totalJSHeapSize,
                    timestamp: performance.now()
                });
            }
        }
    }

    // Analyze memory growth
    if (memorySnapshots.length < 2) {
        return { hasLeak: false, reason: 'Insufficient memory data' };
    }

    const firstSnapshot = memorySnapshots[0];
    const lastSnapshot = memorySnapshots[memorySnapshots.length - 1];
    const memoryGrowth = lastSnapshot.heapUsed - firstSnapshot.heapUsed;
    const growthRate = memoryGrowth / memorySnapshots.length;

    return {
        hasLeak: memoryGrowth > leakThreshold,
        memoryGrowth,
        growthRate,
        snapshots: memorySnapshots,
        analysis: {
            totalGrowth: memoryGrowth,
            averageGrowthPerIteration: growthRate,
            peakMemory: Math.max(...memorySnapshots.map(s => s.heapUsed)),
            finalMemory: lastSnapshot.heapUsed
        }
    };
}

/**
 * Benchmark a function's execution time
 * @param {Function} fn - Function to benchmark
 * @param {Object} options - Benchmark options
 * @returns {Promise<Object>} Benchmark results
 */
export async function benchmark(fn, options = {}) {
    const {
        iterations = 1000,
        warmupIterations = 100
    } = options;

    // Warmup
    for (let i = 0; i < warmupIterations; i++) {
        await fn();
    }

    // Benchmark
    const times = [];
    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await fn();
        const end = performance.now();
        times.push(end - start);
    }

    const average = times.reduce((sum, time) => sum + time, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    const median = times.sort((a, b) => a - b)[Math.floor(times.length / 2)];

    return {
        iterations,
        average,
        min,
        max,
        median,
        times
    };
}