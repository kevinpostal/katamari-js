/**
 * Environment system for the Katamari game
 * Handles ground, terrain, mountains, and atmospheric elements
 */

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { debugLog, debugWarn, debugError, debugInfo } from '../utils/debug.js';
import { getScene } from '../core/scene.js';
import { getPhysicsWorld, addPhysicsBody } from '../core/physics.js';

// Environment state
let ground = null;
let groundBody = null;
let mountains = [];

/**
 * Initialize the environment system
 */
export function initializeEnvironment() {
    debugInfo("Initializing environment system...");
    mountains = [];
    debugInfo("Environment system initialized");
}

/**
 * Create the game environment based on theme
 */
export function createEnvironment(theme) {
    debugInfo("createEnvironment: Removing old environment objects...");
    
    const scene = getScene();
    
    // Remove old environment objects
    scene.children.filter(obj => obj.userData.isEnvironment).forEach(obj => scene.remove(obj));
    mountains = []; // Ensure mountains array is cleared
    debugInfo("createEnvironment: Old environment objects removed.");

    // Create clouds
    createClouds();
    
    // Create mountains based on theme
    createMountains(theme);
    
    debugInfo("Environment creation completed");
}

/**
 * Create atmospheric clouds
 */
function createClouds() {
    debugInfo("createEnvironment: Creating clouds...");
    
    const scene = getScene();
    const cloudMat = new THREE.MeshStandardMaterial({ 
        color: 0xffffff, 
        transparent: true, 
        opacity: 0.7, 
        roughness: 1 
    });
    
    for (let i = 0; i < 15; i++) {
        const cloudGeo = new THREE.SphereGeometry(Math.random() * 8 + 5, 16, 16);
        const cloud = new THREE.Mesh(cloudGeo, cloudMat);
        cloud.position.set(
            (Math.random() - 0.5) * 400, 
            50 + Math.random() * 30, 
            (Math.random() - 0.5) * 400
        );
        cloud.userData.isEnvironment = true;
        scene.add(cloud);
    }
    
    debugInfo("createEnvironment: Clouds created.");
}

/**
 * Create mountains and distant scenery
 */
function createMountains(theme) {
    debugInfo("createEnvironment: Creating mountains...");
    
    const scene = getScene();
    const mountainColor = new THREE.Color(theme.groundColor).lerp(new THREE.Color(0x000000), 0.2);
    const mountainMat = new THREE.MeshStandardMaterial({ color: mountainColor, roughness: 0.8 });
    const safeZoneRadius = 50; // Define a radius around the origin where mountains shouldn't spawn

    for (let i = 0; i < 8; i++) {
        const h = Math.random() * 50 + 30;
        const r = Math.random() * 40 + 20;
        const mountainGeo = new THREE.ConeGeometry(r, h, 16);
        const mountain = new THREE.Mesh(mountainGeo, mountainMat);
        
        mountain.castShadow = mountain.receiveShadow = true;
        mountain.userData.isEnvironment = true;
        mountain.userData.size = r; // Store the effective radius for collision
        mountain.userData.minSizeToPass = r * 1.8; // Katamari must be at least 1.8x mountain radius to pass

        let xPos, zPos;
        let positionFound = false;
        
        // Try to find a position outside the safe zone
        while (!positionFound) {
            xPos = (Math.random() - 0.5) * 500;
            zPos = (Math.random() - 0.5) * 500;
            // Check if the mountain's base is outside the safe zone
            if (Math.sqrt(xPos * xPos + zPos * zPos) > safeZoneRadius) {
                positionFound = true;
            }
        }
        
        mountain.position.set(xPos, h / 2 - 0.1, zPos);
        scene.add(mountain);
        mountains.push(mountain); // Add to mountains array
    }
    
    debugInfo("createEnvironment: Mountains created.");
}

/**
 * Create the ground plane
 */
export function createGround(theme) {
    debugInfo("Creating ground...");
    
    const scene = getScene();
    const world = getPhysicsWorld();
    
    // Remove existing ground
    if (ground) {
        scene.remove(ground);
        ground.geometry.dispose();
        ground.material.dispose();
    }
    if (groundBody) {
        world.removeBody(groundBody);
    }

    // Create ground texture
    const groundColor1 = new THREE.Color(theme.groundColor);
    const groundColor2 = groundColor1.clone().lerp(new THREE.Color(0x000000), 0.1);
    const groundTexture = generateGroundTexture(groundColor1, groundColor2);
    
    // Create ground mesh
    const groundMat = new THREE.MeshLambertMaterial({ map: groundTexture });
    const groundGeo = new THREE.PlaneGeometry(500, 500);
    ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Create ground physics body
    groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(new CANNON.Plane());
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    
    // Set ground position (plane should be at Y=0)
    groundBody.position.set(0, 0, 0);
    
    // Set ground material properties for proper collision
    const groundMaterial = new CANNON.Material({
        friction: 1.0,
        restitution: 0.0
    });
    groundBody.material = groundMaterial;
    
    // Create contact material for ground interactions
    const groundContactMaterial = new CANNON.ContactMaterial(
        groundMaterial,
        world.defaultMaterial,
        {
            friction: 1.0,
            restitution: 0.0,
            contactEquationStiffness: 1e8,
            contactEquationRelaxation: 2
        }
    );
    world.addContactMaterial(groundContactMaterial);
    
    // Add user data to identify this as the ground body
    groundBody.userData = {
        name: 'ground',
        isStatic: true,
        isGround: true
    };
    
    // Add to physics world (don't track in physicsBodies array since it's static)
    addPhysicsBody(groundBody, false);
    
    // Verify the ground body was added to the physics world
    const worldBodies = world.bodies;
    const groundBodyInWorld = worldBodies.includes(groundBody);
    
    debugInfo("Ground physics body created and added to physics world:");
    debugInfo(`- Position: (${groundBody.position.x}, ${groundBody.position.y}, ${groundBody.position.z})`);
    debugInfo(`- Rotation: (${groundBody.quaternion.x}, ${groundBody.quaternion.y}, ${groundBody.quaternion.z}, ${groundBody.quaternion.w})`);
    debugInfo(`- Mass: ${groundBody.mass}`);
    debugInfo(`- Material friction: ${groundBody.material.friction}`);
    debugInfo(`- Material restitution: ${groundBody.material.restitution}`);
    debugInfo(`- Ground body in physics world: ${groundBodyInWorld}`);
    debugInfo(`- Total bodies in physics world: ${worldBodies.length}`);
}

/**
 * Generate a procedural ground texture
 */
function generateGroundTexture(color1, color2) {
    const canvas = document.createElement('canvas');
    const size = 512;
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Create base gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, `#${color1.getHexString()}`);
    gradient.addColorStop(1, `#${color2.getHexString()}`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Add noise pattern
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 30;
        data[i] = Math.max(0, Math.min(255, data[i] + noise));     // Red
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // Green
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // Blue
    }
    
    ctx.putImageData(imageData, 0, 0);

    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    
    return texture;
}

/**
 * Update environment elements (if needed for animations)
 */
export function updateEnvironment(deltaTime) {
    // Add any environment animations here
    // For example, cloud movement, day/night cycle, etc.
}

/**
 * Check collision with mountains
 */
export function checkMountainCollisions(katamariPosition, katamariRadius) {
    for (const mountain of mountains) {
        const distance = katamariPosition.distanceTo(mountain.position);
        const mountainRadius = mountain.userData.size;
        
        // Check if katamari is colliding with mountain
        if (distance < mountainRadius + katamariRadius) {
            // Check if katamari is large enough to pass through
            if (katamariRadius >= mountain.userData.minSizeToPass) {
                // Katamari can pass through - no collision
                continue;
            } else {
                // Collision detected - katamari should be blocked
                return {
                    collided: true,
                    mountain: mountain,
                    pushDirection: katamariPosition.clone().sub(mountain.position).normalize()
                };
            }
        }
    }
    
    return { collided: false };
}

/**
 * Get all mountains
 */
export function getMountains() {
    return mountains;
}

/**
 * Get the ground mesh
 */
export function getGround() {
    return ground;
}

/**
 * Get the ground physics body
 */
export function getGroundBody() {
    return groundBody;
}

/**
 * Clean up environment resources
 */
export function cleanupEnvironment() {
    debugInfo("Cleaning up environment...");
    
    const scene = getScene();
    const world = getPhysicsWorld();
    
    // Remove ground
    if (ground) {
        scene.remove(ground);
        ground.geometry.dispose();
        ground.material.dispose();
        ground = null;
    }
    
    if (groundBody) {
        world.removeBody(groundBody);
        groundBody = null;
    }
    
    // Remove environment objects
    scene.children.filter(obj => obj.userData.isEnvironment).forEach(obj => {
        scene.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
    });
    
    // Clear mountains array
    mountains = [];
    
    debugInfo("Environment cleaned up");
}

/**
 * Set scene background and fog based on theme
 */
export function setupSceneAtmosphere(theme) {
    const scene = getScene();
    
    scene.background = new THREE.Color(theme.skyColor);
    scene.fog = new THREE.Fog(theme.skyColor, 50, 200);
    
    debugInfo(`Scene atmosphere set for theme: ${theme.themeName}`);
}