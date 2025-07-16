/**
 * Physics system module for the Katamari game
 * Handles Cannon-ES physics world setup, body management, and fixed timestep simulation
 */

import * as CANNON from 'cannon-es';
import { debugLog, debugWarn, debugError, debugInfo } from '../utils/debug.js';
import { recordPhysicsStepTime } from '../utils/performance.js';
import { PHYSICS } from '../utils/constants.js';

// Physics world and state
let world = null;
let physicsBodies = [];
let physicsTimeAccumulator = 0;

// Performance monitoring
let physicsPerformanceStats = {
    lastStepTime: 0,
    averageStepTime: 0,
    maxStepTime: 0,
    stepCount: 0,
    activeBodiesCount: 0,
    sleepingBodiesCount: 0,
    lastStatsUpdate: 0
};

// Physics debugging state
let physicsDebugState = {
    bodyCreationCount: 0,
    bodyRemovalCount: 0,
    lastValidationTime: 0,
    validationInterval: 30000, // Validate every 30 seconds (reduced frequency)
    bodyCreationLog: [],
    bodyRemovalLog: [],
    maxLogEntries: 100,
    worldIntegrityIssues: 0,
    lastIntegrityCheck: 0
};

/**
 * Initialize the physics world with proper configuration
 * @returns {CANNON.World} The initialized physics world
 */
export function initializePhysicsWorld() {
    debugInfo("Initializing physics world...");
    
    // Create physics world
    world = new CANNON.World();
    world.gravity.set(0, PHYSICS.GRAVITY, 0);
    
    // Use optimized broadphase for better performance
    world.broadphase = new CANNON.SAPBroadphase(world);
    world.broadphase.useBoundingBoxes = true;
    
    // Configure solver for better performance/quality balance
    world.solver = new CANNON.GSSolver();
    world.solver.iterations = PHYSICS.SOLVER_ITERATIONS;
    world.solver.tolerance = 0.1; // Slightly relaxed tolerance for better performance
    
    // Enable sleeping for performance optimization
    world.allowSleep = true;
    world.sleepSpeedLimit = 0.1; // Bodies sleep when moving slower than this
    world.sleepTimeLimit = 1; // Time before a slow body goes to sleep
    
    // Simplified contact material properties for better performance
    world.defaultContactMaterial.friction = PHYSICS.FRICTION;
    world.defaultContactMaterial.restitution = PHYSICS.RESTITUTION;
    world.defaultContactMaterial.contactEquationStiffness = PHYSICS.CONTACT_STIFFNESS;
    world.defaultContactMaterial.contactEquationRelaxation = PHYSICS.CONTACT_RELAXATION;
    
    // Optimize collision detection
    world.quatNormalizeSkip = 0;
    world.quatNormalizeFast = false;
    
    // Create ground physics body immediately after world initialization
    createGroundPhysicsBody();
    
    debugInfo("Physics world initialized with performance optimizations and ground body");
    return world;
}

/**
 * Create and add the ground physics body to the world
 * This ensures items can fall and collide with the ground properly
 */
function createGroundPhysicsBody() {
    debugInfo("Creating ground physics body...");
    
    const groundBody = new CANNON.Body({ 
        mass: 0, // Static body
        type: CANNON.Body.KINEMATIC
    });
    
    // Create plane shape for ground collision
    const groundShape = new CANNON.Plane();
    groundBody.addShape(groundShape);
    
    // Position and orient the ground plane (horizontal)
    groundBody.position.set(0, 0, 0);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    
    // Set ground material properties
    groundBody.material = new CANNON.Material('ground', {
        friction: PHYSICS.FRICTION,
        restitution: PHYSICS.RESTITUTION * 0.5 // Less bouncy ground
    });
    
    // Add user data for identification
    groundBody.userData = { 
        name: 'ground',
        isGround: true,
        isStatic: true
    };
    
    // Add ground body to world
    world.addBody(groundBody);
    
    debugInfo("Ground physics body created and added to world");
    return groundBody;
}

/**
 * Get the physics world instance
 * @returns {CANNON.World} The physics world
 */
export function getPhysicsWorld() {
    return world;
}

/**
 * Add a physics body to the world and track it - simplified for performance
 * @param {CANNON.Body} body - The physics body to add
 * @param {boolean} trackBody - Whether to track this body in physicsBodies array
 */
export function addPhysicsBody(body, trackBody = true) {
    if (!world) {
        return;
    }
    
    world.addBody(body);
    
    if (trackBody) {
        physicsBodies.push(body);
    }
}

/**
 * Remove a physics body from the world and tracking - simplified for performance
 * @param {CANNON.Body} body - The physics body to remove
 */
export function removePhysicsBody(body) {
    if (!world || !body) {
        return;
    }
    
    // Remove collision event listeners
    if (body.userData && body.userData.collisionHandler) {
        body.removeEventListener('collide', body.userData.collisionHandler);
    }
    
    // Remove from physics world
    world.removeBody(body);
    
    // Remove from tracking array
    const index = physicsBodies.indexOf(body);
    if (index > -1) {
        physicsBodies.splice(index, 1);
    }
    
    // Simple cleanup
    if (body.userData) {
        body.userData = null;
    }
}

/**
 * Get all tracked physics bodies
 * @returns {CANNON.Body[]} Array of tracked physics bodies
 */
export function getPhysicsBodies() {
    return physicsBodies;
}

/**
 * Clear all tracked physics bodies (but not the world)
 */
export function clearPhysicsBodies() {
    physicsBodies.length = 0;
    debugInfo("Cleared physics bodies tracking array");
}

/**
 * Update physics simulation with simplified fixed timestep - optimized for performance
 * @param {number} deltaTime - Time elapsed since last frame
 */
export function updatePhysics(deltaTime) {
    if (!world) {
        return;
    }
    
    // Simplified physics stepping - no complex accumulator or performance monitoring
    const clampedDeltaTime = Math.min(deltaTime, PHYSICS.FIXED_TIME_STEP * 3);
    physicsTimeAccumulator += clampedDeltaTime;
    
    let stepsThisFrame = 0;
    const maxStepsPerFrame = 3; // Reduced from 5 for better performance
    
    // Simple fixed timestep physics
    while (physicsTimeAccumulator >= PHYSICS.FIXED_TIME_STEP && stepsThisFrame < maxStepsPerFrame) {
        world.step(PHYSICS.FIXED_TIME_STEP);
        physicsTimeAccumulator -= PHYSICS.FIXED_TIME_STEP;
        stepsThisFrame++;
    }
    
    // Prevent accumulator buildup
    if (stepsThisFrame >= maxStepsPerFrame) {
        physicsTimeAccumulator = 0;
    }
}

/**
 * Create a sphere physics body
 * @param {number} radius - Sphere radius
 * @param {number} mass - Body mass
 * @param {CANNON.Vec3} position - Initial position
 * @param {Object} userData - User data to attach to the body
 * @returns {CANNON.Body} The created physics body
 */
export function createSphereBody(radius, mass, position, userData = {}) {
    const shape = new CANNON.Sphere(radius);
    const body = new CANNON.Body({
        mass: mass,
        position: position,
        shape: shape
    });
    
    // Attach user data
    body.userData = userData;
    
    return body;
}

/**
 * Create a box physics body
 * @param {CANNON.Vec3} halfExtents - Half extents of the box
 * @param {number} mass - Body mass
 * @param {CANNON.Vec3} position - Initial position
 * @param {Object} userData - User data to attach to the body
 * @returns {CANNON.Body} The created physics body
 */
export function createBoxBody(halfExtents, mass, position, userData = {}) {
    const shape = new CANNON.Box(halfExtents);
    const body = new CANNON.Body({
        mass: mass,
        position: position,
        shape: shape
    });
    
    // Attach user data
    body.userData = userData;
    
    return body;
}

/**
 * Create a plane physics body (typically for ground)
 * @param {CANNON.Vec3} position - Initial position
 * @param {Object} userData - User data to attach to the body
 * @returns {CANNON.Body} The created physics body
 */
export function createPlaneBody(position, userData = {}) {
    const shape = new CANNON.Plane();
    const body = new CANNON.Body({
        mass: 0, // Static body
        position: position,
        shape: shape
    });
    
    // Rotate to be horizontal (plane is vertical by default)
    body.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    
    // Attach user data
    body.userData = userData;
    
    return body;
}

/**
 * Simplified physics body activation - optimized for performance
 * @param {CANNON.Vec3} referencePosition - Reference position (typically katamari position)
 * @param {number} activeDistance - Distance within which bodies should be active
 */
export function managePhysicsBodyActivation(referencePosition, activeDistance = PHYSICS.ACTIVE_DISTANCE) {
    if (!referencePosition) {
        return;
    }
    
    // Simplified activation - only process every few frames to reduce overhead
    if (Math.random() > 0.1) return; // Only run 10% of the time
    
    for (const body of physicsBodies) {
        if (!body.userData || body.userData.isStatic || body.userData.isKatamari) {
            continue;
        }
        
        const distance = referencePosition.distanceTo(body.position);
        
        if (distance <= activeDistance) {
            if (body.sleepState === CANNON.Body.SLEEPING) {
                body.wakeUp();
            }
        } else if (distance > activeDistance * 2) {
            // Only sleep bodies that are very far away
            if (body.sleepState === CANNON.Body.AWAKE && body.velocity.length() < 0.1) {
                body.sleep();
            }
        }
    }
}

/**
 * Handle collision events for a physics body
 * @param {CANNON.Body} body - The physics body to add collision handling to
 * @param {Function} collisionHandler - Function to call on collision
 */
export function addCollisionHandler(body, collisionHandler) {
    body.addEventListener('collide', collisionHandler);
}

/**
 * Remove collision handler from a physics body
 * @param {CANNON.Body} body - The physics body to remove collision handling from
 * @param {Function} collisionHandler - Function to remove
 */
export function removeCollisionHandler(body, collisionHandler) {
    body.removeEventListener('collide', collisionHandler);
}

/**
 * Get physics time accumulator (for debugging)
 * @returns {number} Current physics time accumulator value
 */
export function getPhysicsTimeAccumulator() {
    return physicsTimeAccumulator;
}

/**
 * Reset physics time accumulator
 */
export function resetPhysicsTimeAccumulator() {
    physicsTimeAccumulator = 0;
    debugInfo("Physics time accumulator reset");
}

/**
 * Update a physics body's shape and mass properties
 * @param {CANNON.Body} body - The physics body to update
 * @param {CANNON.Shape} newShape - The new shape for the body
 * @param {number} newMass - The new mass for the body
 */
export function updateBodyShapeAndMass(body, newShape, newMass) {
    if (!body) {
        debugError("Cannot update body: body is null or undefined");
        return;
    }
    
    // Update shape
    body.shapes = [newShape];
    body.shapeOffsets = [new CANNON.Vec3(0, 0, 0)];
    body.shapeOrientations = [new CANNON.Quaternion(0, 0, 0, 1)];
    
    // Update mass
    body.mass = newMass;
    body.updateMassProperties();
    
    debugLog(`Updated body shape and mass: mass=${newMass.toFixed(2)}kg`);
}

/**
 * Create a sphere body with specific physics properties for Katamari
 * @param {number} radius - Sphere radius
 * @param {CANNON.Vec3} position - Initial position
 * @param {Object} userData - User data to attach to the body
 * @returns {CANNON.Body} The created Katamari physics body
 */
export function createKatamariBody(radius, position, userData = {}) {
    const shape = new CANNON.Sphere(radius);
    const mass = 12.5 * Math.pow(radius, 3); // Mass formula: k * radius^3 where k = 12.5
    
    const body = new CANNON.Body({
        mass: mass,
        position: position,
        shape: shape,
        material: new CANNON.Material({
            friction: PHYSICS.FRICTION,
            restitution: PHYSICS.RESTITUTION
        })
    });
    
    // Ensure minimum height to prevent sinking into ground
    body.position.y = Math.max(radius, body.position.y);
    
    // Attach user data
    body.userData = { ...userData, isKatamari: true };
    
    debugInfo(`Created Katamari body: radius=${radius.toFixed(2)}m, mass=${mass.toFixed(2)}kg`);
    return body;
}

/**
 * Update Katamari physics body properties (radius, mass, position)
 * @param {CANNON.Body} katamariBody - The Katamari physics body
 * @param {number} newRadius - New radius for the Katamari
 */
export function updateKatamariPhysics(katamariBody, newRadius) {
    if (!katamariBody) {
        debugError("Cannot update Katamari physics: body is null or undefined");
        return;
    }
    
    // Create new shape with updated radius
    const newShape = new CANNON.Sphere(newRadius);
    
    // Calculate new mass using the same formula as creation
    const newMass = 12.5 * Math.pow(newRadius, 3);
    
    // Update the body
    updateBodyShapeAndMass(katamariBody, newShape, newMass);
    
    // Ensure the Katamari doesn't sink into the ground
    katamariBody.position.y = Math.max(newRadius, katamariBody.position.y);
    
    debugInfo(`Katamari physics updated: radius=${newRadius.toFixed(2)}m, mass=${newMass.toFixed(2)}kg, Y-pos=${katamariBody.position.y.toFixed(2)}m`);
}

/**
 * Apply impulse to a physics body
 * @param {CANNON.Body} body - The physics body
 * @param {CANNON.Vec3} impulse - The impulse vector to apply
 * @param {CANNON.Vec3} relativePoint - Point relative to body center (optional)
 */
export function applyImpulseToBody(body, impulse, relativePoint = new CANNON.Vec3(0, 0, 0)) {
    if (!body) {
        debugError("Cannot apply impulse: body is null or undefined");
        return;
    }
    
    body.applyImpulse(impulse, relativePoint);
    debugLog(`Applied impulse to body: ${impulse.x.toFixed(2)}, ${impulse.y.toFixed(2)}, ${impulse.z.toFixed(2)}`);
}

/**
 * Check if two bodies are colliding based on distance
 * @param {CANNON.Body} body1 - First physics body
 * @param {CANNON.Body} body2 - Second physics body
 * @param {number} threshold - Distance threshold for collision detection
 * @returns {boolean} True if bodies are colliding
 */
export function checkBodyCollision(body1, body2, threshold = 0) {
    if (!body1 || !body2) {
        return false;
    }
    
    const distance = body1.position.distanceTo(body2.position);
    return distance <= threshold;
}

/**
 * Get physics body velocity magnitude
 * @param {CANNON.Body} body - The physics body
 * @returns {number} Velocity magnitude
 */
export function getBodyVelocityMagnitude(body) {
    if (!body) {
        return 0;
    }
    
    return body.velocity.length();
}

/**
 * Set physics body position
 * @param {CANNON.Body} body - The physics body
 * @param {CANNON.Vec3} position - New position
 */
export function setBodyPosition(body, position) {
    if (!body) {
        debugError("Cannot set body position: body is null or undefined");
        return;
    }
    
    body.position.copy(position);
    debugLog(`Set body position: ${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)}`);
}

/**
 * Update physics body statistics for performance monitoring
 */
function updatePhysicsBodyStats() {
    let activeBodies = 0;
    let sleepingBodies = 0;
    
    for (const body of physicsBodies) {
        if (body.sleepState === CANNON.Body.SLEEPING) {
            sleepingBodies++;
        } else {
            activeBodies++;
        }
    }
    
    physicsPerformanceStats.activeBodiesCount = activeBodies;
    physicsPerformanceStats.sleepingBodiesCount = sleepingBodies;
}

/**
 * Log physics performance statistics
 */
function logPhysicsPerformanceStats() {
    const stats = physicsPerformanceStats;
    debugInfo(`Physics Performance Stats:
        - Average step time: ${stats.averageStepTime.toFixed(2)}ms
        - Max step time: ${stats.maxStepTime.toFixed(2)}ms
        - Total bodies: ${physicsBodies.length}
        - Active bodies: ${stats.activeBodiesCount}
        - Sleeping bodies: ${stats.sleepingBodiesCount}
        - Total steps: ${stats.stepCount}`);
    
    // Reset max step time after logging
    stats.maxStepTime = 0;
}

/**
 * Get current physics performance statistics
 * @returns {Object} Current physics performance stats
 */
export function getPhysicsPerformanceStats() {
    return { ...physicsPerformanceStats };
}

/**
 * Reset physics performance statistics
 */
export function resetPhysicsPerformanceStats() {
    physicsPerformanceStats = {
        lastStepTime: 0,
        averageStepTime: 0,
        maxStepTime: 0,
        stepCount: 0,
        activeBodiesCount: 0,
        sleepingBodiesCount: 0,
        lastStatsUpdate: 0
    };
    debugInfo("Physics performance stats reset");
}

/**
 * Remove all physics bodies from world with proper cleanup
 * This function ensures all bodies are properly disposed of to prevent memory leaks
 */
export function removeAllPhysicsBodies() {
    if (!world) {
        debugWarn("Physics world not initialized");
        return;
    }
    
    debugInfo(`Removing ${physicsBodies.length} physics bodies with proper cleanup...`);
    
    // Create a copy of the array to avoid modification during iteration
    const bodiesToRemove = [...physicsBodies];
    
    for (const body of bodiesToRemove) {
        removePhysicsBody(body);
    }
    
    // Ensure tracking array is completely cleared
    physicsBodies.length = 0;
    
    debugInfo("All physics bodies removed and cleaned up");
}

/**
 * Clean up physics bodies that match a specific condition
 * @param {Function} condition - Function that returns true for bodies to remove
 */
export function removePhysicsBodiesByCondition(condition) {
    if (!world) {
        debugWarn("Physics world not initialized");
        return;
    }
    
    const bodiesToRemove = physicsBodies.filter(condition);
    
    debugInfo(`Removing ${bodiesToRemove.length} physics bodies matching condition...`);
    
    for (const body of bodiesToRemove) {
        removePhysicsBody(body);
    }
    
    debugInfo(`Removed ${bodiesToRemove.length} physics bodies with proper cleanup`);
}

/**
 * Fix memory leaks in physics body tracking arrays
 * This function removes null/undefined references and ensures array integrity
 */
export function fixPhysicsBodyTrackingLeaks() {
    const originalLength = physicsBodies.length;
    
    // Remove null, undefined, or invalid body references
    physicsBodies = physicsBodies.filter(body => {
        if (!body) {
            return false;
        }
        
        // Check if body is still in the physics world
        if (!world.bodies.includes(body)) {
            debugWarn(`Found orphaned physics body in tracking array: ${body.userData?.name || 'unnamed'}`);
            return false;
        }
        
        return true;
    });
    
    const removedCount = originalLength - physicsBodies.length;
    
    if (removedCount > 0) {
        debugInfo(`Fixed physics body tracking: removed ${removedCount} orphaned references`);
    }
    
    return removedCount;
}

/**
 * Validate physics world integrity and fix issues
 * @returns {Object} Validation results with counts of issues found and fixed
 */
export function validateAndFixPhysicsWorld() {
    if (!world) {
        debugWarn("Physics world not initialized");
        return { bodiesInWorld: 0, bodiesTracked: 0, orphanedBodies: 0, fixedLeaks: 0 };
    }
    
    const bodiesInWorld = world.bodies.length;
    const bodiesTracked = physicsBodies.length;
    
    // Fix tracking array leaks
    const fixedLeaks = fixPhysicsBodyTrackingLeaks();
    
    // Count orphaned bodies (in world but not tracked)
    let orphanedBodies = 0;
    for (const body of world.bodies) {
        if (!physicsBodies.includes(body) && body.userData && !body.userData.isStatic) {
            orphanedBodies++;
            debugWarn(`Found orphaned body in world: ${body.userData.name || 'unnamed'}`);
        }
    }
    
    const results = {
        bodiesInWorld,
        bodiesTracked: physicsBodies.length, // Updated count after cleanup
        orphanedBodies,
        fixedLeaks
    };
    
    debugInfo(`Physics world validation: ${bodiesInWorld} in world, ${results.bodiesTracked} tracked, ${orphanedBodies} orphaned, ${fixedLeaks} leaks fixed`);
    
    return results;
}

/**
 * Get physics debugging state and statistics
 * @returns {Object} Current physics debugging state
 */
export function getPhysicsDebugState() {
    return {
        ...physicsDebugState,
        currentBodiesTracked: physicsBodies.length,
        currentBodiesInWorld: world ? world.bodies.length : 0,
        physicsWorldInitialized: world !== null
    };
}

/**
 * Log detailed physics body creation history
 * @param {number} maxEntries - Maximum number of entries to log (default: 10)
 */
export function logPhysicsBodyCreationHistory(maxEntries = 10) {
    const recentCreations = physicsDebugState.bodyCreationLog.slice(-maxEntries);
    
    debugInfo(`[PHYSICS DEBUG] Recent Physics Body Creations (last ${recentCreations.length}):`);
    
    recentCreations.forEach((entry, index) => {
        const timeAgo = Date.now() - entry.timestamp;
        debugInfo(`  ${index + 1}. ${entry.name} (${entry.type}) - Mass: ${entry.mass}kg, Pos: ${entry.position}, Tracked: ${entry.tracked}, ${Math.round(timeAgo/1000)}s ago`);
    });
    
    debugInfo(`[PHYSICS DEBUG] Total bodies created: ${physicsDebugState.bodyCreationCount}`);
}

/**
 * Log detailed physics body removal history
 * @param {number} maxEntries - Maximum number of entries to log (default: 10)
 */
export function logPhysicsBodyRemovalHistory(maxEntries = 10) {
    const recentRemovals = physicsDebugState.bodyRemovalLog.slice(-maxEntries);
    
    debugInfo(`[PHYSICS DEBUG] Recent Physics Body Removals (last ${recentRemovals.length}):`);
    
    recentRemovals.forEach((entry, index) => {
        const timeAgo = Date.now() - entry.timestamp;
        debugInfo(`  ${index + 1}. ${entry.name} (${entry.type}) - Mass: ${entry.mass}kg, Pos: ${entry.position}, Was Tracked: ${entry.wasTracked}, ${Math.round(timeAgo/1000)}s ago`);
    });
    
    debugInfo(`[PHYSICS DEBUG] Total bodies removed: ${physicsDebugState.bodyRemovalCount}`);
}

/**
 * Perform comprehensive physics world integrity check
 * @returns {Object} Detailed integrity check results
 */
export function performPhysicsWorldIntegrityCheck() {
    if (!world) {
        debugWarn("[PHYSICS DEBUG] Physics world not initialized - cannot perform integrity check");
        return { error: "Physics world not initialized" };
    }
    
    const now = Date.now();
    physicsDebugState.lastIntegrityCheck = now;
    
    debugInfo("[PHYSICS DEBUG] Performing comprehensive physics world integrity check...");
    
    const results = {
        timestamp: now,
        worldBodies: world.bodies.length,
        trackedBodies: physicsBodies.length,
        orphanedInWorld: 0,
        orphanedInTracking: 0,
        nullReferences: 0,
        invalidBodies: 0,
        staticBodies: 0,
        dynamicBodies: 0,
        sleepingBodies: 0,
        awakeBodies: 0,
        bodiesWithoutUserData: 0,
        bodiesWithoutNames: 0,
        memoryLeaks: 0,
        issues: []
    };
    
    // Check for orphaned bodies in world (not in tracking array)
    for (const body of world.bodies) {
        if (!physicsBodies.includes(body) && body.userData && !body.userData.isStatic) {
            results.orphanedInWorld++;
            results.issues.push(`Orphaned body in world: ${body.userData.name || 'unnamed'}`);
        }
        
        // Count body types
        if (body.mass === 0 || (body.userData && body.userData.isStatic)) {
            results.staticBodies++;
        } else {
            results.dynamicBodies++;
        }
        
        // Count sleep states
        if (body.sleepState === CANNON.Body.SLEEPING) {
            results.sleepingBodies++;
        } else {
            results.awakeBodies++;
        }
        
        // Check for missing user data
        if (!body.userData) {
            results.bodiesWithoutUserData++;
            results.issues.push(`Body without userData at position (${body.position.x.toFixed(2)}, ${body.position.y.toFixed(2)}, ${body.position.z.toFixed(2)})`);
        } else if (!body.userData.name) {
            results.bodiesWithoutNames++;
            results.issues.push(`Body without name in userData`);
        }
    }
    
    // Check for orphaned bodies in tracking array (not in world)
    for (const body of physicsBodies) {
        if (!body) {
            results.nullReferences++;
            results.issues.push("Null reference in tracking array");
            continue;
        }
        
        if (!world.bodies.includes(body)) {
            results.orphanedInTracking++;
            results.issues.push(`Orphaned body in tracking: ${body.userData?.name || 'unnamed'}`);
        }
        
        // Check for invalid body state
        if (!body.position || !body.velocity || !body.shapes) {
            results.invalidBodies++;
            results.issues.push(`Invalid body state: ${body.userData?.name || 'unnamed'}`);
        }
        
        // Check for potential memory leaks
        if (body.userData && body.userData.threeMesh === null && body.userData.collisionHandler === null) {
            results.memoryLeaks++;
        }
    }
    
    // Update global issue counter
    physicsDebugState.worldIntegrityIssues += results.issues.length;
    
    // Log results
    debugInfo(`[PHYSICS DEBUG] Integrity Check Results:
        - World Bodies: ${results.worldBodies}
        - Tracked Bodies: ${results.trackedBodies}
        - Static Bodies: ${results.staticBodies}
        - Dynamic Bodies: ${results.dynamicBodies}
        - Sleeping Bodies: ${results.sleepingBodies}
        - Awake Bodies: ${results.awakeBodies}
        - Orphaned in World: ${results.orphanedInWorld}
        - Orphaned in Tracking: ${results.orphanedInTracking}
        - Null References: ${results.nullReferences}
        - Invalid Bodies: ${results.invalidBodies}
        - Bodies without UserData: ${results.bodiesWithoutUserData}
        - Bodies without Names: ${results.bodiesWithoutNames}
        - Potential Memory Leaks: ${results.memoryLeaks}
        - Total Issues Found: ${results.issues.length}`);
    
    if (results.issues.length > 0) {
        debugWarn(`[PHYSICS DEBUG] Found ${results.issues.length} integrity issues:`);
        results.issues.forEach((issue, index) => {
            debugWarn(`  ${index + 1}. ${issue}`);
        });
    } else {
        debugInfo("[PHYSICS DEBUG] Physics world integrity check passed - no issues found");
    }
    
    return results;
}

/**
 * Monitor physics body count and alert on unusual changes
 * @param {number} threshold - Threshold for alerting on rapid changes (default: 10)
 */
export function monitorPhysicsBodyCount(threshold = 25) {
    const currentCount = physicsBodies.length;
    const worldCount = world ? world.bodies.length : 0;
    
    // Store previous counts for comparison
    if (!physicsDebugState.previousBodyCount) {
        physicsDebugState.previousBodyCount = currentCount;
        physicsDebugState.previousWorldCount = worldCount;
        return;
    }
    
    const trackedChange = currentCount - physicsDebugState.previousBodyCount;
    const worldChange = worldCount - physicsDebugState.previousWorldCount;
    
    // Alert on significant changes
    if (Math.abs(trackedChange) >= threshold) {
        if (trackedChange > 0) {
            debugWarn(`[PHYSICS DEBUG] Rapid increase in tracked bodies: +${trackedChange} (now ${currentCount})`);
        } else {
            debugWarn(`[PHYSICS DEBUG] Rapid decrease in tracked bodies: ${trackedChange} (now ${currentCount})`);
        }
    }
    
    if (Math.abs(worldChange) >= threshold) {
        if (worldChange > 0) {
            debugWarn(`[PHYSICS DEBUG] Rapid increase in world bodies: +${worldChange} (now ${worldCount})`);
        } else {
            debugWarn(`[PHYSICS DEBUG] Rapid decrease in world bodies: ${worldChange} (now ${worldCount})`);
        }
    }
    
    // Check for discrepancies between tracked and world counts
    const discrepancy = Math.abs(currentCount - worldCount);
    if (discrepancy > 5) { // Allow some difference for static bodies
        debugWarn(`[PHYSICS DEBUG] Large discrepancy between tracked (${currentCount}) and world (${worldCount}) body counts: ${discrepancy}`);
    }
    
    // Update previous counts
    physicsDebugState.previousBodyCount = currentCount;
    physicsDebugState.previousWorldCount = worldCount;
    
    debugLog(`[PHYSICS DEBUG] Body count monitoring: Tracked=${currentCount}, World=${worldCount}, Change=(${trackedChange}, ${worldChange})`);
}

/**
 * Validate physics world configuration and settings
 * @returns {Object} Validation results for world configuration
 */
export function validatePhysicsWorldConfiguration() {
    if (!world) {
        debugError("[PHYSICS DEBUG] Cannot validate physics world configuration - world not initialized");
        return { error: "Physics world not initialized" };
    }
    
    debugInfo("[PHYSICS DEBUG] Validating physics world configuration...");
    
    const config = {
        gravity: world.gravity,
        broadphase: world.broadphase.constructor.name,
        solver: world.solver.constructor.name,
        solverIterations: world.solver.iterations,
        allowSleep: world.allowSleep,
        sleepSpeedLimit: world.sleepSpeedLimit,
        sleepTimeLimit: world.sleepTimeLimit,
        defaultFriction: world.defaultContactMaterial.friction,
        defaultRestitution: world.defaultContactMaterial.restitution,
        contactStiffness: world.defaultContactMaterial.contactEquationStiffness,
        contactRelaxation: world.defaultContactMaterial.contactEquationRelaxation
    };
    
    const issues = [];
    
    // Validate gravity
    if (world.gravity.y >= 0) {
        issues.push("Gravity Y component should be negative for downward gravity");
    }
    
    // Validate solver settings
    if (world.solver.iterations < 5) {
        issues.push("Solver iterations may be too low for stable simulation");
    }
    
    // Validate sleep settings
    if (!world.allowSleep) {
        issues.push("Sleep disabled - may impact performance with many bodies");
    }
    
    // Validate contact material
    if (world.defaultContactMaterial.friction < 0 || world.defaultContactMaterial.friction > 1) {
        issues.push("Default friction value outside normal range (0-1)");
    }
    
    if (world.defaultContactMaterial.restitution < 0 || world.defaultContactMaterial.restitution > 1) {
        issues.push("Default restitution value outside normal range (0-1)");
    }
    
    debugInfo(`[PHYSICS DEBUG] World Configuration:
        - Gravity: (${config.gravity.x}, ${config.gravity.y}, ${config.gravity.z})
        - Broadphase: ${config.broadphase}
        - Solver: ${config.solver} (${config.solverIterations} iterations)
        - Sleep Enabled: ${config.allowSleep}
        - Sleep Speed Limit: ${config.sleepSpeedLimit}
        - Sleep Time Limit: ${config.sleepTimeLimit}
        - Default Friction: ${config.defaultFriction}
        - Default Restitution: ${config.defaultRestitution}
        - Contact Stiffness: ${config.contactStiffness}
        - Contact Relaxation: ${config.contactRelaxation}`);
    
    if (issues.length > 0) {
        debugWarn(`[PHYSICS DEBUG] Configuration issues found:`);
        issues.forEach((issue, index) => {
            debugWarn(`  ${index + 1}. ${issue}`);
        });
    } else {
        debugInfo("[PHYSICS DEBUG] Physics world configuration validation passed");
    }
    
    return { config, issues };
}

/**
 * Reset physics debugging state
 */
export function resetPhysicsDebugState() {
    physicsDebugState = {
        bodyCreationCount: 0,
        bodyRemovalCount: 0,
        lastValidationTime: 0,
        validationInterval: 10000,
        bodyCreationLog: [],
        bodyRemovalLog: [],
        maxLogEntries: 100,
        worldIntegrityIssues: 0,
        lastIntegrityCheck: 0
    };
    
    debugInfo("[PHYSICS DEBUG] Physics debugging state reset");
}

/**
 * Enhanced physics debugging update function to be called periodically
 * This should be called from the main game loop to perform automatic validation
 * @param {number} deltaTime - Time elapsed since last frame
 */
export function updatePhysicsDebugging(deltaTime) {
    const now = Date.now();
    
    // Perform periodic integrity checks
    if (now - physicsDebugState.lastValidationTime > physicsDebugState.validationInterval) {
        performPhysicsWorldIntegrityCheck();
        monitorPhysicsBodyCount();
        physicsDebugState.lastValidationTime = now;
    }
    
    // Validate world configuration periodically (every 30 seconds)
    if (now - physicsDebugState.lastIntegrityCheck > 30000) {
        validatePhysicsWorldConfiguration();
        physicsDebugState.lastIntegrityCheck = now;
    }
}

/**
 * Cleanup physics system with comprehensive resource disposal
 */
export function cleanupPhysics() {
    if (world) {
        debugInfo("Starting comprehensive physics cleanup...");
        
        // Remove all tracked bodies with proper cleanup
        removeAllPhysicsBodies();
        
        // Validate and fix any remaining issues
        validateAndFixPhysicsWorld();
        
        // Reset accumulator
        physicsTimeAccumulator = 0;
        
        // Reset performance stats
        resetPhysicsPerformanceStats();
        
        // Reset debug state
        resetPhysicsDebugState();
        
        debugInfo("Comprehensive physics system cleanup completed");
    }
}