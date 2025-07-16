/**
 * Game configuration constants for the Katamari game
 * Centralized configuration values extracted from the original implementation
 */

// Physics constants - Optimized for performance
export const PHYSICS = {
    GRAVITY: -20,
    TIME_STEP: 1 / 60,
    FIXED_TIME_STEP: 1 / 60,
    SOLVER_ITERATIONS: 10, // Reduced from 20 for better performance
    FRICTION: 0.8, // Reduced for smoother movement
    RESTITUTION: 0.1, // Slight bounce for more natural physics
    CONTACT_STIFFNESS: 1e6, // Reduced from 1e8 for better performance
    CONTACT_RELAXATION: 4, // Increased for faster resolution
    ACTIVE_DISTANCE: 50 // Reduced from 100 for better performance
};

// Katamari constants
export const KATAMARI = {
    INITIAL_RADIUS: 2,
    BASE_SUCK_RANGE_FACTOR: 1.5,
    INITIAL_TARGET_SIZE: 100
};

// Level generation constants
export const LEVEL = {
    GENERATION_DISTANCE_THRESHOLD: 50, // Generate new items every 50 units of travel
    CLEANUP_DISTANCE_THRESHOLD: 200, // Remove items beyond 200 units from Katamari
    MAP_BOUNDARY: 240, // Max X and Z coordinate for item generation to stay on map
    DIFFICULTY_FACTOR: 0.5 // 0.5x increase per level
};

// Audio constants
export const AUDIO = {
    ROLLING_SYNTH_VOLUME: -30,
    COLLECTION_SYNTH_VOLUME: -10,
    SHED_SOUND_VOLUME: -15,
    ATTRACTION_HUM_VOLUME: -40,
    COLLECTION_SOUND_COOLDOWN: 0.05, // 0.05 seconds cooldown
    SHED_COOLDOWN: 1000 // 1 second cooldown for shedding items
};

// Rendering constants
export const RENDERING = {
    MAX_INSTANCES: 1000,
    SHADOW_MAP_SIZE: 2048,
    CAMERA_FOV: 70,
    CAMERA_NEAR: 0.1,
    CAMERA_FAR: 1000,
    GROUND_SIZE: 500,
    ITEM_FADE_DURATION: 1000 // Item fade-in duration in milliseconds
};

// Input constants
export const INPUT = {
    TOUCH_DEAD_ZONE_FACTOR: 0.05, // Screen-size relative deadzone
    TOUCH_SENSITIVITY: 1.0,
    GYRO_SENSITIVITY: 0.5
};

// Power-up constants
export const POWER_UPS = {
    TYPES: ['magnetism', 'speedBoost', 'stickyCoating', 'vacuumBoost'],
    DURATION: 5000 // 5 seconds in milliseconds
};

// Environment constants
export const ENVIRONMENT = {
    CLOUD_COUNT: 15,
    MOUNTAIN_COUNT: 8,
    SAFE_ZONE_RADIUS: 50 // Radius around origin where mountains shouldn't spawn
};

// Lighting constants
export const LIGHTING = {
    AMBIENT_COLOR: 0x404040,
    HEMISPHERE_SKY_COLOR: 0xADD8E6,
    HEMISPHERE_GROUND_COLOR: 0x8B4513,
    HEMISPHERE_INTENSITY: 0.8,
    DIRECTIONAL_COLOR: 0xffffff,
    DIRECTIONAL_INTENSITY: 1.5,
    DIRECTIONAL_POSITION: { x: 20, y: 50, z: 20 },
    SHADOW_CAMERA_SIZE: 50,
    SHADOW_BIAS: -0.0005
};

// Theme definitions
export const THEMES = [
    {
        themeName: "Our Green Earth",
        story: "The King of All Cosmos demands a pristine Earth! Roll up all the litter and grow your Katamari!",
        items: ["Car", "Tree", "House", "Rock", "Bush", "Bench", "Lamp Post", "Trash Can", "Mailbox", "Mushroom", "Flower", "Garden Gnome", "Bird Bath", "Picnic Table"],
        groundColor: "#4CAF50",
        skyColor: "#87CEEB",
        baseTargetSize: 25
    },
    {
        themeName: "Urban Jungle",
        story: "The city is a mess! Clean up the streets and grow your Katamari to skyscraper size!",
        items: ["Car", "Lamp Post", "Trash Can", "Bench", "Mailbox", "Fire Hydrant", "Traffic Cone", "Hot Dog Stand", "Newspaper Stand", "Bicycle", "Skateboard", "Shopping Cart"],
        groundColor: "#607D8B",
        skyColor: "#B0C4DE",
        baseTargetSize: 100
    },
    {
        themeName: "Cosmic Debris",
        story: "The cosmos is cluttered! Roll up space junk and form a new star!",
        items: ["Asteroid", "Satellite", "Space Debris", "Comet Fragment", "Moon Rock", "Star Dust Cluster", "Alien Artifact", "Space Probe"],
        groundColor: "#2C3E50",
        skyColor: "#0A0A2A",
        baseTargetSize: 200
    }
];

// Instanced item mapping
export const INSTANCED_ITEM_MAP = {
    'Rock': 'rock',
    'Bush': 'bush',
    'Flower': 'flower',
    'Mushroom': 'mushroom',
    'Traffic Cone': 'trafficCone',
    'Garden Gnome': 'gardenGnome',
    'Bird Bath': 'birdBath',
    'Asteroid': 'asteroid',
    'Space Debris': 'spaceDebris',
    'Comet Fragment': 'cometFragment',
    'Moon Rock': 'moonRock',
    'Star Dust Cluster': 'starDustCluster'
};