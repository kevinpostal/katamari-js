/**
 * Audio system module for the Katamari game
 * Handles Tone.js audio synthesis setup and dynamic sound generation
 * Extracted from the original implementation to maintain identical audio output
 * 
 * Now imports Tone.js as a module for better bundling and tree shaking
 */

import * as THREE from 'three';
import * as Tone from 'tone';
import { debugInfo, debugError } from '../utils/debug.js';
import { AUDIO } from '../utils/constants.js';

// Audio synthesizers
let rollingSynth = null;
let collectionSynth = null;
let shedSound = null;
let attractionHum = null;

// Audio state tracking
let lastCollectionSoundTime = 0;
let isAudioInitialized = false;

/**
 * Initialize the Tone.js audio system
 * Creates all synthesizers with identical settings to the original implementation
 */
export async function initializeAudio() {
    debugInfo("Initializing Tone.js audio system...");
    
    if (!Tone) {
        debugError("Tone.js not loaded!");
        return false;
    }

    try {
        // Rolling sound synthesizer - white noise for movement
        rollingSynth = new Tone.NoiseSynth({
            noise: { type: "white" },
            envelope: { attack: 0.01, decay: 0.1, sustain: 1, release: 0.1 }
        }).toDestination();
        rollingSynth.volume.value = AUDIO.ROLLING_SYNTH_VOLUME;

        // Collection sound synthesizer - sine wave for item pickup
        collectionSynth = new Tone.Synth({
            oscillator: { type: "sine" },
            envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.1 }
        }).toDestination();
        collectionSynth.volume.value = AUDIO.COLLECTION_SYNTH_VOLUME;

        // Shed sound synthesizer - membrane synth for item shedding
        shedSound = new Tone.MembraneSynth({
            pitchDecay: 0.05,
            octaves: 2,
            envelope: {
                attack: 0.001,
                decay: 0.2,
                sustain: 0.01,
                release: 0.2,
                attackCurve: "exponential"
            },
            oscillator: { type: "sine" },
            volume: AUDIO.SHED_SOUND_VOLUME
        }).toDestination();

        // Attraction hum - continuous oscillator for item attraction
        attractionHum = new Tone.Oscillator({
            frequency: 50, // Start at a low frequency
            type: "sine",
            volume: AUDIO.ATTRACTION_HUM_VOLUME // Start very quiet
        }).toDestination();
        attractionHum.start();

        isAudioInitialized = true;
        debugInfo("Audio system initialized successfully");
        return true;
    } catch (error) {
        debugError("Failed to initialize audio system:", error);
        return false;
    }
}

/**
 * Play rolling sound based on movement speed
 * Adjusts volume and playback rate based on speed
 * @param {number} speed - Current movement speed
 */
export function playRollingSound(speed) {
    if (!isAudioInitialized || !Tone) return;
    
    // Ensure audio context is running
    if (Tone.context.state !== 'running') {
        Tone.start();
    }
    
    // Start the rolling sound if not already playing
    if (rollingSynth.state === 'stopped' || rollingSynth.state === 'idle') {
        rollingSynth.triggerAttack(Tone.context.now());
    }
    
    // Adjust volume and playback rate based on speed
    const maxSpeed = 20;
    const normalizedSpeed = Math.min(1, speed / maxSpeed);
    const minVolumeDb = -40;
    const maxVolumeDb = -10;
    
    rollingSynth.volume.value = THREE.MathUtils.lerp(minVolumeDb, maxVolumeDb, normalizedSpeed);
    rollingSynth.noise.playbackRate = 0.5 + normalizedSpeed * 1.5;
}

/**
 * Stop the rolling sound
 */
export function stopRollingSound() {
    if (!isAudioInitialized || !Tone) return;
    
    if (rollingSynth.state === 'started') {
        rollingSynth.triggerRelease(Tone.context.now());
    }
}

/**
 * Play collection sound when an item is picked up
 * Pitch varies based on item size with cooldown to prevent audio spam
 * @param {number} size - Size of the collected item (default: 1)
 */
export function playCollectionSound(size = 1) {
    if (!isAudioInitialized || !Tone) return;
    
    // Ensure audio context is running
    if (Tone.context.state !== 'running') {
        Tone.start();
    }
    
    const now = Tone.context.now();
    
    // Apply cooldown to prevent audio spam
    if (now - lastCollectionSoundTime > AUDIO.COLLECTION_SOUND_COOLDOWN) {
        // Calculate note frequency based on item size
        const note = 440 * Math.pow(2, (Math.log(size + 1) / Math.log(100)));
        collectionSynth.triggerAttackRelease(note, "8n", now);
        lastCollectionSoundTime = now;
    }
}

/**
 * Play shed sound when items are dropped
 * Uses a low-pitched membrane synth sound
 */
export function playShedSound() {
    if (!isAudioInitialized || !Tone) return;
    
    // Ensure audio context is running
    if (Tone.context.state !== 'running') {
        Tone.start();
    }
    
    shedSound.triggerAttackRelease("C2", "8n");
}

/**
 * Update attraction hum based on item attraction state
 * Adjusts frequency and volume based on attraction force
 * @param {number} attractedItemsCount - Number of items being attracted
 * @param {number} totalAttractionForce - Total force being applied to attracted items
 */
export function updateAttractionHum(attractedItemsCount, totalAttractionForce) {
    if (!isAudioInitialized || !Tone) return;
    
    if (attractedItemsCount > 0) {
        const avgForce = totalAttractionForce / attractedItemsCount;
        const normalizedForce = Math.min(1, avgForce / 100); // Normalize force to 0-1 range
        const targetFrequency = THREE.MathUtils.lerp(50, 200, normalizedForce); // Pitch up to 200Hz
        const targetVolume = THREE.MathUtils.lerp(-40, -10, normalizedForce); // Increase volume

        attractionHum.frequency.value = targetFrequency;
        attractionHum.volume.value = targetVolume;
    } else {
        attractionHum.volume.value = -40; // Quiet when no items are attracted
    }
}

/**
 * Get the current audio initialization state
 * @returns {boolean} True if audio system is initialized
 */
export function isAudioReady() {
    return isAudioInitialized;
}

/**
 * Cleanup audio resources
 * Should be called when the game is being destroyed
 */
export function cleanupAudio() {
    if (!isAudioInitialized) return;
    
    try {
        if (rollingSynth) {
            rollingSynth.dispose();
            rollingSynth = null;
        }
        
        if (collectionSynth) {
            collectionSynth.dispose();
            collectionSynth = null;
        }
        
        if (shedSound) {
            shedSound.dispose();
            shedSound = null;
        }
        
        if (attractionHum) {
            attractionHum.stop();
            attractionHum.dispose();
            attractionHum = null;
        }
        
        isAudioInitialized = false;
        debugInfo("Audio system cleaned up");
    } catch (error) {
        debugError("Error cleaning up audio system:", error);
    }
}

/**
 * Get audio synthesizers for direct access if needed
 * @returns {Object} Object containing all synthesizers
 */
export function getAudioSynthesizers() {
    return {
        rollingSynth,
        collectionSynth,
        shedSound,
        attractionHum
    };
}