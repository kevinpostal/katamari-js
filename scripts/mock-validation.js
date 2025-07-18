#!/usr/bin/env node

/**
 * Mock Validation Script
 * Validates that mock implementations match their real counterparts
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Mock validation configuration
const MOCK_CONFIGS = [
    {
        name: 'Three.js',
        mockPath: 'tests/__mocks__/three.js',
        expectedMethods: [
            'Scene', 'PerspectiveCamera', 'WebGLRenderer', 'DirectionalLight',
            'AmbientLight', 'SphereGeometry', 'BoxGeometry', 'MeshLambertMaterial',
            'Mesh', 'InstancedMesh', 'Vector3', 'Euler', 'Matrix4'
        ]
    },
    {
        name: 'Cannon-ES',
        mockPath: 'tests/__mocks__/cannon-es.js',
        expectedMethods: [
            'World', 'Body', 'Sphere', 'Box', 'Plane', 'Vec3', 'Material',
            'ContactMaterial', 'NaiveBroadphase', 'SAPBroadphase'
        ]
    },
    {
        name: 'Tone.js',
        mockPath: 'tests/__mocks__/tone.js',
        expectedMethods: [
            'MembraneSynth', 'NoiseSynth', 'Oscillator', 'Filter', 'Reverb',
            'Delay', 'Compressor', 'Master', 'Transport'
        ]
    },
    {
        name: 'Browser APIs',
        mockPath: 'tests/__mocks__/browser-apis.js',
        expectedMethods: [
            'HTMLCanvasElement', 'WebGLRenderingContext', 'DeviceOrientationEvent',
            'TouchEvent', 'KeyboardEvent', 'MouseEvent'
        ]
    }
];

/**
 * Validates a single mock file
 */
function validateMock(config) {
    const mockFilePath = join(projectRoot, config.mockPath);
    
    if (!existsSync(mockFilePath)) {
        console.error(`❌ Mock file not found: ${config.mockPath}`);
        return false;
    }

    try {
        const mockContent = readFileSync(mockFilePath, 'utf8');
        const missingMethods = [];
        
        for (const method of config.expectedMethods) {
            if (!mockContent.includes(method)) {
                missingMethods.push(method);
            }
        }

        if (missingMethods.length > 0) {
            console.error(`❌ ${config.name} mock missing methods: ${missingMethods.join(', ')}`);
            return false;
        }

        console.log(`✅ ${config.name} mock validation passed`);
        return true;
    } catch (error) {
        console.error(`❌ Error validating ${config.name} mock: ${error.message}`);
        return false;
    }
}

/**
 * Main validation function
 */
function validateAllMocks() {
    console.log('🔍 Validating mock implementations...\n');
    
    let allValid = true;
    
    for (const config of MOCK_CONFIGS) {
        const isValid = validateMock(config);
        allValid = allValid && isValid;
    }
    
    console.log('\n' + '='.repeat(50));
    
    if (allValid) {
        console.log('✅ All mock validations passed!');
        process.exit(0);
    } else {
        console.log('❌ Some mock validations failed!');
        console.log('\nTo fix mock issues:');
        console.log('1. Check that all expected methods are implemented in mock files');
        console.log('2. Ensure mock files exist in the correct locations');
        console.log('3. Update mock implementations to match real library APIs');
        process.exit(1);
    }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    validateAllMocks();
}

export { validateAllMocks, validateMock, MOCK_CONFIGS };