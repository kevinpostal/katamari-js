# Contributing to Katamari-JS

Thank you for your interest in contributing to Katamari-JS! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- Modern web browser with ES6 module support
- Basic knowledge of JavaScript, Three.js, and web development

### Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/yourusername/katamari-js.git
   cd katamari-js
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:3000`

## 🎯 How to Contribute

### Reporting Bugs
- Use the [GitHub Issues](https://github.com/yourusername/katamari-js/issues) page
- Search existing issues before creating new ones
- Include detailed reproduction steps
- Provide browser/device information
- Include console errors if applicable

### Suggesting Features
- Open a [GitHub Discussion](https://github.com/yourusername/katamari-js/discussions) first
- Describe the feature and its benefits
- Consider implementation complexity
- Discuss with maintainers before starting work

### Code Contributions

#### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

#### Pull Request Process
1. Create a feature branch from `main`
2. Make your changes following our coding standards
3. Test thoroughly on desktop and mobile
4. Update documentation if needed
5. Submit a pull request with clear description

## 📝 Coding Standards

### JavaScript Style
- Use ES6+ features and modules
- 4-space indentation (no tabs)
- Use `const` for immutable references, `let` for variables
- Descriptive variable and function names
- JSDoc comments for public functions

### Code Organization
- Follow the existing modular structure
- Keep functions focused and small
- Use the established debug logging system
- Maintain performance-first approach

### Example Code Style
```javascript
/**
 * Updates katamari physics and rendering
 * @param {number} deltaTime - Time since last frame
 * @param {Object} katamari - Katamari entity
 */
const updateKatamari = (deltaTime, katamari) => {
    const velocity = getBodyVelocityMagnitude(katamari.body);
    
    if (velocity > KATAMARI.MIN_ROLLING_SPEED) {
        playRollingSound(velocity);
    } else {
        stopRollingSound();
    }
    
    debugLog(`Katamari velocity: ${velocity.toFixed(2)}m/s`);
};
```

### Performance Guidelines
- Maintain 60 FPS target
- Use object pooling for frequently created objects
- Implement proper cleanup for removed objects
- Profile performance changes
- Test on lower-end devices

### Debug System
Use the established debug logging:
```javascript
import { debugLog, debugWarn, debugError } from './game/utils/debug.js';

debugLog('Informational message');
debugWarn('Warning message');
debugError('Error message');
```

## 🧪 Testing

### Manual Testing Checklist
- [ ] Game loads without errors
- [ ] Controls work on desktop (WASD, arrows)
- [ ] Touch controls work on mobile
- [ ] Gyroscope controls work (if supported)
- [ ] Physics simulation runs smoothly
- [ ] Audio plays correctly
- [ ] Objects collect properly
- [ ] Performance stays above 45 FPS
- [ ] Debug mode functions correctly

### Browser Testing
Test on these browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

### Performance Testing
- Monitor FPS during gameplay
- Check memory usage over time
- Test with large katamari sizes
- Verify cleanup of distant objects

## 🎨 Asset Guidelines

### 3D Models
- Keep polygon counts reasonable
- Use efficient UV mapping
- Optimize for real-time rendering
- Follow naming conventions

### Audio
- Use Tone.js for dynamic synthesis
- Keep audio files small
- Test on various devices
- Ensure proper cleanup

## 📚 Documentation

### Code Documentation
- JSDoc comments for public APIs
- Inline comments for complex logic
- Update README for new features
- Document configuration options

### Commit Messages
Follow conventional commits format:
```
type(scope): description

feat(physics): add collision detection optimization
fix(audio): resolve mobile audio context issues
docs(readme): update installation instructions
```

## 🔍 Code Review Process

### What We Look For
- Code quality and readability
- Performance impact
- Mobile compatibility
- Proper error handling
- Documentation updates

### Review Criteria
- Follows coding standards
- Includes appropriate tests
- Maintains performance targets
- Works across target browsers
- Includes necessary documentation

## 🚀 Release Process

### Version Numbering
We follow [Semantic Versioning](https://semver.org/):
- `MAJOR.MINOR.PATCH`
- Major: Breaking changes
- Minor: New features
- Patch: Bug fixes

### Release Checklist
- [ ] All tests pass
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Browser compatibility verified
- [ ] Mobile testing completed

## 🤝 Community Guidelines

### Code of Conduct
- Be respectful and inclusive
- Provide constructive feedback
- Help newcomers learn
- Focus on the code, not the person

### Communication
- Use GitHub Issues for bugs
- Use GitHub Discussions for questions
- Be clear and concise
- Provide context and examples

## 🎯 Areas for Contribution

### High Priority
- Performance optimizations
- Mobile experience improvements
- New object types and environments
- Audio system enhancements

### Good First Issues
- UI/UX improvements
- Documentation updates
- Bug fixes
- Code cleanup

### Advanced Features
- Multiplayer support
- Level editor
- Custom physics behaviors
- Advanced rendering effects

## 📞 Getting Help

- **Questions**: Use [GitHub Discussions](https://github.com/yourusername/katamari-js/discussions)
- **Bugs**: Create [GitHub Issues](https://github.com/yourusername/katamari-js/issues)
- **Chat**: Join our community discussions

## 🙏 Recognition

Contributors will be:
- Listed in the README acknowledgments
- Credited in release notes
- Invited to join the core team (for significant contributions)

Thank you for helping make Katamari-JS better! 🌟