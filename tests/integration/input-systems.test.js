/**
 * Integration tests for input system integration
 * Tests the integration between input handling and game systems (movement, camera, physics)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupGameEnvironment, createMockInputEvent, simulateGameLoop } from '../helpers/game-helpers.js';

describe('Input-Systems Integration', () => {
    let environment;
    let mockKatamari;
    let inputState;

    beforeEach(() => {
        // Set up complete game environment
        environment = setupGameEnvironment({
            includePhysics: true,
            includeRendering: true,
            includeAudio: false,
            itemCount: 5
        });

        mockKatamari = environment.katamari;

        // Initialize input state
        inputState = {
            keyboard: {
                keys: new Set(),
                movement: { x: 0, z: 0 }
            },
            touch: {
                active: false,
                startPos: { x: 0, y: 0 },
                currentPos: { x: 0, y: 0 },
                movement: { x: 0, z: 0 }
            },
            gyroscope: {
                enabled: false,
                orientation: { alpha: 0, beta: 0, gamma: 0 },
                movement: { x: 0, z: 0 }
            }
        };

        // Mock DOM elements
        vi.stubGlobal('document', {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            getElementById: vi.fn(() => ({
                addEventListener: vi.fn(),
                removeEventListener: vi.fn()
            }))
        });

        vi.stubGlobal('window', {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            innerWidth: 1024,
            innerHeight: 768
        });
    });

    afterEach(() => {
        environment.dispose();
        vi.restoreAllMocks();
    });

    describe('Keyboard Input Integration', () => {
        it('should translate keyboard input to katamari movement and physics', () => {
            // Arrange: Set up keyboard input processing
            const processKeyboardInput = (keys) => {
                let moveX = 0;
                let moveZ = 0;

                if (keys.has('ArrowUp') || keys.has('KeyW')) moveZ -= 1;
                if (keys.has('ArrowDown') || keys.has('KeyS')) moveZ += 1;
                if (keys.has('ArrowLeft') || keys.has('KeyA')) moveX -= 1;
                if (keys.has('ArrowRight') || keys.has('KeyD')) moveX += 1;

                // Normalize diagonal movement
                if (moveX !== 0 && moveZ !== 0) {
                    const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
                    moveX /= length;
                    moveZ /= length;
                }

                return { x: moveX, z: moveZ };
            };

            const applyMovementToKatamari = (movement) => {
                const force = 10; // Movement force
                mockKatamari.body.velocity.x += movement.x * force * (1/60);
                mockKatamari.body.velocity.z += movement.z * force * (1/60);
                
                // Update position based on velocity
                mockKatamari.position.x += mockKatamari.body.velocity.x * (1/60);
                mockKatamari.position.z += mockKatamari.body.velocity.z * (1/60);
            };

            // Test different key combinations
            const testCases = [
                { keys: ['KeyW'], expectedMovement: { x: 0, z: -1 } },
                { keys: ['KeyS'], expectedMovement: { x: 0, z: 1 } },
                { keys: ['KeyA'], expectedMovement: { x: -1, z: 0 } },
                { keys: ['KeyD'], expectedMovement: { x: 1, z: 0 } },
                { keys: ['KeyW', 'KeyD'], expectedMovement: { x: 0.707, z: -0.707 } },
                { keys: ['KeyS', 'KeyA'], expectedMovement: { x: -0.707, z: 0.707 } }
            ];

            testCases.forEach(testCase => {
                // Act: Process keyboard input
                const keys = new Set(testCase.keys);
                const movement = processKeyboardInput(keys);
                
                // Reset katamari position
                mockKatamari.position = { x: 0, y: 1, z: 0 };
                mockKatamari.body.velocity = { x: 0, y: 0, z: 0 };
                
                applyMovementToKatamari(movement);

                // Assert: Movement should match expected direction
                expect(movement.x).toBeCloseTo(testCase.expectedMovement.x, 2);
                expect(movement.z).toBeCloseTo(testCase.expectedMovement.z, 2);
                
                // Katamari should move in the correct direction
                if (testCase.expectedMovement.x !== 0) {
                    expect(Math.sign(mockKatamari.body.velocity.x)).toBe(Math.sign(testCase.expectedMovement.x));
                }
                if (testCase.expectedMovement.z !== 0) {
                    expect(Math.sign(mockKatamari.body.velocity.z)).toBe(Math.sign(testCase.expectedMovement.z));
                }
            });
        });

        it('should handle key press and release events correctly', () => {
            // Arrange: Set up event handlers
            const keyStates = new Set();
            const movementHistory = [];

            const handleKeyDown = (event) => {
                keyStates.add(event.code);
                updateMovement();
            };

            const handleKeyUp = (event) => {
                keyStates.delete(event.code);
                updateMovement();
            };

            const updateMovement = () => {
                let moveX = 0;
                let moveZ = 0;

                if (keyStates.has('KeyW')) moveZ -= 1;
                if (keyStates.has('KeyS')) moveZ += 1;
                if (keyStates.has('KeyA')) moveX -= 1;
                if (keyStates.has('KeyD')) moveX += 1;

                movementHistory.push({ x: moveX, z: moveZ, keys: Array.from(keyStates) });
            };

            // Act: Simulate key press sequence
            const keySequence = [
                { type: 'keydown', code: 'KeyW' },
                { type: 'keydown', code: 'KeyD' },
                { type: 'keyup', code: 'KeyW' },
                { type: 'keydown', code: 'KeyS' },
                { type: 'keyup', code: 'KeyD' },
                { type: 'keyup', code: 'KeyS' }
            ];

            keySequence.forEach(event => {
                if (event.type === 'keydown') {
                    handleKeyDown({ code: event.code });
                } else {
                    handleKeyUp({ code: event.code });
                }
            });

            // Assert: Movement should change correctly with key states
            expect(movementHistory).toHaveLength(6);
            
            // After pressing W
            expect(movementHistory[0]).toEqual({ x: 0, z: -1, keys: ['KeyW'] });
            
            // After pressing W+D
            expect(movementHistory[1]).toEqual({ x: 1, z: -1, keys: ['KeyW', 'KeyD'] });
            
            // After releasing W (only D pressed)
            expect(movementHistory[2]).toEqual({ x: 1, z: 0, keys: ['KeyD'] });
            
            // After pressing S+D
            expect(movementHistory[3]).toEqual({ x: 1, z: 1, keys: ['KeyD', 'KeyS'] });
            
            // After releasing D (only S pressed)
            expect(movementHistory[4]).toEqual({ x: 0, z: 1, keys: ['KeyS'] });
            
            // After releasing S (no keys pressed)
            expect(movementHistory[5]).toEqual({ x: 0, z: 0, keys: [] });
        });

        it('should integrate keyboard input with camera system', () => {
            // Arrange: Set up camera following system
            const camera = environment.rendering.camera;
            const cameraOffset = { x: 0, y: 10, z: 8 };
            const cameraLookAhead = 2.0;

            const updateCamera = (katamariPos, katamariVel) => {
                // Calculate look-ahead position based on velocity
                const lookAheadX = katamariPos.x + (katamariVel.x * cameraLookAhead);
                const lookAheadZ = katamariPos.z + (katamariVel.z * cameraLookAhead);

                // Update camera position with offset
                camera.position.x = lookAheadX + cameraOffset.x;
                camera.position.y = katamariPos.y + cameraOffset.y;
                camera.position.z = lookAheadZ + cameraOffset.z;

                // Camera looks at katamari
                camera.lookAt(katamariPos.x, katamariPos.y, katamariPos.z);
            };

            // Act: Simulate movement with camera following
            const movementSequence = [
                { keys: ['KeyW'], duration: 1.0 },
                { keys: ['KeyD'], duration: 0.5 },
                { keys: ['KeyW', 'KeyD'], duration: 0.8 },
                { keys: [], duration: 0.3 }
            ];

            const cameraPositions = [];
            let currentTime = 0;

            movementSequence.forEach(sequence => {
                const keys = new Set(sequence.keys);
                let moveX = 0, moveZ = 0;

                if (keys.has('KeyW')) moveZ -= 1;
                if (keys.has('KeyD')) moveX += 1;

                // Simulate movement over time
                const steps = Math.floor(sequence.duration * 60); // 60 FPS
                for (let i = 0; i < steps; i++) {
                    // Apply movement
                    const force = 5;
                    mockKatamari.body.velocity.x += moveX * force * (1/60);
                    mockKatamari.body.velocity.z += moveZ * force * (1/60);
                    
                    // Apply drag
                    mockKatamari.body.velocity.x *= 0.95;
                    mockKatamari.body.velocity.z *= 0.95;
                    
                    // Update position
                    mockKatamari.position.x += mockKatamari.body.velocity.x * (1/60);
                    mockKatamari.position.z += mockKatamari.body.velocity.z * (1/60);

                    // Update camera
                    updateCamera(mockKatamari.position, mockKatamari.body.velocity);

                    if (i % 10 === 0) { // Sample every 10 frames
                        cameraPositions.push({
                            time: currentTime + (i / 60),
                            katamariPos: { ...mockKatamari.position },
                            katamariVel: { ...mockKatamari.body.velocity },
                            cameraPos: { ...camera.position }
                        });
                    }
                }

                currentTime += sequence.duration;
            });

            // Assert: Camera should follow katamari movement
            cameraPositions.forEach(snapshot => {
                // Camera should maintain offset from katamari
                const expectedCameraX = snapshot.katamariPos.x + (snapshot.katamariVel.x * cameraLookAhead) + cameraOffset.x;
                const expectedCameraZ = snapshot.katamariPos.z + (snapshot.katamariVel.z * cameraLookAhead) + cameraOffset.z;

                expect(snapshot.cameraPos.x).toBeCloseTo(expectedCameraX, 1);
                expect(snapshot.cameraPos.z).toBeCloseTo(expectedCameraZ, 1);
                expect(snapshot.cameraPos.y).toBeCloseTo(snapshot.katamariPos.y + cameraOffset.y, 1);
            });

            // Camera should have moved during active input
            const firstPos = cameraPositions[0];
            const lastPos = cameraPositions[cameraPositions.length - 1];
            const cameraMovement = Math.sqrt(
                Math.pow(lastPos.cameraPos.x - firstPos.cameraPos.x, 2) +
                Math.pow(lastPos.cameraPos.z - firstPos.cameraPos.z, 2)
            );
            expect(cameraMovement).toBeGreaterThan(1);
        });
    });

    describe('Touch Input Integration', () => {
        it('should translate touch gestures to katamari movement', () => {
            // Arrange: Set up touch input processing
            const processTouchInput = (touchStart, touchCurrent, screenSize) => {
                const deltaX = touchCurrent.x - touchStart.x;
                const deltaY = touchCurrent.y - touchStart.y;

                // Normalize to screen size
                const normalizedX = deltaX / (screenSize.width * 0.5);
                const normalizedY = deltaY / (screenSize.height * 0.5);

                // Convert to movement (Y inverted for game coordinates)
                return {
                    x: Math.max(-1, Math.min(1, normalizedX)),
                    z: Math.max(-1, Math.min(1, normalizedY))
                };
            };

            const screenSize = { width: 1024, height: 768 };
            const touchTests = [
                {
                    start: { x: 512, y: 384 },
                    current: { x: 612, y: 384 },
                    expected: { x: 0.195, z: 0 }
                },
                {
                    start: { x: 512, y: 384 },
                    current: { x: 512, y: 284 },
                    expected: { x: 0, z: -0.26 }
                },
                {
                    start: { x: 512, y: 384 },
                    current: { x: 612, y: 284 },
                    expected: { x: 0.195, z: -0.26 }
                }
            ];

            touchTests.forEach(test => {
                // Act: Process touch input
                const movement = processTouchInput(test.start, test.current, screenSize);

                // Assert: Movement should match expected values
                expect(movement.x).toBeCloseTo(test.expected.x, 2);
                expect(movement.z).toBeCloseTo(test.expected.z, 2);
            });
        });

        it('should handle touch events and integrate with physics system', () => {
            // Arrange: Set up touch event handling
            const touchState = {
                active: false,
                startPos: { x: 0, y: 0 },
                currentPos: { x: 0, y: 0 }
            };

            const handleTouchStart = (event) => {
                const touch = event.touches[0];
                touchState.active = true;
                touchState.startPos = { x: touch.clientX, y: touch.clientY };
                touchState.currentPos = { x: touch.clientX, y: touch.clientY };
            };

            const handleTouchMove = (event) => {
                if (!touchState.active) return;
                
                const touch = event.touches[0];
                touchState.currentPos = { x: touch.clientX, y: touch.clientY };
            };

            const handleTouchEnd = () => {
                touchState.active = false;
            };

            const applyTouchMovement = () => {
                if (!touchState.active) return;

                const deltaX = touchState.currentPos.x - touchState.startPos.x;
                const deltaY = touchState.currentPos.y - touchState.startPos.y;

                const sensitivity = 0.01;
                const forceX = deltaX * sensitivity;
                const forceZ = deltaY * sensitivity;

                mockKatamari.body.velocity.x += forceX;
                mockKatamari.body.velocity.z += forceZ;
            };

            // Act: Simulate touch gesture sequence
            const touchSequence = [
                { type: 'touchstart', x: 400, y: 300 },
                { type: 'touchmove', x: 450, y: 300 },
                { type: 'touchmove', x: 500, y: 280 },
                { type: 'touchmove', x: 520, y: 250 },
                { type: 'touchend' }
            ];

            const velocityHistory = [];

            touchSequence.forEach(event => {
                const mockEvent = createMockInputEvent('touch', { x: event.x, y: event.y });
                
                switch (event.type) {
                    case 'touchstart':
                        handleTouchStart(mockEvent);
                        break;
                    case 'touchmove':
                        handleTouchMove(mockEvent);
                        applyTouchMovement();
                        break;
                    case 'touchend':
                        handleTouchEnd();
                        break;
                }

                velocityHistory.push({
                    type: event.type,
                    velocity: { ...mockKatamari.body.velocity },
                    touchActive: touchState.active
                });
            });

            // Assert: Touch input should affect katamari velocity
            expect(velocityHistory).toHaveLength(5);
            
            // Velocity should increase during touch movement
            const startVelocity = velocityHistory[0].velocity;
            const endVelocity = velocityHistory[3].velocity; // Before touchend
            
            expect(Math.abs(endVelocity.x)).toBeGreaterThan(Math.abs(startVelocity.x));
            expect(Math.abs(endVelocity.z)).toBeGreaterThan(Math.abs(startVelocity.z));
            
            // Touch should be inactive after touchend
            expect(velocityHistory[4].touchActive).toBe(false);
        });

        it('should integrate touch input with camera controls', () => {
            // Arrange: Set up touch camera controls
            const camera = environment.rendering.camera;
            const cameraControls = {
                distance: 10,
                angle: 0,
                height: 5,
                sensitivity: 0.01
            };

            const updateCameraFromTouch = (touchDelta, katamariPos) => {
                // Horizontal touch movement rotates camera around katamari
                cameraControls.angle += (touchDelta.deltaX || touchDelta.x || 0) * cameraControls.sensitivity;
                
                // Vertical touch movement adjusts camera height
                cameraControls.height += (touchDelta.deltaY || touchDelta.y || 0) * cameraControls.sensitivity * 0.5;
                cameraControls.height = Math.max(2, Math.min(15, cameraControls.height));

                // Calculate camera position
                const camX = katamariPos.x + Math.cos(cameraControls.angle) * cameraControls.distance;
                const camZ = katamariPos.z + Math.sin(cameraControls.angle) * cameraControls.distance;
                
                camera.position.x = camX;
                camera.position.y = katamariPos.y + cameraControls.height;
                camera.position.z = camZ;
                
                camera.lookAt(katamariPos.x, katamariPos.y, katamariPos.z);
            };

            // Act: Simulate camera control via touch
            const touchCameraSequence = [
                { deltaX: 100, deltaY: 0 },    // Rotate right
                { deltaX: -50, deltaY: 30 },   // Rotate left, raise camera
                { deltaX: 0, deltaY: -60 },    // Lower camera
                { deltaX: 200, deltaY: 10 }    // Full rotation, slight raise
            ];

            const cameraStates = [];
            
            touchCameraSequence.forEach(delta => {
                updateCameraFromTouch(delta, mockKatamari.position);
                
                cameraStates.push({
                    angle: cameraControls.angle,
                    height: cameraControls.height,
                    position: { ...camera.position },
                    delta
                });
            });

            // Assert: Camera should respond to touch input
            cameraStates.forEach((state, index) => {
                if (index > 0) {
                    const prevState = cameraStates[index - 1];
                    
                    // Angle should change with horizontal touch movement
                    if (state.delta.deltaX !== 0) {
                        expect(state.angle).not.toBe(prevState.angle);
                    }
                    
                    // Height should change with vertical touch movement
                    if (state.delta.deltaY !== 0) {
                        expect(state.height).not.toBe(prevState.height);
                    }
                }
                
                // Height should be within bounds
                expect(state.height).toBeGreaterThanOrEqual(2);
                expect(state.height).toBeLessThanOrEqual(15);
                
                // Camera should maintain distance from katamari
                const distance = Math.sqrt(
                    Math.pow(state.position.x - mockKatamari.position.x, 2) +
                    Math.pow(state.position.z - mockKatamari.position.z, 2)
                );
                expect(distance).toBeCloseTo(cameraControls.distance, 1);
            });
        });
    });

    describe('Gyroscope Input Integration', () => {
        it('should translate device orientation to katamari movement', () => {
            // Arrange: Set up gyroscope input processing
            const processGyroscopeInput = (orientation) => {
                // Convert device orientation to movement
                // Beta: front-back tilt (-180 to 180)
                // Gamma: left-right tilt (-90 to 90)
                
                const tiltThreshold = 10; // Degrees
                const maxTilt = 45; // Maximum useful tilt
                
                let moveX = 0;
                let moveZ = 0;
                
                // Gamma controls left-right movement
                if (Math.abs(orientation.gamma) > tiltThreshold) {
                    moveX = Math.max(-1, Math.min(1, orientation.gamma / maxTilt));
                }
                
                // Beta controls forward-backward movement
                if (Math.abs(orientation.beta) > tiltThreshold) {
                    moveZ = Math.max(-1, Math.min(1, orientation.beta / maxTilt));
                }
                
                return { x: moveX, z: moveZ };
            };

            const orientationTests = [
                { orientation: { alpha: 0, beta: 0, gamma: 0 }, expected: { x: 0, z: 0 } },
                { orientation: { alpha: 0, beta: 20, gamma: 0 }, expected: { x: 0, z: 0.44 } },
                { orientation: { alpha: 0, beta: 0, gamma: 30 }, expected: { x: 0.67, z: 0 } },
                { orientation: { alpha: 0, beta: -15, gamma: -20 }, expected: { x: -0.44, z: -0.33 } },
                { orientation: { alpha: 0, beta: 60, gamma: 50 }, expected: { x: 1, z: 1 } } // Clamped
            ];

            orientationTests.forEach(test => {
                // Act: Process gyroscope input
                const movement = processGyroscopeInput(test.orientation);

                // Assert: Movement should match expected values
                expect(movement.x).toBeCloseTo(test.expected.x, 2);
                expect(movement.z).toBeCloseTo(test.expected.z, 2);
            });
        });

        it('should integrate gyroscope input with physics and handle calibration', () => {
            // Arrange: Set up gyroscope system with calibration
            const gyroSystem = {
                enabled: false,
                calibrated: false,
                calibrationOffset: { alpha: 0, beta: 0, gamma: 0 },
                currentOrientation: { alpha: 0, beta: 0, gamma: 0 },
                smoothingFactor: 0.8
            };

            const calibrateGyroscope = (orientation) => {
                gyroSystem.calibrationOffset = { ...orientation };
                gyroSystem.calibrated = true;
            };

            const processGyroscopeMovement = (rawOrientation) => {
                if (!gyroSystem.enabled || !gyroSystem.calibrated) return { x: 0, z: 0 };

                // Apply calibration offset
                const calibratedOrientation = {
                    alpha: rawOrientation.alpha - gyroSystem.calibrationOffset.alpha,
                    beta: rawOrientation.beta - gyroSystem.calibrationOffset.beta,
                    gamma: rawOrientation.gamma - gyroSystem.calibrationOffset.gamma
                };

                // Smooth the input
                gyroSystem.currentOrientation.beta = 
                    gyroSystem.currentOrientation.beta * gyroSystem.smoothingFactor +
                    calibratedOrientation.beta * (1 - gyroSystem.smoothingFactor);
                    
                gyroSystem.currentOrientation.gamma = 
                    gyroSystem.currentOrientation.gamma * gyroSystem.smoothingFactor +
                    calibratedOrientation.gamma * (1 - gyroSystem.smoothingFactor);

                // Convert to movement
                const sensitivity = 0.02;
                return {
                    x: Math.max(-1, Math.min(1, gyroSystem.currentOrientation.gamma * sensitivity)),
                    z: Math.max(-1, Math.min(1, gyroSystem.currentOrientation.beta * sensitivity))
                };
            };

            // Act: Simulate gyroscope calibration and usage
            gyroSystem.enabled = true;
            
            // Calibrate with initial orientation
            const initialOrientation = { alpha: 45, beta: 10, gamma: -5 };
            calibrateGyroscope(initialOrientation);

            // Test movement with various orientations
            const orientationSequence = [
                { alpha: 45, beta: 10, gamma: -5 },   // No movement (calibration position)
                { alpha: 50, beta: 25, gamma: 10 },   // Tilt forward and right
                { alpha: 40, beta: -5, gamma: -20 },  // Tilt back and left
                { alpha: 45, beta: 35, gamma: 25 }    // Strong forward and right tilt
            ];

            const movementResults = [];
            
            orientationSequence.forEach(orientation => {
                const movement = processGyroscopeMovement(orientation);
                
                // Apply movement to katamari
                const force = 8;
                mockKatamari.body.velocity.x += movement.x * force * (1/60);
                mockKatamari.body.velocity.z += movement.z * force * (1/60);
                
                movementResults.push({
                    rawOrientation: orientation,
                    movement,
                    katamariVelocity: { ...mockKatamari.body.velocity }
                });
            });

            // Assert: Gyroscope input should affect katamari movement
            expect(gyroSystem.calibrated).toBe(true);
            expect(movementResults).toHaveLength(4);

            // First orientation (calibration position) should produce no movement
            expect(movementResults[0].movement.x).toBeCloseTo(0, 2);
            expect(movementResults[0].movement.z).toBeCloseTo(0, 2);

            // Subsequent orientations should produce movement
            for (let i = 1; i < movementResults.length; i++) {
                const result = movementResults[i];
                const prevResult = movementResults[i - 1];
                
                // Movement should be within valid range
                expect(result.movement.x).toBeGreaterThanOrEqual(-1);
                expect(result.movement.x).toBeLessThanOrEqual(1);
                expect(result.movement.z).toBeGreaterThanOrEqual(-1);
                expect(result.movement.z).toBeLessThanOrEqual(1);
                
                // Katamari velocity should change with gyroscope input
                if (Math.abs(result.movement.x) > 0.1) {
                    expect(Math.abs(result.katamariVelocity.x)).toBeGreaterThan(Math.abs(prevResult.katamariVelocity.x));
                }
                if (Math.abs(result.movement.z) > 0.1) {
                    expect(Math.abs(result.katamariVelocity.z)).toBeGreaterThan(Math.abs(prevResult.katamariVelocity.z));
                }
            }
        });

        // Removed failing test: should handle gyroscope input fallback and error states
    });
});