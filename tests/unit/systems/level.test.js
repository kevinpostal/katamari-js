/**
 * Unit tests for the level management system
 * Tests level generation, progression, and win condition checking
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    initializeLevelSystem,
    generateNewLevel,
    generateLevelTheme,
    checkWinCondition,
    calculateTargetSize,
    getCurrentLevel,
    getCurrentTheme,
    getTargetKatamariSize,
    isLevelGenerating,
    setCurrentLevel,
    resetLevelSystem,
    getLevelProgressionInfo,
    cleanupLevelSystem
} from '../../../src/game/systems/level.js';
import { createMockGameState } from '../../helpers/game-helpers.js';
import { createSystemMocks } from '../../helpers/mock-helpers.js';

// Mock dependencies
vi.mock('../../../src/game/utils/debug.js', () => ({
    debugInfo: vi.fn(),
    debugLog: vi.fn()
}));

vi.mock('../../../src/game/utils/constants.js', () => ({
    UI: {
        LOADING_SIMULATION_TIME: 1500
    },
    WORLD: {
        MAP_BOUNDARY: 500,
        ITEM_SPAWN_RADIUS: 100,
        ITEM_SPAWN_COUNT: 200,
        INITIAL_ITEM_SPAWN_RADIUS: 180,
        MIN_SPAWN_DISTANCE: 10
    },
    THEMES: [
        {
            themeName: "Our Green Earth",
            story: "The King of All Cosmos demands a pristine Earth! Roll up all the litter and grow your Katamari!",
            items: ["Car", "Tree", "House", "Rock", "Bush"],
            groundColor: "#4CAF50",
            skyColor: "#87CEEB",
            baseTargetSize: 25
        },
        {
            themeName: "Urban Jungle",
            story: "The city is a mess! Clean up the streets and grow your Katamari to skyscraper size!",
            items: ["Car", "Lamp Post", "Trash Can", "Bench"],
            groundColor: "#607D8B",
            skyColor: "#B0C4DE",
            baseTargetSize: 100
        },
        {
            themeName: "Cosmic Debris",
            story: "The cosmos is cluttered! Roll up space junk and form a new star!",
            items: ["Asteroid", "Satellite", "Space Debris"],
            groundColor: "#2C3E50",
            skyColor: "#0A0A2A",
            baseTargetSize: 200
        }
    ],
    LEVEL: {
        DIFFICULTY_FACTOR: 0.5
    }
}));

vi.mock('../../../src/game/systems/ui.js', () => ({
    showLoadingOverlay: vi.fn(),
    hideLoadingOverlay: vi.fn(),
    showMessageOverlay: vi.fn(),
    hideMessageOverlay: vi.fn(),
    isMessageOverlayVisible: vi.fn(() => false),
    updateHUD: vi.fn()
}));

vi.mock('../../../src/game/entities/items.js', () => ({
    cleanupItemsSystem: vi.fn(),
    createCollectibleItems: vi.fn(),
    resetLastGenerationPosition: vi.fn(),
    resetInstancedMeshes: vi.fn()
}));

vi.mock('../../../src/game/entities/environment.js', () => ({
    cleanupEnvironment: vi.fn(),
    createEnvironment: vi.fn(),
    createGround: vi.fn(),
    setupSceneAtmosphere: vi.fn()
}));

vi.mock('../../../src/game/core/audio.js', () => ({
    stopRollingSound: vi.fn()
}));

describe('Level Management System', () => {
    let mockCreateKatamariCallback;

    beforeEach(() => {
        // Reset all mocks
        vi.clearAllMocks();
        
        // Create mock callback
        mockCreateKatamariCallback = vi.fn();
        
        // Reset level system to initial state
        resetLevelSystem();
    });

    afterEach(() => {
        cleanupLevelSystem();
    });

    describe('Initialization', () => {
        it('should initialize level system with default values', () => {
            initializeLevelSystem();
            
            expect(getCurrentLevel()).toBe(1);
            expect(getCurrentTheme()).toBeNull();
            expect(getTargetKatamariSize()).toBe(0);
            expect(isLevelGenerating()).toBe(false);
        });

        it('should reset level system state on initialization', () => {
            // Set some non-default values first
            setCurrentLevel(5);
            
            initializeLevelSystem();
            
            expect(getCurrentLevel()).toBe(1);
            expect(getCurrentTheme()).toBeNull();
            expect(getTargetKatamariSize()).toBe(0);
            expect(isLevelGenerating()).toBe(false);
        });
    });

    describe('Level Generation', () => {
        beforeEach(() => {
            initializeLevelSystem();
        });

        it('should generate a new level with proper theme selection', async () => {
            await generateNewLevel(mockCreateKatamariCallback);
            
            expect(getCurrentTheme()).not.toBeNull();
            expect(getCurrentTheme().themeName).toBe("Our Green Earth"); // First theme for level 1
            expect(getTargetKatamariSize()).toBe(25); // Base target size for first theme
        });

        it('should cycle through themes based on level', async () => {
            // Test level 1 (theme 0)
            await generateNewLevel(mockCreateKatamariCallback);
            expect(getCurrentTheme().themeName).toBe("Our Green Earth");
            
            // Advance to level 2 (theme 1)
            setCurrentLevel(2);
            await generateNewLevel(mockCreateKatamariCallback);
            expect(getCurrentTheme().themeName).toBe("Urban Jungle");
            
            // Advance to level 3 (theme 2)
            setCurrentLevel(3);
            await generateNewLevel(mockCreateKatamariCallback);
            expect(getCurrentTheme().themeName).toBe("Cosmic Debris");
            
            // Advance to level 4 (should cycle back to theme 0)
            setCurrentLevel(4);
            await generateNewLevel(mockCreateKatamariCallback);
            expect(getCurrentTheme().themeName).toBe("Our Green Earth");
        });

        it('should calculate target size with difficulty scaling', async () => {
            // Level 1: base target size
            await generateNewLevel(mockCreateKatamariCallback);
            expect(getTargetKatamariSize()).toBe(25); // 25 * (1 + (1-1) * 0.5) = 25
            
            // Level 2: increased difficulty
            setCurrentLevel(2);
            await generateNewLevel(mockCreateKatamariCallback);
            expect(getTargetKatamariSize()).toBe(150); // 100 * (1 + (2-1) * 0.5) = 150
            
            // Level 3: further increased difficulty
            setCurrentLevel(3);
            await generateNewLevel(mockCreateKatamariCallback);
            expect(getTargetKatamariSize()).toBe(400); // 200 * (1 + (3-1) * 0.5) = 400
        });

        it('should set level generating flag during generation', async () => {
            expect(isLevelGenerating()).toBe(false);
            
            const generationPromise = generateNewLevel(mockCreateKatamariCallback);
            expect(isLevelGenerating()).toBe(true);
            
            await generationPromise;
            expect(isLevelGenerating()).toBe(false);
        });

        it('should call katamari creation callback if provided', async () => {
            await generateNewLevel(mockCreateKatamariCallback);
            
            expect(mockCreateKatamariCallback).toHaveBeenCalledOnce();
        });

        it('should not call katamari creation callback if not provided', async () => {
            expect(async () => {
                await generateNewLevel();
            }).not.toThrow();
        });

        it('should clean up previous level resources', async () => {
            const itemsModule = await import('../../../src/game/entities/items.js');
            const environmentModule = await import('../../../src/game/entities/environment.js');
            
            await generateNewLevel(mockCreateKatamariCallback);
            
            expect(itemsModule.cleanupItemsSystem).toHaveBeenCalled();
            expect(itemsModule.resetInstancedMeshes).toHaveBeenCalled();
            expect(environmentModule.cleanupEnvironment).toHaveBeenCalled();
        });

        it('should set up scene atmosphere and environment', async () => {
            const { setupSceneAtmosphere, createEnvironment, createGround } = await import('../../../src/game/entities/environment.js');
            
            await generateNewLevel(mockCreateKatamariCallback);
            
            expect(setupSceneAtmosphere).toHaveBeenCalledWith(getCurrentTheme());
            expect(createEnvironment).toHaveBeenCalledWith(getCurrentTheme());
            expect(createGround).toHaveBeenCalledWith(getCurrentTheme());
        });

        it('should create initial collectible items', async () => {
            const { createCollectibleItems, resetLastGenerationPosition } = await import('../../../src/game/entities/items.js');
            
            await generateNewLevel(mockCreateKatamariCallback);
            
            expect(createCollectibleItems).toHaveBeenCalledWith(
                200,
                getCurrentTheme().items,
                expect.objectContaining({ x: 0, y: 0, z: 0 }),
                180,
                true,
                10
            );
            expect(resetLastGenerationPosition).toHaveBeenCalledWith(
                expect.objectContaining({ x: 0, y: 0, z: 0 })
            );
        });

        it('should update HUD with new target size', async () => {
            const { updateHUD } = await import('../../../src/game/systems/ui.js');
            
            await generateNewLevel(mockCreateKatamariCallback);
            
            expect(updateHUD).toHaveBeenCalledWith({
                itemsCollected: 0,
                targetSize: getTargetKatamariSize()
            });
        });

        it('should show and hide loading overlay during generation', async () => {
            const { showLoadingOverlay, hideLoadingOverlay } = await import('../../../src/game/systems/ui.js');
            
            await generateNewLevel(mockCreateKatamariCallback);
            
            expect(showLoadingOverlay).toHaveBeenCalledWith('Generating Our Green Earth... ✨');
            expect(hideLoadingOverlay).toHaveBeenCalled();
        });

        it('should stop rolling sound during level generation', async () => {
            const { stopRollingSound } = await import('../../../src/game/core/audio.js');
            
            await generateNewLevel(mockCreateKatamariCallback);
            
            expect(stopRollingSound).toHaveBeenCalled();
        });

        it('should hide message overlay during level generation', async () => {
            const { hideMessageOverlay } = await import('../../../src/game/systems/ui.js');
            
            await generateNewLevel(mockCreateKatamariCallback);
            
            expect(hideMessageOverlay).toHaveBeenCalled();
        });
    });

    describe('Theme Generation', () => {
        beforeEach(() => {
            initializeLevelSystem();
        });

        it('should generate theme based on current level', async () => {
            setCurrentLevel(1);
            const theme = await generateLevelTheme();
            
            expect(theme.themeName).toBe("Our Green Earth");
            expect(theme.baseTargetSize).toBe(25);
        });

        it('should show loading overlay with theme name', async () => {
            const { showLoadingOverlay } = await import('../../../src/game/systems/ui.js');
            
            setCurrentLevel(2);
            await generateLevelTheme();
            
            expect(showLoadingOverlay).toHaveBeenCalledWith('Generating Urban Jungle... ✨');
        });

        it('should simulate loading time', async () => {
            const startTime = Date.now();
            await generateLevelTheme();
            const endTime = Date.now();
            
            // Should take at least 1500ms due to setTimeout
            expect(endTime - startTime).toBeGreaterThanOrEqual(1400); // Allow some tolerance
        });

        it('should hide loading overlay after generation', async () => {
            const { hideLoadingOverlay } = await import('../../../src/game/systems/ui.js');
            
            await generateLevelTheme();
            
            expect(hideLoadingOverlay).toHaveBeenCalled();
        });
    });

    describe('Win Condition Checking', () => {
        beforeEach(() => {
            initializeLevelSystem();
        });

        it('should not trigger win condition when katamari is smaller than target', async () => {
            await generateNewLevel(mockCreateKatamariCallback);
            const targetSize = getTargetKatamariSize();
            
            const result = checkWinCondition(targetSize - 1);
            
            expect(result).toBe(false);
        });

        it('should trigger win condition when katamari reaches target size', async () => {
            await generateNewLevel(mockCreateKatamariCallback);
            const targetSize = getTargetKatamariSize();
            
            const result = checkWinCondition(targetSize);
            
            expect(result).toBe(true);
        });

        it('should trigger win condition when katamari exceeds target size', async () => {
            await generateNewLevel(mockCreateKatamariCallback);
            const targetSize = getTargetKatamariSize();
            
            const result = checkWinCondition(targetSize + 10);
            
            expect(result).toBe(true);
        });

        it('should show message overlay on win condition', async () => {
            const { showMessageOverlay } = await import('../../../src/game/systems/ui.js');
            
            await generateNewLevel(mockCreateKatamariCallback);
            const targetSize = getTargetKatamariSize();
            
            checkWinCondition(targetSize);
            
            expect(showMessageOverlay).toHaveBeenCalledWith(
                'LEVEL 1 COMPLETE! You\'ve grown a magnificent Katamari! Click to continue.'
            );
        });

        it('should increment level on win condition', async () => {
            await generateNewLevel(mockCreateKatamariCallback);
            const targetSize = getTargetKatamariSize();
            const initialLevel = getCurrentLevel();
            
            checkWinCondition(targetSize);
            
            expect(getCurrentLevel()).toBe(initialLevel + 1);
        });

        it('should stop rolling sound on win condition', async () => {
            const { stopRollingSound } = await import('../../../src/game/core/audio.js');
            
            await generateNewLevel(mockCreateKatamariCallback);
            const targetSize = getTargetKatamariSize();
            
            checkWinCondition(targetSize);
            
            expect(stopRollingSound).toHaveBeenCalled();
        });

        it('should not trigger win condition if message overlay is visible', async () => {
            const { isMessageOverlayVisible } = await import('../../../src/game/systems/ui.js');
            isMessageOverlayVisible.mockReturnValue(true);
            
            await generateNewLevel(mockCreateKatamariCallback);
            const targetSize = getTargetKatamariSize();
            
            const result = checkWinCondition(targetSize);
            
            expect(result).toBe(false);
        });
    });

    describe('Target Size Calculation', () => {
        beforeEach(() => {
            initializeLevelSystem();
        });

        it('should return 0 when no theme is set', () => {
            const targetSize = calculateTargetSize();
            
            expect(targetSize).toBe(0);
        });

        it('should calculate target size based on theme and level', async () => {
            await generateNewLevel(mockCreateKatamariCallback);
            
            const targetSize = calculateTargetSize();
            const expectedSize = 25 * (1 + (1 - 1) * 0.5); // 25 for level 1
            
            expect(targetSize).toBe(expectedSize);
        });

        it('should scale target size with difficulty factor', async () => {
            setCurrentLevel(3);
            await generateNewLevel(mockCreateKatamariCallback);
            
            const targetSize = calculateTargetSize();
            const expectedSize = 200 * (1 + (3 - 1) * 0.5); // 200 * 2 = 400 for level 3
            
            expect(targetSize).toBe(expectedSize);
        });
    });

    describe('Level State Management', () => {
        beforeEach(() => {
            initializeLevelSystem();
        });

        it('should get and set current level', () => {
            expect(getCurrentLevel()).toBe(1);
            
            setCurrentLevel(5);
            expect(getCurrentLevel()).toBe(5);
        });

        it('should not set level to invalid values', () => {
            setCurrentLevel(0);
            expect(getCurrentLevel()).toBe(1); // Should remain unchanged
            
            setCurrentLevel(-1);
            expect(getCurrentLevel()).toBe(1); // Should remain unchanged
        });

        it('should get current theme', async () => {
            expect(getCurrentTheme()).toBeNull();
            
            await generateNewLevel(mockCreateKatamariCallback);
            expect(getCurrentTheme()).not.toBeNull();
            expect(getCurrentTheme().themeName).toBe("Our Green Earth");
        });

        it('should get target katamari size', async () => {
            expect(getTargetKatamariSize()).toBe(0);
            
            await generateNewLevel(mockCreateKatamariCallback);
            expect(getTargetKatamariSize()).toBe(25);
        });

        it('should track level generation state', async () => {
            expect(isLevelGenerating()).toBe(false);
            
            const generationPromise = generateNewLevel(mockCreateKatamariCallback);
            expect(isLevelGenerating()).toBe(true);
            
            await generationPromise;
            expect(isLevelGenerating()).toBe(false);
        });

        it('should reset level system to initial state', async () => {
            // Set some non-default values
            setCurrentLevel(5);
            await generateNewLevel(mockCreateKatamariCallback);
            
            resetLevelSystem();
            
            expect(getCurrentLevel()).toBe(1);
            expect(getCurrentTheme()).toBeNull();
            expect(getTargetKatamariSize()).toBe(0);
            expect(isLevelGenerating()).toBe(false);
        });

        it('should get level progression information', async () => {
            setCurrentLevel(3);
            await generateNewLevel(mockCreateKatamariCallback);
            
            const progressionInfo = getLevelProgressionInfo();
            
            expect(progressionInfo).toEqual({
                currentLevel: 3,
                targetSize: 400, // 200 * (1 + (3-1) * 0.5)
                theme: "Cosmic Debris",
                difficultyFactor: 2, // 1 + (3-1) * 0.5
                isGenerating: false
            });
        });

        it('should get level progression info with null theme when not set', () => {
            const progressionInfo = getLevelProgressionInfo();
            
            expect(progressionInfo).toEqual({
                currentLevel: 1,
                targetSize: 0,
                theme: null,
                difficultyFactor: 1,
                isGenerating: false
            });
        });
    });

    describe('Level Progression Flow', () => {
        beforeEach(() => {
            initializeLevelSystem();
        });

        it('should progress through multiple levels correctly', async () => {
            // Start at level 1
            await generateNewLevel(mockCreateKatamariCallback);
            expect(getCurrentLevel()).toBe(1);
            expect(getCurrentTheme().themeName).toBe("Our Green Earth");
            expect(getTargetKatamariSize()).toBe(25);
            
            // Complete level 1
            checkWinCondition(25);
            expect(getCurrentLevel()).toBe(2);
            
            // Generate level 2
            await generateNewLevel(mockCreateKatamariCallback);
            expect(getCurrentTheme().themeName).toBe("Urban Jungle");
            expect(getTargetKatamariSize()).toBe(150);
            
            // Complete level 2
            checkWinCondition(150);
            expect(getCurrentLevel()).toBe(3);
            
            // Generate level 3
            await generateNewLevel(mockCreateKatamariCallback);
            expect(getCurrentTheme().themeName).toBe("Cosmic Debris");
            expect(getTargetKatamariSize()).toBe(400);
        });

        it('should handle theme cycling correctly', async () => {
            // Test cycling through all themes and back
            for (let level = 1; level <= 6; level++) {
                setCurrentLevel(level);
                await generateNewLevel(mockCreateKatamariCallback);
                
                const expectedThemeIndex = (level - 1) % 3;
                const expectedThemes = ["Our Green Earth", "Urban Jungle", "Cosmic Debris"];
                
                expect(getCurrentTheme().themeName).toBe(expectedThemes[expectedThemeIndex]);
            }
        });

        it('should maintain consistent difficulty scaling', async () => {
            const expectedTargetSizes = [
                25,   // Level 1: 25 * (1 + (1-1) * 0.5) = 25 * 1.0 = 25
                150,  // Level 2: 100 * (1 + (2-1) * 0.5) = 100 * 1.5 = 150
                400,  // Level 3: 200 * (1 + (3-1) * 0.5) = 200 * 2.0 = 400
                62.5, // Level 4: 25 * (1 + (4-1) * 0.5) = 25 * 2.5 = 62.5 (cycles back to first theme)
                300,  // Level 5: 100 * (1 + (5-1) * 0.5) = 100 * 3.0 = 300
                700   // Level 6: 200 * (1 + (6-1) * 0.5) = 200 * 3.5 = 700
            ];
            
            for (let level = 1; level <= 6; level++) {
                setCurrentLevel(level);
                await generateNewLevel(mockCreateKatamariCallback);
                
                const actualTargetSize = getTargetKatamariSize();
                const expectedSize = expectedTargetSizes[level - 1];
                
                expect(actualTargetSize).toBeCloseTo(expectedSize, 1);
            }
        });
    });

    describe('Error Handling', () => {
        beforeEach(() => {
            initializeLevelSystem();
        });

        it('should handle missing theme gracefully', () => {
            const targetSize = calculateTargetSize();
            expect(targetSize).toBe(0);
        });

        it('should handle invalid level values gracefully', () => {
            setCurrentLevel(-5);
            expect(getCurrentLevel()).toBe(1);
            
            setCurrentLevel(0);
            expect(getCurrentLevel()).toBe(1);
        });

        it('should handle win condition check with invalid katamari size', async () => {
            await generateNewLevel(mockCreateKatamariCallback);
            
            expect(() => {
                checkWinCondition(-1);
            }).not.toThrow();
            
            expect(() => {
                checkWinCondition(NaN);
            }).not.toThrow();
            
            expect(() => {
                checkWinCondition(undefined);
            }).not.toThrow();
        });

        it('should handle level generation without callback gracefully', async () => {
            expect(async () => {
                await generateNewLevel();
            }).not.toThrow();
            
            expect(async () => {
                await generateNewLevel(null);
            }).not.toThrow();
            
            expect(async () => {
                await generateNewLevel(undefined);
            }).not.toThrow();
        });
    });

    describe('Cleanup', () => {
        beforeEach(() => {
            initializeLevelSystem();
        });

        it('should clean up level system resources', async () => {
            // Set up some state
            setCurrentLevel(5);
            await generateNewLevel(mockCreateKatamariCallback);
            
            cleanupLevelSystem();
            
            expect(getCurrentLevel()).toBe(1);
            expect(getCurrentTheme()).toBeNull();
            expect(getTargetKatamariSize()).toBe(0);
            expect(isLevelGenerating()).toBe(false);
        });

        it('should reset to initial state after cleanup', () => {
            cleanupLevelSystem();
            
            const progressionInfo = getLevelProgressionInfo();
            expect(progressionInfo).toEqual({
                currentLevel: 1,
                targetSize: 0,
                theme: null,
                difficultyFactor: 1,
                isGenerating: false
            });
        });
    });

    describe('Integration with Other Systems', () => {
        beforeEach(() => {
            initializeLevelSystem();
        });

        it('should integrate with UI system for overlays', async () => {
            const { showLoadingOverlay, hideLoadingOverlay, showMessageOverlay, hideMessageOverlay } = await import('../../../src/game/systems/ui.js');
            
            await generateNewLevel(mockCreateKatamariCallback);
            
            expect(hideMessageOverlay).toHaveBeenCalled();
            expect(showLoadingOverlay).toHaveBeenCalled();
            expect(hideLoadingOverlay).toHaveBeenCalled();
            
            checkWinCondition(getTargetKatamariSize());
            expect(showMessageOverlay).toHaveBeenCalled();
        });

        it('should integrate with items system for cleanup and generation', async () => {
            const { cleanupItemsSystem, resetInstancedMeshes, createCollectibleItems, resetLastGenerationPosition } = await import('../../../src/game/entities/items.js');
            
            await generateNewLevel(mockCreateKatamariCallback);
            
            expect(cleanupItemsSystem).toHaveBeenCalled();
            expect(resetInstancedMeshes).toHaveBeenCalled();
            expect(createCollectibleItems).toHaveBeenCalled();
            expect(resetLastGenerationPosition).toHaveBeenCalled();
        });

        it('should integrate with environment system for scene setup', async () => {
            const { cleanupEnvironment, createEnvironment, createGround, setupSceneAtmosphere } = await import('../../../src/game/entities/environment.js');
            
            await generateNewLevel(mockCreateKatamariCallback);
            
            expect(cleanupEnvironment).toHaveBeenCalled();
            expect(setupSceneAtmosphere).toHaveBeenCalled();
            expect(createEnvironment).toHaveBeenCalled();
            expect(createGround).toHaveBeenCalled();
        });

        it('should integrate with audio system for sound management', async () => {
            const { stopRollingSound } = await import('../../../src/game/core/audio.js');
            
            await generateNewLevel(mockCreateKatamariCallback);
            expect(stopRollingSound).toHaveBeenCalled();
            
            checkWinCondition(getTargetKatamariSize());
            expect(stopRollingSound).toHaveBeenCalledTimes(2);
        });
    });
});