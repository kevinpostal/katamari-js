/**
 * Test fixtures for game state data
 * Provides consistent test data for game state testing
 */

export const initialGameState = {
    scene: {
        initialized: false,
        objectCount: 0,
        lightingSetup: false
    },
    physics: {
        worldCreated: false,
        bodyCount: 0,
        activeCollisions: 0
    },
    katamari: {
        position: { x: 0, y: 0, z: 0 },
        size: 1.0,
        velocity: { x: 0, y: 0, z: 0 },
        collectedItems: 0
    },
    level: {
        currentLevel: 1,
        theme: 'earth',
        targetSize: 10.0,
        itemsGenerated: 0
    }
};

export const midGameState = {
    scene: {
        initialized: true,
        objectCount: 150,
        lightingSetup: true
    },
    physics: {
        worldCreated: true,
        bodyCount: 150,
        activeCollisions: 5
    },
    katamari: {
        position: { x: 5.2, y: 1.0, z: -3.1 },
        size: 5.5,
        velocity: { x: 0.2, y: 0, z: -0.1 },
        collectedItems: 25
    },
    level: {
        currentLevel: 2,
        theme: 'urban',
        targetSize: 25.0,
        itemsGenerated: 200
    }
};

export const endGameState = {
    scene: {
        initialized: true,
        objectCount: 500,
        lightingSetup: true
    },
    physics: {
        worldCreated: true,
        bodyCount: 500,
        activeCollisions: 12
    },
    katamari: {
        position: { x: -10.5, y: 2.5, z: 8.3 },
        size: 50.0,
        velocity: { x: -0.5, y: 0, z: 0.3 },
        collectedItems: 150
    },
    level: {
        currentLevel: 5,
        theme: 'space',
        targetSize: 100.0,
        itemsGenerated: 1000
    }
};

export const testLevelData = {
    earth: {
        theme: 'earth',
        items: ['leaf', 'stick', 'rock', 'flower', 'mushroom'],
        colors: [0x228B22, 0x8B4513, 0x696969, 0xFF69B4, 0xDEB887],
        targetSizes: [5, 10, 20, 35, 50]
    },
    urban: {
        theme: 'urban',
        items: ['coin', 'paperclip', 'pen', 'book', 'chair'],
        colors: [0xFFD700, 0xC0C0C0, 0x000080, 0x8B4513, 0x654321],
        targetSizes: [10, 25, 50, 100, 200]
    },
    space: {
        theme: 'space',
        items: ['asteroid', 'satellite', 'planet', 'star', 'galaxy'],
        colors: [0x696969, 0xC0C0C0, 0x4169E1, 0xFFFF00, 0x9370DB],
        targetSizes: [50, 150, 500, 1000, 5000]
    }
};

export const mockPerformanceMetrics = {
    frameRate: {
        average: 60.0,
        minimum: 58.2,
        maximum: 61.5,
        consistency: 0.95
    },
    memory: {
        heapUsed: 25600000,
        heapTotal: 51200000,
        external: 1024000,
        arrayBuffers: 512000
    },
    timing: {
        physicsStep: 2.5,
        renderTime: 12.3,
        updateTime: 1.8,
        totalFrameTime: 16.6
    }
};