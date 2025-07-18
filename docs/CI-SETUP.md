# Continuous Integration Setup

This document describes the CI/CD setup for the Katamari-JS project using GitHub Actions.

## Overview

The project uses GitHub Actions for automated testing, coverage reporting, and deployment. The CI system is designed to:

- Run comprehensive test suites on every push and pull request
- Generate and report code coverage metrics
- Provide fast feedback to developers
- Prevent broken code from being merged
- Cache dependencies for faster execution

## Workflows

### 1. Continuous Integration (`ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**
- **Test Suite**: Runs on Node.js 18.x and 20.x
  - Unit tests
  - Integration tests
  - Performance tests
  - Coverage generation
  - Coverage threshold validation
- **Code Quality**: Runs coverage analysis and summary generation
- **Security Audit**: Checks for vulnerabilities
- **Build Verification**: Ensures the project builds successfully

**Coverage Integration:**
- Uploads coverage to Codecov and Coveralls
- Generates multiple coverage report formats
- Enforces 80% coverage threshold

### 2. Pull Request Checks (`pr-checks.yml`)

**Triggers:**
- Pull request opened, synchronized, or reopened

**Features:**
- Comprehensive test execution
- Coverage reporting with PR comments
- Performance test validation
- Commit status updates
- Detailed feedback on test results

### 3. Nightly Builds (`nightly.yml`)

**Triggers:**
- Scheduled daily at 2 AM UTC
- Manual workflow dispatch

**Features:**
- Extended test suite including E2E tests
- Multi-version Node.js testing (18.x, 20.x, 21.x)
- Dependency security audits
- Performance benchmarking
- Automated issue creation on failures

## Configuration Files

### GitHub Actions Workflows

- `.github/workflows/ci.yml` - Main CI pipeline
- `.github/workflows/pr-checks.yml` - Pull request validation
- `.github/workflows/nightly.yml` - Nightly builds and extended testing

### Coverage Configuration

- `codecov.yml` - Codecov service configuration
- Coverage thresholds: 80% for lines, branches, functions, and statements
- Ignore patterns for test files and build artifacts

### Cache Management

- `scripts/ci-cache.js` - CI cache management utilities
- Intelligent caching based on package-lock.json and test configuration
- Cache key generation and validation

## Test Scripts

The following npm scripts are available for CI:

```bash
# Test execution
npm test                    # Run all tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:performance   # Performance tests only

# Coverage
npm run test:coverage:ci   # Generate coverage for CI
npm run coverage:threshold # Check coverage thresholds
npm run coverage:summary   # Generate coverage summary

# Cache management
npm run ci:cache:key       # Generate cache key
npm run ci:cache:check     # Check cache validity
npm run ci:cache:stats     # Show cache statistics
```

## Status Badges

The project includes CI status badges in the README:

- **CI Status**: Shows current build status
- **Coverage**: Shows code coverage percentage

## Environment Variables

The following secrets should be configured in GitHub repository settings:

- `CODECOV_TOKEN` - Token for Codecov integration
- `GITHUB_TOKEN` - Automatically provided by GitHub Actions

## Performance Considerations

### Caching Strategy

- **Node modules**: Cached based on package-lock.json hash
- **Test results**: Cached to speed up subsequent runs
- **Build artifacts**: Cached between jobs

### Parallel Execution

- Tests run in parallel across multiple Node.js versions
- Jobs are optimized to run concurrently where possible
- Matrix strategy for multi-version testing

### Optimization Features

- Dependency caching reduces installation time
- Selective test execution based on changes
- Artifact sharing between jobs

## Troubleshooting

### Common Issues

1. **Test Timeouts**: Some performance tests may timeout on slower CI runners
   - Solution: Increase timeout values or optimize test performance

2. **Coverage Threshold Failures**: Coverage drops below 80%
   - Solution: Add tests for uncovered code or adjust thresholds

3. **Cache Issues**: Stale cache causing problems
   - Solution: Use cache management scripts to clean and regenerate

### Debugging

- Check workflow logs in GitHub Actions tab
- Use `npm run ci:cache:stats` to inspect cache status
- Review coverage reports for detailed metrics

## Best Practices

### For Developers

1. **Run tests locally** before pushing
2. **Check coverage** with `npm run test:coverage`
3. **Review PR feedback** from automated checks
4. **Keep tests fast** to maintain CI performance

### For Maintainers

1. **Monitor CI performance** and optimize as needed
2. **Update dependencies** regularly for security
3. **Review coverage trends** to maintain quality
4. **Adjust thresholds** based on project needs

## Future Enhancements

Potential improvements to the CI system:

- **Visual regression testing** for UI components
- **Performance regression detection** with historical baselines
- **Automated dependency updates** with Dependabot
- **Deployment automation** for staging environments
- **Integration with external monitoring** services

## Support

For CI-related issues:

1. Check the workflow logs in GitHub Actions
2. Review this documentation
3. Create an issue with the `ci-failure` label
4. Contact the maintainers for urgent issues