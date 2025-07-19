/**
 * @fileoverview Game configuration constants for the Katamari game.
 * Centralized configuration values extracted from the original implementation
 * to easily manage and balance game mechanics, rendering, audio, and more.
 */

// Physics constants
// Defines parameters for the physics engine, optimized for game performance and realistic interactions.
export const PHYSICS = {
    GRAVITY: -20, // Gravitational acceleration (units per second squared)
    TIME_STEP: 1 / 60, // Fixed time step for physics simulation (seconds)
    FIXED_TIME_STEP: 1 / 60, // Another fixed time step, often same as TIME_STEP
    SOLVER_ITERATIONS: 10, // Number of iterations for the physics solver (reduced for performance)
    FRICTION: 0.8, // Coefficient of friction for material interactions (reduced for smoother movement)
    RESTITUTION: 0.1, // Coefficient of restitution (bounciness) for collisions (slight bounce)
    CONTACT_STIFFNESS: 1e6, // Stiffness of contacts (reduced for performance)
    CONTACT_RELAXATION: 4, // How quickly contact constraints are resolved; higher values mean faster, softer resolution, but can cause instability.
    ACTIVE_DISTANCE: 50 // Distance threshold for physics bodies to be considered active (reduced for performance)
};

// Katamari constants
// Defines properties and behaviors specific to the Katamari ball.
export const KATAMARI = {
    INITIAL_RADIUS: 2, // Initial radius of the Katamari at the start of the game
    BASE_SUCK_RANGE_FACTOR: 1.5, // Multiplier for the base range at which the Katamari can 'suck in' items
    INITIAL_TARGET_SIZE: 100 // Initial target size the Katamari needs to reach to complete a level
};

// Collection mechanics constants
// Parameters governing how the Katamari collects items, including thresholds, attraction, and growth.
export const COLLECTION = {
    // Collection threshold - how much larger katamari needs to be than items
    BASE_THRESHOLD: 0.9, // Base ratio: Katamari can collect items up to 10% larger than its current size (0.9 means item_size <= katamari_size / 0.9)
    PROGRESSIVE_SCALING: 0.02, // How much the collection threshold increases per unit of Katamari radius growth
    MAX_THRESHOLD: 1.3, // Maximum collection threshold, preventing the Katamari from collecting excessively large items

    // Attraction mechanics
    ATTRACTION_FORCE: 0.08, // Strength of the force attracting items towards the Katamari
    MIN_ATTRACTION_RANGE_FACTOR: 1.2, // Minimum multiplier for the Katamari's attraction range
    MAX_ATTRACTION_RANGE_FACTOR: 3.0, // Maximum multiplier for the Katamari's attraction range
    ATTRACTION_RANGE_GROWTH_RATE: 0.1, // Rate at which the attraction range grows with the Katamari's size

    // Growth mechanics
    VOLUME_CONTRIBUTION_FACTOR: 0.8, // Percentage of an item's volume that contributes to the Katamari's growth
    GROWTH_RATE_REDUCTION: 0.3, // Overall multiplier reducing the Katamari's growth rate
    DIFFICULTY_SCALE_RATE: 0.02, // Rate at which growth difficulty increases with the Katamari's size
    SIZE_RATIO_MULTIPLIER: 2.0, // Multiplier applied to the size ratio for growth contribution scaling

    // Animation and attachment
    COMPRESSION_RATE: 0.008, // Rate at which attached items compress as the Katamari grows
    MIN_COMPRESSION_SCALE: 0.6, // Minimum scale an attached item can be compressed to
    ATTACHMENT_SCALE: 0.85, // Base visual scale for items once they are attached to the Katamari
    SURFACE_DISTANCE_FACTOR: 0.15, // Factor determining how close attached items sit to the Katamari's surface
    ORBITAL_SPEED_RANGE: [0.2, 0.7] // Minimum and maximum speeds for attached items orbiting the Katamari
};

// Level generation constants
// Parameters for generating and managing game levels, including item spawning and boundaries.
export const LEVEL = {
    GENERATION_DISTANCE_THRESHOLD: 50, // Distance the Katamari must travel before new items are generated
    MAP_BOUNDARY: 240, // Maximum X and Z coordinate for item generation, keeping items within the playable map area
    DIFFICULTY_FACTOR: 0.5 // Factor by which difficulty increases per level (e.g., item density, target size)
};

// Audio constants
// Defines volume levels and cooldowns for various in-game sound effects.
export const AUDIO = {
    ROLLING_SYNTH_VOLUME: -30, // Volume for the Katamari's rolling sound effect (decibels)
    COLLECTION_SYNTH_VOLUME: -10, // Volume for the sound played when an item is collected (decibels)
    SHED_SOUND_VOLUME: -15, // Volume for the sound played when an item is shed (decibels)
    ATTRACTION_HUM_VOLUME: -40, // Volume for the ambient hum sound when items are attracted (decibels)
    COLLECTION_SOUND_COOLDOWN: 0.05, // Cooldown period between collection sound effects (seconds)
    SHED_COOLDOWN: 1000 // Cooldown period between shedding sound effects (milliseconds)
};

// Rendering constants
// Parameters related to the visual rendering of the game world, including camera, shadows, and item appearance.
export const RENDERING = {
    MAX_INSTANCES: 1000, // Maximum number of instances for rendering (e.g., for items)
    SHADOW_MAP_SIZE: 2048, // Resolution of the shadow map (e.g., 2048x2048 pixels)
    CAMERA_FOV: 70, // Field of view for the main camera (degrees)
    CAMERA_NEAR: 0.1, // Near clipping plane for the camera
    CAMERA_FAR: 1000, // Far clipping plane for the camera
    GROUND_SIZE: 500, // Size of the ground plane in the game world
    ITEM_FADE_DURATION: 1000 // Duration for item fade-in animation (milliseconds)
};

// Input constants
// Defines parameters for handling user input, including touch and gyroscope controls.
export const INPUT = {
    TOUCH_DEAD_ZONE_FACTOR: 0.05, // Factor determining the size of the touch dead zone relative to the screen size
    TOUCH_SENSITIVITY: 1.0, // Sensitivity multiplier for touch input
    GYRO_SENSITIVITY: 0.5 // Sensitivity multiplier for gyroscope input
};

// Power-up constants
// Defines types and durations for in-game power-ups.
export const POWER_UPS = {
    TYPES: ['magnetism', 'speedBoost', 'stickyCoating', 'vacuumBoost'], // Array of available power-up types
    DURATION: 5000 // Default duration for power-ups (milliseconds)
};

// Camera constants
// Parameters controlling the game camera's behavior, position, and movement.
export const CAMERA = {
    INITIAL_POSITION: { x: 0, y: 15, z: 30 }, // Initial position of the camera in 3D space
    LOOK_AT_POSITION: { x: 0, y: 0, z: 0 }, // The point in 3D space the camera initially looks at
    BASE_DISTANCE: 20, // Base distance of the camera from the Katamari
    HEIGHT_OFFSET: 15, // Base height offset of the camera above the Katamari
    DISTANCE_MULTIPLIER: 2, // Multiplier for how much camera distance increases with Katamari size
    FOLLOW_LERP_SPEED: 0.05, // Linear interpolation speed for smoothing camera position changes
    LOOK_AT_LERP_SPEED: 0.1 // Linear interpolation speed for smoothing the camera's look-at target
};

// Game world constants
// Defines global properties and boundaries of the game world.
export const WORLD = {
    MAP_BOUNDARY: 500, // Maximum boundary for Katamari movement, preventing it from going too far out of bounds
    ITEM_SPAWN_RADIUS: 100, // Default radius within which items are spawned around the Katamari
    ITEM_SPAWN_COUNT: 200, // Default number of items to spawn at a time
    INITIAL_ITEM_SPAWN_RADIUS: 180, // Radius for initial item spawning when a level begins
    MIN_SPAWN_DISTANCE: 10 // Minimum distance from the center (or Katamari) for item spawning to avoid immediate collection
};

// Performance constants
// Parameters for optimizing and monitoring game performance.
export const PERFORMANCE = {
    EXPENSIVE_OPERATIONS_FREQUENCY: 0.1, // Probability (0-1) per frame for executing expensive operations (e.g., complex calculations)
    UI_UPDATE_FREQUENCY: 0.3, // Probability (0-1) per frame for updating UI elements
    SPEED_SMOOTHING_FACTOR: 0.9, // Smoothing factor for the displayed Katamari speed, reducing jitter
    VELOCITY_SMOOTHING_FACTOR: 0.1, // Contribution of raw velocity to the smoothed speed calculation
    MOVEMENT_THRESHOLD: 0.1, // Minimum velocity magnitude to consider the Katamari as actively moving
    PERFORMANCE_DEGRADATION_THRESHOLD: 0.8, // Threshold (0-1) below which performance is considered degraded (e.g., 80% of target frame rate)
    MAX_CONSECUTIVE_LOW_FRAMES: 30, // Number of consecutive low-frame-rate frames before a performance alert is triggered
    FRAME_TIME_SMOOTHING: 0.95, // Smoothing factor for averaging frame times, used for performance monitoring
    PHYSICS_TIME_BUDGET_RATIO: 0.5 // Maximum proportion of a frame's time budget that physics calculations should consume
};

// Movement constants
// Parameters governing the Katamari's movement, including acceleration, speed limits, and damping.
export const MOVEMENT = {
    BASE_ACCELERATION: 80, // Base acceleration applied to the Katamari for movement
    MAX_ACCELERATION: 200, // Maximum acceleration the Katamari can achieve
    ACCELERATION_RADIUS_MULTIPLIER: 2, // How much acceleration increases with the Katamari's radius
    MAX_SPEED: 25, // Maximum linear velocity (speed) the Katamari can reach
    MAX_ANGULAR_SPEED: 8, // Maximum angular velocity (rotation speed) the Katamari can reach
    ACTIVE_LINEAR_DAMPING: 0.05, // Linear damping applied when the Katamari is actively moving
    ACTIVE_ANGULAR_DAMPING: 0.05, // Angular damping applied when the Katamari is actively moving
    IDLE_LINEAR_DAMPING: 0.9, // Linear damping applied when the Katamari is not actively moving (at rest)
    IDLE_ANGULAR_DAMPING: 0.9, // Angular damping applied when the Katamari is not actively moving (at rest)
    GYRO_SENSITIVITY: 0.8, // Sensitivity of gyroscope input for movement control
    GYRO_THRESHOLD: 0.1, // Minimum gyroscope input required to register movement
    TORQUE_MULTIPLIER: 0.5 // Multiplier used in calculating torque applied to the Katamari
};

// Visual constants
// Parameters related to the visual appearance and animations of the Katamari and other game elements.
export const VISUAL = {
    KATAMARI_GEOMETRY_SEGMENTS: 32, // Number of segments used to define the Katamari's sphere geometry (higher for smoother sphere)
    KATAMARI_MATERIAL_ROUGHNESS: 0.6, // Roughness property of the Katamari's material (0 = smooth, 1 = rough)
    KATAMARI_MATERIAL_METALNESS: 0.1, // Metalness property of the Katamari's material (0 = dielectric, 1 = metallic)
    TEXTURE_SIZE: 512, // Resolution of the Katamari's texture canvas (e.g., 512x512 pixels)
    OCEAN_SPOTS_COUNT: 20, // Number of distinct 'ocean' spots or variations on the Katamari's texture
    CONTINENT_COUNT: 8, // Number of large 'continent' shapes on the Katamari's texture
    ISLAND_COUNT: 25, // Number of small 'island' shapes on the Katamari's texture
    MOUNTAIN_RANGE_COUNT: 15, // Number of mountain range patterns on the Katamari's texture
    CLOUD_COUNT: 30, // Number of cloud patterns on the Katamari's texture
    GROWTH_LERP_BASE_SPEED: 0.08, // Base linear interpolation speed for the Katamari's size growth animation
    GROWTH_LERP_MAX_SPEED: 0.15, // Maximum linear interpolation speed for the Katamari's size growth animation
    GROWTH_LERP_ACCELERATION: 0.5, // Acceleration factor for the Katamari's size growth animation
    GROWTH_SNAP_THRESHOLD: 0.01, // Threshold at which the Katamari's size snaps to the target size during growth animation
    ITEM_ROTATION_Y_SPEED: 0.5, // Rotation speed around the Y-axis for attached items
    ITEM_ROTATION_X_SPEED: 0.3 // Rotation speed around the X-axis for attached items
};

// UI constants
// Parameters for user interface elements and their behavior.
export const UI = {
    ALERT_DURATION: 3000, // Default duration for on-screen alerts (milliseconds)
    DECIMAL_PLACES: 2, // Number of decimal places to display for size and speed values
    PROGRESS_MAX: 100, // Maximum value for progress bars (e.g., level completion)
    POWER_UP_TIME_DECIMAL_PLACES: 1, // Decimal places for power-up countdown timer
    POWER_UP_TIME_DIVISOR: 1000, // Divisor to convert power-up duration from milliseconds to seconds
    LOADING_SIMULATION_TIME: 1500 // Simulated loading time for UI elements (milliseconds)
};

// Item generation constants
// Parameters controlling the spawning, fading, and physical properties of items in the game world.
export const ITEM_GENERATION = {
    FADE_DURATION: 500, // Duration for item fade-in animation when spawned (milliseconds)
    CLEANUP_DISTANCE_THRESHOLD: 180, // Distance from the Katamari at which items are removed from the scene to optimize performance
    LINEAR_DAMPING: 0.1, // Linear damping applied to item physics bodies, reducing their linear velocity over time
    ANGULAR_DAMPING: 0.1, // Angular damping applied to item physics bodies, reducing their rotational velocity over time
    DEFAULT_GEOMETRY_SIZE: 1, // Default size multiplier for item geometries
    SPHERE_WIDTH_SEGMENTS: 8, // Number of width segments for sphere geometries used in items
    SPHERE_HEIGHT_SEGMENTS: 6, // Number of height segments for sphere geometries used in items
    CYLINDER_RADIAL_SEGMENTS: 8 // Number of radial segments for cylinder geometries used in items
};

// Environment constants
// Defines parameters for the game environment, such as cloud and mountain counts.
export const ENVIRONMENT = {
    CLOUD_COUNT: 15, // Number of clouds to generate in the environment
    MOUNTAIN_COUNT: 8, // Number of mountains to generate in the environment
    SAFE_ZONE_RADIUS: 50 // Radius around the origin where mountains should not spawn to ensure clear play area
};

// Lighting constants
// Parameters for configuring the lighting in the 3D scene.
export const LIGHTING = {
    AMBIENT_COLOR: 0x404040, // Color of the ambient light, which illuminates all objects equally
    HEMISPHERE_SKY_COLOR: 0xADD8E6, // Color of the sky part of the hemisphere light
    HEMISPHERE_GROUND_COLOR: 0x8B4513, // Color of the ground part of the hemisphere light
    HEMISPHERE_INTENSITY: 0.8, // Intensity of the hemisphere light
    DIRECTIONAL_COLOR: 0xffffff, // Color of the directional light, simulating sunlight
    DIRECTIONAL_INTENSITY: 1.5, // Intensity of the directional light
    DIRECTIONAL_POSITION: { x: 20, y: 50, z: 20 }, // Position of the directional light source
    SHADOW_CAMERA_SIZE: 50, // Size of the camera used for rendering shadows from the directional light
    SHADOW_BIAS: -0.0005 // Shadow bias to prevent shadow acne artifacts
};

// Theme definitions
// Defines different game themes, each with a unique story, set of items, and visual properties.
export const THEMES = [
    {
        themeName: "Our Green Earth", // Name of the theme
        story: "The King of All Cosmos demands a pristine Earth! Roll up all the litter and grow your Katamari!", // Story description for the theme
        items: ["Rock", "Bush", "Flower", "Mushroom", "Garden Gnome", "Bird Bath", "Skateboard", "Trash Can", "Mailbox", "Bicycle", "Fire Hydrant", "Traffic Cone", "Bench", "Lamp Post", "Picnic Table", "Hot Dog Stand", "Newspaper Stand", "Shopping Cart", "Car", "Bus", "Tree", "House", "Building"], // List of items available in this theme
        groundColor: "#4CAF50", // Hex color for the ground in this theme
        skyColor: "#87CEEB", // Hex color for the sky in this theme
        baseTargetSize: 25 // Base target size for the Katamari in this theme
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
// Maps display names of items to their corresponding instanced mesh names for rendering.
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
