/**
 * Katamari Entity Module
 * Handles the katamari ball logic including physics body management, size scaling,
 * collection mechanics, and growth system.
 */

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { createKatamariBody, updateKatamariPhysics, removePhysicsBody, addPhysicsBody } from '../core/physics.js';
import { debugInfo, debugWarn, debugError, debugLog } from '../utils/debug.js';
import { KATAMARI, COLLECTION, VISUAL, MOVEMENT } from '../utils/constants.js';

/**
 * Katamari class manages the player-controlled ball entity
 */
export class Katamari {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;

        // Visual representation
        this.group = null;
        this.coreBall = null;

        // Physics body
        this.body = null;

        // State
        this.radius = KATAMARI.INITIAL_RADIUS;
        this.targetRadius = KATAMARI.INITIAL_RADIUS;
        this.itemsCollectedCount = 0;

        // Movement state
        this.isMovingInput = false;
        this.currentAcceleration = 0;

        // Initialize the katamari
        this.init();
    }

    /**
     * Initialize the katamari visual and physics components
     */
    init() {
        debugInfo("Creating Katamari...");

        // Create visual representation
        this.createVisual();

        // Create physics body
        this.createPhysicsBody();

        debugInfo("Katamari created and added to physics world.");
    }

    /**
     * Create the visual representation of the katamari
     */
    createVisual() {
        this.group = new THREE.Group();

        // Create the core ball geometry and material
        const katGeo = new THREE.SphereGeometry(this.radius, VISUAL.KATAMARI_GEOMETRY_SEGMENTS, VISUAL.KATAMARI_GEOMETRY_SEGMENTS);
        const katamariTexture = new THREE.CanvasTexture(this.generateKatamariTexture());
        const katMat = new THREE.MeshStandardMaterial({
            map: katamariTexture,
            roughness: VISUAL.KATAMARI_MATERIAL_ROUGHNESS,
            metalness: VISUAL.KATAMARI_MATERIAL_METALNESS
        });

        this.coreBall = new THREE.Mesh(katGeo, katMat);
        this.coreBall.castShadow = true;
        this.coreBall.name = 'core';
        this.group.add(this.coreBall);

        // Position the katamari
        this.group.position.y = this.radius;
        this.group.scale.set(1, 1, 1);

        this.scene.add(this.group);
    }

    /**
     * Create the physics body for the katamari
     */
    createPhysicsBody() {
        const position = new CANNON.Vec3(0, this.radius, 0);
        this.body = createKatamariBody(this.radius, position, { name: 'katamari' });

        // Set physics properties
        this.body.linearDamping = MOVEMENT.ACTIVE_LINEAR_DAMPING; // Reduced linear damping for more natural momentum
        this.body.angularDamping = MOVEMENT.ACTIVE_ANGULAR_DAMPING; // Slight angular damping to prevent excessive spinning

        // Store collision handler reference for proper cleanup
        this.collisionHandler = (event) => {
            this.handleCollision(event);
        };

        // Add collision event listener
        this.body.addEventListener('collide', this.collisionHandler);

        // Add to physics world using proper tracking system
        addPhysicsBody(this.body, true); // Track the katamari body
        this.updatePhysics(); // Initial physics update

        debugInfo("Katamari collision event handler registered");
    }

    /**
     * Generate the katamari texture - Earth globe style
     */
    generateKatamariTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Create Earth-like globe texture
        // Ocean background (deep blue)
        ctx.fillStyle = '#1e3a8a'; // Deep ocean blue
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add lighter ocean areas
        ctx.fillStyle = '#2563eb'; // Lighter blue
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const radius = Math.random() * 40 + 20;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Generate continents (green/brown landmasses)
        const continentColors = ['#22c55e', '#16a34a', '#15803d', '#166534', '#8b5a2b', '#a0522d'];

        // Large continents
        for (let i = 0; i < 8; i++) {
            ctx.fillStyle = continentColors[Math.floor(Math.random() * continentColors.length)];
            const centerX = Math.random() * canvas.width;
            const centerY = Math.random() * canvas.height;
            const baseRadius = Math.random() * 60 + 40;

            // Create irregular continent shape
            ctx.beginPath();
            const points = 12 + Math.floor(Math.random() * 8);
            for (let j = 0; j < points; j++) {
                const angle = (j / points) * Math.PI * 2;
                const radiusVariation = 0.6 + Math.random() * 0.8;
                const radius = baseRadius * radiusVariation;
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;

                if (j === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.fill();
        }

        // Smaller islands
        for (let i = 0; i < 25; i++) {
            ctx.fillStyle = continentColors[Math.floor(Math.random() * continentColors.length)];
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const radius = Math.random() * 15 + 5;

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Add mountain ranges (darker green/brown)
        ctx.fillStyle = '#166534';
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const width = Math.random() * 30 + 10;
            const height = Math.random() * 8 + 3;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(Math.random() * Math.PI * 2);
            ctx.fillRect(-width / 2, -height / 2, width, height);
            ctx.restore();
        }

        // Add polar ice caps (white)
        ctx.fillStyle = '#f8fafc';
        // North pole
        ctx.beginPath();
        ctx.arc(canvas.width / 2, 0, 40, 0, Math.PI);
        ctx.fill();
        // South pole
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height, 40, Math.PI, Math.PI * 2);
        ctx.fill();

        // Add cloud patterns (semi-transparent white)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const radius = Math.random() * 25 + 10;

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Add atmospheric glow effect
        const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, canvas.width / 2
        );
        gradient.addColorStop(0, 'rgba(135, 206, 235, 0)');
        gradient.addColorStop(0.8, 'rgba(135, 206, 235, 0.1)');
        gradient.addColorStop(1, 'rgba(135, 206, 235, 0.3)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        return canvas;
    }

    /**
     * Handle movement input and apply forces to the katamari - optimized for performance
     */
    handleMovement(movementInput, camera, useGyroscope) {
        const { keys, touchInput, gyro } = movementInput;

        // Calculate camera-relative directions
        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);
        cameraDirection.y = 0; // Keep movement horizontal
        cameraDirection.normalize();

        const rightDirection = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), cameraDirection).normalize();

        let desiredMovementDirection = new CANNON.Vec3(0, 0, 0);
        this.isMovingInput = false;

        // Simplified acceleration calculation - much higher base values for responsive movement
        this.currentAcceleration = Math.min(MOVEMENT.BASE_ACCELERATION + (this.radius * MOVEMENT.ACCELERATION_RADIUS_MULTIPLIER), MOVEMENT.MAX_ACCELERATION);

        // Handle gyroscope input
        if (useGyroscope && gyro.normalizedGamma !== undefined && gyro.normalizedBeta !== undefined) {
            const forwardBackwardTilt = -gyro.normalizedGamma;
            const leftRightTilt = gyro.normalizedBeta;

            desiredMovementDirection.x += cameraDirection.x * forwardBackwardTilt * MOVEMENT.GYRO_SENSITIVITY;
            desiredMovementDirection.z += cameraDirection.z * forwardBackwardTilt * MOVEMENT.GYRO_SENSITIVITY;
            desiredMovementDirection.x -= rightDirection.x * leftRightTilt * MOVEMENT.GYRO_SENSITIVITY;
            desiredMovementDirection.z -= rightDirection.z * leftRightTilt * MOVEMENT.GYRO_SENSITIVITY;

            if (Math.abs(forwardBackwardTilt) > MOVEMENT.GYRO_THRESHOLD || Math.abs(leftRightTilt) > MOVEMENT.GYRO_THRESHOLD) {
                this.isMovingInput = true;
            }
        } else {
            // Handle keyboard input
            let forward = 0, sideways = 0;

            if (keys['w'] || keys['arrowup']) forward = -1;
            if (keys['s'] || keys['arrowdown']) forward = 1;
            if (keys['a'] || keys['arrowleft']) sideways = -1;
            if (keys['d'] || keys['arrowright']) sideways = 1;

            if (forward !== 0 || sideways !== 0) {
                desiredMovementDirection.x = cameraDirection.x * forward + rightDirection.x * sideways;
                desiredMovementDirection.z = cameraDirection.z * forward + rightDirection.z * sideways;
                this.isMovingInput = true;
            }

            // Handle touch input
            if (touchInput.active) {
                const touchDeadZone = Math.min(30, window.innerWidth * 0.05);
                const touchSensitivity = 1.5; // Increased sensitivity

                const deltaX = touchInput.currentX - touchInput.startX;
                const deltaY = touchInput.currentY - touchInput.startY;
                const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

                if (length > touchDeadZone) {
                    const normalizedDeltaX = deltaX / length;
                    const normalizedDeltaY = deltaY / length;

                    desiredMovementDirection.x += (-cameraDirection.x * normalizedDeltaY + rightDirection.x * normalizedDeltaX) * touchSensitivity;
                    desiredMovementDirection.z += (-cameraDirection.z * normalizedDeltaY + rightDirection.z * normalizedDeltaX) * touchSensitivity;
                    this.isMovingInput = true;
                }
            }
        }

        // Apply movement forces - using ONLY torque like the working backup
        if (this.isMovingInput) {
            desiredMovementDirection.normalize();

            // Calculate torque for rolling motion (like in the working backup)
            // Torque = Force * Radius (simplified for a sphere rolling on a plane)
            const torqueMagnitude = this.currentAcceleration * this.body.mass * this.radius * MOVEMENT.TORQUE_MULTIPLIER;

            // The axis of rotation should be perpendicular to the desired movement direction and the 'up' vector
            const rotationAxis = new CANNON.Vec3();
            const upVector = new CANNON.Vec3(0, 1, 0); // Y-axis is up
            desiredMovementDirection.cross(upVector, rotationAxis); // Cross product gives perpendicular vector
            rotationAxis.normalize();

            const torque = new CANNON.Vec3();
            rotationAxis.scale(torqueMagnitude, torque);

            // Apply ONLY torque to the Katamari body (no direct forces)
            this.body.applyTorque(torque);

            // Adjust damping when actively moving (like backup)
            this.body.linearDamping = MOVEMENT.ACTIVE_LINEAR_DAMPING;
            this.body.angularDamping = MOVEMENT.ACTIVE_ANGULAR_DAMPING;
        } else {
            // Increase damping when no input to slow down (like backup)
            this.body.linearDamping = MOVEMENT.IDLE_LINEAR_DAMPING;
            this.body.angularDamping = MOVEMENT.IDLE_ANGULAR_DAMPING;
        }

        // Simplified velocity clamping
        const currentSpeed = this.body.velocity.length();
        if (currentSpeed > MOVEMENT.MAX_SPEED) {
            this.body.velocity.scale(MOVEMENT.MAX_SPEED / currentSpeed, this.body.velocity);
        }

        const currentAngularSpeed = this.body.angularVelocity.length();
        if (currentAngularSpeed > MOVEMENT.MAX_ANGULAR_SPEED) {
            this.body.angularVelocity.scale(MOVEMENT.MAX_ANGULAR_SPEED / currentAngularSpeed, this.body.angularVelocity);
        }
    }

    /**
     * Update the katamari's visual and physics state
     */
    update(mapBoundary) {
        // Sync visual position with physics body
        this.group.position.copy(this.body.position);
        this.group.quaternion.copy(this.body.quaternion);

        // Clamp position to stay within bounds
        this.body.position.x = THREE.MathUtils.clamp(
            this.body.position.x,
            -mapBoundary + this.radius,
            mapBoundary - this.radius
        );
        this.body.position.z = THREE.MathUtils.clamp(
            this.body.position.z,
            -mapBoundary + this.radius,
            mapBoundary - this.radius
        );

        // Update visual position to match clamped physics body position
        this.group.position.copy(this.body.position);

        // Handle size growth animation with dynamic speed
        if (this.radius < this.targetRadius) {
            const growthDifference = this.targetRadius - this.radius;

            // Dynamic lerp speed - faster for larger differences, slower as we approach target
            // This creates a more satisfying growth curve similar to the original game
            const baseLerpSpeed = 0.08;
            const dynamicLerpSpeed = Math.min(0.15, baseLerpSpeed + (growthDifference * 0.5));

            const oldRadius = this.radius;
            this.radius = THREE.MathUtils.lerp(this.radius, this.targetRadius, dynamicLerpSpeed);

            // Only update physics and visuals if there's a meaningful change
            if (Math.abs(this.radius - oldRadius) > 0.001) {
                // Smoothly adjust position to prevent ground penetration during growth
                const positionAdjustment = this.radius - oldRadius;
                this.body.position.y += positionAdjustment;

                this.updatePhysics();
                this.updateVisuals();

                // Ensure we don't go below ground during growth
                this.body.position.y = Math.max(this.radius, this.body.position.y);
                this.group.position.copy(this.body.position);
            }

            // Snap to target when very close to avoid infinite tiny updates
            if (Math.abs(this.targetRadius - this.radius) < 0.01) {
                this.radius = this.targetRadius;
                this.updatePhysics();
                this.updateVisuals();
            }
        }

        // Handle attached item orbiting and compression animation (like original game)
        this.updateAttachedItems();
    }

    /**
     * Update attached items with orbiting and compression animation like the original game
     */
    updateAttachedItems() {
        const deltaTime = 1/60; // Approximate delta time for consistent animation

        for (let i = this.group.children.length - 1; i >= 0; i--) {
            const child = this.group.children[i];
            
            // Skip the core ball
            if (child.name === 'core') continue;
            
            if (child.userData.isAttachedToKatamari && child.userData.initialLocalPosition) {
                // Calculate dynamic compression based on current Katamari size - more aggressive compression
                const compressionFactor = Math.max(0.3, 1.0 - this.radius * COLLECTION.COMPRESSION_RATE);
                
                // Calculate much tighter positioning as katamari grows - items closer to surface
                const desiredDistance = this.radius + child.userData.initialSize * COLLECTION.SURFACE_DISTANCE_FACTOR * compressionFactor;
                const direction = child.userData.initialLocalPosition.clone().normalize();
                const currentLocalPosition = direction.multiplyScalar(desiredDistance);

                // Apply orbital rotation for dynamic movement
                child.userData.currentOrbitalAngle = (child.userData.currentOrbitalAngle || 0) + child.userData.rotationSpeed * deltaTime;
                currentLocalPosition.applyAxisAngle(new THREE.Vector3(0, 1, 0), child.userData.currentOrbitalAngle);

                // Update position
                child.position.copy(currentLocalPosition);

                // Apply stronger compression scaling as katamari grows, but keep items larger
                const scale = Math.max(COLLECTION.MIN_COMPRESSION_SCALE, COLLECTION.ATTACHMENT_SCALE * compressionFactor);
                child.scale.set(scale, scale, scale);

                // Make items slowly rotate on their own axis for visual interest
                child.rotation.y += deltaTime * 0.5;
                child.rotation.x += deltaTime * 0.3;
            }
        }
    }

    /**
     * Update the physics properties of the katamari
     */
    updatePhysics() {
        updateKatamariPhysics(this.body, this.radius);

        // Ensure the katamari doesn't sink into the ground
        this.body.position.y = Math.max(this.radius, this.body.position.y);
        this.group.position.y = this.body.position.y;
    }

    /**
     * Update the visual representation
     */
    updateVisuals() {
        if (this.coreBall) {
            // Dispose of old geometry
            if (this.coreBall.geometry) {
                this.coreBall.geometry.dispose();
            }
            // Create new geometry with updated radius
            this.coreBall.geometry = new THREE.SphereGeometry(this.radius, 32, 32);
        }
    }

    /**
     * Grow the katamari by collecting an item - authentic PlayStation game formula
     */
    collectItem(itemSize, volumeContributionFactor = COLLECTION.VOLUME_CONTRIBUTION_FACTOR) {
        const oldRadius = this.radius;
        
        // Authentic katamari growth formula with diminishing returns
        // Small items contribute very little, larger items contribute more but with scaling
        const itemVolume = Math.pow(itemSize, 3);
        const katamariVolume = Math.pow(oldRadius, 3);
        
        // Progressive difficulty scaling - larger katamari needs more items to grow
        const difficultyScale = Math.max(0.1, 1.0 - (this.radius * COLLECTION.DIFFICULTY_SCALE_RATE)); // Reduces contribution as katamari grows
        
        // Size-based contribution - smaller items contribute less relative to katamari size
        const sizeRatio = itemSize / oldRadius;
        const contributionMultiplier = Math.min(1.0, sizeRatio * COLLECTION.SIZE_RATIO_MULTIPLIER); // Items smaller than half katamari size contribute less
        
        // Final volume contribution with authentic scaling
        const volumeContribution = itemVolume * volumeContributionFactor * difficultyScale * contributionMultiplier * COLLECTION.GROWTH_RATE_REDUCTION; // Reduced overall growth rate
        
        const newVolume = katamariVolume + volumeContribution;
        const newRadius = Math.cbrt(newVolume);

        // Set target radius for smooth animation instead of immediate change
        this.targetRadius = newRadius;

        // Increment collection count
        this.itemsCollectedCount++;

        debugInfo(`Item collected! Size: ${itemSize.toFixed(2)}, Contribution: ${(volumeContribution/itemVolume*100).toFixed(1)}%, Target radius: ${this.targetRadius.toFixed(2)}m (current: ${this.radius.toFixed(2)}m), Items: ${this.itemsCollectedCount}`);
    }

    /**
     * Attach an item to the katamari visually with proper compression like the original game
     */
    attachItem(itemMesh, itemWorldPosition) {
        let attachedMesh = itemMesh;

        // Handle instanced vs regular items differently
        if (itemMesh.userData.isInstanced) {
            // For instanced items, create a new mesh to attach to katamari
            attachedMesh = this.createAttachedItemMesh(itemMesh);
            if (!attachedMesh) return;
            
            this.group.add(attachedMesh);
        } else {
            // For regular items, add directly to katamari group
            this.group.add(itemMesh);
        }

        // Calculate the direction from Katamari's center to the item's original world position
        const directionFromKatamariCenter = new THREE.Vector3().subVectors(itemWorldPosition, this.group.position);

        // Transform this direction into the Katamari's local space
        const localDirection = directionFromKatamariCenter.applyQuaternion(this.group.quaternion.clone().invert());

        // Calculate compression factor - more compression as katamari grows
        const compressionFactor = Math.max(0.3, 1.0 - this.radius * COLLECTION.COMPRESSION_RATE);
        
        // Position on surface with much tighter compression (much closer to surface)
        const minOrbitalDistance = this.radius + attachedMesh.userData.size * COLLECTION.SURFACE_DISTANCE_FACTOR * compressionFactor;
        localDirection.normalize().multiplyScalar(minOrbitalDistance);

        // Set the item's initial local position
        attachedMesh.position.copy(localDirection);

        // Store data for animation and compression
        attachedMesh.userData.isAttachedToKatamari = true;
        attachedMesh.userData.initialLocalPosition = localDirection.clone();
        attachedMesh.userData.initialSize = attachedMesh.userData.size; // Store original size
        attachedMesh.userData.rotationSpeed = (Math.random() * (COLLECTION.ORBITAL_SPEED_RANGE[1] - COLLECTION.ORBITAL_SPEED_RANGE[0]) + COLLECTION.ORBITAL_SPEED_RANGE[0]); // Random speed for individual rotation
        attachedMesh.userData.currentOrbitalAngle = 0; // Initialize orbital angle

        // Apply compression scale to the item for visual effect, but keep items larger
        const compressionScale = Math.max(COLLECTION.MIN_COMPRESSION_SCALE, COLLECTION.ATTACHMENT_SCALE * compressionFactor);
        attachedMesh.scale.set(compressionScale, compressionScale, compressionScale);

        debugInfo(`Item attached to katamari with compression: scale=${compressionScale.toFixed(2)}, distance=${minOrbitalDistance.toFixed(2)}`);
    }

    /**
     * Create a new mesh for attaching instanced items to katamari
     */
    createAttachedItemMesh(originalItemMesh) {
        try {
            // Get the original geometry and create a new mesh
            const instancedId = originalItemMesh.userData.instancedId;
            const size = originalItemMesh.userData.size;
            const color = originalItemMesh.userData.color || 0x888888;

            // Create appropriate geometry based on the instanced item type
            let geometry;
            switch (instancedId) {
                case 'sphere':
                    geometry = new THREE.SphereGeometry(size * 0.7, 16, 16);
                    break;
                case 'box':
                    geometry = new THREE.BoxGeometry(size, size, size);
                    break;
                case 'cylinder':
                    geometry = new THREE.CylinderGeometry(size * 0.5, size * 0.5, size, 8);
                    break;
                case 'cone':
                    geometry = new THREE.ConeGeometry(size * 0.5, size, 8);
                    break;
                default:
                    geometry = new THREE.SphereGeometry(size * 0.5, 8, 8);
                    break;
            }

            const material = new THREE.MeshStandardMaterial({
                color: color,
                roughness: 0.6,
                metalness: 0.1
            });

            const attachedMesh = new THREE.Mesh(geometry, material);
            attachedMesh.castShadow = true;
            attachedMesh.receiveShadow = true;
            attachedMesh.userData.size = size;
            attachedMesh.userData.originalInstancedId = instancedId;

            return attachedMesh;
        } catch (error) {
            debugError("Failed to create attached item mesh:", error);
            return null;
        }
    }

    /**
     * Reset the katamari position
     */
    resetPosition() {
        debugInfo("Resetting Katamari position...");
        if (this.body) {
            this.body.position.set(0, this.radius, 0);
            this.body.velocity.set(0, 0, 0);
            this.body.angularVelocity.set(0, 0, 0);
            this.group.position.copy(this.body.position);
            this.group.quaternion.copy(this.body.quaternion);
            debugInfo("Katamari position reset to (0,0,0).");
        } else {
            debugWarn("resetPosition: katamari body is not defined.");
        }
    }

    /**
     * Handle collision events
     */
    handleCollision(event) {
        const contact = event.contact;
        const otherBody = event.target === this.body ? event.body : event.target;

        // Ignore collisions with ground or non-item bodies
        if (!otherBody.userData || !otherBody.userData.threeMesh || otherBody.userData.isGround) {
            debugLog(`Ignoring collision with: ${otherBody.userData?.name || 'unnamed'} (isGround: ${otherBody.userData?.isGround})`);
            return;
        }

        const itemThreeMesh = otherBody.userData.threeMesh;
        let itemSize = itemThreeMesh.userData.size;

        // Check if itemSize is valid
        if (!itemSize || typeof itemSize !== 'number' || itemSize <= 0) {
            debugWarn(`Invalid item size in collision: ${itemSize} for item: ${otherBody.userData?.name || 'unnamed'}`);
            
            // Try to fix the size if we can determine it from the physics body shape
            let fixedSize = null;
            
            if (otherBody.shape) {
                if (otherBody.shape.radius) {
                    // Sphere shape
                    fixedSize = otherBody.shape.radius * 2;
                } else if (otherBody.shape.halfExtents) {
                    // Box shape - use the largest dimension
                    const extents = otherBody.shape.halfExtents;
                    fixedSize = Math.max(extents.x, extents.y, extents.z) * 2;
                } else if (otherBody.shape.radiusTop || otherBody.shape.radiusBottom) {
                    // Cylinder shape
                    const radius = Math.max(otherBody.shape.radiusTop || 0, otherBody.shape.radiusBottom || 0);
                    fixedSize = radius * 2;
                }
            }
            
            if (fixedSize && fixedSize > 0) {
                debugWarn(`Fixed size using physics shape: ${fixedSize.toFixed(2)}`);
                itemThreeMesh.userData.size = fixedSize;
                itemSize = fixedSize; // Update the itemSize variable to continue with collision detection
            } else {
                debugError(`Could not determine size for item ${otherBody.userData?.name || 'unnamed'}, skipping collision`);
                return;
            }
        }

        // Ensure it's a collectible item that hasn't been collected yet
        if (!itemThreeMesh.userData.isCollectible || itemThreeMesh.userData.isCollected) {
            return;
        }

        debugInfo(`Collision detected with item: ${otherBody.userData.name}, size: ${itemSize.toFixed(2)}m, katamari radius: ${this.radius.toFixed(2)}m`);
        debugInfo(`Item isCollectible: ${itemThreeMesh.userData.isCollectible}, isCollected: ${itemThreeMesh.userData.isCollected}`);
        debugInfo(`Can collect check: katamari radius ${this.radius.toFixed(2)} >= item size * 0.5 (${(itemSize * 0.5).toFixed(2)}) = ${this.canCollectItem(itemSize)}`);

        // Check if katamari can collect the item (using same logic as working backup)
        if (this.canCollectItem(itemSize)) {
            // Collect the item (grow katamari)
            this.collectItem(itemSize);

            // Attach the item visually to the katamari
            this.attachItem(itemThreeMesh, itemThreeMesh.position.clone());

            // Mark item as collected so it can be removed from the world
            itemThreeMesh.userData.isCollected = true;
            otherBody.userData.isCollected = true;

            // Ensure physics body will be properly removed
            if (otherBody.userData.collisionHandler) {
                otherBody.removeEventListener('collide', otherBody.userData.collisionHandler);
                debugLog(`Removed collision handler for collected item ${otherBody.userData.name}`);
            }

            debugInfo(`Item collected via collision! Size: ${itemSize.toFixed(2)}m, new katamari radius: ${this.radius.toFixed(2)}m, items collected: ${this.itemsCollectedCount}`);
        } else {
            // Katamari is too small, bounce off the item (like in working backup)
            const pushDirection = new THREE.Vector3()
                .subVectors(this.getThreePosition(), itemThreeMesh.position)
                .normalize();
            const pushForce = pushDirection.multiplyScalar(2); // Use same force as backup

            // Apply impulse to bounce away (using same scaling as backup)
            const impulse = new CANNON.Vec3(pushForce.x, pushForce.y, pushForce.z).scale(10);
            this.body.applyImpulse(impulse, new CANNON.Vec3(0, 0, 0));

            debugInfo(`Katamari bounced off larger item (size: ${itemSize.toFixed(2)}m vs katamari: ${this.radius.toFixed(2)}m)`);
        }
    }

    /**
     * Get the current velocity magnitude
     */
    getVelocityMagnitude() {
        return this.body ? this.body.velocity.length() : 0;
    }

    /**
     * Get the current position
     */
    getPosition() {
        return this.body ? this.body.position : new CANNON.Vec3(0, 0, 0);
    }

    /**
     * Get the current Three.js position
     */
    getThreePosition() {
        return this.group ? this.group.position : new THREE.Vector3(0, 0, 0);
    }

    /**
     * Check if the katamari can collect an item of given size
     */
    canCollectItem(itemSize) {
        // More forgiving collection threshold - easier to pick up items
        // Katamari can collect items that are similar in size
        // Reduced progressive difficulty for better gameplay flow
        const progressiveThreshold = Math.min(COLLECTION.MAX_THRESHOLD, COLLECTION.BASE_THRESHOLD + (this.radius * COLLECTION.PROGRESSIVE_SCALING));
        
        return this.radius >= itemSize * progressiveThreshold;
    }

    /**
     * Get the attraction range for items
     */
    getAttractionRange() {
        let calculatedSuckRangeFactor = COLLECTION.MIN_ATTRACTION_RANGE_FACTOR + (this.radius * COLLECTION.ATTRACTION_RANGE_GROWTH_RATE);
        calculatedSuckRangeFactor = Math.min(COLLECTION.MAX_ATTRACTION_RANGE_FACTOR, calculatedSuckRangeFactor);

        return this.radius * calculatedSuckRangeFactor;
    }

    /**
     * Cleanup resources
     */
    dispose() {
        if (this.group) {
            this.scene.remove(this.group);

            // Dispose of geometries and materials
            this.group.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        }

        if (this.body) {
            // Remove collision event listener before removing body
            if (this.collisionHandler) {
                this.body.removeEventListener('collide', this.collisionHandler);
                debugInfo("Katamari collision event handler removed");
            }

            // Use proper physics body removal function to ensure tracking is updated
            removePhysicsBody(this.body);
            debugInfo("Katamari physics body properly removed from world and tracking");
        }
    }
}