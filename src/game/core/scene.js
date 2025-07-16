/**
 * Three.js Scene Management Module
 * Handles scene, camera, renderer setup, lighting configuration, and instanced mesh management
 */

import * as THREE from 'three';
import { debugLog, debugWarn, debugError, debugInfo } from '../utils/debug.js';
import { RENDERING, LIGHTING } from '../utils/constants.js';

// Scene management state
let scene, camera, renderer;
let instancedGeometries = {};
let instancedMaterials = {};
let instancedMeshes = {};
const frustum = new THREE.Frustum();

/**
 * Initialize the Three.js scene, camera, and renderer
 */
function initializeScene() {
    debugInfo("Initializing Three.js scene...");
    
    // Create scene
    scene = new THREE.Scene();
    
    // Create camera
    camera = new THREE.PerspectiveCamera(
        RENDERING.CAMERA_FOV, 
        window.innerWidth / window.innerHeight, 
        RENDERING.CAMERA_NEAR, 
        RENDERING.CAMERA_FAR
    );
    camera.position.set(0, 15, 30);
    camera.lookAt(0, 0, 0);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);
    
    debugInfo("Three.js scene initialized successfully");
}

/**
 * Set up the lighting system with ambient, hemisphere, and directional lights
 */
function setupLighting() {
    debugInfo("Setting up lighting system...");
    
    // Ambient light
    const ambientLight = new THREE.AmbientLight(LIGHTING.AMBIENT_COLOR);
    scene.add(ambientLight);
    
    // Hemisphere light
    const hemiLight = new THREE.HemisphereLight(
        LIGHTING.HEMISPHERE_SKY_COLOR, 
        LIGHTING.HEMISPHERE_GROUND_COLOR, 
        LIGHTING.HEMISPHERE_INTENSITY
    );
    scene.add(hemiLight);
    
    // Directional light with shadows
    const dirLight = new THREE.DirectionalLight(
        LIGHTING.DIRECTIONAL_COLOR, 
        LIGHTING.DIRECTIONAL_INTENSITY
    );
    dirLight.position.set(
        LIGHTING.DIRECTIONAL_POSITION.x, 
        LIGHTING.DIRECTIONAL_POSITION.y, 
        LIGHTING.DIRECTIONAL_POSITION.z
    );
    dirLight.castShadow = true;
    
    // Configure shadow camera
    Object.assign(dirLight.shadow.camera, { 
        top: LIGHTING.SHADOW_CAMERA_SIZE, 
        bottom: -LIGHTING.SHADOW_CAMERA_SIZE, 
        left: -LIGHTING.SHADOW_CAMERA_SIZE, 
        right: LIGHTING.SHADOW_CAMERA_SIZE 
    });
    dirLight.shadow.mapSize.width = RENDERING.SHADOW_MAP_SIZE;
    dirLight.shadow.mapSize.height = RENDERING.SHADOW_MAP_SIZE;
    dirLight.shadow.bias = LIGHTING.SHADOW_BIAS;
    
    scene.add(dirLight);
    
    debugInfo("Lighting system setup complete");
}

/**
 * Create or get an instanced mesh for performance optimization
 * @param {string} geometryType - Type of geometry (sphere, box, etc.)
 * @param {Object} geometryParams - Parameters for geometry creation
 * @param {THREE.Material} material - Material for the mesh
 * @param {number} maxInstances - Maximum number of instances
 * @returns {THREE.InstancedMesh} The instanced mesh
 */
function getInstancedMesh(geometryType, geometryParams, material, maxInstances = RENDERING.MAX_INSTANCES) {
    const key = `${geometryType}_${JSON.stringify(geometryParams)}`;
    
    if (!instancedMeshes[key]) {
        // Create geometry based on type
        let geometry;
        switch (geometryType) {
            case 'sphere':
                geometry = new THREE.SphereGeometry(
                    geometryParams.radius || 1,
                    geometryParams.widthSegments || 8,
                    geometryParams.heightSegments || 6
                );
                break;
            case 'box':
                geometry = new THREE.BoxGeometry(
                    geometryParams.width || 1,
                    geometryParams.height || 1,
                    geometryParams.depth || 1
                );
                break;
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(
                    geometryParams.radiusTop || 1,
                    geometryParams.radiusBottom || 1,
                    geometryParams.height || 1,
                    geometryParams.radialSegments || 8
                );
                break;
            default:
                debugError(`Unknown geometry type: ${geometryType}`);
                return null;
        }
        
        // Store geometry and material
        instancedGeometries[key] = geometry;
        instancedMaterials[key] = material;
        
        // Create instanced mesh
        const instancedMesh = new THREE.InstancedMesh(geometry, material, maxInstances);
        instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        instancedMesh.castShadow = true;
        instancedMesh.receiveShadow = true;
        
        instancedMeshes[key] = instancedMesh;
        scene.add(instancedMesh);
        
        debugLog(`Created instanced mesh for ${geometryType} with ${maxInstances} max instances`);
    }
    
    return instancedMeshes[key];
}

/**
 * Update instanced mesh with new instance data
 * @param {string} meshKey - Key identifying the instanced mesh
 * @param {Array} instances - Array of instance data {position, rotation, scale}
 */
function updateInstancedMesh(meshKey, instances) {
    const mesh = instancedMeshes[meshKey];
    if (!mesh) {
        debugWarn(`Instanced mesh not found: ${meshKey}`);
        return;
    }
    
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Euler();
    const scale = new THREE.Vector3();
    
    for (let i = 0; i < instances.length; i++) {
        const instance = instances[i];
        
        position.copy(instance.position);
        rotation.copy(instance.rotation);
        scale.copy(instance.scale);
        
        matrix.compose(position, new THREE.Quaternion().setFromEuler(rotation), scale);
        mesh.setMatrixAt(i, matrix);
    }
    
    mesh.instanceMatrix.needsUpdate = true;
    mesh.count = instances.length;
}

/**
 * Perform frustum culling to determine visible objects
 * @param {THREE.Object3D[]} objects - Array of objects to check
 * @returns {THREE.Object3D[]} Array of visible objects
 */
function performFrustumCulling(objects) {
    // Update frustum from camera
    const matrix = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(matrix);
    
    return objects.filter(object => {
        if (!object.geometry) return true; // Skip objects without geometry
        
        // Get bounding sphere
        if (!object.geometry.boundingSphere) {
            object.geometry.computeBoundingSphere();
        }
        
        const sphere = object.geometry.boundingSphere.clone();
        sphere.applyMatrix4(object.matrixWorld);
        
        return frustum.intersectsSphere(sphere);
    });
}

/**
 * Handle window resize events
 */
function handleWindowResize() {
    if (!camera || !renderer) {
        debugWarn("Camera or renderer not initialized for resize");
        return;
    }
    
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    debugLog("Window resized, camera and renderer updated");
}

/**
 * Render the scene
 */
function renderScene() {
    if (!renderer || !scene || !camera) {
        debugWarn("Renderer, scene, or camera not initialized");
        return;
    }
    
    renderer.render(scene, camera);
}

/**
 * Clean up instanced meshes and geometries
 */
function cleanup() {
    debugInfo("Cleaning up scene resources...");
    
    // Dispose of geometries
    Object.values(instancedGeometries).forEach(geometry => {
        geometry.dispose();
    });
    
    // Dispose of materials
    Object.values(instancedMaterials).forEach(material => {
        if (material.dispose) {
            material.dispose();
        }
    });
    
    // Remove meshes from scene
    Object.values(instancedMeshes).forEach(mesh => {
        scene.remove(mesh);
    });
    
    // Clear references
    instancedGeometries = {};
    instancedMaterials = {};
    instancedMeshes = {};
    
    debugInfo("Scene cleanup complete");
}

/**
 * Get the current scene
 * @returns {THREE.Scene} The Three.js scene
 */
function getScene() {
    return scene;
}

/**
 * Get the current camera
 * @returns {THREE.PerspectiveCamera} The Three.js camera
 */
function getCamera() {
    return camera;
}

/**
 * Get the current renderer
 * @returns {THREE.WebGLRenderer} The Three.js renderer
 */
function getRenderer() {
    return renderer;
}

/**
 * Get the frustum for culling calculations
 * @returns {THREE.Frustum} The frustum object
 */
function getFrustum() {
    return frustum;
}

/**
 * Get the instanced meshes object
 * @returns {Object} The instanced meshes collection
 */
function getInstancedMeshes() {
    return instancedMeshes;
}

// Export the scene management interface
export {
    initializeScene,
    setupLighting,
    getInstancedMesh,
    updateInstancedMesh,
    performFrustumCulling,
    handleWindowResize,
    renderScene,
    cleanup,
    getScene,
    getCamera,
    getRenderer,
    getFrustum,
    getInstancedMeshes
};