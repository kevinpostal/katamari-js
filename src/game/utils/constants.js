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

// Collection mechanics constants
export const COLLECTION = {
    // Collection threshold - how much larger katamari needs to be than items
    BASE_THRESHOLD: 0.9, // Can collect items up to 10% larger than katamari
    PROGRESSIVE_SCALING: 0.02, // How much threshold increases per radius unit
    MAX_THRESHOLD: 1.3, // Maximum collection threshold for large katamaris

    // Attraction mechanics
    ATTRACTION_FORCE: 0.08, // Strength of item attraction toward katamari
    MIN_ATTRACTION_RANGE_FACTOR: 1.2, // Minimum attraction range multiplier
    MAX_ATTRACTION_RANGE_FACTOR: 3.0, // Maximum attraction range multiplier
    ATTRACTION_RANGE_GROWTH_RATE: 0.1, // How fast attraction range grows with katamari size

    // Growth mechanics
    VOLUME_CONTRIBUTION_FACTOR: 0.8, // How much of item volume contributes to growth
    GROWTH_RATE_REDUCTION: 0.3, // Overall growth rate multiplier
    DIFFICULTY_SCALE_RATE: 0.02, // How much growth difficulty increases with size
    SIZE_RATIO_MULTIPLIER: 2.0, // Multiplier for size-based contribution scaling

    // Animation and attachment
    COMPRESSION_RATE: 0.008, // How much attached items compress as katamari grows
    MIN_COMPRESSION_SCALE: 0.6, // Minimum scale for compressed items
    ATTACHMENT_SCALE: 0.85, // Base scale for attached items
    SURFACE_DISTANCE_FACTOR: 0.15, // How close items sit to katamari surface
    ORBITAL_SPEED_RANGE: [0.2, 0.7] // Min/max orbital rotation speeds for attached items
};

// Level generation constants
export const LEVEL = {
    GENERATION_DISTANCE_THRESHOLD: 50, // Generate new items every 50 units of travel
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

// Camera constants
export const CAMERA = {
    INITIAL_POSITION: { x: 0, y: 15, z: 30 },
    LOOK_AT_POSITION: { x: 0, y: 0, z: 0 },
    BASE_DISTANCE: 20, // Base camera distance from katamari
    HEIGHT_OFFSET: 15, // Base camera height above katamari
    DISTANCE_MULTIPLIER: 2, // How much camera distance increases with katamari size
    FOLLOW_LERP_SPEED: 0.05, // Camera position smoothing speed
    LOOK_AT_LERP_SPEED: 0.1 // Camera look-at smoothing speed
};

// Game world constants
export const WORLD = {
    MAP_BOUNDARY: 500, // Maximum boundary for katamari movement
    ITEM_SPAWN_RADIUS: 100, // Default radius for item spawning
    ITEM_SPAWN_COUNT: 200, // Default number of items to spawn
    INITIAL_ITEM_SPAWN_RADIUS: 180, // Radius for initial level item spawning
    MIN_SPAWN_DISTANCE: 10 // Minimum distance from center for item spawning
};

// Performance constants
export const PERFORMANCE = {
    EXPENSIVE_OPERATIONS_FREQUENCY: 0.1, // 10% chance per frame for expensive operations
    UI_UPDATE_FREQUENCY: 0.3, // 30% chance per frame for UI updates
    SPEED_SMOOTHING_FACTOR: 0.9, // Smoothing factor for katamari speed display
    VELOCITY_SMOOTHING_FACTOR: 0.1, // Velocity contribution to smoothed speed
    MOVEMENT_THRESHOLD: 0.1, // Minimum velocity to consider katamari as moving
    PERFORMANCE_DEGRADATION_THRESHOLD: 0.8, // 80% of target performance
    MAX_CONSECUTIVE_LOW_FRAMES: 30, // Alert after 30 consecutive low frames
    FRAME_TIME_SMOOTHING: 0.95, // Smoothing factor for frame time averaging
    PHYSICS_TIME_BUDGET_RATIO: 0.5 // Physics should use max 50% of frame time
};

// Movement constants
export const MOVEMENT = {
    BASE_ACCELERATION: 80, // Base acceleration for katamari movement
    MAX_ACCELERATION: 200, // Maximum acceleration
    ACCELERATION_RADIUS_MULTIPLIER: 2, // How much acceleration increases with radius
    MAX_SPEED: 25, // Maximum linear velocity
    MAX_ANGULAR_SPEED: 8, // Maximum angular velocity
    ACTIVE_LINEAR_DAMPING: 0.05, // Damping when actively moving
    ACTIVE_ANGULAR_DAMPING: 0.05, // Angular damping when actively moving
    IDLE_LINEAR_DAMPING: 0.9, // Damping when not moving
    IDLE_ANGULAR_DAMPING: 0.9, // Angular damping when not moving
    GYRO_SENSITIVITY: 0.8, // Gyroscope input sensitivity
    GYRO_THRESHOLD: 0.1, // Minimum gyro input to register movement
    TORQUE_MULTIPLIER: 0.5 // Torque calculation multiplier
};

// Visual constants
export const VISUAL = {
    KATAMARI_GEOMETRY_SEGMENTS: 32, // Sphere geometry segments for katamari
    KATAMARI_MATERIAL_ROUGHNESS: 0.6, // Material roughness
    KATAMARI_MATERIAL_METALNESS: 0.1, // Material metalness
    TEXTURE_SIZE: 512, // Katamari texture canvas size
    OCEAN_SPOTS_COUNT: 20, // Number of ocean variation spots
    CONTINENT_COUNT: 8, // Number of large continents
    ISLAND_COUNT: 25, // Number of small islands
    MOUNTAIN_RANGE_COUNT: 15, // Number of mountain ranges
    CLOUD_COUNT: 30, // Number of cloud patterns
    GROWTH_LERP_BASE_SPEED: 0.08, // Base speed for size growth animation
    GROWTH_LERP_MAX_SPEED: 0.15, // Maximum speed for size growth animation
    GROWTH_LERP_ACCELERATION: 0.5, // Growth animation acceleration factor
    GROWTH_SNAP_THRESHOLD: 0.01, // Threshold to snap to target size
    ITEM_ROTATION_Y_SPEED: 0.5, // Y-axis rotation speed for attached items
    ITEM_ROTATION_X_SPEED: 0.3 // X-axis rotation speed for attached items
};

// UI constants
export const UI = {
    ALERT_DURATION: 3000, // Default alert duration in milliseconds
    DECIMAL_PLACES: 2, // Decimal places for size/speed display
    PROGRESS_MAX: 100, // Maximum progress bar value
    POWER_UP_TIME_DECIMAL_PLACES: 1, // Decimal places for power-up countdown
    POWER_UP_TIME_DIVISOR: 1000, // Convert milliseconds to seconds
    LOADING_SIMULATION_TIME: 1500 // Simulated loading time in milliseconds
};

// Item generation constants
export const ITEM_GENERATION = {
    FADE_DURATION: 500, // Item fade-in duration in milliseconds (reduced from 1000ms)
    CLEANUP_DISTANCE_THRESHOLD: 180, // Distance threshold for item cleanup
    LINEAR_DAMPING: 0.1, // Linear damping for item physics bodies
    ANGULAR_DAMPING: 0.1, // Angular damping for item physics bodies
    DEFAULT_GEOMETRY_SIZE: 1, // Default size for geometry parameters
    SPHERE_WIDTH_SEGMENTS: 8, // Default sphere geometry segments
    SPHERE_HEIGHT_SEGMENTS: 6, // Default sphere geometry segments
    CYLINDER_RADIAL_SEGMENTS: 8 // Default cylinder geometry segments
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
        items: ["Rock", "Bush", "Flower", "Mushroom", "Garden Gnome", "Bird Bath", "Skateboard", "Trash Can", "Mailbox", "Bicycle", "Fire Hydrant", "Traffic Cone", "Bench", "Lamp Post", "Picnic Table", "Hot Dog Stand", "Newspaper Stand", "Shopping Cart", "Car", "Bus", "Tree", "House", "Building"],
        groundColor: "#4CAF50",
        skyColor: "#87CEEB",
        baseTargetSize: 25
    },
    {
        themeName: "Urban Jungle",
        story: "The city is a mess! Clean up the streets and grow your Katamari to skyscraper size!",
        items: ["Car", "Lamp Post", "Trash Can", "Bench", "Mailbox", "Fire Hydrant", "Traffic Cone", "Hot Dog Stand", "Newspaper Stand", "Bicycle", "Skateboard", "Shopping Cart", "Bus", "Building"],
        groundColor: "#607D8B",
        skyColor: "#B0C4DE",
        baseTargetSize: 100
    },
    {
        themeName: "Cosmic Debris",
        story: "The cosmos is cluttered! Roll up space junk and form a new star!",
        items: ["Asteroid", "Satellite", "Space Debris", "Comet Fragment", "Moon Rock", "Star Dust Cluster", "Alien Artifact", "Space Probe", "Space Station"],
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