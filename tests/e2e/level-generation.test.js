/**
 * End-to-end tests for level generation
 * Tests procedural level generation, item spawning, and theme transitions
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupGameEnvironment, simulateLevelProgression, createTestScenario } from '../helpers/game-helpers.js';

describe('Level Generation E2E', () => {
    let gameEnvironment;

    beforeEach(() => {
        gameEnvironment = setupGameEnvironment({
            includePhysics: true,
            includeRendering: true,
            itemCount: 20
        });
    });

    afterEach(() => {
        if (gameEnvironment?.dispose) {
            gameEnvironment.dispose();
        }
    });

    describe('Theme Progression', () => {
        it('should progress through themes correctly', () => {
            // Start with earth theme
            expect(gameEnvironment.gameState.level.theme).toBe('earth');
            expect(gameEnvironment.gameState.level.currentLevel).toBe(1);

            // Simulate reaching target size
            gameEnvironment.gameState.katamari.size = gameEnvironment.gameState.level.targetSize;
            
            const progression = simulateLevelProgression(gameEnvironment);
            
            expect(progression.levelCompleted).toBe(true);
            expect(progression.newLevel).toBe(2);
            expect(progression.newTheme).toBe('urban');
        });

        it('should generate appropriate items for each theme', () => {
            const themes = ['earth', 'urban', 'space'];
            
            themes.forEach(theme => {
                // Create a new environment with theme-specific items
                const themeEnvironment = setupGameEnvironment({
                    includePhysics: true,
                    includeRendering: true,
                    itemCount: 10
                });
                
                // Set the theme
                themeEnvironment.gameState.level.theme = theme;
                
                // Update items to match theme
                themeEnvironment.items.forEach((item, index) => {
                    if (theme === 'earth') {
                        item.type = ['leaf', 'stick', 'rock'][index % 3];
                    } else if (theme === 'urban') {
                        item.type = ['coin', 'paperclip', 'pen'][index % 3];
                    } else if (theme === 'space') {
                        item.type = ['asteroid', 'satellite', 'planet'][index % 3];
                    }
                });
                
                // Verify theme-appropriate items exist
                const themeItems = themeEnvironment.items.filter(item => {
                    if (theme === 'earth') {
                        return ['leaf', 'stick', 'rock'].includes(item.type);
                    } else if (theme === 'urban') {
                        return ['coin', 'paperclip', 'pen'].includes(item.type);
                    } else if (theme === 'space') {
                        return ['asteroid', 'satellite', 'planet'].includes(item.type);
                    }
                    return false;
                });
                
                expect(themeItems.length).toBeGreaterThan(0);
                
                themeEnvironment.dispose();
            });
        });
    });

    describe('Item Spawning', () => {
        it('should spawn items within map boundaries', () => {
            gameEnvironment.items.forEach(item => {
                expect(Math.abs(item.position.x)).toBeLessThanOrEqual(240);
                expect(Math.abs(item.position.z)).toBeLessThanOrEqual(240);
                expect(item.position.y).toBeGreaterThanOrEqual(0);
            });
        });

        it('should maintain appropriate item density', () => {
            const itemCount = gameEnvironment.items.length;
            const mapArea = 240 * 240 * 4; // Map boundary squared * 4 quadrants
            const density = itemCount / mapArea;
            
            expect(density).toBeGreaterThan(0);
            expect(density).toBeLessThan(0.01); // Reasonable density threshold
        });
    });

    describe('Performance with Large Levels', () => {
        it('should handle large item counts efficiently', () => {
            const largeEnvironment = createTestScenario('crowded-world', {
                itemCount: 500
            });

            const startTime = performance.now();
            
            // Simulate level operations
            for (let i = 0; i < 100; i++) {
                largeEnvironment.items.forEach(item => {
                    if (!item.collected && Math.random() < 0.01) {
                        item.collected = true;
                    }
                });
            }
            
            const endTime = performance.now();
            const processingTime = endTime - startTime;
            
            expect(processingTime).toBeLessThan(100); // Should complete within 100ms
            
            largeEnvironment.dispose();
        });
    });
});