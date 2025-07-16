/**
 * Level Management System
 * Handles level generation, theming, target size calculation, and win conditions
 * Maintains identical level generation behavior from the original implementation
 */

import * as THREE from 'three';
import { debugInfo, debugLog } from '../utils/debug.js';
import { LEVEL, THEMES } from '../utils/constants.js';
import { 
    showLoadingOverlay, 
    hideLoadingOverlay, 
    showMessageOverlay, 
    hideMessageOverlay,
    isMessageOverlayVisible,
    updateHUD 
} from './ui.js';
import { 
    cleanupItemsSystem, 
    createCollectibleItems, 
    resetLastGenerationPosition,
    resetInstancedMeshes
} from '../entities/items.js';
import { 
    cleanupEnvironment, 
    createEnvironment, 
    createGround, 
    setupSceneAtmosphere 
} from '../entities/environment.js';
import { stopRollingSound } from '../core/audio.js';

// Level state
let currentLevel = 1;
let isGeneratingLevel = false;
let currentTheme = null;
let targetKatamariSize = 0;

/**
 * Initialize the level management system
 */
function initializeLevelSystem() {
    debugInfo("Level management system initialized");
    currentLevel = 1;
    isGeneratingLevel = false;
    currentTheme = null;
    targetKatamariSize = 0;
}

/**
 * Generate a new level with theme, environment, and items
 * @param {Function} createKatamariCallback - Callback to create katamari after level generation
 * @returns {Promise<void>}
 */
async function generateNewLevel(createKatamariCallback = null) {
    debugInfo("Starting generateNewLevel...");
    isGeneratingLevel = true;
    
    stopRollingSound();
    hideMessageOverlay();

    // Clean up previous level with proper instanced mesh reset
    cleanupItemsSystem();
    resetInstancedMeshes(); // Reset instanced meshes for level restart
    cleanupEnvironment();

    // Generate new theme
    currentTheme = await generateLevelTheme();
    
    // Calculate target size with difficulty scaling
    const difficultyFactor = 1 + (currentLevel - 1) * LEVEL.DIFFICULTY_FACTOR;
    targetKatamariSize = currentTheme.baseTargetSize * difficultyFactor;

    // Update UI with new target size
    updateHUD({
        itemsCollected: 0,
        targetSize: targetKatamariSize
    });

    // Set up scene atmosphere
    setupSceneAtmosphere(currentTheme);
    
    // Create environment
    createEnvironment(currentTheme);
    createGround(currentTheme);

    // Create katamari if callback provided
    if (createKatamariCallback && typeof createKatamariCallback === 'function') {
        createKatamariCallback();
    }

    // Generate initial items
    debugInfo("Creating initial collectible items...");
    const initialPosition = new THREE.Vector3(0, 0, 0);
    createCollectibleItems(200, currentTheme.items, initialPosition, 180);
    resetLastGenerationPosition(initialPosition);

    isGeneratingLevel = false;
    debugInfo("generateNewLevel completed");
}

/**
 * Generate level theme based on current level
 * @returns {Promise<Object>} The selected theme object
 */
async function generateLevelTheme() {
    debugInfo("Starting generateLevelTheme...");
    
    const theme = THEMES[(currentLevel - 1) % THEMES.length];
    showLoadingOverlay(`Generating ${theme.themeName}... ✨`);
    
    await new Promise(r => setTimeout(r, 1500)); // Simulate loading time
    hideLoadingOverlay();
    
    debugInfo("Finished generateLevelTheme. Selected theme:", theme.themeName);
    return theme;
}

/**
 * Check win condition and handle level completion
 * @param {number} katamariRadius - Current katamari radius
 * @returns {boolean} True if level is complete
 */
function checkWinCondition(katamariRadius) {
    if (katamariRadius >= targetKatamariSize && !isMessageOverlayVisible()) {
        showMessageOverlay(`LEVEL ${currentLevel} COMPLETE! You've grown a magnificent Katamari! Click to continue.`);
        currentLevel++;
        
        stopRollingSound();
        
        return true;
    }
    return false;
}

/**
 * Calculate target size for current level
 * @returns {number} Target katamari size for current level
 */
function calculateTargetSize() {
    if (!currentTheme) {
        return 0;
    }
    
    const difficultyFactor = 1 + (currentLevel - 1) * LEVEL.DIFFICULTY_FACTOR;
    return currentTheme.baseTargetSize * difficultyFactor;
}

/**
 * Get current level number
 * @returns {number} Current level
 */
function getCurrentLevel() {
    return currentLevel;
}

/**
 * Get current theme object
 * @returns {Object|null} Current theme or null if not set
 */
function getCurrentTheme() {
    return currentTheme;
}

/**
 * Get target katamari size for current level
 * @returns {number} Target size
 */
function getTargetKatamariSize() {
    return targetKatamariSize;
}

/**
 * Check if level is currently being generated
 * @returns {boolean} True if generating level
 */
function isLevelGenerating() {
    return isGeneratingLevel;
}

/**
 * Set current level (for testing or manual control)
 * @param {number} level - Level to set
 */
function setCurrentLevel(level) {
    if (level > 0) {
        currentLevel = level;
        debugInfo(`Level set to: ${currentLevel}`);
    }
}

/**
 * Reset level system to initial state
 */
function resetLevelSystem() {
    currentLevel = 1;
    isGeneratingLevel = false;
    currentTheme = null;
    targetKatamariSize = 0;
    debugInfo("Level system reset to initial state");
}

/**
 * Get level progression information
 * @returns {Object} Level progression data
 */
function getLevelProgressionInfo() {
    return {
        currentLevel,
        targetSize: targetKatamariSize,
        theme: currentTheme ? currentTheme.themeName : null,
        difficultyFactor: 1 + (currentLevel - 1) * LEVEL.DIFFICULTY_FACTOR,
        isGenerating: isGeneratingLevel
    };
}

/**
 * Cleanup level system resources
 */
function cleanupLevelSystem() {
    debugInfo("Cleaning up level system...");
    resetLevelSystem();
}

// Export all level management functions
export {
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
};