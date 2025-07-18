# Testing Guide

This document provides comprehensive guidance for testing the Katamari-JS game using Vitest.

## Table of Contents

- [Quick Start](#quick-start)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Mock System](#mock-system)
- [Performance Testing](#performance-testing)
- [Coverage Reporting](#coverage-reporting)
- [Continuous Integration](#continuous-integration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Prerequisites

- Node.js 16+ installed
- Project dependencies installed (`npm install`)

### Running Your First Test

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Structure

Our test suite is organized into four main categories:

```
tests/
├── unit/           # Individual component tests
├── integration/    # System interaction tests  
├── performance/    # Performance and benchmarking tests
├── e2e/           # End-to-end scenario tests
├── __mocks__/     # Mock implementations
├── __fixtures__/  # Test data and fixtures
├── __snapshots__/ # Snapshot test files
└── helpers/       # Test utilities
```

### Unit Tests

Test individual modules in isolation:

```javascript
// tests/unit/core/scene.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createScene } from '../../../src/game/core/scene.js';

describe('Scene Management', () => {
    let scene;
    
    beforeEach(() => {
        scene = createScene();
    });
    
    afterEach(() => {
        scene?.dispose();
    });
    
    it('should initialize scene with default lighting', () => {
        expect(scene.children).toHaveLength(2); // ambient + directional light
        expect(scene.children[0].type).toBe('AmbientLight');
    });
});
```

### Integration Tests

Test how systems work together:

```javascript
// tests/integration/physics-rendering.test.js
import { describe, it, expect } from 'vitest';
import { setupGameWorld } from '../helpers/game-helpers.js';

describe('Physics-Rendering Integration', () => {
    it('should sync physics body position with mesh position', async () => {
        const { world, scene, katamari } = setupGameWorld();
        
        // Move physics body
        katamari.body.position.set(5, 0, 5);
        world.step(1/60);
        
        // Check mesh follows
        expect(katamari.mesh.position.x).toBeCloseTo(5);
        expect(katamari.mesh.position.z).toBeCloseTo(5);
    });
});
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run specific test categories
npm run test:unit
npm run test:integration  
npm run test:performance
npm run test:e2e

# Run all test categories sequentially
npm run test:all
```

### Development Commands

```bash
# Watch mode for active development
npm run test:watch

# Interactive UI for test exploration
npm run test:ui

# Debug mode with verbose output
npm run test:debug

# Profile tests for performance analysis
npm run test:profile
```

### Coverage Commands

```bash
# Generate coverage report
npm run test:coverage

# Open coverage report in browser
npm run test:coverage:open

# Generate coverage analysis
npm run coverage:analyze

# Check coverage thresholds
npm run coverage:threshold
```

### Maintenance Commands

```bash
# Update snapshot tests
npm run test:snapshots:update

# Validate mock implementations
npm run test:mocks:validate

# Run maintenance checks
npm run test:maintenance
```

## Writing Tests

### Test File Naming

- Unit tests: `*.test.js`
- Integration tests: `*.test.js` 
- Performance tests: `*.test.js`
- E2E tests: `*.test.js`

### Test Structure Template

```javascript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Component Name', () => {
    // Setup and teardown
    beforeEach(() => {
        // Initialize test environment
    });
    
    afterEach(() => {
        // Clean up resources
        vi.clearAllMocks();
    });
    
    describe('Feature Group', () => {
        it('should behave correctly under normal conditions', () => {
            // Arrange
            const input = createTestInput();
            
            // Act
            const result = functionUnderTest(input);
            
            // Assert
            expect(result).toBe(expectedValue);
        });
        
        it('should handle edge cases gracefully', () => {
            // Test edge cases and error conditions
        });
    });
});
```

### Async Testing

```javascript
it('should handle async operations', async () => {
    const promise = asyncFunction();
    await expect(promise).resolves.toBe(expectedValue);
});

it('should handle promise rejections', async () => {
    const promise = failingAsyncFunction();
    await expect(promise).rejects.toThrow('Expected error message');
});
```

### Mock Usage

```javascript
import { vi } from 'vitest';

it('should call external dependency correctly', () => {
    const mockFn = vi.fn().mockReturnValue('mocked result');
    const result = functionThatCallsMock(mockFn);
    
    expect(mockFn).toHaveBeenCalledWith(expectedArgs);
    expect(result).toBe('expected result');
});
```

## Mock System

### Available Mocks

Our mock system provides lightweight implementations for:

- **Three.js**: 3D graphics objects and methods
- **Cannon-ES**: Physics simulation components  
- **Tone.js**: Audio synthesis and playback
- **Browser APIs**: DOM, Canvas, WebGL, device events

### Using Mocks

Mocks are automatically applied via Vitest configuration. To use them:

```javascript
// Mocks are automatically available
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// These will use mock implementations in tests
const scene = new THREE.Scene();
const world = new CANNON.World();
```

### Custom Mock Implementations

```javascript
// tests/__mocks__/custom-module.js
export const mockFunction = vi.fn(() => 'mocked result');
export const mockClass = vi.fn().mockImplementation(() => ({
    method: vi.fn(),
    property: 'mock value'
}));
```

### Mock Validation

Ensure mocks stay in sync with real implementations:

```bash
npm run test:mocks:validate
```

## Performance Testing

### Frame Rate Testing

```javascript
// tests/performance/frame-rate.test.js
import { measureFrameRate } from '../helpers/performance-helpers.js';

it('should maintain 60 FPS with 100 objects', async () => {
    const { averageFPS } = await measureFrameRate({
        objectCount: 100,
        duration: 1000 // 1 second
    });
    
    expect(averageFPS).toBeGreaterThan(58); // Allow 2 FPS tolerance
});
```

### Memory Testing

```javascript
// tests/performance/memory-usage.test.js
import { measureMemoryUsage } from '../helpers/performance-helpers.js';

it('should not leak memory during gameplay', async () => {
    const initialMemory = measureMemoryUsage();
    
    // Simulate gameplay
    await simulateGameplay(5000); // 5 seconds
    
    const finalMemory = measureMemoryUsage();
    const memoryIncrease = finalMemory - initialMemory;
    
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB limit
});
```

## Coverage Reporting

### Coverage Thresholds

Our project maintains these coverage requirements:

- **Lines**: 80%
- **Functions**: 80%  
- **Branches**: 80%
- **Statements**: 80%

### Viewing Coverage

```bash
# Generate and open coverage report
npm run test:coverage:open

# View coverage summary in terminal
npm run coverage:summary

# Analyze coverage patterns
npm run coverage:analyze
```

### Coverage Configuration

Coverage is configured in `vitest.config.js`:

```javascript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      },
      exclude: [
        'tests/**',
        'scripts/**',
        'docs/**'
      ]
    }
  }
});
```

## Continuous Integration

### GitHub Actions Integration

Tests run automatically on:

- Every push to main branch
- Every pull request
- Scheduled nightly runs

### CI Commands

```bash
# Run full CI test suite
npm run test:ci

# Generate CI-specific coverage report
npm run test:coverage:ci
```

### Cache Management

```bash
# Check cache status
npm run ci:cache:check

# Generate cache key
npm run ci:cache:key

# Save cache
npm run ci:cache:save

# Clean cache
npm run ci:cache:clean
```

## Best Practices

### Test Organization

1. **Group related tests** using `describe` blocks
2. **Use descriptive test names** that explain the expected behavior
3. **Follow AAA pattern**: Arrange, Act, Assert
4. **Keep tests focused** on single behaviors
5. **Use setup/teardown** for common initialization

### Performance Considerations

1. **Clean up resources** in `afterEach` hooks
2. **Use mocks** to avoid expensive operations
3. **Limit test data size** to minimum needed
4. **Avoid unnecessary async operations**
5. **Use `vi.useFakeTimers()`** for time-dependent tests

### Mock Best Practices

1. **Mock external dependencies** but not internal modules
2. **Verify mock interactions** with `toHaveBeenCalledWith`
3. **Reset mocks** between tests
4. **Keep mocks simple** and focused
5. **Validate mock implementations** regularly

### Snapshot Testing

1. **Use snapshots** for complex data structures
2. **Review snapshot changes** carefully
3. **Keep snapshots small** and focused
4. **Update snapshots** only when intentional changes occur

## Troubleshooting

### Common Issues

#### Tests Failing in CI but Passing Locally

```bash
# Check for environment differences
npm run test:debug

# Validate mock implementations
npm run test:mocks:validate

# Check cache issues
npm run ci:cache:clean
```

#### Memory Leaks in Tests

```javascript
// Ensure proper cleanup
afterEach(() => {
    // Dispose Three.js objects
    scene?.dispose();
    renderer?.dispose();
    
    // Clear Cannon-ES world
    world?.bodies.forEach(body => world.removeBody(body));
    
    // Reset mocks
    vi.clearAllMocks();
});
```

#### Flaky Performance Tests

```javascript
// Use multiple samples for stability
it('should maintain performance', async () => {
    const samples = [];
    
    for (let i = 0; i < 5; i++) {
        const fps = await measureFrameRate();
        samples.push(fps);
    }
    
    const averageFPS = samples.reduce((a, b) => a + b) / samples.length;
    expect(averageFPS).toBeGreaterThan(58);
});
```

#### Snapshot Mismatches

```bash
# Review changes carefully
npm run test:snapshots:check

# Update if changes are intentional
npm run test:snapshots:update
```

### Getting Help

1. **Check test output** for specific error messages
2. **Use debug mode** for verbose information
3. **Validate mocks** if external dependencies are involved
4. **Check coverage reports** for untested code paths
5. **Review CI logs** for environment-specific issues

### Debugging Tests

```javascript
// Add debug logging
import { debugLog } from '../helpers/debug-helpers.js';

it('should debug test behavior', () => {
    debugLog('Test input:', testInput);
    const result = functionUnderTest(testInput);
    debugLog('Test result:', result);
    expect(result).toBe(expected);
});
```

## Advanced Topics

### Custom Matchers

```javascript
// tests/helpers/custom-matchers.js
import { expect } from 'vitest';

expect.extend({
    toBeWithinRange(received, floor, ceiling) {
        const pass = received >= floor && received <= ceiling;
        return {
            pass,
            message: () => `expected ${received} to be within range ${floor}-${ceiling}`
        };
    }
});
```

### Test Utilities

```javascript
// tests/helpers/game-helpers.js
export function setupGameWorld(options = {}) {
    const scene = new THREE.Scene();
    const world = new CANNON.World();
    const katamari = createKatamari(options.katamariSize);
    
    return { scene, world, katamari };
}

export function simulateGameplay(duration) {
    return new Promise(resolve => {
        const startTime = Date.now();
        const gameLoop = () => {
            if (Date.now() - startTime >= duration) {
                resolve();
            } else {
                requestAnimationFrame(gameLoop);
            }
        };
        gameLoop();
    });
}
```

This testing guide provides everything you need to effectively test the Katamari-JS game. For additional questions or advanced use cases, refer to the [Vitest documentation](https://vitest.dev/) or check the project's test examples.