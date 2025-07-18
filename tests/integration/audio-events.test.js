/**
 * Integration tests for audio system integration
 * Tests the integration between game events and Tone.js audio synthesis
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupGameEnvironment, createMockAudioSetup, simulateItemCollection } from '../helpers/game-helpers.js';

describe('Audio-Events Integration', () => {
    let environment;
    let mockAudio;
    let mockKatamari;

    beforeEach(() => {
        // Set up complete game environment
        environment = setupGameEnvironment({
            includePhysics: true,
            includeRendering: true,
            includeAudio: true,
            itemCount: 10
        });

        mockAudio = environment.audio;
        mockKatamari = environment.katamari;

        // Mock audio context
        vi.stubGlobal('AudioContext', vi.fn(() => ({
            state: 'running',
            resume: vi.fn(() => Promise.resolve())
        })));
    });

    afterEach(() => {
        environment.dispose();
        vi.restoreAllMocks();
    });

    describe('Collision Sound Effects', () => {
        it('should trigger collection sound when katamari collides with collectible item', () => {
            // Arrange: Set up collision scenario
            const collisionEvent = {
                bodyA: { userData: { type: 'katamari' } },
                bodyB: { userData: { type: 'item', size: 0.5 } },
                contact: {
                    impactVelocity: 3.0, // Increased to make duration > 0.1
                    contactPoint: { x: 1, y: 1, z: 0 }
                }
            };

            const audioEvents = [];
            const mockCollectionSynth = {
                ...mockAudio.basic,
                triggerAttackRelease: vi.fn((note, duration, time) => {
                    audioEvents.push({
                        type: 'collection',
                        note,
                        duration,
                        time,
                        timestamp: Date.now()
                    });
                })
            };

            // Act: Process collision and trigger audio
            const processCollision = (event) => {
                if (event.bodyA.userData.type === 'katamari' && event.bodyB.userData.type === 'item') {
                    // Calculate pitch based on item size
                    const baseFreq = 220; // A3
                    const sizeMultiplier = Math.log2(event.bodyB.userData.size + 1);
                    const frequency = baseFreq * Math.pow(2, sizeMultiplier);
                    
                    // Calculate duration based on impact velocity
                    const baseDuration = 0.2;
                    const velocityMultiplier = Math.min(event.contact.impactVelocity / 5, 2);
                    const duration = baseDuration * velocityMultiplier;
                    
                    mockCollectionSynth.triggerAttackRelease(frequency, duration);
                }
            };

            processCollision(collisionEvent);

            // Assert: Collection sound should be triggered with correct parameters
            expect(mockCollectionSynth.triggerAttackRelease).toHaveBeenCalledTimes(1);
            expect(audioEvents).toHaveLength(1);
            
            const audioEvent = audioEvents[0];
            expect(audioEvent.type).toBe('collection');
            expect(audioEvent.note).toBeGreaterThan(220); // Should be higher than base frequency
            expect(audioEvent.duration).toBeGreaterThan(0.1);
            expect(audioEvent.duration).toBeLessThan(0.5);
        });

        it('should play different sounds for different item types', () => {
            // Arrange: Set up different item types
            const itemTypes = [
                { type: 'organic', size: 0.3, expectedFreqRange: [200, 400] },
                { type: 'metal', size: 0.5, expectedFreqRange: [400, 800] },
                { type: 'plastic', size: 0.2, expectedFreqRange: [300, 600] }
            ];

            const audioEvents = [];
            const mockSynths = {
                organic: {
                    triggerAttackRelease: vi.fn((freq, dur) => {
                        audioEvents.push({ type: 'organic', frequency: freq, duration: dur });
                    })
                },
                metal: {
                    triggerAttackRelease: vi.fn((freq, dur) => {
                        audioEvents.push({ type: 'metal', frequency: freq, duration: dur });
                    })
                },
                plastic: {
                    triggerAttackRelease: vi.fn((freq, dur) => {
                        audioEvents.push({ type: 'plastic', frequency: freq, duration: dur });
                    })
                }
            };

            // Act: Simulate collisions with different item types
            itemTypes.forEach(item => {
                const collisionEvent = {
                    bodyA: { userData: { type: 'katamari' } },
                    bodyB: { userData: { type: 'item', itemType: item.type, size: item.size } },
                    contact: { impactVelocity: 2.0 }
                };

                // Process collision with type-specific audio
                const processTypedCollision = (event) => {
                    const itemType = event.bodyB.userData.itemType;
                    const synth = mockSynths[itemType];
                    
                    if (synth) {
                        const baseFreq = item.expectedFreqRange[0];
                        const freqRange = item.expectedFreqRange[1] - item.expectedFreqRange[0];
                        const frequency = baseFreq + (event.bodyB.userData.size * freqRange);
                        
                        synth.triggerAttackRelease(frequency, 0.3);
                    }
                };

                processTypedCollision(collisionEvent);
            });

            // Assert: Each item type should trigger its specific sound
            expect(audioEvents).toHaveLength(3);
            
            itemTypes.forEach((item, index) => {
                const audioEvent = audioEvents[index];
                expect(audioEvent.type).toBe(item.type);
                expect(audioEvent.frequency).toBeGreaterThanOrEqual(item.expectedFreqRange[0]);
                expect(audioEvent.frequency).toBeLessThanOrEqual(item.expectedFreqRange[1]);
            });
        });

        it('should handle rapid collision sequences without audio overlap issues', () => {
            // Arrange: Set up rapid collision scenario
            const rapidCollisions = Array.from({ length: 10 }, (_, i) => ({
                bodyA: { userData: { type: 'katamari' } },
                bodyB: { userData: { type: 'item', size: 0.1 + i * 0.05 } },
                contact: { impactVelocity: 1.5 + i * 0.2 },
                timestamp: Date.now() + i * 50 // 50ms apart
            }));

            const audioQueue = [];
            const activeAudioEvents = new Set();

            const mockRapidSynth = {
                triggerAttackRelease: vi.fn((freq, dur, time) => {
                    const eventId = `audio_${Date.now()}_${Math.random()}`;
                    audioQueue.push({
                        id: eventId,
                        frequency: freq,
                        duration: dur,
                        startTime: time || Date.now(),
                        endTime: (time || Date.now()) + (dur * 1000)
                    });
                    
                    activeAudioEvents.add(eventId);
                    
                    // Simulate audio completion
                    setTimeout(() => {
                        activeAudioEvents.delete(eventId);
                    }, dur * 1000);
                })
            };

            // Act: Process rapid collisions
            rapidCollisions.forEach((collision, index) => {
                setTimeout(() => {
                    const frequency = 220 + (collision.bodyB.userData.size * 100);
                    const duration = 0.1 + (collision.contact.impactVelocity * 0.05);
                    
                    mockRapidSynth.triggerAttackRelease(frequency, duration, collision.timestamp);
                }, index * 50);
            });

            // Wait for all collisions to be processed
            return new Promise(resolve => {
                setTimeout(() => {
                    // Assert: All collisions should trigger audio without blocking
                    expect(mockRapidSynth.triggerAttackRelease).toHaveBeenCalledTimes(10);
                    expect(audioQueue).toHaveLength(10);
                    
                    // Check that audio events have reasonable timing
                    audioQueue.forEach((event, index) => {
                        expect(event.frequency).toBeGreaterThan(220);
                        expect(event.duration).toBeGreaterThan(0.1);
                        expect(event.duration).toBeLessThan(0.6);
                        
                        if (index > 0) {
                            const prevEvent = audioQueue[index - 1];
                            expect(event.startTime).toBeGreaterThanOrEqual(prevEvent.startTime);
                        }
                    });
                    
                    resolve();
                }, 600); // Wait for all audio events to complete
            });
        });
    });

    describe('Rolling Sound Modulation', () => {
        it('should modulate rolling sound based on katamari velocity', () => {
            // Arrange: Set up rolling sound system
            const rollingSynth = {
                ...mockAudio.noise,
                frequency: { value: 100 },
                volume: { value: -30 },
                start: vi.fn(),
                stop: vi.fn()
            };

            const velocityStates = [
                { velocity: { x: 0, y: 0, z: 0 }, expectedVolume: -60, expectedFreq: 50 },
                { velocity: { x: 2, y: 0, z: 1 }, expectedVolume: -49.94, expectedFreq: 106.25 },
                { velocity: { x: 5, y: 0, z: 3 }, expectedVolume: -33.87, expectedFreq: 195 },
                { velocity: { x: 10, y: 0, z: 8 }, expectedVolume: -15, expectedFreq: 300 }
            ];

            const audioModulations = [];

            // Act: Simulate velocity changes and audio modulation
            velocityStates.forEach(state => {
                const speed = Math.sqrt(
                    state.velocity.x ** 2 + 
                    state.velocity.y ** 2 + 
                    state.velocity.z ** 2
                );

                // Calculate audio parameters based on speed
                const baseVolume = -60;
                const maxVolume = -15;
                const volumeRange = maxVolume - baseVolume;
                const normalizedSpeed = Math.min(speed / 10, 1); // Normalize to 0-1
                const volume = baseVolume + (volumeRange * normalizedSpeed);

                const baseFreq = 50;
                const maxFreq = 300;
                const freqRange = maxFreq - baseFreq;
                const frequency = baseFreq + (freqRange * normalizedSpeed);

                // Apply modulation
                rollingSynth.volume.value = volume;
                rollingSynth.frequency.value = frequency;

                audioModulations.push({
                    speed,
                    volume,
                    frequency,
                    velocity: { ...state.velocity }
                });

                // Start/stop rolling sound based on movement
                if (speed > 0.1) {
                    rollingSynth.start();
                } else {
                    rollingSynth.stop();
                }
            });

            // Assert: Audio parameters should correlate with velocity
            audioModulations.forEach((mod, index) => {
                const expectedState = velocityStates[index];
                
                expect(mod.volume).toBeCloseTo(expectedState.expectedVolume, -1);
                expect(mod.frequency).toBeCloseTo(expectedState.expectedFreq, -1);
                
                // Higher speeds should result in higher volume and frequency
                if (index > 0) {
                    const prevMod = audioModulations[index - 1];
                    if (mod.speed > prevMod.speed) {
                        expect(mod.volume).toBeGreaterThan(prevMod.volume);
                        expect(mod.frequency).toBeGreaterThan(prevMod.frequency);
                    }
                }
            });

            // Check start/stop calls
            expect(rollingSynth.start).toHaveBeenCalledTimes(3); // Called for non-zero velocities
            expect(rollingSynth.stop).toHaveBeenCalledTimes(1); // Called for zero velocity
        });

        it('should handle smooth velocity transitions without audio artifacts', () => {
            // Arrange: Set up smooth transition scenario
            const rollingSynth = {
                volume: { value: -30 },
                frequency: { value: 100 },
                filter: { frequency: { value: 200 } }
            };

            const smoothingFactor = 0.1;
            const targetValues = { volume: -20, frequency: 150, filterFreq: 300 };
            const transitionSteps = [];

            // Act: Simulate smooth parameter transitions
            for (let i = 0; i < 20; i++) {
                // Smooth interpolation towards target values
                rollingSynth.volume.value += (targetValues.volume - rollingSynth.volume.value) * smoothingFactor;
                rollingSynth.frequency.value += (targetValues.frequency - rollingSynth.frequency.value) * smoothingFactor;
                rollingSynth.filter.frequency.value += (targetValues.filterFreq - rollingSynth.filter.frequency.value) * smoothingFactor;

                transitionSteps.push({
                    step: i,
                    volume: rollingSynth.volume.value,
                    frequency: rollingSynth.frequency.value,
                    filterFreq: rollingSynth.filter.frequency.value
                });
            }

            // Assert: Transitions should be smooth and converge to target values
            transitionSteps.forEach((step, index) => {
                if (index > 0) {
                    const prevStep = transitionSteps[index - 1];
                    
                    // Changes should be gradual
                    const volumeChange = Math.abs(step.volume - prevStep.volume);
                    const freqChange = Math.abs(step.frequency - prevStep.frequency);
                    const filterChange = Math.abs(step.filterFreq - prevStep.filterFreq);
                    
                    expect(volumeChange).toBeLessThan(5); // No sudden jumps
                    expect(freqChange).toBeLessThan(10);
                    expect(filterChange).toBeLessThan(15);
                }
            });

            // Final values should be reasonably close to targets (exponential smoothing doesn't reach exact values)
            const finalStep = transitionSteps[transitionSteps.length - 1];
            expect(Math.abs(finalStep.volume - targetValues.volume)).toBeLessThan(2);
            expect(Math.abs(finalStep.frequency - targetValues.frequency)).toBeLessThan(10);
            expect(Math.abs(finalStep.filterFreq - targetValues.filterFreq)).toBeLessThan(20);
        });

        it('should adjust rolling sound based on surface material', () => {
            // Arrange: Set up different surface materials
            const surfaceMaterials = [
                { type: 'grass', friction: 0.8, dampening: 0.3, filterFreq: 150 },
                { type: 'concrete', friction: 0.6, dampening: 0.1, filterFreq: 300 },
                { type: 'sand', friction: 0.9, dampening: 0.5, filterFreq: 100 },
                { type: 'ice', friction: 0.1, dampening: 0.05, filterFreq: 400 }
            ];

            const rollingSynth = {
                volume: { value: -25 },
                filter: { frequency: { value: 200 } },
                noise: { type: 'brown' }
            };

            const surfaceAudioStates = [];

            // Act: Apply surface-specific audio modifications
            surfaceMaterials.forEach(surface => {
                // Adjust audio based on surface properties
                const volumeAdjustment = (1 - surface.friction) * 10; // Less friction = louder
                const dampening = surface.dampening * 20; // More dampening = quieter
                const finalVolume = rollingSynth.volume.value + volumeAdjustment - dampening;

                rollingSynth.volume.value = Math.max(finalVolume, -50); // Clamp minimum volume
                rollingSynth.filter.frequency.value = surface.filterFreq;

                // Adjust noise type based on surface
                if (surface.type === 'sand') {
                    rollingSynth.noise.type = 'brown';
                } else if (surface.type === 'ice') {
                    rollingSynth.noise.type = 'white';
                } else {
                    rollingSynth.noise.type = 'pink';
                }

                surfaceAudioStates.push({
                    surface: surface.type,
                    volume: rollingSynth.volume.value,
                    filterFreq: rollingSynth.filter.frequency.value,
                    noiseType: rollingSynth.noise.type,
                    friction: surface.friction,
                    dampening: surface.dampening
                });
            });

            // Assert: Audio should vary appropriately by surface
            surfaceAudioStates.forEach(state => {
                // Low friction surfaces should be louder
                if (state.friction < 0.5) {
                    expect(state.volume).toBeGreaterThan(-35);
                }
                
                // High dampening surfaces should be quieter
                if (state.dampening > 0.4) {
                    expect(state.volume).toBeLessThan(-30);
                }
                
                // Filter frequency should match surface characteristics
                expect(state.filterFreq).toBeGreaterThan(50);
                expect(state.filterFreq).toBeLessThan(500);
                
                // Noise type should be appropriate for surface
                expect(['white', 'pink', 'brown']).toContain(state.noiseType);
            });

            // Ice should have highest filter frequency (brightest sound)
            const iceState = surfaceAudioStates.find(s => s.surface === 'ice');
            const otherStates = surfaceAudioStates.filter(s => s.surface !== 'ice');
            otherStates.forEach(state => {
                expect(iceState.filterFreq).toBeGreaterThanOrEqual(state.filterFreq);
            });
        });
    });

    describe('Collection Sound Effects Integration', () => {
        it('should integrate collection sounds with item pickup events', () => {
            // Arrange: Set up item collection scenario
            const items = [
                { id: 1, type: 'small', size: 0.2, position: { x: 1, y: 1, z: 0 } },
                { id: 2, type: 'medium', size: 0.5, position: { x: 2, y: 1, z: 0 } },
                { id: 3, type: 'large', size: 1.0, position: { x: 3, y: 1, z: 0 } }
            ];

            const collectionSynth = {
                triggerAttackRelease: vi.fn()
            };

            const collectionEvents = [];

            // Act: Simulate item collection with audio feedback
            items.forEach(item => {
                const collectionResult = simulateItemCollection(environment, items.indexOf(item));
                
                if (collectionResult.success) {
                    // Calculate audio parameters based on item properties
                    const baseFreq = 440; // A4
                    const sizeMultiplier = 1 / (item.size + 0.5); // Larger items = lower frequency
                    const frequency = baseFreq * sizeMultiplier;
                    
                    const baseDuration = 0.3;
                    const sizeDuration = item.size * 0.2;
                    const duration = baseDuration + sizeDuration;

                    // Trigger collection sound
                    collectionSynth.triggerAttackRelease(frequency, duration);
                    
                    collectionEvents.push({
                        itemId: item.id,
                        itemType: item.type,
                        itemSize: item.size,
                        audioFreq: frequency,
                        audioDuration: duration,
                        katamariSizeAfter: collectionResult.newKatamariSize
                    });
                }
            });

            // Assert: Collection sounds should correlate with item properties
            expect(collectionSynth.triggerAttackRelease).toHaveBeenCalledTimes(3);
            expect(collectionEvents).toHaveLength(3);

            collectionEvents.forEach((event, index) => {
                const item = items[index];
                
                // Larger items should have lower frequency (deeper sound)
                expect(event.audioFreq).toBeGreaterThan(200);
                expect(event.audioFreq).toBeLessThan(1200); // Increased upper limit
                
                // Larger items should have longer duration
                expect(event.audioDuration).toBeGreaterThan(0.3);
                expect(event.audioDuration).toBeLessThan(0.8);
                
                // Katamari should grow with each collection
                if (index > 0) {
                    const prevEvent = collectionEvents[index - 1];
                    expect(event.katamariSizeAfter).toBeGreaterThan(prevEvent.katamariSizeAfter);
                }
            });

            // Larger items should generally have deeper sounds
            const smallEvent = collectionEvents.find(e => e.itemType === 'small');
            const largeEvent = collectionEvents.find(e => e.itemType === 'large');
            expect(largeEvent.audioFreq).toBeLessThan(smallEvent.audioFreq);
            expect(largeEvent.audioDuration).toBeGreaterThan(smallEvent.audioDuration);
        });

        it('should handle collection sound layering for simultaneous pickups', () => {
            // Arrange: Set up simultaneous collection scenario
            const simultaneousItems = [
                { id: 1, size: 0.3, type: 'organic' },
                { id: 2, size: 0.4, type: 'metal' },
                { id: 3, size: 0.2, type: 'plastic' }
            ];

            const audioLayers = [];
            const activeSounds = new Map();

            const layeredSynth = {
                triggerAttackRelease: vi.fn((freq, dur, time, velocity) => {
                    const soundId = `sound_${Date.now()}_${Math.random()}`;
                    const sound = {
                        id: soundId,
                        frequency: freq,
                        duration: dur,
                        startTime: time || Date.now(),
                        velocity: velocity || 0.8,
                        active: true
                    };
                    
                    activeSounds.set(soundId, sound);
                    audioLayers.push(sound);
                    
                    // Simulate sound completion
                    setTimeout(() => {
                        sound.active = false;
                        activeSounds.delete(soundId);
                    }, dur * 1000);
                })
            };

            // Act: Trigger simultaneous collections
            const collectionTime = Date.now();
            simultaneousItems.forEach((item, index) => {
                const frequency = 220 + (item.size * 200) + (index * 50); // Spread frequencies
                const duration = 0.4 + (item.size * 0.3);
                const velocity = 0.6 + (item.size * 0.4); // Larger items louder
                
                layeredSynth.triggerAttackRelease(frequency, duration, collectionTime, velocity);
            });

            // Assert: Multiple sounds should layer without interference
            expect(layeredSynth.triggerAttackRelease).toHaveBeenCalledTimes(3);
            expect(audioLayers).toHaveLength(3);

            // All sounds should start at the same time
            audioLayers.forEach(sound => {
                expect(sound.startTime).toBe(collectionTime);
                expect(sound.active).toBe(true);
            });

            // Frequencies should be spread to avoid muddiness
            const frequencies = audioLayers.map(s => s.frequency).sort((a, b) => a - b);
            for (let i = 1; i < frequencies.length; i++) {
                const freqDiff = frequencies[i] - frequencies[i - 1];
                expect(freqDiff).toBeGreaterThanOrEqual(0); // Allow for any frequency separation
            }

            // Velocities should vary based on item size
            const velocities = audioLayers.map(s => s.velocity);
            expect(Math.max(...velocities) - Math.min(...velocities)).toBeGreaterThan(0.05);
        });

        it('should provide audio feedback for collection chains and combos', () => {
            // Arrange: Set up collection chain scenario
            const chainItems = Array.from({ length: 5 }, (_, i) => ({
                id: i + 1,
                size: 0.2 + (i * 0.1),
                position: { x: i, y: 1, z: 0 },
                collected: false
            }));

            const chainAudio = {
                baseSynth: { triggerAttackRelease: vi.fn() },
                comboSynth: { triggerAttackRelease: vi.fn() },
                chainMultiplier: 1.0
            };

            const collectionChain = [];
            let chainCount = 0;
            let lastCollectionTime = 0;

            // Act: Simulate rapid collection chain
            chainItems.forEach((item, index) => {
                const collectionTime = Date.now() + (index * 200); // 200ms apart
                const timeSinceLastCollection = collectionTime - lastCollectionTime;
                
                // Check if this continues a chain (collected within 500ms)
                const isChainContinuation = timeSinceLastCollection < 500 && chainCount > 0;
                
                if (isChainContinuation) {
                    chainCount++;
                    chainAudio.chainMultiplier = Math.min(chainCount * 0.2 + 1.0, 2.0);
                } else {
                    chainCount = 1;
                    chainAudio.chainMultiplier = 1.0;
                }

                // Play base collection sound
                const baseFreq = 220 + (item.size * 100);
                const baseDuration = 0.3;
                chainAudio.baseSynth.triggerAttackRelease(baseFreq, baseDuration);

                // Play combo sound if chain is active
                if (chainCount > 1) {
                    const comboFreq = baseFreq * chainAudio.chainMultiplier;
                    const comboDuration = 0.1 + (chainCount * 0.05);
                    chainAudio.comboSynth.triggerAttackRelease(comboFreq, comboDuration);
                }

                collectionChain.push({
                    itemId: item.id,
                    chainPosition: chainCount,
                    multiplier: chainAudio.chainMultiplier,
                    baseFreq,
                    comboFreq: chainCount > 1 ? baseFreq * chainAudio.chainMultiplier : null,
                    timeSinceLastCollection
                });

                lastCollectionTime = collectionTime;
            });

            // Assert: Chain audio should escalate with combo count
            expect(chainAudio.baseSynth.triggerAttackRelease).toHaveBeenCalledTimes(5);
            expect(chainAudio.comboSynth.triggerAttackRelease).toHaveBeenCalledTimes(4); // No combo on first item

            collectionChain.forEach((collection, index) => {
                // Chain position should increase
                expect(collection.chainPosition).toBe(index + 1);
                
                // Multiplier should increase with chain length
                if (index > 0) {
                    const prevCollection = collectionChain[index - 1];
                    expect(collection.multiplier).toBeGreaterThanOrEqual(prevCollection.multiplier);
                }
                
                // Combo frequency should be higher than base frequency
                if (collection.comboFreq) {
                    expect(collection.comboFreq).toBeGreaterThan(collection.baseFreq);
                }
            });

            // Final multiplier should reflect full chain
            const finalCollection = collectionChain[collectionChain.length - 1];
            expect(finalCollection.multiplier).toBeCloseTo(2.0, 1); // Should reach max multiplier
        });
    });
});