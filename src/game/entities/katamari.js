/**
 * Katamari Entity Module
 * Handles the katamari ball logic including physics body management, size scaling,
 * collection mechanics, and growth system.
 */

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { createKatamariBody, updateKatamariPhysics } from '../core/physics.js';
import { debugInfo, debugWarn, debugError, debugLog } from '../utils/debug.js';
import { KATAMARI } from '../utils/constants.js';

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
        const katGeo = new THREE.SphereGeometry(this.radius, 32, 32);
        const katamariTexture = new THREE.CanvasTexture(this.generateKatamariTexture());
        const katMat = new THREE.MeshStandardMaterial({
            map: katamariTexture,
            roughness: 0.6,
            metalness: 0.1
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
        this.body.linearDamping = 0.05; // Reduced linear damping for more natural momentum
        this.body.angularDamping = 0.1; // Slight angular damping to prevent excessive spinning

        // Store collision handler reference for proper cleanup
        this.collisionHandler = (event) => {
            this.handleCollision(event);
        };

        // Add collision event listener
        this.body.addEventListener('collide', this.collisionHandler);

        this.world.addBody(this.body);
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
        const baseAcceleration = 80; // Increased from 15
        const maxAcceleration = 200; // Increased from 50
        this.currentAcceleration = Math.min(baseAcceleration + (this.radius * 2), maxAcceleration);

        // Handle gyroscope input
        if (useGyroscope && gyro.normalizedGamma !== undefined && gyro.normalizedBeta !== undefined) {
            const gyroSensitivity = 0.8; // Increased sensitivity
            const forwardBackwardTilt = -gyro.normalizedGamma;
            const leftRightTilt = gyro.normalizedBeta;

            desiredMovementDirection.x += cameraDirection.x * forwardBackwardTilt * gyroSensitivity;
            desiredMovementDirection.z += cameraDirection.z * forwardBackwardTilt * gyroSensitivity;
            desiredMovementDirection.x -= rightDirection.x * leftRightTilt * gyroSensitivity;
            desiredMovementDirection.z -= rightDirection.z * leftRightTilt * gyroSensitivity;

            if (Math.abs(forwardBackwardTilt) > 0.1 || Math.abs(leftRightTilt) > 0.1) {
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
            const torqueMagnitude = this.currentAcceleration * this.body.mass * this.radius * 0.5;

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
            this.body.linearDamping = 0.05;
            this.body.angularDamping = 0.05;
        } else {
            // Increase damping when no input to slow down (like backup)
            this.body.linearDamping = 0.9;
            this.body.angularDamping = 0.9;
        }

        // Simplified velocity clamping
        const maxSpeed = 25; // Increased max speed
        const currentSpeed = this.body.velocity.length();
        if (currentSpeed > maxSpeed) {
            this.body.velocity.scale(maxSpeed / currentSpeed, this.body.velocity);
        }

        const maxAngularSpeed = 8; // Increased max angular speed
        const currentAngularSpeed = this.body.angularVelocity.length();
        if (currentAngularSpeed > maxAngularSpeed) {
            this.body.angularVelocity.scale(maxAngularSpeed / currentAngularSpeed, this.body.angularVelocity);
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

        // Handle size growth animation
        if (this.radius < this.targetRadius) {
            this.radius = THREE.MathUtils.lerp(this.radius, this.targetRadius, 0.05);
            this.updatePhysics();
            this.updateVisuals();
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
     * Grow the katamari by collecting an item
     */
    collectItem(itemSize, volumeContributionFactor = 0.8) {
        const oldRadius = this.radius;
        const newVolume = Math.pow(oldRadius, 3) + Math.pow(itemSize, 3) * volumeContributionFactor;
        this.radius = Math.cbrt(newVolume);
        this.targetRadius = this.radius;

        // Adjust position to prevent ground penetration
        const positionAdjustment = this.radius - oldRadius;
        this.body.position.y += positionAdjustment;

        this.updatePhysics();

        // Ensure we don't go below ground
        this.body.position.y = Math.max(this.radius, this.body.position.y);

        // Update visuals immediately
        this.updateVisuals();

        // Increment collection count
        this.itemsCollectedCount++;

        debugInfo(`Item collected! New radius: ${this.radius.toFixed(2)}m, Items collected: ${this.itemsCollectedCount}`);
    }

    /**
     * Attach an item to the katamari visually
     */
    attachItem(itemMesh, itemWorldPosition) {
        // Handle instanced vs regular items differently
        if (itemMesh.userData.isInstanced) {
            // For instanced items, create a new mesh to attach to katamari
            const attachedMesh = this.createAttachedItemMesh(itemMesh);
            if (attachedMesh) {
                this.group.add(attachedMesh);

                // Calculate local position on katamari surface
                const directionFromCenter = new THREE.Vector3().subVectors(itemWorldPosition, this.group.position);
                const localDirection = directionFromCenter.clone();
                this.group.worldToLocal(localDirection);

                // Position on surface with compression
                const compressionFactor = Math.max(0.4, 1.0 - this.radius * 0.005);
                const minOrbitalDistance = this.radius + itemMesh.userData.size * 0.3 * compressionFactor;
                localDirection.normalize().multiplyScalar(minOrbitalDistance);

                attachedMesh.position.copy(localDirection);
                attachedMesh.userData.isAttachedToKatamari = true;
                attachedMesh.userData.initialLocalPosition = localDirection.clone();

                debugInfo(`Instanced item attached to katamari at local position: ${localDirection.x.toFixed(2)}, ${localDirection.y.toFixed(2)}, ${localDirection.z.toFixed(2)}`);
            }
        } else {
            // For regular items, add directly to katamari group
            this.group.add(itemMesh);

            // Calculate local position on katamari surface
            const directionFromCenter = new THREE.Vector3().subVectors(itemWorldPosition, this.group.position);
            const localDirection = directionFromCenter.clone();
            this.group.worldToLocal(localDirection);

            // Position on surface with compression
            const compressionFactor = Math.max(0.4, 1.0 - this.radius * 0.005);
            const minOrbitalDistance = this.radius + itemMesh.userData.size * 0.3 * compressionFactor;
            localDirection.normalize().multiplyScalar(minOrbitalDistance);

            itemMesh.position.copy(localDirection);
            itemMesh.userData.isAttachedToKatamari = true;
            itemMesh.userData.initialLocalPosition = localDirection.clone();

            debugInfo(`Regular item attached to katamari at local position: ${localDirection.x.toFixed(2)}, ${localDirection.y.toFixed(2)}, ${localDirection.z.toFixed(2)}`);
        }
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
            return;
        }

        const itemThreeMesh = otherBody.userData.threeMesh;
        const itemSize = itemThreeMesh.userData.size;

        // Check if itemSize is valid
        if (!itemSize || typeof itemSize !== 'number') {
            debugWarn(`Invalid item size in collision: ${itemSize}`);
            return;
        }

        // Ensure it's a collectible item that hasn't been collected yet
        if (!itemThreeMesh.userData.isCollectible || itemThreeMesh.userData.isCollected) {
            return;
        }

        debugInfo(`Collision detected with item: ${otherBody.userData.name}, size: ${itemSize.toFixed(2)}m, katamari radius: ${this.radius.toFixed(2)}m`);

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
        return this.radius >= itemSize * 0.6; // Slightly more restrictive for better gameplay balance
    }

    /**
     * Get the attraction range for items
     */
    getAttractionRange() {
        const baseSuckRangeFactor = 1.5;
        const minSuckRangeFactor = 1.2;
        const maxSuckRangeFactor = 3.0;
        const suckFactorGrowthRate = 0.1;

        let calculatedSuckRangeFactor = minSuckRangeFactor + (this.radius * suckFactorGrowthRate);
        calculatedSuckRangeFactor = Math.min(maxSuckRangeFactor, calculatedSuckRangeFactor);

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

            this.world.removeBody(this.body);
        }
    }
}