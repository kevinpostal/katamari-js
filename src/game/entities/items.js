/**
 * Items system for collectible objects in the Katamari game
 * Handles procedural generation, instanced rendering, and item management
 */

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { debugLog, debugWarn, debugError, debugInfo } from '../utils/debug.js';
import { INSTANCED_ITEM_MAP, RENDERING } from '../utils/constants.js';
import { getScene, getInstancedMesh, updateInstancedMesh } from '../core/scene.js';
import {
    getPhysicsWorld,
    addPhysicsBody,
    removePhysicsBody,
    removeAllPhysicsBodies,
    removePhysicsBodiesByCondition,
    validateAndFixPhysicsWorld
} from '../core/physics.js';

// Item management state
let itemsToCollect = [];
let powerUpItems = [];
let lastGenerationPosition = new THREE.Vector3();

// Instanced mesh management
const instancedGeometries = {};
const instancedMaterials = {};
const instancedMeshes = {};

// Constants for item generation - optimized for performance
const GENERATION_DISTANCE_THRESHOLD = 80; // Increased from 50 to reduce generation frequency
const CLEANUP_DISTANCE_THRESHOLD = 150; // Reduced from 200 for more aggressive cleanup
const MAP_BOUNDARY = 240;
const ITEM_FADE_DURATION = 500; // Reduced from 1000ms for faster fade-in

// Item colors for variety
const ITEM_COLORS = [0xFF6347, 0x6A5ACD, 0x3CB371, 0xFFD700, 0xBA55D3, 0x4682B4, 0xD2B48C, 0xFFA07A, 0x20B2AA, 0xFF69B4];

/**
 * Initialize the items system
 */
export function initializeItemsSystem() {
    debugInfo("Initializing items system...");
    itemsToCollect = [];
    powerUpItems = [];
    lastGenerationPosition.set(0, 0, 0);

    // Clear existing instanced meshes
    clearInstancedMeshes();

    debugInfo("Items system initialized");
}

/**
 * Create collectible items around a center position
 */
export function createCollectibleItems(count, itemNames, centerPosition = new THREE.Vector3(0, 0, 0), spawnRadius = 100) {
    debugInfo(`createCollectibleItems: Attempting to create ${count} items.`);
    if (!itemNames || itemNames.length === 0) {
        debugWarn("createCollectibleItems: itemNames array is empty or undefined. Cannot create items.");
        return;
    }

    const scene = getScene();
    const world = getPhysicsWorld();

    // Initialize instanced meshes if they don't exist
    initializeInstancedMeshes(itemNames);

    const dummy = new THREE.Object3D(); // For setting instance matrix

    for (let i = 0; i < count; i++) {
        const itemName = itemNames[Math.floor(Math.random() * itemNames.length)];
        debugInfo(`Attempting to create item: ${itemName}`);

        let threeMesh;
        let cannonShape;
        let size;

        const color = ITEM_COLORS[Math.floor(Math.random() * ITEM_COLORS.length)];

        // Check if the item can be instanced
        const instancedId = INSTANCED_ITEM_MAP[itemName];
        const isInstanced = !!instancedId;

        if (isInstanced) {
            // Create instanced item
            const result = createInstancedItem(itemName, instancedId, color, dummy);
            if (!result) continue;

            threeMesh = result.threeMesh;
            cannonShape = result.cannonShape;
            size = result.size;
        } else {
            // Create regular item
            const result = createRegularItem(itemName, color);
            if (!result) continue;

            threeMesh = result.threeMesh;
            cannonShape = result.cannonShape;
            size = result.size;
        }

        // Position the item with proper ground clearance
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * spawnRadius;
        const x = centerPosition.x + Math.cos(angle) * distance;
        const z = centerPosition.z + Math.sin(angle) * distance;

        // Clamp to map boundaries
        const clampedX = THREE.MathUtils.clamp(x, -MAP_BOUNDARY, MAP_BOUNDARY);
        const clampedZ = THREE.MathUtils.clamp(z, -MAP_BOUNDARY, MAP_BOUNDARY);

        // Ensure items spawn above ground level with proper Y coordinates
        // Use size-based positioning with additional height for falling effect
        const groundLevel = 0; // Ground is at Y=0
        const minHeight = size * 0.5; // Half the item size above ground
        const maxHeight = size * 0.5 + 5; // Add up to 5 units for falling effect
        const yPosition = groundLevel + minHeight + Math.random() * (maxHeight - minHeight);

        threeMesh.position.set(clampedX, yPosition, clampedZ);

        // Create physics body with proper error handling
        try {
            const itemBody = new CANNON.Body({
                mass: size * 5, // Use size-based mass like in working backup
                shape: cannonShape
            });

            // Ensure initial position is above ground level
            const groundClearance = size + 0.1; // Add small buffer above ground
            const initialY = Math.max(groundClearance, threeMesh.position.y);

            itemBody.position.set(
                threeMesh.position.x,
                initialY,
                threeMesh.position.z
            );
            itemBody.quaternion.copy(threeMesh.quaternion);

            // Set proper initial velocity and damping settings
            itemBody.velocity.set(0, 0, 0); // Start with zero velocity
            itemBody.angularVelocity.set(0, 0, 0); // No initial rotation

            // Apply damping to prevent excessive bouncing and spinning
            itemBody.linearDamping = 0.1; // Light linear damping
            itemBody.angularDamping = 0.1; // Light angular damping

            // Set material properties for realistic physics interaction
            itemBody.material = new CANNON.Material('item', {
                friction: 0.4,
                restitution: 0.3 // Moderate bounciness
            });

            itemBody.userData = {
                threeMesh: threeMesh,
                name: `item-${itemName}-${i}`,
                isCollectible: true
            };
            threeMesh.userData.cannonBody = itemBody;

            // Add collision event handler for item-ground interactions
            const itemCollisionHandler = (event) => {
                handleItemCollision(itemBody, event);
            };
            itemBody.addEventListener('collide', itemCollisionHandler);

            // Store collision handler reference for cleanup
            itemBody.userData.collisionHandler = itemCollisionHandler;

            // Verify physics world exists before adding
            if (!world) {
                debugError(`Physics world not available when creating item ${itemName}`);
                continue;
            }

            // Add to physics world with validation
            addPhysicsBody(itemBody);

            // Verify the body was actually added to the world
            if (!world.bodies.includes(itemBody)) {
                debugError(`Failed to add physics body to world for item ${itemName}`);
                continue;
            }

            debugLog(`Successfully created and added physics body for ${itemName} at position (${itemBody.position.x.toFixed(2)}, ${itemBody.position.y.toFixed(2)}, ${itemBody.position.z.toFixed(2)})`);

        } catch (error) {
            debugError(`Failed to create physics body for item ${itemName}:`, error);
            continue; // Skip this item if physics body creation fails
        }

        // Handle instanced mesh positioning
        if (isInstanced) {
            const instancedMesh = instancedMeshes[instancedId];
            if (instancedMesh) {
                const instanceIndex = getNextInstanceIndex(instancedId);
                threeMesh.userData.instanceIndex = instanceIndex;

                // Set instance matrix
                dummy.position.copy(threeMesh.position);
                dummy.quaternion.copy(threeMesh.quaternion);
                dummy.scale.setScalar(size);
                dummy.updateMatrix();
                instancedMesh.setMatrixAt(instanceIndex, dummy.matrix);
                instancedMesh.instanceMatrix.needsUpdate = true;

                // Set instance color if available
                if (instancedMesh.instanceColor) {
                    const colorObj = new THREE.Color(color);
                    instancedMesh.instanceColor.setXYZ(instanceIndex, colorObj.r, colorObj.g, colorObj.b);
                    instancedMesh.instanceColor.needsUpdate = true;
                }
            }
        } else {
            scene.add(threeMesh);
        }

        // Add fade-in properties
        threeMesh.userData.isFadingIn = true;
        threeMesh.userData.fadeStartTime = Date.now();

        // Mark as collectible for collision detection
        threeMesh.userData.isCollectible = true;

        itemsToCollect.push(threeMesh);
    }

    debugInfo(`Created ${count} collectible items around position (${centerPosition.x.toFixed(1)}, ${centerPosition.z.toFixed(1)})`);
}

/**
 * Initialize instanced meshes for efficient rendering
 */
function initializeInstancedMeshes(itemNames) {
    const scene = getScene();

    for (const itemName of itemNames) {
        const id = INSTANCED_ITEM_MAP[itemName];
        if (!id || instancedMeshes[id]) continue;

        let geometry, material;
        const color = ITEM_COLORS[Math.floor(Math.random() * ITEM_COLORS.length)];
        const mat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.6, transparent: true, opacity: 0 });

        switch (itemName) {
            case 'Rock':
                geometry = new THREE.SphereGeometry(0.7, 16, 16);
                break;
            case 'Bush':
                geometry = new THREE.SphereGeometry(0.8, 24, 24);
                break;
            case 'Flower':
                geometry = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 8);
                break;
            case 'Mushroom':
                geometry = new THREE.CylinderGeometry(0.6, 0.3, 1.2, 16);
                break;
            case 'Traffic Cone':
                geometry = new THREE.ConeGeometry(0.5, 1.5, 16);
                break;
            case 'Garden Gnome':
                geometry = new THREE.SphereGeometry(0.5, 16, 16);
                break;
            case 'Bird Bath':
                geometry = new THREE.CylinderGeometry(0.7, 0.6, 1.4, 16);
                break;
            case 'Asteroid':
                geometry = new THREE.IcosahedronGeometry(1, 0);
                break;
            case 'Space Debris':
                geometry = new THREE.BoxGeometry(1, 1, 1);
                break;
            case 'Comet Fragment':
                geometry = new THREE.IcosahedronGeometry(1, 1);
                break;
            case 'Moon Rock':
                geometry = new THREE.DodecahedronGeometry(1, 0);
                break;
            case 'Star Dust Cluster':
                geometry = new THREE.SphereGeometry(0.5, 8, 8);
                break;
            default:
                continue;
        }

        instancedGeometries[id] = geometry;
        instancedMaterials[id] = mat;
        instancedMeshes[id] = new THREE.InstancedMesh(geometry, mat, RENDERING.MAX_INSTANCES);
        instancedMeshes[id].instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        instancedMeshes[id].castShadow = true;
        instancedMeshes[id].receiveShadow = true;
        instancedMeshes[id].userData.instanceCount = 0; // Track used instances
        scene.add(instancedMeshes[id]);
    }
}

/**
 * Create an instanced item
 */
function createInstancedItem(itemName, instancedId, color, dummy) {
    const size = Math.random() * 1.5 + 0.5;
    const baseGeometry = instancedGeometries[instancedId];

    if (!baseGeometry) {
        debugWarn(`Base geometry not found for instanced item: ${itemName}`);
        return null;
    }

    // Determine cannon shape based on geometry type
    let cannonShape;
    if (baseGeometry.type === 'SphereGeometry' || baseGeometry.type === 'IcosahedronGeometry' || baseGeometry.type === 'DodecahedronGeometry') {
        cannonShape = new CANNON.Sphere(size * baseGeometry.parameters.radius);
    } else if (baseGeometry.type === 'BoxGeometry') {
        cannonShape = new CANNON.Box(new CANNON.Vec3(
            size * baseGeometry.parameters.width * 0.5,
            size * baseGeometry.parameters.height * 0.5,
            size * baseGeometry.parameters.depth * 0.5
        ));
    } else if (baseGeometry.type === 'CylinderGeometry') {
        cannonShape = new CANNON.Cylinder(
            size * baseGeometry.parameters.radiusTop,
            size * baseGeometry.parameters.radiusBottom,
            size * baseGeometry.parameters.height,
            baseGeometry.parameters.radialSegments
        );
    } else if (baseGeometry.type === 'ConeGeometry') {
        cannonShape = new CANNON.Cylinder(
            0,
            size * baseGeometry.parameters.radius,
            size * baseGeometry.parameters.height,
            baseGeometry.parameters.radialSegments
        );
    } else {
        cannonShape = new CANNON.Box(new CANNON.Vec3(size * 0.5, size * 0.5, size * 0.5));
    }

    // Create placeholder mesh for physics and user data
    const threeMesh = new THREE.Mesh();
    threeMesh.userData.isInstanced = true;
    threeMesh.userData.instancedId = instancedId;
    threeMesh.userData.instanceIndex = -1;
    threeMesh.userData.size = size * (baseGeometry.parameters.radius || baseGeometry.parameters.height || baseGeometry.parameters.width);
    threeMesh.userData.cannonShape = cannonShape;
    threeMesh.userData.color = color;

    return { threeMesh, cannonShape, size };
}

/**
 * Create a regular (non-instanced) item with complex geometry
 */
function createRegularItem(itemName, color) {
    let itemGroup = new THREE.Group();
    let threeMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x888888, transparent: true, opacity: 0 }));
    let cannonShape;
    let size = 1;

    switch (itemName) {
        case 'Car':
            const carResult = createCarItem(color);
            threeMesh = carResult.mesh;
            cannonShape = carResult.shape;
            size = carResult.size;
            break;
        case 'Tree':
            const treeResult = createTreeItem(color);
            threeMesh = treeResult.mesh;
            cannonShape = treeResult.shape;
            size = treeResult.size;
            break;
        case 'House':
            const houseResult = createHouseItem(color);
            threeMesh = houseResult.mesh;
            cannonShape = houseResult.shape;
            size = houseResult.size;
            break;
        // Add more complex items as needed
        default:
            debugWarn(`Unknown regular item type: ${itemName}`);
            return null;
    }

    return { threeMesh, cannonShape, size };
}

/**
 * Create a car item with detailed geometry
 */
function createCarItem(color) {
    const size = Math.random() * 2 + 0.8;
    const itemGroup = new THREE.Group();

    // Main body
    const carBodyGeo = new THREE.BoxGeometry(size * 2, size * 0.8, size);
    const carBodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, transparent: true, opacity: 0 });
    const carBody = new THREE.Mesh(carBodyGeo, carBodyMat);
    carBody.castShadow = carBody.receiveShadow = true;
    itemGroup.add(carBody);

    // Cabin
    const carCabinGeo = new THREE.BoxGeometry(size * 1.2, size * 0.6, size * 0.8);
    const carCabinMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, transparent: true, opacity: 0 });
    const carCabin = new THREE.Mesh(carCabinGeo, carCabinMat);
    carCabin.castShadow = carCabin.receiveShadow = true;
    carCabin.position.y = size * 0.7;
    itemGroup.add(carCabin);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(size * 0.25, size * 0.25, size * 0.2, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8, transparent: true, opacity: 0 });
    const wheelPositions = [[0.7, 0.5], [-0.7, 0.5], [0.7, -0.5], [-0.7, -0.5]];

    wheelPositions.forEach(([dx, dz]) => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(size * dx, -size * 0.2, size * dz);
        itemGroup.add(wheel);
    });

    const cannonShape = new CANNON.Box(new CANNON.Vec3(size, size * 0.4, size * 0.5));

    return {
        mesh: itemGroup,
        shape: cannonShape,
        size: size * 2
    };
}

/**
 * Create a tree item with detailed geometry
 */
function createTreeItem(color) {
    const size = Math.random() * 4 + 2;
    const itemGroup = new THREE.Group();

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(size * 0.08, size * 0.12, size * 1.2, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7, transparent: true, opacity: 0 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.castShadow = trunk.receiveShadow = true;
    trunk.position.y = size * 0.6;
    itemGroup.add(trunk);

    // Foliage
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.5, transparent: true, opacity: 0 });
    const foliageGeo = new THREE.ConeGeometry(size * 0.4, size * 0.8, 16);
    const foliage = new THREE.Mesh(foliageGeo, foliageMat);
    foliage.castShadow = foliage.receiveShadow = true;
    foliage.position.y = size * 1.2;
    itemGroup.add(foliage);

    const cannonShape = new CANNON.Cylinder(size * 0.12, size * 0.4, size * 2, 8);

    return {
        mesh: itemGroup,
        shape: cannonShape,
        size: size * 1.5
    };
}

/**
 * Create a house item with detailed geometry
 */
function createHouseItem(color) {
    const size = Math.random() * 2 + 1;
    const itemGroup = new THREE.Group();

    // Main body
    const mainBodyGeo = new THREE.BoxGeometry(size * 1.5, size * 1.2, size * 1.5);
    const mainBodyMat = new THREE.MeshStandardMaterial({ color: 0xF5DEB3, roughness: 0.7, transparent: true, opacity: 0 });
    const mainBody = new THREE.Mesh(mainBodyGeo, mainBodyMat);
    mainBody.castShadow = mainBody.receiveShadow = true;
    itemGroup.add(mainBody);

    // Roof
    const roofGeo = new THREE.ConeGeometry(size * 1.2, size * 0.8, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xA0522D, roughness: 0.7, transparent: true, opacity: 0 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = size * 1.2;
    roof.castShadow = roof.receiveShadow = true;
    itemGroup.add(roof);

    const cannonShape = new CANNON.Box(new CANNON.Vec3(size * 0.75, size * 0.75, size * 0.75));

    return {
        mesh: itemGroup,
        shape: cannonShape,
        size: size * 1.5
    };
}

/**
 * Handle collision events for items (primarily item-ground interactions)
 * @param {CANNON.Body} itemBody - The item's physics body
 * @param {Object} event - The collision event
 */
function handleItemCollision(itemBody, event) {
    const otherBody = event.target === itemBody ? event.body : event.target;

    // Check if collision is with ground
    if (otherBody.userData && otherBody.userData.isGround) {
        // Item has hit the ground - ensure it stays grounded
        const itemThreeMesh = itemBody.userData.threeMesh;
        if (itemThreeMesh) {
            // Prevent items from bouncing too much on ground
            if (itemBody.velocity.y < -0.5) {
                itemBody.velocity.y *= 0.5; // Reduce downward velocity
            }

            // Add slight damping when on ground to prevent sliding
            if (Math.abs(itemBody.position.y - itemThreeMesh.userData.size * 0.5) < 0.1) {
                itemBody.linearDamping = Math.max(itemBody.linearDamping, 0.3);
                itemBody.angularDamping = Math.max(itemBody.angularDamping, 0.3);
            }

            debugLog(`Item ${itemBody.userData.name} collided with ground at Y=${itemBody.position.y.toFixed(2)}`);
        }
    }

    // Handle other collision types if needed (item-item, etc.)
    // This can be expanded for more complex interactions
}

/**
 * Get the next available instance index for an instanced mesh
 */
function getNextInstanceIndex(instancedId) {
    const instancedMesh = instancedMeshes[instancedId];
    if (!instancedMesh) return -1;

    const currentCount = instancedMesh.userData.instanceCount || 0;
    if (currentCount >= RENDERING.MAX_INSTANCES) {
        debugWarn(`Maximum instances reached for ${instancedId}`);
        return -1;
    }

    instancedMesh.userData.instanceCount = currentCount + 1;
    return currentCount;
}

/**
 * Update item fade-in effects
 */
export function updateItemFadeIn() {
    for (const item of itemsToCollect) {
        if (item.userData.isFadingIn) {
            const elapsed = Date.now() - item.userData.fadeStartTime;
            const progress = Math.min(elapsed / ITEM_FADE_DURATION, 1);
            const opacity = progress;

            if (item.userData.isInstanced) {
                // Handle instanced mesh fade-in
                const instancedMesh = instancedMeshes[item.userData.instancedId];
                if (instancedMesh && item.userData.instanceIndex !== -1) {
                    // Update material opacity (affects all instances)
                    instancedMesh.material.opacity = Math.max(instancedMesh.material.opacity, opacity);
                }
            } else {
                // Handle regular mesh fade-in
                item.traverse(child => {
                    if (child.material) {
                        child.material.opacity = opacity;
                    }
                });
            }

            if (progress >= 1) {
                item.userData.isFadingIn = false;
            }
        }
    }
}

/**
 * Generate items dynamically based on katamari position
 */
export function generateItemsAroundKatamari(katamariPosition, currentTheme) {
    if (katamariPosition.distanceTo(lastGenerationPosition) > GENERATION_DISTANCE_THRESHOLD) {
        debugInfo("Generating new items due to travel distance.");
        createCollectibleItems(15, currentTheme.items, katamariPosition, 100); // Reduced from 50 to 15 items, smaller radius
        lastGenerationPosition.copy(katamariPosition);
    }
}

/**
 * Clean up items that are too far from the katamari with proper resource disposal
 */
export function cleanupOldItems(katamariPosition) {
    const scene = getScene();
    let cleanedUpCount = 0;

    for (let i = itemsToCollect.length - 1; i >= 0; i--) {
        const itemThreeMesh = itemsToCollect[i];

        if (katamariPosition.distanceTo(itemThreeMesh.position) > CLEANUP_DISTANCE_THRESHOLD) {
            // Remove physics body using the improved cleanup function
            const itemCannonBody = itemThreeMesh.userData.cannonBody;
            if (itemCannonBody) {
                removePhysicsBody(itemCannonBody);
            }

            // Handle visual cleanup with proper resource disposal
            if (itemThreeMesh.userData.isInstanced) {
                // Use the improved instanced mesh disposal function
                disposeInstancedMeshInstance(itemThreeMesh.userData.instancedId, itemThreeMesh.userData.instanceIndex);
            } else {
                // Dispose of regular mesh resources
                disposeItemMesh(itemThreeMesh);
                scene.remove(itemThreeMesh);
            }

            // Clear item references to prevent memory leaks
            if (itemThreeMesh.userData) {
                itemThreeMesh.userData.cannonBody = null;
                itemThreeMesh.userData.threeMesh = null;
            }

            itemsToCollect.splice(i, 1);
            cleanedUpCount++;
        }
    }

    if (cleanedUpCount > 0) {
        debugInfo(`Cleaned up ${cleanedUpCount} old items with proper resource disposal`);

        // Validate physics world integrity after cleanup
        validateAndFixPhysicsWorld();
    }
}

/**
 * Dispose of a regular item mesh and its resources to prevent memory leaks
 * @param {THREE.Object3D} itemMesh - The item mesh to dispose
 */
function disposeItemMesh(itemMesh) {
    if (!itemMesh) return;

    // Recursively dispose of all child meshes and their resources
    itemMesh.traverse((child) => {
        if (child.geometry) {
            child.geometry.dispose();
        }

        if (child.material) {
            // Handle both single materials and material arrays
            if (Array.isArray(child.material)) {
                child.material.forEach(material => {
                    if (material.map) material.map.dispose();
                    if (material.normalMap) material.normalMap.dispose();
                    if (material.roughnessMap) material.roughnessMap.dispose();
                    if (material.metalnessMap) material.metalnessMap.dispose();
                    material.dispose();
                });
            } else {
                if (child.material.map) child.material.map.dispose();
                if (child.material.normalMap) child.material.normalMap.dispose();
                if (child.material.roughnessMap) child.material.roughnessMap.dispose();
                if (child.material.metalnessMap) child.material.metalnessMap.dispose();
                child.material.dispose();
            }
        }
    });

    debugLog(`Disposed item mesh resources: ${itemMesh.userData?.name || 'unnamed'}`);
}

/**
 * Properly dispose of instanced mesh instances when items are removed
 * @param {string} instancedId - The instanced mesh ID
 * @param {number} instanceIndex - The instance index to remove
 */
function disposeInstancedMeshInstance(instancedId, instanceIndex) {
    const instancedMesh = instancedMeshes[instancedId];
    if (!instancedMesh || instanceIndex === -1) return;

    // Hide the instance by setting scale to zero
    const dummy = new THREE.Object3D();
    dummy.scale.set(0, 0, 0);
    dummy.updateMatrix();
    instancedMesh.setMatrixAt(instanceIndex, dummy.matrix);
    instancedMesh.instanceMatrix.needsUpdate = true;

    // Clear instance color if available
    if (instancedMesh.instanceColor) {
        instancedMesh.instanceColor.setXYZ(instanceIndex, 0, 0, 0);
        instancedMesh.instanceColor.needsUpdate = true;
    }

    // Decrement instance count for reuse
    if (instancedMesh.userData.instanceCount > 0) {
        instancedMesh.userData.instanceCount--;
    }

    debugLog(`Disposed instanced mesh instance: ${instancedId}[${instanceIndex}]`);
}

/**
 * Update instance matrix for hidden/removed items correctly
 * @param {string} instancedId - The instanced mesh ID
 * @param {number} instanceIndex - The instance index to update
 * @param {THREE.Vector3} position - New position (or null to hide)
 * @param {THREE.Quaternion} quaternion - New rotation (or null to hide)
 * @param {number} scale - New scale (or 0 to hide)
 */
function updateInstancedMeshMatrix(instancedId, instanceIndex, position = null, quaternion = null, scale = 0) {
    const instancedMesh = instancedMeshes[instancedId];
    if (!instancedMesh || instanceIndex === -1) return;

    const dummy = new THREE.Object3D();

    if (position && quaternion && scale > 0) {
        // Show/update the instance
        dummy.position.copy(position);
        dummy.quaternion.copy(quaternion);
        dummy.scale.setScalar(scale);
    } else {
        // Hide the instance
        dummy.scale.set(0, 0, 0);
    }

    dummy.updateMatrix();
    instancedMesh.setMatrixAt(instanceIndex, dummy.matrix);
    instancedMesh.instanceMatrix.needsUpdate = true;

    debugLog(`Updated instanced mesh matrix: ${instancedId}[${instanceIndex}] scale=${scale}`);
}

/**
 * Add proper cleanup of instanced mesh resources on level restart
 */
export function resetInstancedMeshes() {
    debugInfo("Resetting instanced meshes for level restart...");

    for (const key in instancedMeshes) {
        const instancedMesh = instancedMeshes[key];
        if (instancedMesh) {
            // Reset all instances to hidden state
            const dummy = new THREE.Object3D();
            dummy.scale.set(0, 0, 0);
            dummy.updateMatrix();

            for (let i = 0; i < RENDERING.MAX_INSTANCES; i++) {
                instancedMesh.setMatrixAt(i, dummy.matrix);
            }

            instancedMesh.instanceMatrix.needsUpdate = true;

            // Reset instance color if available
            if (instancedMesh.instanceColor) {
                for (let i = 0; i < RENDERING.MAX_INSTANCES; i++) {
                    instancedMesh.instanceColor.setXYZ(i, 0, 0, 0);
                }
                instancedMesh.instanceColor.needsUpdate = true;
            }

            // Reset instance count
            instancedMesh.userData.instanceCount = 0;

            debugLog(`Reset instanced mesh: ${key}`);
        }
    }

    debugInfo("Instanced meshes reset for level restart");
}

/**
 * Clear all instanced meshes with proper resource disposal
 */
function clearInstancedMeshes() {
    const scene = getScene();

    debugInfo("Clearing instanced meshes with proper resource disposal...");

    // Dispose of instanced meshes
    for (const key in instancedMeshes) {
        if (instancedMeshes[key]) {
            const instancedMesh = instancedMeshes[key];

            // Remove from scene
            scene.remove(instancedMesh);

            // Dispose of geometry
            if (instancedMesh.geometry) {
                instancedMesh.geometry.dispose();
            }

            // Dispose of material and its textures
            if (instancedMesh.material) {
                if (instancedMesh.material.map) instancedMesh.material.map.dispose();
                if (instancedMesh.material.normalMap) instancedMesh.material.normalMap.dispose();
                if (instancedMesh.material.roughnessMap) instancedMesh.material.roughnessMap.dispose();
                if (instancedMesh.material.metalnessMap) instancedMesh.material.metalnessMap.dispose();
                instancedMesh.material.dispose();
            }

            // Clear the reference
            instancedMeshes[key] = null;
            delete instancedMeshes[key];

            debugLog(`Disposed instanced mesh: ${key}`);
        }
    }

    // Dispose of geometries
    for (const key in instancedGeometries) {
        if (instancedGeometries[key]) {
            instancedGeometries[key].dispose();
            instancedGeometries[key] = null;
            delete instancedGeometries[key];
            debugLog(`Disposed instanced geometry: ${key}`);
        }
    }

    // Dispose of materials
    for (const key in instancedMaterials) {
        if (instancedMaterials[key]) {
            const material = instancedMaterials[key];

            // Dispose of material textures
            if (material.map) material.map.dispose();
            if (material.normalMap) material.normalMap.dispose();
            if (material.roughnessMap) material.roughnessMap.dispose();
            if (material.metalnessMap) material.metalnessMap.dispose();

            // Dispose of material
            material.dispose();
            instancedMaterials[key] = null;
            delete instancedMaterials[key];

            debugLog(`Disposed instanced material: ${key}`);
        }
    }

    debugInfo("All instanced meshes cleared with proper resource disposal");
}

/**
 * Get all collectible items
 */
export function getItemsToCollect() {
    return itemsToCollect;
}

/**
 * Get instanced mesh by ID
 * @param {string} instancedId - The instanced mesh ID
 * @returns {THREE.InstancedMesh|null} The instanced mesh or null if not found
 */
export function getInstancedMeshById(instancedId) {
    return instancedMeshes[instancedId] || null;
}

/**
 * Remove item from collection
 */
export function removeItemFromCollection(item) {
    const index = itemsToCollect.indexOf(item);
    if (index !== -1) {
        itemsToCollect.splice(index, 1);
    }
}

/**
 * Reset the last generation position
 */
export function resetLastGenerationPosition(position) {
    lastGenerationPosition.copy(position);
}

/**
 * Remove all item physics bodies with proper cleanup
 * This function ensures all item physics bodies are properly disposed of to prevent memory leaks
 */
export function removeAllItemPhysicsBodies() {
    debugInfo("Removing all item physics bodies with proper cleanup...");

    // Use the improved physics cleanup function to remove all collectible item bodies
    removePhysicsBodiesByCondition(body => {
        return body.userData && body.userData.isCollectible;
    });

    debugInfo("All item physics bodies removed with proper cleanup");
}

/**
 * Clean up collected items and their resources
 * @param {Array} collectedItems - Array of items that have been collected
 */
export function cleanupCollectedItems(collectedItems) {
    if (!collectedItems || collectedItems.length === 0) return;

    debugInfo(`Cleaning up ${collectedItems.length} collected items...`);

    const scene = getScene();
    let cleanedUpCount = 0;

    for (const item of collectedItems) {
        // Remove physics body using improved cleanup
        if (item.userData.cannonBody) {
            removePhysicsBody(item.userData.cannonBody);
        }

        // Handle visual cleanup
        if (item.userData.isInstanced) {
            // Use the improved instanced mesh disposal function
            disposeInstancedMeshInstance(item.userData.instancedId, item.userData.instanceIndex);
        } else {
            // Dispose of regular mesh resources
            disposeItemMesh(item);
            scene.remove(item);
        }

        // Clear item references to prevent memory leaks
        if (item.userData) {
            item.userData.cannonBody = null;
            item.userData.threeMesh = null;
        }

        // Remove from items array
        removeItemFromCollection(item);
        cleanedUpCount++;
    }

    debugInfo(`Cleaned up ${cleanedUpCount} collected items with proper resource disposal`);

    // Validate physics world integrity after cleanup
    validateAndFixPhysicsWorld();
}

/**
 * Clean up all items and resources with comprehensive resource disposal
 */
export function cleanupItemsSystem() {
    debugInfo("Starting comprehensive items system cleanup...");

    const scene = getScene();

    // Remove all item physics bodies using the improved cleanup function
    removeAllItemPhysicsBodies();

    // Clean up visual resources for all items
    itemsToCollect.forEach(item => {
        if (!item.userData.isInstanced) {
            // Dispose of regular mesh resources
            disposeItemMesh(item);
            scene.remove(item);
        }

        // Clear item references to prevent memory leaks
        if (item.userData) {
            item.userData.cannonBody = null;
            item.userData.threeMesh = null;
        }
    });

    // Clean up power-up items
    powerUpItems.forEach(item => {
        disposeItemMesh(item);
        scene.remove(item);
    });

    // Clear arrays
    itemsToCollect.length = 0;
    powerUpItems.length = 0;

    // Clear instanced meshes with proper resource disposal
    clearInstancedMeshes();

    // Reset generation position
    lastGenerationPosition.set(0, 0, 0);

    // Final validation of physics world integrity
    const validationResults = validateAndFixPhysicsWorld();

    debugInfo(`Comprehensive items system cleanup completed. Validation results: ${JSON.stringify(validationResults)}`);
}