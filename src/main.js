/**
 * Main entry point for the Katamari game
 * Initializes the game while maintaining IIFE encapsulation pattern through module exports
 */

// Import dependencies
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import * as Tone from 'tone';

// Import game modules
import { debugInfo, debugWarn, debugError, debugLog, toggleDebugMode } from './game/utils/debug.js';
import { PHYSICS, KATAMARI } from './game/utils/constants.js';
import { 
    initializeScene, 
    setupLighting, 
    handleWindowResize, 
    renderScene, 
    getScene, 
    getCamera, 
    getRenderer,
    getInstancedMesh
} from './game/core/scene.js';
import {
    initializePhysicsWorld,
    updatePhysics,
    getBodyVelocityMagnitude,
    managePhysicsBodyActivation,
    getPhysicsPerformanceStats,
    updatePhysicsDebugging
} from './game/core/physics.js';
import {
    initializePerformanceMonitoring,
    updatePerformanceMonitoring,
    recordRenderTime,
    getPerformanceStats,
    logPerformanceStats
} from './game/utils/performance.js';
import {
    initializeAudio,
    playRollingSound,
    stopRollingSound,
    playCollectionSound,
    updateAttractionHum
} from './game/core/audio.js';
import {
    initializeItemsSystem,
    updateItemFadeIn,
    generateItemsAroundKatamari,
    cleanupOldItems,
    getItemsToCollect,
    removeItemFromCollection,
    resetLastGenerationPosition,
    resetInstancedMeshes,
    cleanupItemsSystem,
    getInstancedMeshById
} from './game/entities/items.js';
import {
    initializeEnvironment,
    updateEnvironment
} from './game/entities/environment.js';
import { Katamari } from './game/entities/katamari.js';
import {
    initializeInputSystem,
    registerTouchCanvas,
    getKeyboardInput,
    getTouchInput,
    getGyroscopeInput,
    isGyroscopeEnabled,
    toggleGyroscope
} from './game/systems/input.js';
import {
    initializeUISystem,
    updateHUD,
    updatePowerUpStatus,
    updateGyroButtonState,
    updateDebugButtonState
} from './game/systems/ui.js';
import {
    initializeLevelSystem,
    generateNewLevel,
    checkWinCondition,
    getCurrentLevel,
    getCurrentTheme,
    getTargetKatamariSize,
    isLevelGenerating
} from './game/systems/level.js';

// Import styles
import './styles/main.css';

// Encapsulate the entire game logic within a module that maintains IIFE-like behavior
const gameModule = (function() {
    // Game state variables
    let scene, camera, renderer, world;
    let katamari; // Now using Katamari class
    let cameraLookAtTarget = new THREE.Vector3();
    const clock = new THREE.Clock();
    let smoothedSpeed = 0;

    // Cooldowns
    let lastCollectionSoundTime = 0;
    let lastRollingSoundTime = 0;

    // Power-up variables
    let activePowerUps = {};

    // FPS Counter
    const fpsCounter = {
        dom: null,
        frames: [],
        lastFrameTimeStamp: performance.now(),
        init: function() {
            this.dom = document.getElementById('fps');
        },
        update: function() {
            const now = performance.now();
            const delta = now - this.lastFrameTimeStamp;
            this.lastFrameTimeStamp = now;
            const fps = 1 / (delta / 1000);
            
            this.frames.push(fps);
            if (this.frames.length > 60) {
                this.frames.shift();
            }
            
            let mean = 0;
            for(const frame of this.frames) {
                mean += frame;
            }
            mean /= this.frames.length;

            if (this.dom) {
                this.dom.textContent = Math.round(mean);
            }
        }
    };

    // UI elements are now managed by the UI system

    // Initialize the game
    async function init() {
        debugInfo("Initializing Katamari game...");
        
        fpsCounter.init();

        // Debugging: Check Tone object (imported as module)
        debugInfo("Tone object after module import:", Tone);
        debugInfo("Type of Tone.NoiseSynth:", typeof Tone.NoiseSynth);
        debugInfo("Type of Tone.Synth:", typeof Tone.Synth);
        debugInfo("Type of Tone.MembraneSynth:", typeof Tone.MembraneSynth);

        // Debugging: Check CANNON object
        debugInfo("CANNON object after module import:", CANNON);
        debugInfo("Type of CANNON.World:", typeof CANNON.World);

        // Initialize Three.js scene using scene module
        initializeScene();
        scene = getScene();
        camera = getCamera();
        renderer = getRenderer();

        // Initialize physics world using physics module
        world = initializePhysicsWorld();

        // Set up lighting
        setupLighting();

        // Initialize audio system using the audio module
        await initializeAudio();

        // Initialize items and environment systems
        initializeItemsSystem();
        initializeEnvironment();

        // Initialize level system
        initializeLevelSystem();

        // Initialize UI system
        initializeUISystem({
            onMessageOverlayClick: () => generateNewLevel(createKatamari),
            onGyroToggle: () => {
                const newGyroState = toggleGyroscope();
                return newGyroState;
            },
            onDebugToggle: () => {
                const newDebugMode = toggleDebugMode();
                return newDebugMode;
            }
        });

        // Initialize input system
        initializeInputSystem({
            onSpaceKey: () => generateNewLevel(createKatamari),
            onResetKey: resetKatamariPosition,
            onMessageOverlayClick: () => generateNewLevel(createKatamari),
            onWindowResize: () => {
                handleWindowResize();
            }
        });

        // Initialize performance monitoring system
        initializePerformanceMonitoring({
            targetFps: 60,
            lowFpsThreshold: 45,
            criticalFpsThreshold: 30,
            enabled: true
        });

        // Register canvas for touch events
        registerTouchCanvas(renderer.domElement);

        debugInfo("Calling generateNewLevel from init...");
        await generateNewLevel(createKatamari);
        debugInfo("generateNewLevel completed. Starting animation loop.");
        
        animate();
    }



    // Audio system is now handled by the audio module



    // Level generation is now handled by the level system module

    // Create katamari using the Katamari class
    function createKatamari() {
        debugInfo("Creating Katamari instance...");
        
        // Dispose of existing katamari if it exists
        if (katamari) {
            katamari.dispose();
        }
        
        // Create new katamari instance
        katamari = new Katamari(scene, world);
        
        // Reset item generation position
        resetLastGenerationPosition(katamari.getThreePosition());
        
        debugInfo("Katamari created successfully");
    }

    function resetKatamariPosition() {
        if (katamari) {
            katamari.resetPosition();
            resetLastGenerationPosition(katamari.getThreePosition());
            debugInfo("Katamari position reset.");
        }
    }

    function animate() {
        requestAnimationFrame(animate);
        
        const frameStartTime = performance.now();
        const deltaTime = clock.getDelta();
        fpsCounter.update();

        // Update performance monitoring
        updatePerformanceMonitoring(frameStartTime);

        if (!isLevelGenerating() && katamari) {
            // Update physics
            updatePhysics(deltaTime);

            // Handle katamari movement input
            const movementInput = {
                keys: getKeyboardInput(),
                touchInput: getTouchInput(),
                gyro: getGyroscopeInput()
            };
            katamari.handleMovement(movementInput, camera, isGyroscopeEnabled());

            // Update katamari state
            const mapBoundary = 500;
            katamari.update(mapBoundary);

            // Synchronize physics bodies with visual meshes
            synchronizePhysicsWithVisuals();

            // Handle item collection
            handleItemCollection();

            // Calculate katamari speed for UI and audio
            const velocity = katamari.getVelocityMagnitude();
            smoothedSpeed = smoothedSpeed * 0.9 + velocity * 0.1;

            // Update camera to follow katamari
            updateCamera();

            // Reduce frequency of expensive operations
            if (Math.random() < 0.1) { // Only run 10% of the time
                // Update physics debugging (includes periodic integrity checks)
                updatePhysicsDebugging(deltaTime);

                // Manage physics body activation/deactivation based on katamari position
                const katamariCannonPosition = katamari.getPosition();
                managePhysicsBodyActivation(katamariCannonPosition, PHYSICS.ACTIVE_DISTANCE);

                // Update items
                updateItemFadeIn();
                
                // Generate items dynamically around katamari
                generateItemsAroundKatamari(katamari.getThreePosition(), getCurrentTheme(), katamari.radius);
                
                // Clean up old items
                cleanupOldItems(katamari.getThreePosition());

                // Update environment
                updateEnvironment(deltaTime);
            }

            // Reduce frequency of audio and UI updates
            if (Math.random() < 0.3) { // Only run 30% of the time
                // Update audio based on movement
                updateAudioBasedOnMovement(velocity);

                // Get physics and performance stats
                const physicsStats = getPhysicsPerformanceStats();
                const performanceStats = getPerformanceStats();
                
                // Update UI with current game state including performance data
                updateHUD({
                    katamariRadius: katamari.radius,
                    katamariSpeed: smoothedSpeed,
                    itemsCollected: katamari.itemsCollectedCount,
                    targetSize: getTargetKatamariSize(),
                    fps: performanceStats.fps || (fpsCounter.frames.length > 0 ? fpsCounter.frames[fpsCounter.frames.length - 1] : 0),
                    physicsStats: physicsStats,
                    performanceStats: performanceStats
                });

                // Update power-up status
                updatePowerUpStatus(activePowerUps);

                // Check for win condition using level system
                checkWinCondition(katamari.radius);
            }
        }

        // Measure render time
        const renderStartTime = performance.now();
        
        // Render the scene
        renderScene();
        
        // Record render performance
        const renderEndTime = performance.now();
        recordRenderTime(renderEndTime - renderStartTime);
    }

    // Handle item collection logic and cleanup
    function handleItemCollection() {
        const itemsToCollect = getItemsToCollect();
        const katamariPosition = katamari.getThreePosition();
        const attractionRange = katamari.getAttractionRange();
        
        let itemsInRange = 0;
        const currentTime = performance.now();

        // Check for collected items (marked by collision handler) and clean them up
        for (let i = itemsToCollect.length - 1; i >= 0; i--) {
            const item = itemsToCollect[i];
            
            if (item.userData.isCollected) {
                // Remove physics body with proper collision event cleanup
                if (item.userData.cannonBody) {
                    // Remove collision event handler before removing body
                    if (item.userData.cannonBody.userData.collisionHandler) {
                        item.userData.cannonBody.removeEventListener('collide', item.userData.cannonBody.userData.collisionHandler);
                        debugLog(`Removed collision handler for collected item ${item.userData.cannonBody.userData.name}`);
                    }
                    
                    world.removeBody(item.userData.cannonBody);
                }
                
                // Remove from visual scene using improved cleanup
                if (item.userData.isInstanced) {
                    // Use the improved instanced mesh disposal function
                    // Note: This will be handled by the cleanupCollectedItems function
                    // For now, hide the instance manually
                    const instancedMesh = getInstancedMeshById(item.userData.instancedId);
                    if (instancedMesh && item.userData.instanceIndex !== -1) {
                        const dummy = new THREE.Object3D();
                        dummy.scale.set(0, 0, 0);
                        dummy.updateMatrix();
                        instancedMesh.setMatrixAt(item.userData.instanceIndex, dummy.matrix);
                        instancedMesh.instanceMatrix.needsUpdate = true;
                    }
                } else {
                    scene.remove(item);
                }
                
                // Remove from items array
                removeItemFromCollection(item);
                
                // Play collection sound with cooldown
                if (currentTime - lastCollectionSoundTime > 100) {
                    playCollectionSound(item.userData.size);
                    lastCollectionSoundTime = currentTime;
                }
                
                continue;
            }
            
            // Handle attraction for non-collected items
            const distance = katamariPosition.distanceTo(item.position);
            
            if (distance <= attractionRange) {
                itemsInRange++;
                
                // Apply attraction force for items that are too big to collect immediately
                if (!katamari.canCollectItem(item.userData.size)) {
                    const direction = new THREE.Vector3().subVectors(katamariPosition, item.position);
                    const attractionStrength = Math.max(0, 1 - distance / attractionRange) * 0.02;
                    direction.normalize().multiplyScalar(attractionStrength);
                    item.position.add(direction);
                    
                    // Update physics body position to match
                    if (item.userData.cannonBody) {
                        item.userData.cannonBody.position.copy(item.position);
                    }
                }
            }
        }

        // Update attraction hum based on nearby items
        updateAttractionHum(itemsInRange, attractionRange);
    }

    // Update audio based on katamari movement
    function updateAudioBasedOnMovement(velocity) {
        const currentTime = performance.now();
        const isMoving = velocity > 0.1;
        
        if (isMoving) {
            // Play rolling sound with cooldown
            if (currentTime - lastRollingSoundTime > 200) {
                playRollingSound(velocity, katamari.radius);
                lastRollingSoundTime = currentTime;
            }
        } else {
            // Stop rolling sound when not moving
            stopRollingSound();
        }
    }

    // Synchronize physics bodies with visual meshes
    function synchronizePhysicsWithVisuals() {
        const itemsToCollect = getItemsToCollect();
        
        for (const item of itemsToCollect) {
            const cannonBody = item.userData.cannonBody;
            if (!cannonBody) continue;
            
            // Update visual mesh position to match physics body
            item.position.copy(cannonBody.position);
            item.quaternion.copy(cannonBody.quaternion);
            
            // Handle instanced mesh synchronization
            if (item.userData.isInstanced) {
                const instancedMesh = getInstancedMeshById(item.userData.instancedId);
                if (instancedMesh && item.userData.instanceIndex !== -1) {
                    const dummy = new THREE.Object3D();
                    dummy.position.copy(cannonBody.position);
                    dummy.quaternion.copy(cannonBody.quaternion);
                    dummy.scale.setScalar(item.userData.size || 1);
                    dummy.updateMatrix();
                    instancedMesh.setMatrixAt(item.userData.instanceIndex, dummy.matrix);
                    instancedMesh.instanceMatrix.needsUpdate = true;
                }
            }
        }
    }

    // Update camera to follow katamari
    function updateCamera() {
        if (!katamari) return;

        const katamariPosition = katamari.getThreePosition();
        
        // Calculate camera distance based on katamari size
        const baseCameraDistance = 20;
        const cameraDistance = baseCameraDistance + katamari.radius * 2;
        const cameraHeight = 15 + katamari.radius;
        
        // Smooth camera following
        const targetCameraPosition = new THREE.Vector3(
            katamariPosition.x,
            katamariPosition.y + cameraHeight,
            katamariPosition.z + cameraDistance
        );
        
        camera.position.lerp(targetCameraPosition, 0.05);
        
        // Smooth look-at target
        cameraLookAtTarget.lerp(katamariPosition, 0.1);
        camera.lookAt(cameraLookAtTarget);
    }

    // Input handling is now managed by the input system module

    // Public interface maintaining IIFE-like encapsulation
    return {
        init,
        // Expose necessary functions for other modules
        getScene: () => scene,
        getCamera: () => camera,
        getRenderer: () => renderer,
        getWorld: () => world,
        getKatamari: () => katamari,
        getCurrentLevel: () => getCurrentLevel(),
        getCurrentTheme: () => getCurrentTheme(),
        // Expose state getters
        getKatamariRadius: () => katamari ? katamari.radius : KATAMARI.INITIAL_RADIUS,
        getItemsCollectedCount: () => katamari ? katamari.itemsCollectedCount : 0
    };
})();

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    debugInfo("DOM loaded, initializing game...");
    gameModule.init().catch(error => {
        debugError("Failed to initialize game:", error);
    });
});

// Export the game module for potential external access
export default gameModule;