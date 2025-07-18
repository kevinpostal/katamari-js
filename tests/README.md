# Katamari-JS Test Suite

A comprehensive testing framework for the Katamari-JS game built with Vitest.

## Overview

This test suite provides complete coverage for the Katamari-JS game including:

- **Unit Tests** - Individual component testing
- **Integration Tests** - System interaction testing  
- **Performance Tests** - Frame rate and memory testing
- **End-to-End Tests** - Complete gameplay scenarios
- **Mock System** - Isolated testing environment
- **Coverage Reporting** - Code quality metrics
- **CI/CD Integration** - Automated testing pipeline

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Open test UI
npm run test:ui
```

## Test Categories

### Unit Tests (`tests/unit/`)

Test individual modules in isolation:

```bash
npm run test:unit
```

**Structure:**
- `core/` - Scene, physics, audio systems
- `entities/` - Katamari, items, environment
- `systems/` - Input, level, UI management
- `utils/` - Debug, performance, constants

### Integration Tests (`tests/integration/`)

Test system interactions:

```bash
npm run test:integration
```

**Coverage:**
- Physics-rendering synchronization
- Audio-event integration
- Input system coordination
- Collection mechanics flow
- Level progression logic

### Performance Tests (`tests/performance/`)

Benchmark game performance:

```bash
npm run test:performance
```

**Metrics:**
- Frame rate consistency (60 FPS target)
- Memory usage patterns
- Physics simulation performance
- Rendering optimization

### End-to-End Tests (`tests/e2e/`)

Complete gameplay scenarios:

```bash
npm run test:e2e
```

**Scenarios:**
- Game initialization flow
- Complete gameplay sessions
- Error handling and recovery

## Mock System

### Available Mocks

Located in `tests/__mocks__/`:

- **`three.js`** - 3D graphics mocking
- **`cannon-es.js`** - Physics simulation mocking
- **`tone.js`** - Audio synthesis mocking
- **`browser-apis.js`** - DOM/WebGL mocking

### Mock Usage

Mocks are automatically applied in test environment:

```javascript
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// These use mock implementations in tests
const scene = new THREE.Scene();
const world = new CANNON.World();
```

### Mock Validation

Ensure mocks stay synchronized:

```bash
npm run test:mocks:validate
```

## Test Utilities

### Helper Functions (`tests/helpers/`)

- **`setup.js`** - Global test configuration
- **`game-helpers.js`** - Game state utilities
- **`mock-helpers.js`** - Mock creation utilities
- **`performance-helpers.js`** - Performance measurement

### Test Fixtures (`tests/__fixtures__/`)

Standardized test data:

- **`game-states.js`** - Predefined game states
- **`level-data.js`** - Level configuration data
- **`mock-responses.js`** - Mock response data

### Example Usage

```javascript
import { setupGameWorld } from '../helpers/game-helpers.js';
import { measureFrameRate } from '../helpers/performance-helpers.js';

describe('Game Performance', () => {
    it('should maintain 60 FPS', async () => {
        const { scene, world } = setupGameWorld();
        const fps = await measureFrameRate({ duration: 1000 });
        expect(fps.average).toBeGreaterThan(58);
    });
});
```

## Coverage Reporting

### Coverage Thresholds

- **Lines**: 80%
- **Functions**: 80%
- **Branches**: 80%
- **Statements**: 80%

### Coverage Commands

```bash
# Generate coverage report
npm run test:coverage

# Open coverage in browser
npm run test:coverage:open

# Analyze coverage patterns
npm run coverage:analyze

# Check coverage thresholds
npm run coverage:threshold
```

### Coverage Configuration

Configured in `vitest.config.js`:

```javascript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'],
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 80,
    statements: 80
  }
}
```

## Snapshot Testing

### Snapshot Files (`tests/__snapshots__/`)

Captures consistent game state patterns:

- Game initialization snapshots
- Level generation patterns
- UI structure snapshots

### Snapshot Commands

```bash
# Update snapshots
npm run test:snapshots:update

# Check snapshot consistency
npm run test:snapshots:check
```

### Snapshot Usage

```javascript
it('should generate consistent level layout', () => {
    const level = generateLevel({ theme: 'earth', size: 'medium' });
    expect(level).toMatchSnapshot();
});
```

## Test Maintenance

### Maintenance Scripts

```bash
# Run all maintenance
npm run test:maintenance

# Update snapshots only
npm run test:maintenance:snapshots

# Validate mocks only
npm run test:maintenance:mocks

# Clean test artifacts
npm run test:maintenance:cleanup

# Generate test statistics
npm run test:maintenance:stats
```

### Automated Maintenance

The maintenance system provides:

- Snapshot synchronization
- Mock validation
- Test artifact cleanup
- Statistics generation
- Health monitoring

## Continuous Integration

### GitHub Actions Integration

Tests run automatically on:

- Push to main branch
- Pull request creation
- Scheduled nightly runs

### CI Commands

```bash
# Full CI test suite
npm run test:ci

# CI-specific coverage
npm run test:coverage:ci
```

### Cache Management

```bash
# Check cache status
npm run ci:cache:check

# Save test cache
npm run ci:cache:save

# Clean cache
npm run ci:cache:clean
```

## Metrics Dashboard

### Dashboard Generation

```bash
# Generate test dashboard
npm run test:dashboard

# Full test report
npm run test:report
```

### Dashboard Features

- Test execution metrics
- Coverage visualization
- Performance trends
- Suite statistics
- Historical data

### Dashboard Output

Generated files:
- `test-results/dashboard.html` - Interactive dashboard
- `test-results/metrics.json` - Raw metrics data

## Writing Tests

### Test Structure Template

```javascript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Component Name', () => {
    let component;
    
    beforeEach(() => {
        // Setup test environment
        component = createComponent();
    });
    
    afterEach(() => {
        // Cleanup resources
        component?.dispose();
        vi.clearAllMocks();
    });
    
    describe('Feature Group', () => {
        it('should behave correctly under normal conditions', () => {
            // Arrange
            const input = createTestInput();
            
            // Act
            const result = component.process(input);
            
            // Assert
            expect(result).toBe(expectedValue);
        });
        
        it('should handle edge cases gracefully', () => {
            // Test boundary conditions
        });
    });
});
```

### Best Practices

1. **Use descriptive test names** that explain expected behavior
2. **Follow AAA pattern** (Arrange, Act, Assert)
3. **Clean up resources** in afterEach hooks
4. **Mock external dependencies** but not internal modules
5. **Keep tests focused** on single behaviors
6. **Use setup helpers** for common initialization

### Performance Test Example

```javascript
import { measurePerformance } from '../helpers/performance-helpers.js';

it('should maintain performance under load', async () => {
    const metrics = await measurePerformance({
        setup: () => createGameWorld({ objects: 1000 }),
        test: (world) => world.step(1/60),
        iterations: 100
    });
    
    expect(metrics.averageTime).toBeLessThan(16); // 60 FPS = 16ms
    expect(metrics.memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB
});
```

## Troubleshooting

### Common Issues

#### Tests Failing in CI

```bash
# Check environment differences
npm run test:debug

# Validate mocks
npm run test:mocks:validate

# Clean cache
npm run ci:cache:clean
```

#### Memory Leaks

```javascript
afterEach(() => {
    // Dispose Three.js objects
    scene?.dispose();
    renderer?.dispose();
    
    // Clear physics world
    world?.bodies.forEach(body => world.removeBody(body));
    
    // Reset mocks
    vi.clearAllMocks();
});
```

#### Flaky Tests

```javascript
// Use multiple samples for stability
it('should be stable across runs', async () => {
    const results = [];
    for (let i = 0; i < 5; i++) {
        results.push(await measureMetric());
    }
    const average = results.reduce((a, b) => a + b) / results.length;
    expect(average).toBeGreaterThan(threshold);
});
```

### Debug Utilities

```javascript
import { debugLog } from '../helpers/debug-helpers.js';

it('should debug test execution', () => {
    debugLog('Test input:', input);
    const result = functionUnderTest(input);
    debugLog('Test result:', result);
    expect(result).toBe(expected);
});
```

## Configuration

### Vitest Configuration (`vitest.config.js`)

```javascript
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/helpers/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 }
    }
  }
});
```

### Environment Variables

- `DEBUG=true` - Enable debug logging
- `CI=true` - CI environment detection
- `COVERAGE_THRESHOLD=80` - Coverage requirement

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](../docs/TESTING.md)
- [Project Architecture](../docs/ARCHITECTURE.md)
- [Contributing Guidelines](../CONTRIBUTING.md)

## Support

For test-related questions:

1. Check this README and testing documentation
2. Review existing test examples
3. Run diagnostic commands (`npm run test:debug`)
4. Validate test environment (`npm run test:maintenance`)

---

**Happy Testing! 🎮🧪**