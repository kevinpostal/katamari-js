/**
 * Items system for collectible objects in the Katamari game
 * Handles procedural generation, instanced rendering, and item management
 */

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { debugLog, debugWarn, debugError, debugInfo } from '../utils/debug.js';
import { INSTANCED_ITEM_MAP, RENDERING } from '../utils/constants.js';
import { getScene, getInstancedMesh, updateInstancedMesh, getCamera } from '../core/scene.js';
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
 * Calculate a position that's outside the camera's field of view
 * @param {THREE.Vector3} centerPosition - The katamari's position
 * @param {number} spawnRadius - The radius around the center to spawn items
 * @returns {THREE.Vector3} A position that's off-camera
 */
function getOffCameraPosition(centerPosition, spawnRadius, minDistance = 0) {
    const camera = getCamera();
    if (!camera) {
        // Fallback to random position if camera not available
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * spawnRadius;
        return new THREE.Vector3(
            centerPosition.x + Math.cos(angle) * distance,
            centerPosition.y,
            centerPosition.z + Math.sin(angle) * distance
        );
    }

    // Calculate camera direction and field of view
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);

    // Get camera's horizontal field of view in radians
    const fovRadians = THREE.MathUtils.degToRad(camera.fov);
    const aspect = camera.aspect;
    const horizontalFov = 2 * Math.atan(Math.tan(fovRadians / 2) * aspect);

    // Calculate the camera's viewing angle relative to the katamari
    const cameraToKatamari = new THREE.Vector3().subVectors(centerPosition, camera.position);
    cameraToKatamari.y = 0; // Project to horizontal plane
    cameraToKatamari.normalize();

    // Get the camera's forward direction projected to horizontal plane
    const cameraForward = new THREE.Vector3(cameraDirection.x, 0, cameraDirection.z).normalize();

    // Calculate the angle of the camera's view direction
    const cameraAngle = Math.atan2(cameraForward.z, cameraForward.x);

    // Define the visible arc (camera's field of view plus some buffer)
    const visibleArcBuffer = Math.PI / 6; // 30 degrees buffer
    const visibleArcStart = cameraAngle - horizontalFov / 2 - visibleArcBuffer;
    const visibleArcEnd = cameraAngle + horizontalFov / 2 + visibleArcBuffer;

    // Generate a random angle that's outside the visible arc
    let spawnAngle;
    const invisibleArcSize = (2 * Math.PI) - (visibleArcEnd - visibleArcStart);

    if (invisibleArcSize > 0) {
        // Pick a random point in the invisible arc
        const randomInInvisibleArc = Math.random() * invisibleArcSize;
        spawnAngle = visibleArcEnd + randomInInvisibleArc;

        // Normalize angle to [-π, π] range
        while (spawnAngle > Math.PI) spawnAngle -= 2 * Math.PI;
        while (spawnAngle < -Math.PI) spawnAngle += 2 * Math.PI;
    } else {
        // Fallback: spawn behind the camera
        spawnAngle = cameraAngle + Math.PI + (Math.random() - 0.5) * Math.PI / 2;
    }

    // Calculate distance with some variation, respecting minimum distance
    const effectiveMinDistance = Math.max(minDistance, spawnRadius * 0.5);
    const maxDistance = spawnRadius;
    const distance = effectiveMinDistance + Math.random() * (maxDistance - effectiveMinDistance);

    // Calculate final position
    const x = centerPosition.x + Math.cos(spawnAngle) * distance;
    const z = centerPosition.z + Math.sin(spawnAngle) * distance;

    return new THREE.Vector3(x, centerPosition.y, z);
}

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
export function createCollectibleItems(count, itemNames, centerPosition = new THREE.Vector3(0, 0, 0), spawnRadius = 100, allowOnCamera = false, minDistance = 0) {
    debugInfo(`createCollectibleItems: Attempting to create ${count} items from ${itemNames.length} types: [${itemNames.join(', ')}]`);
    if (!itemNames || itemNames.length === 0) {
        debugWarn("createCollectibleItems: itemNames array is empty or undefined. Cannot create items.");
        return;
    }

    const scene = getScene();
    const world = getPhysicsWorld();

    // Initialize instanced meshes if they don't exist
    initializeInstancedMeshes(itemNames);

    const dummy = new THREE.Object3D(); // For setting instance matrix

    // Track item type distribution for debugging
    const itemTypeCount = {};

    for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * itemNames.length);
        const itemName = itemNames[randomIndex];

        // Track item distribution
        itemTypeCount[itemName] = (itemTypeCount[itemName] || 0) + 1;

        debugInfo(`Attempting to create item ${i + 1}/${count}: ${itemName} (index ${randomIndex}/${itemNames.length - 1})`);

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

            // Ensure regular items have size in userData
            threeMesh.userData.size = size;
            threeMesh.userData.isCollectible = true;

            debugInfo(`Created regular item: ${itemName}, size: ${size.toFixed(2)}`);
        }

        // Position the item with proper ground clearance
        let x, z;
        if (allowOnCamera) {
            // Allow items to spawn anywhere around the center (including on-camera)
            const angle = Math.random() * Math.PI * 2;
            // Ensure distance is at least minDistance away from center
            const distance = minDistance + Math.random() * (spawnRadius - minDistance);
            x = centerPosition.x + Math.cos(angle) * distance;
            z = centerPosition.z + Math.sin(angle) * distance;
        } else {
            // Position items off-camera only
            const offCameraPosition = getOffCameraPosition(centerPosition, spawnRadius, minDistance);
            x = offCameraPosition.x;
            z = offCameraPosition.z;
        }

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

            // CRITICAL: Ensure size is set on threeMesh userData (final safety check)
            if (!threeMesh.userData.size || threeMesh.userData.size <= 0) {
                threeMesh.userData.size = size;
                debugWarn(`CRITICAL FIX: Set missing size for ${itemName}: ${size.toFixed(2)}`);
            }

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

            debugInfo(`Successfully created and added physics body for ${itemName} (size: ${size.toFixed(2)}) at position (${itemBody.position.x.toFixed(2)}, ${itemBody.position.y.toFixed(2)}, ${itemBody.position.z.toFixed(2)})`);

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

        // Ensure size is set for all items (safety check)
        if (!threeMesh.userData.size || threeMesh.userData.size <= 0) {
            threeMesh.userData.size = size;
            debugWarn(`Fixed missing size for item ${itemName}: ${size.toFixed(2)}`);
        }

        // Mark as collectible for collision detection
        threeMesh.userData.isCollectible = true;

        itemsToCollect.push(threeMesh);
    }

    debugInfo(`Created ${count} collectible items around position (${centerPosition.x.toFixed(1)}, ${centerPosition.z.toFixed(1)})`);
    debugInfo(`Item distribution:`, itemTypeCount);
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

    // Ensure size is always a valid number
    let finalSize = size;
    if (baseGeometry.parameters) {
        const geometrySize = baseGeometry.parameters.radius || baseGeometry.parameters.height || baseGeometry.parameters.width || 1;
        finalSize = size * geometrySize;
    }

    // Ensure size is never zero or negative
    threeMesh.userData.size = Math.max(0.1, finalSize);
    threeMesh.userData.cannonShape = cannonShape;
    threeMesh.userData.color = color;

    return { threeMesh, cannonShape, size };
}

/**
 * Create a regular (non-instanced) item with complex geometry
 */
function createRegularItem(itemName, color) {
    let threeMesh = null;
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
        case 'Bench':
            const benchResult = createBenchItem(color);
            threeMesh = benchResult.mesh;
            cannonShape = benchResult.shape;
            size = benchResult.size;
            break;
        case 'Lamp Post':
            const lampResult = createLampPostItem(color);
            threeMesh = lampResult.mesh;
            cannonShape = lampResult.shape;
            size = lampResult.size;
            break;
        case 'Trash Can':
            const trashResult = createTrashCanItem(color);
            threeMesh = trashResult.mesh;
            cannonShape = trashResult.shape;
            size = trashResult.size;
            break;
        case 'Mailbox':
            const mailboxResult = createMailboxItem(color);
            threeMesh = mailboxResult.mesh;
            cannonShape = mailboxResult.shape;
            size = mailboxResult.size;
            break;
        case 'Picnic Table':
            const picnicResult = createPicnicTableItem(color);
            threeMesh = picnicResult.mesh;
            cannonShape = picnicResult.shape;
            size = picnicResult.size;
            break;
        case 'Fire Hydrant':
            const hydrantResult = createFireHydrantItem(color);
            threeMesh = hydrantResult.mesh;
            cannonShape = hydrantResult.shape;
            size = hydrantResult.size;
            break;
        case 'Hot Dog Stand':
            const hotdogResult = createHotDogStandItem(color);
            threeMesh = hotdogResult.mesh;
            cannonShape = hotdogResult.shape;
            size = hotdogResult.size;
            break;
        case 'Newspaper Stand':
            const newsResult = createNewsStandItem(color);
            threeMesh = newsResult.mesh;
            cannonShape = newsResult.shape;
            size = newsResult.size;
            break;
        case 'Bicycle':
            const bikeResult = createBicycleItem(color);
            threeMesh = bikeResult.mesh;
            cannonShape = bikeResult.shape;
            size = bikeResult.size;
            break;
        case 'Skateboard':
            const skateResult = createSkateboardItem(color);
            threeMesh = skateResult.mesh;
            cannonShape = skateResult.shape;
            size = skateResult.size;
            break;
        case 'Shopping Cart':
            const cartResult = createShoppingCartItem(color);
            threeMesh = cartResult.mesh;
            cannonShape = cartResult.shape;
            size = cartResult.size;
            break;
        case 'Satellite':
            const satelliteResult = createSatelliteItem(color);
            threeMesh = satelliteResult.mesh;
            cannonShape = satelliteResult.shape;
            size = satelliteResult.size;
            break;
        case 'Alien Artifact':
            const artifactResult = createAlienArtifactItem(color);
            threeMesh = artifactResult.mesh;
            cannonShape = artifactResult.shape;
            size = artifactResult.size;
            break;
        case 'Space Probe':
            const probeResult = createSpaceProbeItem(color);
            threeMesh = probeResult.mesh;
            cannonShape = probeResult.shape;
            size = probeResult.size;
            break;
        // Add more complex items as needed
        default:
            debugWarn(`Unknown regular item type: ${itemName}`);
            return null;
    }

    // Ensure the threeMesh has the size in userData for all regular items
    if (threeMesh) {
        // Initialize userData if it doesn't exist
        if (!threeMesh.userData) {
            threeMesh.userData = {};
        }
        threeMesh.userData.size = size;
        threeMesh.userData.isCollectible = true;

        // For Groups, ensure the root group has the size data
        if (threeMesh.isGroup) {
            threeMesh.userData.size = size;
            threeMesh.userData.isCollectible = true;
        }

        debugInfo(`Set size ${size.toFixed(2)} for regular item ${itemName} (isGroup: ${threeMesh.isGroup})`);
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
        size: size * 1.2 // Reduced from 2x to make cars more collectible
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
        size: size * 1.0 // Reduced from 1.5x to make trees more collectible
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
        size: size * 1.0 // Reduced from 1.5x to make houses more collectible
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
        createCollectibleItems(15, currentTheme.items, katamariPosition, 100, false, 5); // Off-camera spawning for dynamic generation, min 5 units away
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
                // Remove collision handler first to prevent issues
                if (itemCannonBody.userData && itemCannonBody.userData.collisionHandler) {
                    itemCannonBody.removeEventListener('collide', itemCannonBody.userData.collisionHandler);
                    itemCannonBody.userData.collisionHandler = null;
                }
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

/**
 * Create a bench item with detailed geometry
 */
function createBenchItem(color) {
    const size = Math.random() * 1.5 + 0.8;
    const itemGroup = new THREE.Group();

    // Bench seat
    const seatGeo = new THREE.BoxGeometry(size * 2, size * 0.1, size * 0.4);
    const seatMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7, transparent: true, opacity: 0 });
    const seat = new THREE.Mesh(seatGeo, seatMat);
    seat.castShadow = seat.receiveShadow = true;
    seat.position.y = size * 0.4;
    itemGroup.add(seat);

    // Bench back
    const backGeo = new THREE.BoxGeometry(size * 2, size * 0.6, size * 0.1);
    const backMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7, transparent: true, opacity: 0 });
    const back = new THREE.Mesh(backGeo, backMat);
    back.castShadow = back.receiveShadow = true;
    back.position.set(0, size * 0.7, -size * 0.15);
    itemGroup.add(back);

    // Legs
    const legGeo = new THREE.BoxGeometry(size * 0.1, size * 0.4, size * 0.1);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8, transparent: true, opacity: 0 });
    const legPositions = [[-0.8, 0.15], [0.8, 0.15], [-0.8, -0.15], [0.8, -0.15]];

    legPositions.forEach(([dx, dz]) => {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(size * dx, size * 0.2, size * dz);
        itemGroup.add(leg);
    });

    const cannonShape = new CANNON.Box(new CANNON.Vec3(size, size * 0.3, size * 0.2));

    return {
        mesh: itemGroup,
        shape: cannonShape,
        size: size * 0.8
    };
}

/**
 * Create a lamp post item with detailed geometry
 */
function createLampPostItem(color) {
    const size = Math.random() * 2 + 1.5;
    const itemGroup = new THREE.Group();

    // Post
    const postGeo = new THREE.CylinderGeometry(size * 0.05, size * 0.08, size * 3, 8);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.8, transparent: true, opacity: 0 });
    const post = new THREE.Mesh(postGeo, postMat);
    post.castShadow = post.receiveShadow = true;
    post.position.y = size * 1.5;
    itemGroup.add(post);

    // Lamp
    const lampGeo = new THREE.SphereGeometry(size * 0.2, 16, 16);
    const lampMat = new THREE.MeshStandardMaterial({ color: 0xFFFFAA, roughness: 0.3, transparent: true, opacity: 0 });
    const lamp = new THREE.Mesh(lampGeo, lampMat);
    lamp.castShadow = lamp.receiveShadow = true;
    lamp.position.y = size * 2.8;
    itemGroup.add(lamp);

    const cannonShape = new CANNON.Cylinder(size * 0.08, size * 0.2, size * 3, 8);

    return {
        mesh: itemGroup,
        shape: cannonShape,
        size: size * 1.2
    };
}

/**
 * Create a trash can item with detailed geometry
 */
function createTrashCanItem(color) {
    const size = Math.random() * 1.2 + 0.6;
    const itemGroup = new THREE.Group();

    // Main body
    const bodyGeo = new THREE.CylinderGeometry(size * 0.4, size * 0.5, size * 1.2, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.7, transparent: true, opacity: 0 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = body.receiveShadow = true;
    body.position.y = size * 0.6;
    itemGroup.add(body);

    // Lid
    const lidGeo = new THREE.CylinderGeometry(size * 0.45, size * 0.45, size * 0.1, 16);
    const lidMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7, transparent: true, opacity: 0 });
    const lid = new THREE.Mesh(lidGeo, lidMat);
    lid.castShadow = lid.receiveShadow = true;
    lid.position.y = size * 1.25;
    itemGroup.add(lid);

    const cannonShape = new CANNON.Cylinder(size * 0.5, size * 0.45, size * 1.3, 16);

    return {
        mesh: itemGroup,
        shape: cannonShape,
        size: size * 0.9
    };
}

/**
 * Create a mailbox item with detailed geometry
 */
function createMailboxItem(color) {
    const size = Math.random() * 1.0 + 0.5;
    const itemGroup = new THREE.Group();

    // Post
    const postGeo = new THREE.CylinderGeometry(size * 0.03, size * 0.03, size * 1.2, 8);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8, transparent: true, opacity: 0 });
    const post = new THREE.Mesh(postGeo, postMat);
    post.castShadow = post.receiveShadow = true;
    post.position.y = size * 0.6;
    itemGroup.add(post);

    // Mailbox body
    const boxGeo = new THREE.BoxGeometry(size * 0.6, size * 0.3, size * 0.4);
    const boxMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, transparent: true, opacity: 0 });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.castShadow = box.receiveShadow = true;
    box.position.y = size * 1.0;
    itemGroup.add(box);

    const cannonShape = new CANNON.Box(new CANNON.Vec3(size * 0.3, size * 0.6, size * 0.2));

    return {
        mesh: itemGroup,
        shape: cannonShape,
        size: size * 0.7
    };
}

/**
 * Create a picnic table item with detailed geometry
 */
function createPicnicTableItem(color) {
    const size = Math.random() * 1.5 + 1.0;
    const itemGroup = new THREE.Group();

    // Table top
    const topGeo = new THREE.BoxGeometry(size * 2, size * 0.1, size * 1);
    const topMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8, transparent: true, opacity: 0 });
    const top = new THREE.Mesh(topGeo, topMat);
    top.castShadow = top.receiveShadow = true;
    top.position.y = size * 0.7;
    itemGroup.add(top);

    // Benches
    const benchGeo = new THREE.BoxGeometry(size * 1.8, size * 0.08, size * 0.3);
    const benchMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8, transparent: true, opacity: 0 });

    const bench1 = new THREE.Mesh(benchGeo, benchMat);
    bench1.position.set(0, size * 0.4, size * 0.65);
    itemGroup.add(bench1);

    const bench2 = new THREE.Mesh(benchGeo, benchMat);
    bench2.position.set(0, size * 0.4, -size * 0.65);
    itemGroup.add(bench2);

    // Legs
    const legGeo = new THREE.BoxGeometry(size * 0.1, size * 0.7, size * 0.1);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.8, transparent: true, opacity: 0 });
    const legPositions = [[-0.8, 0.4], [0.8, 0.4], [-0.8, -0.4], [0.8, -0.4]];

    legPositions.forEach(([dx, dz]) => {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(size * dx, size * 0.35, size * dz);
        itemGroup.add(leg);
    });

    const cannonShape = new CANNON.Box(new CANNON.Vec3(size, size * 0.4, size * 0.5));

    return {
        mesh: itemGroup,
        shape: cannonShape,
        size: size * 1.2
    };
}

/**
 * Create a fire hydrant item with detailed geometry
 */
function createFireHydrantItem(color) {
    const size = Math.random() * 1.0 + 0.6;
    const itemGroup = new THREE.Group();

    // Main body
    const bodyGeo = new THREE.CylinderGeometry(size * 0.3, size * 0.35, size * 1.0, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xFF0000, roughness: 0.6, transparent: true, opacity: 0 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = body.receiveShadow = true;
    body.position.y = size * 0.5;
    itemGroup.add(body);

    // Top cap
    const capGeo = new THREE.CylinderGeometry(size * 0.25, size * 0.3, size * 0.2, 8);
    const capMat = new THREE.MeshStandardMaterial({ color: 0xCC0000, roughness: 0.6, transparent: true, opacity: 0 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.castShadow = cap.receiveShadow = true;
    cap.position.y = size * 1.1;
    itemGroup.add(cap);

    // Side outlets
    const outletGeo = new THREE.CylinderGeometry(size * 0.08, size * 0.08, size * 0.2, 8);
    const outletMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.7, transparent: true, opacity: 0 });

    const outlet1 = new THREE.Mesh(outletGeo, outletMat);
    outlet1.rotation.z = Math.PI / 2;
    outlet1.position.set(size * 0.4, size * 0.7, 0);
    itemGroup.add(outlet1);

    const outlet2 = new THREE.Mesh(outletGeo, outletMat);
    outlet2.rotation.z = -Math.PI / 2;
    outlet2.position.set(-size * 0.4, size * 0.7, 0);
    itemGroup.add(outlet2);

    const cannonShape = new CANNON.Cylinder(size * 0.35, size * 0.25, size * 1.2, 8);

    return {
        mesh: itemGroup,
        shape: cannonShape,
        size: size * 0.8
    };
}

/**
 * Create a hot dog stand item with detailed geometry
 */
function createHotDogStandItem(color) {
    const size = Math.random() * 1.5 + 1.0;
    const itemGroup = new THREE.Group();

    // Cart base
    const baseGeo = new THREE.BoxGeometry(size * 1.5, size * 0.8, size * 1.0);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.6, transparent: true, opacity: 0 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.castShadow = base.receiveShadow = true;
    base.position.y = size * 0.4;
    itemGroup.add(base);

    // Umbrella
    const umbrellaGeo = new THREE.ConeGeometry(size * 1.2, size * 0.3, 16);
    const umbrellaMat = new THREE.MeshStandardMaterial({ color: 0xFF6347, roughness: 0.5, transparent: true, opacity: 0 });
    const umbrella = new THREE.Mesh(umbrellaGeo, umbrellaMat);
    umbrella.castShadow = umbrella.receiveShadow = true;
    umbrella.position.y = size * 1.5;
    itemGroup.add(umbrella);

    // Pole
    const poleGeo = new THREE.CylinderGeometry(size * 0.02, size * 0.02, size * 1.0, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8, transparent: true, opacity: 0 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = size * 1.0;
    itemGroup.add(pole);

    const cannonShape = new CANNON.Box(new CANNON.Vec3(size * 0.75, size * 0.4, size * 0.5));

    return {
        mesh: itemGroup,
        shape: cannonShape,
        size: size * 1.0
    };
}

/**
 * Create a newspaper stand item with detailed geometry
 */
function createNewsStandItem(color) {
    const size = Math.random() * 1.0 + 0.8;
    const itemGroup = new THREE.Group();

    // Main box
    const boxGeo = new THREE.BoxGeometry(size * 0.8, size * 1.2, size * 0.4);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x4169E1, roughness: 0.6, transparent: true, opacity: 0 });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.castShadow = box.receiveShadow = true;
    box.position.y = size * 0.6;
    itemGroup.add(box);

    // Glass front
    const glassGeo = new THREE.BoxGeometry(size * 0.82, size * 0.8, size * 0.02);
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x87CEEB, roughness: 0.1, transparent: true, opacity: 0.3 });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, size * 0.8, size * 0.21);
    itemGroup.add(glass);

    const cannonShape = new CANNON.Box(new CANNON.Vec3(size * 0.4, size * 0.6, size * 0.2));

    return {
        mesh: itemGroup,
        shape: cannonShape,
        size: size * 0.7
    };
}

/**
 * Create a bicycle item with detailed geometry
 */
function createBicycleItem(color) {
    const size = Math.random() * 1.2 + 0.8;
    const itemGroup = new THREE.Group();

    // Frame
    const frameGeo = new THREE.BoxGeometry(size * 1.5, size * 0.05, size * 0.05);
    const frameMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, transparent: true, opacity: 0 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.castShadow = frame.receiveShadow = true;
    frame.position.y = size * 0.5;
    itemGroup.add(frame);

    // Wheels
    const wheelGeo = new THREE.TorusGeometry(size * 0.3, size * 0.05, 8, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8, transparent: true, opacity: 0 });

    const frontWheel = new THREE.Mesh(wheelGeo, wheelMat);
    frontWheel.rotation.y = Math.PI / 2;
    frontWheel.position.set(size * 0.6, size * 0.3, 0);
    itemGroup.add(frontWheel);

    const backWheel = new THREE.Mesh(wheelGeo, wheelMat);
    backWheel.rotation.y = Math.PI / 2;
    backWheel.position.set(-size * 0.6, size * 0.3, 0);
    itemGroup.add(backWheel);

    // Handlebars
    const handleGeo = new THREE.CylinderGeometry(size * 0.02, size * 0.02, size * 0.4, 8);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.7, transparent: true, opacity: 0 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(size * 0.6, size * 0.8, 0);
    itemGroup.add(handle);

    const cannonShape = new CANNON.Box(new CANNON.Vec3(size * 0.75, size * 0.3, size * 0.15));

    return {
        mesh: itemGroup,
        shape: cannonShape,
        size: size * 0.9
    };
}

/**
 * Create a skateboard item with detailed geometry
 */
function createSkateboardItem(color) {
    const size = Math.random() * 0.8 + 0.4;
    const itemGroup = new THREE.Group();

    // Deck
    const deckGeo = new THREE.BoxGeometry(size * 2, size * 0.05, size * 0.3);
    const deckMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7, transparent: true, opacity: 0 });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.castShadow = deck.receiveShadow = true;
    deck.position.y = size * 0.1;
    itemGroup.add(deck);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(size * 0.08, size * 0.08, size * 0.05, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8, transparent: true, opacity: 0 });
    const wheelPositions = [[-0.7, 0.1], [0.7, 0.1], [-0.7, -0.1], [0.7, -0.1]];

    wheelPositions.forEach(([dx, dz]) => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(size * dx, size * 0.05, size * dz);
        itemGroup.add(wheel);
    });

    const cannonShape = new CANNON.Box(new CANNON.Vec3(size, size * 0.05, size * 0.15));

    return {
        mesh: itemGroup,
        shape: cannonShape,
        size: size * 0.6
    };
}

/**
 * Create a shopping cart item with detailed geometry
 */
function createShoppingCartItem(color) {
    const size = Math.random() * 1.2 + 0.8;
    const itemGroup = new THREE.Group();

    // Basket
    const basketGeo = new THREE.BoxGeometry(size * 1.0, size * 0.6, size * 0.8);
    const basketMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.7, transparent: true, opacity: 0 });
    const basket = new THREE.Mesh(basketGeo, basketMat);
    basket.castShadow = basket.receiveShadow = true;
    basket.position.y = size * 0.5;
    itemGroup.add(basket);

    // Handle
    const handleGeo = new THREE.CylinderGeometry(size * 0.02, size * 0.02, size * 1.0, 8);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.8, transparent: true, opacity: 0 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(-size * 0.7, size * 0.9, 0);
    itemGroup.add(handle);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(size * 0.08, size * 0.08, size * 0.05, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8, transparent: true, opacity: 0 });
    const wheelPositions = [[-0.4, 0.35], [0.4, 0.35], [-0.4, -0.35], [0.4, -0.35]];

    wheelPositions.forEach(([dx, dz]) => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(size * dx, size * 0.08, size * dz);
        itemGroup.add(wheel);
    });

    const cannonShape = new CANNON.Box(new CANNON.Vec3(size * 0.5, size * 0.3, size * 0.4));

    return {
        mesh: itemGroup,
        shape: cannonShape,
        size: size * 0.8
    };
}

/**
 * Create a satellite item with detailed geometry
 */
function createSatelliteItem(color) {
    const size = Math.random() * 2 + 1.5;
    const itemGroup = new THREE.Group();

    // Main body
    const bodyGeo = new THREE.BoxGeometry(size * 1.0, size * 0.8, size * 1.2);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, roughness: 0.3, transparent: true, opacity: 0 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = body.receiveShadow = true;
    itemGroup.add(body);

    // Solar panels
    const panelGeo = new THREE.BoxGeometry(size * 2.5, size * 0.05, size * 1.5);
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x000080, roughness: 0.2, transparent: true, opacity: 0 });

    const panel1 = new THREE.Mesh(panelGeo, panelMat);
    panel1.position.set(size * 1.75, 0, 0);
    itemGroup.add(panel1);

    const panel2 = new THREE.Mesh(panelGeo, panelMat);
    panel2.position.set(-size * 1.75, 0, 0);
    itemGroup.add(panel2);

    // Antenna
    const antennaGeo = new THREE.CylinderGeometry(size * 0.02, size * 0.02, size * 1.5, 8);
    const antennaMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.7, transparent: true, opacity: 0 });
    const antenna = new THREE.Mesh(antennaGeo, antennaMat);
    antenna.position.y = size * 1.15;
    itemGroup.add(antenna);

    const cannonShape = new CANNON.Box(new CANNON.Vec3(size * 1.25, size * 0.4, size * 0.6));

    return {
        mesh: itemGroup,
        shape: cannonShape,
        size: size * 1.5
    };
}

/**
 * Create an alien artifact item with detailed geometry
 */
function createAlienArtifactItem(color) {
    const size = Math.random() * 1.5 + 1.0;
    const itemGroup = new THREE.Group();

    // Main crystal
    const crystalGeo = new THREE.OctahedronGeometry(size * 0.8);
    const crystalMat = new THREE.MeshStandardMaterial({
        color: 0x00FF00,
        roughness: 0.1,
        transparent: true,
        opacity: 0.8,
        emissive: 0x002200
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.castShadow = crystal.receiveShadow = true;
    crystal.position.y = size * 0.4;
    itemGroup.add(crystal);

    // Base
    const baseGeo = new THREE.CylinderGeometry(size * 0.6, size * 0.8, size * 0.3, 8);
    const baseMat = new THREE.MeshStandardMaterial({
        color: 0x444444,
        roughness: 0.3,
        transparent: true,
        opacity: 0,
        metalness: 0.8
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.castShadow = base.receiveShadow = true;
    base.position.y = size * 0.15;
    itemGroup.add(base);

    const cannonShape = new CANNON.Sphere(size * 0.8);

    return {
        mesh: itemGroup,
        shape: cannonShape,
        size: size * 1.0
    };
}

/**
 * Create a space probe item with detailed geometry
 */
function createSpaceProbeItem(color) {
    const size = Math.random() * 2 + 1.5;
    const itemGroup = new THREE.Group();

    // Main body
    const bodyGeo = new THREE.ConeGeometry(size * 0.4, size * 2.0, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.4, transparent: true, opacity: 0 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = body.receiveShadow = true;
    body.position.y = size * 1.0;
    itemGroup.add(body);

    // Dish antenna
    const dishGeo = new THREE.ConeGeometry(size * 0.6, size * 0.2, 16);
    const dishMat = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, roughness: 0.3, transparent: true, opacity: 0 });
    const dish = new THREE.Mesh(dishGeo, dishMat);
    dish.rotation.x = Math.PI;
    dish.position.y = size * 2.2;
    itemGroup.add(dish);

    // Thruster
    const thrusterGeo = new THREE.CylinderGeometry(size * 0.15, size * 0.2, size * 0.5, 8);
    const thrusterMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.6, transparent: true, opacity: 0 });
    const thruster = new THREE.Mesh(thrusterGeo, thrusterMat);
    thruster.position.y = -size * 0.25;
    itemGroup.add(thruster);

    const cannonShape = new CANNON.Cylinder(size * 0.4, size * 0.15, size * 2.5, 8);

    return {
        mesh: itemGroup,
        shape: cannonShape,
        size: size * 1.3
    };
}