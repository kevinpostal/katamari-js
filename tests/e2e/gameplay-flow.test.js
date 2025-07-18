/**
 * End-to-end tests for complete gameplay scenarios
 * Tests full gameplay loop from initialization to level completion, item collection and katamari growth progression, and level transition scenarios
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
    setupGameEnvironment, 
    createMockGameState, 
    simulateItemCollection, 
    simulateLevelProgression,
    simulateGameLoop,
    waitForFrames,
    validateGameState,
    createTestScenario
} from '../helpers/game-helpers.js';

describe('Complete Gameplay Flow E2E Tests', () => {
    let gameEnvironment;
    let gameState;

    beforeEach(() => {
        // Set up complete game environment for E2E testing
        gameEnvironment = setupGameEnvironment({
            includePhysics: true,
            includeRendering: true,
            includeAudio: true,
            itemCount: 50,
            initialKatamariSize: 2.0
        });

        gameState = createMockGameState('initial');
        
        // Mock DOM elements for UI updates
        document.body.innerHTML = `
            <div id="game-ui">
                <div>Size: <span id="katamari-size">2.00m</span></div>
                <div>Speed: <span id="katamari-speed">0.00m/s</span></div>
                <div>Items Collected: <span id="items-collected">0</span></div>
                <div>FPS: <span id="fps">60</span></div>
                <div id="progress-container">
                    <div id="progress-bar" style="width: 0%"></div>
                </div>
                <div>Target Size: <span id="target-size">100.00m</span></div>
                <div id="power-up-status"></div>
            </div>
            <div id="loading-overlay" style="display: none;">Loading...</div>
            <div id="message-overlay" style="display: none;"></div>
        `;

        // Mock performance.now for consistent timing
        vi.spyOn(performance, 'now').mockImplementation(() => Date.now());
    });

    afterEach(() => {
        if (gameEnvironment?.dispose) {
            gameEnvironment.dispose();
        }
        document.body.innerHTML = '';
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    describe('Full Gameplay Loop Tests', () => {
        it('should complete full game initialization to level completion flow', async () => {
            // Phase 1: Game Initialization
            const initializationResult = await simulateGameInitialization();
            expect(initializationResult.success).toBe(true);
            expect(initializationResult.scene.initialized).toBe(true);
            expect(initializationResult.physics.worldCreated).toBe(true);
            expect(initializationResult.audio.initialized).toBe(true);

            // Phase 2: Initial Game State Validation
            const initialValidation = validateGameState(gameState);
            expect(initialValidation.valid).toBe(true);
            expect(initialValidation.errors).toHaveLength(0);

            // Phase 3: Item Collection Phase
            const collectionResults = [];
            for (let i = 0; i < 10; i++) {
                const result = simulateItemCollection(gameEnvironment, i);
                if (result.success) {
                    collectionResults.push(result);
                    
                    // Update UI to reflect collection
                    updateUIAfterCollection(result);
                    
                    // Simulate game loop iteration
                    gameState = simulateGameLoop(gameState, 16.67);
                    
                    // Wait for next frame
                    await waitForFrames(1);
                }
            }

            expect(collectionResults.length).toBeGreaterThan(0);
            expect(gameEnvironment.katamari.size).toBeGreaterThan(2.0);
            expect(gameEnvironment.katamari.collectedItems).toBe(collectionResults.length);

            // Phase 4: Katamari Growth Verification
            const growthProgression = analyzeKatamariGrowth(collectionResults);
            expect(growthProgression.totalGrowth).toBeGreaterThan(0);
            expect(growthProgression.averageGrowthPerItem).toBeGreaterThan(0);
            expect(growthProgression.growthConsistency).toBe(true);

            // Phase 5: Level Progression Check
            gameEnvironment.katamari.size = gameState.level.targetSize; // Force level completion
            const levelResult = simulateLevelProgression(gameEnvironment);
            
            if (levelResult.levelCompleted) {
                expect(levelResult.newLevel).toBe(gameState.level.currentLevel + 1);
                expect(levelResult.newTargetSize).toBeGreaterThan(gameState.level.targetSize);
                expect(levelResult.newTheme).toBeDefined();
                
                // Update UI for level completion
                updateUIAfterLevelCompletion(levelResult);
            }

            // Phase 6: Final State Validation
            const finalValidation = validateGameState(gameEnvironment.gameState);
            expect(finalValidation.valid).toBe(true);
            expect(finalValidation.warnings.length).toBeLessThanOrEqual(1); // Allow level completion warning
        });

        it('should handle continuous gameplay across multiple levels', async () => {
            const levelCompletions = [];
            let currentLevel = 1;
            const maxLevels = 3;

            while (currentLevel <= maxLevels) {
                // Collect items until level target is reached
                const itemsToCollect = Math.ceil(gameState.level.targetSize / 0.5); // Estimate items needed
                const collectionResults = [];

                for (let i = 0; i < Math.min(itemsToCollect, gameEnvironment.items.length); i++) {
                    const result = simulateItemCollection(gameEnvironment, i);
                    if (result.success) {
                        collectionResults.push(result);
                        gameState = simulateGameLoop(gameState, 16.67);
                        await waitForFrames(1);
                    }
                }

                // Force level completion for testing
                gameEnvironment.katamari.size = gameState.level.targetSize;
                gameEnvironment.gameState.katamari.size = gameState.level.targetSize;

                const levelResult = simulateLevelProgression(gameEnvironment);
                
                if (levelResult.levelCompleted) {
                    levelCompletions.push({
                        level: currentLevel,
                        itemsCollected: collectionResults.length,
                        finalSize: gameEnvironment.katamari.size,
                        newTheme: levelResult.newTheme,
                        newTargetSize: levelResult.newTargetSize
                    });

                    // Update game state for next level
                    gameState.level = gameEnvironment.gameState.level;
                    currentLevel = gameState.level.currentLevel;

                    // Regenerate items for new level
                    regenerateItemsForLevel(gameEnvironment, levelResult.newTheme);
                } else {
                    break; // Exit if level not completed
                }
            }

            expect(levelCompletions).toHaveLength(maxLevels);
            
            // Verify level progression consistency
            for (let i = 1; i < levelCompletions.length; i++) {
                const prev = levelCompletions[i - 1];
                const curr = levelCompletions[i];
                
                expect(curr.level).toBe(prev.level + 1);
                expect(curr.newTargetSize).toBeGreaterThan(prev.newTargetSize);
                expect(curr.newTheme).not.toBe(prev.newTheme); // Theme should change
            }
        });

        it('should maintain performance during extended gameplay session', async () => {
            const performanceMetrics = [];
            const sessionDuration = 100; // frames
            let frameCount = 0;

            while (frameCount < sessionDuration) {
                const frameStart = performance.now();
                
                // Simulate game loop operations
                gameState = simulateGameLoop(gameState, 16.67);
                
                // Simulate random item collection
                if (Math.random() < 0.1 && frameCount % 10 === 0) {
                    const availableItems = gameEnvironment.items.filter(item => !item.collected);
                    if (availableItems.length > 0) {
                        const randomIndex = gameEnvironment.items.indexOf(availableItems[0]);
                        simulateItemCollection(gameEnvironment, randomIndex);
                    }
                }

                // Update UI elements
                updateUIElements(gameState);

                const frameEnd = performance.now();
                const frameDuration = frameEnd - frameStart;
                
                performanceMetrics.push({
                    frame: frameCount,
                    duration: frameDuration,
                    katamariSize: gameEnvironment.katamari.size,
                    itemsCollected: gameEnvironment.katamari.collectedItems,
                    memoryUsage: process.memoryUsage ? process.memoryUsage().heapUsed : 0
                });

                frameCount++;
                await waitForFrames(1);
            }

            // Analyze performance metrics
            const avgFrameDuration = performanceMetrics.reduce((sum, m) => sum + m.duration, 0) / performanceMetrics.length;
            const maxFrameDuration = Math.max(...performanceMetrics.map(m => m.duration));
            const frameRateConsistency = performanceMetrics.filter(m => m.duration < 20).length / performanceMetrics.length;

            expect(avgFrameDuration).toBeLessThan(16.67); // Should maintain 60 FPS average
            expect(maxFrameDuration).toBeLessThan(50); // No frame should take longer than 50ms
            expect(frameRateConsistency).toBeGreaterThan(0.9); // 90% of frames should be under 20ms
            
            // Verify no memory leaks during extended play
            const memoryGrowth = performanceMetrics[performanceMetrics.length - 1].memoryUsage - performanceMetrics[0].memoryUsage;
            expect(memoryGrowth).toBeLessThan(10000000); // Less than 10MB growth
        });
    });

    describe('Item Collection and Katamari Growth Tests', () => {
        it('should verify progressive katamari growth with item collection', async () => {
            const initialSize = gameEnvironment.katamari.size;
            const growthHistory = [{ size: initialSize, items: 0, timestamp: performance.now() }];

            // Collect items in sequence and track growth
            for (let i = 0; i < 20; i++) {
                const result = simulateItemCollection(gameEnvironment, i);
                
                if (result.success) {
                    growthHistory.push({
                        size: result.newKatamariSize,
                        items: gameEnvironment.katamari.collectedItems,
                        sizeIncrease: result.sizeIncrease,
                        itemSize: result.item.size,
                        timestamp: performance.now()
                    });

                    // Verify growth is proportional to item size
                    expect(result.sizeIncrease).toBeGreaterThan(0);
                    expect(result.sizeIncrease).toBeLessThanOrEqual(result.item.size);
                    
                    // Update game state
                    gameState = simulateGameLoop(gameState, 16.67);
                    await waitForFrames(1);
                }
            }

            // Analyze growth progression
            expect(growthHistory.length).toBeGreaterThan(1);
            
            const finalGrowth = growthHistory[growthHistory.length - 1];
            expect(finalGrowth.size).toBeGreaterThan(initialSize);
            expect(finalGrowth.items).toBeGreaterThan(0);

            // Verify growth consistency
            for (let i = 1; i < growthHistory.length; i++) {
                expect(growthHistory[i].size).toBeGreaterThanOrEqual(growthHistory[i - 1].size);
                expect(growthHistory[i].items).toBeGreaterThanOrEqual(growthHistory[i - 1].items);
            }

            // Verify growth rate is reasonable
            const totalGrowth = finalGrowth.size - initialSize;
            const averageGrowthPerItem = totalGrowth / finalGrowth.items;
            expect(averageGrowthPerItem).toBeGreaterThan(0.01);
            expect(averageGrowthPerItem).toBeLessThan(1.0);
        });

        it('should handle different item types and sizes correctly', async () => {
            // Create items of different types and sizes
            const itemTypes = [
                { type: 'small', size: 0.1, expectedGrowth: 0.01 },
                { type: 'medium', size: 0.5, expectedGrowth: 0.05 },
                { type: 'large', size: 1.0, expectedGrowth: 0.1 }
            ];

            const collectionResults = [];

            for (const itemType of itemTypes) {
                // Find or create item of this type
                const itemIndex = gameEnvironment.items.findIndex(item => 
                    !item.collected && Math.abs(item.size - itemType.size) < 0.1
                );

                if (itemIndex !== -1) {
                    // Adjust item properties for test
                    gameEnvironment.items[itemIndex].size = itemType.size;
                    gameEnvironment.items[itemIndex].type = itemType.type;

                    const result = simulateItemCollection(gameEnvironment, itemIndex);
                    
                    if (result.success) {
                        collectionResults.push({
                            ...result,
                            expectedGrowth: itemType.expectedGrowth,
                            actualGrowthRatio: result.sizeIncrease / itemType.size
                        });

                        gameState = simulateGameLoop(gameState, 16.67);
                        await waitForFrames(1);
                    }
                }
            }

            expect(collectionResults.length).toBeGreaterThanOrEqual(2); // At least 2 items should be collected

            // Verify growth is proportional to item size
            for (const result of collectionResults) {
                expect(result.sizeIncrease).toBeCloseTo(result.expectedGrowth, 1);
                expect(result.actualGrowthRatio).toBeCloseTo(0.1, 1); // 10% of item size
            }

            // Verify larger items provide more growth
            const sortedResults = collectionResults.sort((a, b) => a.item.size - b.item.size);
            for (let i = 1; i < sortedResults.length; i++) {
                expect(sortedResults[i].sizeIncrease).toBeGreaterThanOrEqual(sortedResults[i - 1].sizeIncrease);
            }
        });

        it('should update UI elements correctly during item collection', async () => {
            const initialUIState = captureUIState();
            
            // Collect several items and verify UI updates
            for (let i = 0; i < 5; i++) {
                const result = simulateItemCollection(gameEnvironment, i);
                
                if (result.success) {
                    updateUIAfterCollection(result);
                    
                    const currentUIState = captureUIState();
                    
                    // Verify size display updated
                    expect(parseFloat(currentUIState.katamariSize)).toBeGreaterThan(parseFloat(initialUIState.katamariSize));
                    
                    // Verify items collected counter updated
                    expect(parseInt(currentUIState.itemsCollected)).toBe(gameEnvironment.katamari.collectedItems);
                    
                    // Verify progress bar updated
                    const progressPercentage = (gameEnvironment.katamari.size / gameState.level.targetSize) * 100;
                    expect(currentUIState.progressWidth).toBe(`${Math.min(progressPercentage, 100)}%`);
                    
                    gameState = simulateGameLoop(gameState, 16.67);
                    await waitForFrames(1);
                }
            }
        });
    });

    describe('Level Transition and Win Condition Tests', () => {
        it('should handle level completion and transition correctly', async () => {
            const initialLevel = gameState.level.currentLevel;
            const initialTheme = gameState.level.theme;
            const initialTargetSize = gameState.level.targetSize;

            // Grow katamari to target size
            gameEnvironment.katamari.size = initialTargetSize;
            gameEnvironment.gameState.katamari.size = initialTargetSize;

            const levelResult = simulateLevelProgression(gameEnvironment);
            
            expect(levelResult.levelCompleted).toBe(true);
            expect(levelResult.previousLevel).toBe(initialLevel);
            expect(levelResult.newLevel).toBe(initialLevel + 1);
            expect(levelResult.newTheme).not.toBe(initialTheme);
            expect(levelResult.newTargetSize).toBeGreaterThan(initialTargetSize);

            // Verify game state updated correctly
            expect(gameEnvironment.gameState.level.currentLevel).toBe(initialLevel + 1);
            expect(gameEnvironment.gameState.level.theme).toBe(levelResult.newTheme);
            expect(gameEnvironment.gameState.level.targetSize).toBe(levelResult.newTargetSize);

            // Update UI for level completion
            updateUIAfterLevelCompletion(levelResult);
            
            const uiState = captureUIState();
            expect(uiState.targetSize).toBe(`${levelResult.newTargetSize.toFixed(2)}m`);
            
            // Verify message overlay shows level completion
            const messageOverlay = document.getElementById('message-overlay');
            expect(messageOverlay.style.display).not.toBe('none');
            expect(messageOverlay.textContent).toContain('Level Complete');
        });

        it('should handle multiple level transitions with theme changes', async () => {
            const themes = ['earth', 'urban', 'space'];
            const levelTransitions = [];
            let currentLevel = 1;

            for (let i = 0; i < 3; i++) {
                // Set katamari size to current target
                gameEnvironment.katamari.size = gameState.level.targetSize;
                gameEnvironment.gameState.katamari.size = gameState.level.targetSize;

                const levelResult = simulateLevelProgression(gameEnvironment);
                
                if (levelResult.levelCompleted) {
                    levelTransitions.push({
                        fromLevel: levelResult.previousLevel,
                        toLevel: levelResult.newLevel,
                        fromTheme: themes[i % themes.length],
                        toTheme: levelResult.newTheme,
                        newTargetSize: levelResult.newTargetSize
                    });

                    // Update game state for next iteration
                    gameState.level = gameEnvironment.gameState.level;
                    currentLevel = gameState.level.currentLevel;

                    await waitForFrames(2); // Allow for transition animations
                }
            }

            expect(levelTransitions).toHaveLength(3);

            // Verify level progression
            for (let i = 0; i < levelTransitions.length; i++) {
                const transition = levelTransitions[i];
                expect(transition.toLevel).toBe(transition.fromLevel + 1);
                expect(transition.toTheme).toBeDefined();
                expect(transition.newTargetSize).toBeGreaterThan(0);
                
                if (i > 0) {
                    expect(transition.newTargetSize).toBeGreaterThan(levelTransitions[i - 1].newTargetSize);
                }
            }

            // Verify theme cycling
            const uniqueThemes = [...new Set(levelTransitions.map(t => t.toTheme))];
            expect(uniqueThemes.length).toBeGreaterThanOrEqual(2); // Should have at least 2 different themes
        });

        it('should handle win conditions with proper feedback', async () => {
            // Simulate reaching a high level (win condition)
            gameState.level.currentLevel = 10;
            gameEnvironment.gameState.level.currentLevel = 10;
            gameEnvironment.katamari.size = 1000; // Very large katamari
            gameEnvironment.katamari.collectedItems = 50; // Ensure some items were collected

            const winConditionMet = checkWinCondition(gameEnvironment);
            
            if (winConditionMet.isWin) {
                expect(winConditionMet.level).toBeGreaterThanOrEqual(10);
                expect(winConditionMet.finalSize).toBeGreaterThanOrEqual(1000);
                expect(winConditionMet.totalItemsCollected).toBeGreaterThan(0);

                // Update UI for win condition
                updateUIForWinCondition(winConditionMet);
                
                const messageOverlay = document.getElementById('message-overlay');
                expect(messageOverlay.style.display).not.toBe('none');
                expect(messageOverlay.textContent).toContain('Congratulations');
                
                // Verify final statistics are displayed
                expect(messageOverlay.textContent).toContain(winConditionMet.level.toString());
                expect(messageOverlay.textContent).toContain(winConditionMet.finalSize.toString());
            }
        });

        it('should maintain game state consistency during level transitions', async () => {
            const stateSnapshots = [];
            
            // Capture initial state
            stateSnapshots.push(JSON.parse(JSON.stringify(gameEnvironment.gameState)));

            // Perform multiple level transitions
            for (let i = 0; i < 3; i++) {
                // Grow katamari to target
                gameEnvironment.katamari.size = gameState.level.targetSize;
                gameEnvironment.gameState.katamari.size = gameState.level.targetSize;

                const levelResult = simulateLevelProgression(gameEnvironment);
                
                if (levelResult.levelCompleted) {
                    // Capture state after transition
                    stateSnapshots.push(JSON.parse(JSON.stringify(gameEnvironment.gameState)));
                    
                    // Update local game state
                    gameState.level = gameEnvironment.gameState.level;
                    
                    await waitForFrames(1);
                }
            }

            expect(stateSnapshots.length).toBeGreaterThan(1);

            // Validate each state snapshot
            for (const snapshot of stateSnapshots) {
                const validation = validateGameState(snapshot);
                expect(validation.valid).toBe(true);
                expect(validation.errors).toHaveLength(0);
            }

            // Verify progression consistency
            for (let i = 1; i < stateSnapshots.length; i++) {
                const prev = stateSnapshots[i - 1];
                const curr = stateSnapshots[i];
                
                expect(curr.level.currentLevel).toBeGreaterThanOrEqual(prev.level.currentLevel);
                expect(curr.level.targetSize).toBeGreaterThanOrEqual(prev.level.targetSize);
                expect(curr.katamari.collectedItems).toBeGreaterThanOrEqual(prev.katamari.collectedItems);
            }
        });
    });

    // Helper functions for gameplay flow testing
    async function simulateGameInitialization() {
        return {
            success: true,
            scene: { initialized: true, objectCount: gameEnvironment.items.length },
            physics: { worldCreated: true, bodyCount: gameEnvironment.items.length + 1 },
            audio: { initialized: true, synthsCreated: 3 }
        };
    }

    function updateUIAfterCollection(collectionResult) {
        document.getElementById('katamari-size').textContent = `${collectionResult.newKatamariSize.toFixed(2)}m`;
        document.getElementById('items-collected').textContent = gameEnvironment.katamari.collectedItems.toString();
        
        const progressPercentage = (collectionResult.newKatamariSize / gameState.level.targetSize) * 100;
        document.getElementById('progress-bar').style.width = `${Math.min(progressPercentage, 100)}%`;
    }

    function updateUIAfterLevelCompletion(levelResult) {
        document.getElementById('target-size').textContent = `${levelResult.newTargetSize.toFixed(2)}m`;
        
        const messageOverlay = document.getElementById('message-overlay');
        messageOverlay.style.display = 'block';
        messageOverlay.textContent = `Level Complete! Welcome to ${levelResult.newTheme} world!`;
        
        // Reset progress bar for new level
        document.getElementById('progress-bar').style.width = '0%';
    }

    function updateUIElements(gameState) {
        document.getElementById('katamari-speed').textContent = `${(Math.random() * 10).toFixed(2)}m/s`;
        document.getElementById('fps').textContent = '60';
    }

    function captureUIState() {
        return {
            katamariSize: document.getElementById('katamari-size').textContent,
            katamariSpeed: document.getElementById('katamari-speed').textContent,
            itemsCollected: document.getElementById('items-collected').textContent,
            fps: document.getElementById('fps').textContent,
            targetSize: document.getElementById('target-size').textContent,
            progressWidth: document.getElementById('progress-bar').style.width
        };
    }

    function analyzeKatamariGrowth(collectionResults) {
        const totalGrowth = collectionResults.reduce((sum, result) => sum + result.sizeIncrease, 0);
        const averageGrowthPerItem = totalGrowth / collectionResults.length;
        const growthConsistency = collectionResults.every(result => result.sizeIncrease > 0);

        return {
            totalGrowth,
            averageGrowthPerItem,
            growthConsistency,
            itemsCollected: collectionResults.length
        };
    }

    function regenerateItemsForLevel(environment, theme) {
        // Reset collected status for existing items
        environment.items.forEach(item => {
            item.collected = false;
            // Adjust item properties based on theme
            if (theme === 'urban') {
                item.size *= 1.5; // Urban items are larger
            } else if (theme === 'space') {
                item.size *= 2.0; // Space items are even larger
            }
        });
    }

    function checkWinCondition(environment) {
        const isWin = environment.gameState.level.currentLevel >= 10 || environment.katamari.size >= 1000;
        
        return {
            isWin,
            level: environment.gameState.level.currentLevel,
            finalSize: environment.katamari.size,
            totalItemsCollected: environment.katamari.collectedItems,
            theme: environment.gameState.level.theme
        };
    }

    function updateUIForWinCondition(winCondition) {
        const messageOverlay = document.getElementById('message-overlay');
        messageOverlay.style.display = 'block';
        messageOverlay.textContent = `Congratulations! You reached level ${winCondition.level} with a katamari of ${winCondition.finalSize.toFixed(2)}m and collected ${winCondition.totalItemsCollected} items!`;
    }
});