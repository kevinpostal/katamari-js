# Game Configuration Constants (constants.js)

This document provides an in-depth explanation of the configuration constants defined in `src/game/utils/constants.js`. These constants are central to balancing and fine-tuning various aspects of the Katamari game, from physics and rendering to gameplay mechanics and user interface. Understanding these values is crucial for modifying game behavior, optimizing performance, or introducing new features.

---

## PHYSICS

Defines parameters for the physics engine, optimized for game performance and realistic interactions. Adjusting these values directly impacts how objects move, collide, and interact within the game world.

-   **`GRAVITY`**:
    -   **Description**: The gravitational acceleration applied to all physics bodies in the game world. This value determines the strength and direction of the downward force.
    -   **Value**: `-20` (units per second squared). The negative value indicates a downward pull along the Y-axis.
    -   **Impact**: A higher absolute value will make objects fall faster and feel heavier. A lower absolute value will make objects feel lighter and fall slower. Changing the sign would invert gravity.

-   **`TIME_STEP`**:
    -   **Description**: The fixed time step used for advancing the physics simulation. This ensures consistent physics calculations regardless of the frame rate.
    -   **Value**: `1 / 60` (approximately 0.0167 seconds). This corresponds to 60 physics updates per second.
    -   **Impact**: A smaller time step (higher frequency) leads to more accurate and stable physics simulations but requires more computational power. A larger time step (lower frequency) can lead to less accurate physics, potential tunneling (objects passing through each other), and instability, but improves performance.

-   **`FIXED_TIME_STEP`**:
    -   **Description**: Another fixed time step, often used in conjunction with `TIME_STEP` for specific physics engine configurations. In many cases, it will be set to the same value as `TIME_STEP`.
    -   **Value**: `1 / 60` (approximately 0.0167 seconds).
    -   **Impact**: Similar to `TIME_STEP`, it affects the granularity and stability of the physics simulation.

-   **`SOLVER_ITERATIONS`**:
    -   **Description**: The number of iterations the physics solver performs to resolve contacts and constraints. More iterations lead to more accurate collision resolution.
    -   **Value**: `10`. This value has been reduced from a higher default (e.g., 20) for better performance.
    -   **Impact**: Increasing this value improves the accuracy of collisions, reducing interpenetration and jitter, but at the cost of CPU performance. Decreasing it can lead to objects passing through each other or unstable stacking.

-   **`FRICTION`**:
    -   **Description**: The coefficient of friction applied to material interactions between colliding bodies. It determines the resistance to relative motion between surfaces.
    -   **Value**: `0.8`. This value has been reduced for smoother movement of the Katamari and collected items.
    -   **Impact**: Higher friction makes objects stickier and slows down sliding. Lower friction makes surfaces more slippery, allowing objects to slide more easily.

-   **`RESTITUTION`**:
    -   **Description**: The coefficient of restitution, which determines the "bounciness" of collisions. It represents the ratio of relative speed after and before an impact.
    -   **Value**: `0.1`. A slight bounce for more natural physics.
    -   **Impact**: A value of 0 means objects will not bounce (perfectly inelastic collision). A value of 1 means objects will bounce with their original speed (perfectly elastic collision). Values in between represent varying degrees of bounciness.

-   **`CONTACT_STIFFNESS`**:
    -   **Description**: The stiffness of contacts between colliding bodies. It influences how much objects deform or compress upon impact.
    -   **Value**: `1e6` (1,000,000). This value has been reduced from a higher default (e.g., 1e8) for better performance.
    -   **Impact**: Higher stiffness makes contacts more rigid and less forgiving, potentially leading to more forceful reactions. Lower stiffness allows for more "give" or compression during collisions, which can look softer but might also lead to more interpenetration if too low.

-   **`CONTACT_RELAXATION`**:
    -   **Description**: Determines how quickly contact constraints (like preventing objects from interpenetrating) are resolved.
    -   **Value**: `4`.
    -   **Impact**: Higher values lead to faster, but potentially softer, resolution, which can make collisions appear bouncier or less rigid. This can be beneficial for performance as the solver converges faster. However, if too high, it might introduce instability or allow objects to slightly interpenetrate. Lower values result in more rigid, but potentially slower, resolution, requiring more solver iterations to achieve stability.

-   **`ACTIVE_DISTANCE`**:
    -   **Description**: The distance threshold for physics bodies to be considered "active" in the simulation. Bodies outside this range might be put to sleep or simulated with less precision to save performance.
    -   **Value**: `50`. This value has been reduced from a higher default (e.g., 100) for better performance.
    -   **Impact**: A smaller active distance means fewer objects are actively simulated at any given time, improving performance. However, objects might appear to "pop in" or react late if they become active too close to the player. A larger distance ensures more consistent physics but increases computational load.

---

## KATAMARI

Defines properties and behaviors specific to the Katamari ball, the player-controlled object.

-   **`INITIAL_RADIUS`**:
    -   **Description**: The starting radius of the Katamari when a new game or level begins.
    -   **Value**: `2`.
    -   **Impact**: Determines the initial size of the Katamari, affecting what items it can initially collect and the early game difficulty.

-   **`BASE_SUCK_RANGE_FACTOR`**:
    -   **Description**: A multiplier for the base range at which the Katamari can "suck in" or attract items towards itself. This is a conceptual range, not necessarily a strict physical one.
    -   **Value**: `1.5`.
    -   **Impact**: A higher factor means the Katamari can attract items from further away, making collection easier. A lower factor requires the Katamari to be closer to items for attraction to occur.

-   **`INITIAL_TARGET_SIZE`**:
    -   **Description**: The initial target size the Katamari needs to reach to complete a level or objective. This value can be overridden by theme-specific targets.
    -   **Value**: `100`.
    -   **Impact**: Directly influences the duration and difficulty of a level. A larger target size means a longer gameplay session.

---

## COLLECTION

Parameters governing how the Katamari collects items, including thresholds, attraction mechanics, growth, and visual attachment.

### Collection Threshold

-   **`BASE_THRESHOLD`**:
    -   **Description**: The base ratio that determines how much larger the Katamari needs to be than an item to collect it.
    -   **Value**: `0.9`. This means the Katamari can collect items up to approximately 10% larger than its current size (i.e., `item_size <= katamari_size / 0.9`).
    -   **Impact**: A lower value (closer to 0) makes it easier to collect larger items relative to the Katamari's size. A higher value (closer to 1) makes it harder, requiring the Katamari to be significantly larger than the item.

-   **`PROGRESSIVE_SCALING`**:
    -   **Description**: How much the collection threshold increases per unit of Katamari radius growth. This makes it progressively easier to collect larger items as the Katamari grows.
    -   **Value**: `0.02`.
    -   **Impact**: A higher value means the Katamari becomes capable of collecting relatively larger items more quickly as it grows. A lower value slows down this progression.

-   **`MAX_THRESHOLD`**:
    -   **Description**: The maximum collection threshold, preventing the Katamari from collecting excessively large items, even at very large sizes. This acts as an upper bound for `BASE_THRESHOLD` + `PROGRESSIVE_SCALING`.
    -   **Value**: `1.3`.
    -   **Impact**: Ensures that there's always a limit to the size of items that can be collected, maintaining a challenge and preventing the game from becoming too easy at very large Katamari sizes.

### Attraction Mechanics

-   **`ATTRACTION_FORCE`**:
    -   **Description**: The strength of the force attracting items towards the Katamari when they are within its attraction range.
    -   **Value**: `0.08`.
    -   **Impact**: A higher force makes items gravitate towards the Katamari more aggressively, making collection feel more automatic. A lower force requires more precise maneuvering.

-   **`MIN_ATTRACTION_RANGE_FACTOR`**:
    -   **Description**: The minimum multiplier for the Katamari's attraction range. This ensures a base attraction range even when the Katamari is small.
    -   **Value**: `1.2`.
    -   **Impact**: Defines the smallest effective attraction radius relative to the Katamari's size.

-   **`MAX_ATTRACTION_RANGE_FACTOR`**:
    -   **Description**: The maximum multiplier for the Katamari's attraction range. This caps how large the attraction range can become as the Katamari grows.
    -   **Value**: `3.0`.
    -   **Impact**: Prevents the attraction range from becoming excessively large, which could make the game too easy at very large Katamari sizes.

-   **`ATTRACTION_RANGE_GROWTH_RATE`**:
    -   **Description**: The rate at which the attraction range grows with the Katamari's size.
    -   **Value**: `0.1`.
    -   **Impact**: A higher rate means the attraction range expands more rapidly as the Katamari grows, making it easier to collect items from a distance in later stages.

### Growth Mechanics

-   **`VOLUME_CONTRIBUTION_FACTOR`**:
    -   **Description**: The percentage of an item's volume that actually contributes to the Katamari's growth. This allows for balancing the rate of growth.
    -   **Value**: `0.8`.
    -   **Impact**: A higher factor means collected items contribute more to the Katamari's size, leading to faster growth. A lower factor slows down growth.

-   **`GROWTH_RATE_REDUCTION`**:
    -   **Description**: An overall multiplier reducing the Katamari's growth rate. This can be used to globally slow down progression.
    -   **Value**: `0.3`.
    -   **Impact**: A lower value makes the game feel slower and more challenging, requiring more items to reach target sizes. A higher value accelerates progression.

-   **`DIFFICULTY_SCALE_RATE`**:
    -   **Description**: The rate at which growth difficulty increases with the Katamari's size. This can influence how the game scales its challenge.
    -   **Value**: `0.02`.
    -   **Impact**: A higher rate means that as the Katamari grows, it becomes proportionally harder to increase its size further, requiring more items or larger items to achieve the same growth.

-   **`SIZE_RATIO_MULTIPLIER`**:
    -   **Description**: A multiplier applied to the size ratio between the Katamari and a collected item, influencing how much that item contributes to growth based on its relative size.
    -   **Value**: `2.0`.
    -   **Impact**: A higher multiplier means that items closer to the Katamari's current size (or slightly larger, if collectible) contribute more significantly to growth.

### Animation and Attachment

-   **`COMPRESSION_RATE`**:
    -   **Description**: The rate at which attached items visually compress or shrink as the Katamari grows larger. This creates the illusion of items being absorbed into the Katamari.
    -   **Value**: `0.008`.
    -   **Impact**: A higher rate makes items compress faster and more noticeably. A lower rate makes the compression more subtle.

-   **`MIN_COMPRESSION_SCALE`**:
    -   **Description**: The minimum visual scale an attached item can be compressed to. Items will not shrink beyond this point.
    -   **Value**: `0.6`.
    -   **Impact**: Prevents items from disappearing entirely or becoming too small to be visible on the Katamari's surface.

-   **`ATTACHMENT_SCALE`**:
    -   **Description**: The base visual scale for items once they are attached to the Katamari. This is their initial size before any compression.
    -   **Value**: `0.85`.
    -   **Impact**: Determines how large items appear immediately after being collected.

-   **`SURFACE_DISTANCE_FACTOR`**:
    -   **Description**: A factor determining how close attached items sit to the Katamari's surface.
    -   **Value**: `0.15`.
    -   **Impact**: A lower factor makes items appear more embedded in the Katamari. A higher factor makes them protrude more.

-   **`ORBITAL_SPEED_RANGE`**:
    -   **Description**: The minimum and maximum speeds for attached items orbiting the Katamari. This adds dynamic visual movement to collected items.
    -   **Value**: `[0.2, 0.7]`.
    -   **Impact**: Defines the range of rotational speeds for attached items. Adjusting this can make the Katamari appear more or less dynamic.

---

## LEVEL

Parameters for generating and managing game levels, including item spawning and boundaries.

-   **`GENERATION_DISTANCE_THRESHOLD`**:
    -   **Description**: The distance the Katamari must travel before new items are generated in the game world. This helps ensure a continuous supply of items.
    -   **Value**: `50` (units of travel).
    -   **Impact**: A lower threshold means items are generated more frequently, potentially increasing density. A higher threshold means less frequent generation, which might lead to sparse areas.

-   **`MAP_BOUNDARY`**:
    -   **Description**: The maximum X and Z coordinate for item generation, keeping items within the playable map area. This defines the extent of the game world.
    -   **Value**: `240`.
    -   **Impact**: Determines the size of the playable area. Increasing this value creates a larger map, potentially requiring more items or longer play sessions.

-   **`DIFFICULTY_FACTOR`**:
    -   **Description**: A factor by which difficulty increases per level. This can influence various aspects like item density, target size, or enemy behavior (if applicable).
    -   **Value**: `0.5` (0.5x increase per level).
    -   **Impact**: A higher factor makes each subsequent level significantly harder. A lower factor provides a more gradual increase in difficulty.

---

## AUDIO

Defines volume levels and cooldowns for various in-game sound effects.

-   **`ROLLING_SYNTH_VOLUME`**:
    -   **Description**: Volume for the Katamari's continuous rolling sound effect.
    -   **Value**: `-30` (decibels).
    -   **Impact**: Adjusts the loudness of the primary background sound.

-   **`COLLECTION_SYNTH_VOLUME`**:
    -   **Description**: Volume for the sound played when an item is successfully collected.
    -   **Value**: `-10` (decibels).
    -   **Impact**: Controls the prominence of the collection feedback sound.

-   **`SHED_SOUND_VOLUME`**:
    -   **Description**: Volume for the sound played when an item is shed (e.g., due to collision or size mismatch).
    -   **Value**: `-15` (decibels).
    -   **Impact**: Adjusts the loudness of the shedding feedback sound.

-   **`ATTRACTION_HUM_VOLUME`**:
    -   **Description**: Volume for the ambient hum sound that plays when items are within the Katamari's attraction range.
    -   **Value**: `-40` (decibels).
    -   **Impact**: Controls the subtlety of the attraction indicator sound.

-   **`COLLECTION_SOUND_COOLDOWN`**:
    -   **Description**: Cooldown period between consecutive collection sound effects. This prevents rapid, overlapping sounds when many items are collected at once.
    -   **Value**: `0.05` (seconds).
    -   **Impact**: A shorter cooldown allows for more frequent collection sounds, potentially making the game feel more responsive but also more chaotic. A longer cooldown reduces audio clutter.

-   **`SHED_COOLDOWN`**:
    -   **Description**: Cooldown period between shedding sound effects.
    -   **Value**: `1000` (milliseconds).
    -   **Impact**: Similar to `COLLECTION_SOUND_COOLDOWN`, it prevents rapid, repetitive shedding sounds.

---

## RENDERING

Parameters related to the visual rendering of the game world, including camera, shadows, and item appearance.

-   **`MAX_INSTANCES`**:
    -   **Description**: The maximum number of instances that can be rendered for a single type of object (e.g., for items). Instancing is an optimization technique to draw many copies of the same mesh efficiently.
    -   **Value**: `1000`.
    -   **Impact**: A higher value allows more items of the same type to be rendered simultaneously, increasing visual density but also VRAM usage and rendering complexity.

-   **`SHADOW_MAP_SIZE`**:
    -   **Description**: The resolution of the shadow map, which is a texture used to calculate and render shadows.
    -   **Value**: `2048` (e.g., 2048x2048 pixels).
    -   **Impact**: A higher resolution shadow map produces sharper, more detailed shadows but consumes more memory and requires more rendering time. A lower resolution results in blockier shadows.

-   **`CAMERA_FOV`**:
    -   **Description**: The field of view (FOV) for the main camera, measured in degrees. This determines how much of the game world is visible on screen.
    -   **Value**: `70` (degrees).
    -   **Impact**: A wider FOV (higher value) shows more of the scene but can introduce a "fish-eye" distortion. A narrower FOV (lower value) provides a more zoomed-in view.

-   **`CAMERA_NEAR`**:
    -   **Description**: The near clipping plane for the camera. Objects closer than this distance to the camera will not be rendered.
    -   **Value**: `0.1`.
    -   **Impact**: Setting this too high can cause objects very close to the camera to disappear. Setting it too low can lead to precision issues with depth buffering (z-fighting).

-   **`CAMERA_FAR`**:
    -   **Description**: The far clipping plane for the camera. Objects further than this distance from the camera will not be rendered.
    -   **Value**: `1000`.
    -   **Impact**: Setting this too low can cause distant objects to disappear prematurely. Setting it too high can reduce depth buffer precision and increase rendering load for objects that are barely visible.

-   **`GROUND_SIZE`**:
    -   **Description**: The size of the ground plane in the game world.
    -   **Value**: `500`.
    -   **Impact**: Defines the visual extent of the ground. A larger size means a more expansive environment.

-   **`ITEM_FADE_DURATION`**:
    -   **Description**: The duration for the fade-in animation of items when they are spawned or become visible.
    -   **Value**: `1000` (milliseconds).
    -   **Impact**: A longer duration makes items appear more gradually. A shorter duration makes them pop in more quickly.

---

## INPUT

Defines parameters for handling user input, including touch and gyroscope controls.

-   **`TOUCH_DEAD_ZONE_FACTOR`**:
    -   **Description**: A factor determining the size of the touch dead zone relative to the screen size. Input within this zone is ignored to prevent accidental or minor touches from registering.
    -   **Value**: `0.05` (5% of screen size).
    -   **Impact**: A larger dead zone makes touch controls less sensitive to small movements, reducing accidental input but potentially making precise control harder.

-   **`TOUCH_SENSITIVITY`**:
    -   **Description**: Sensitivity multiplier for touch input.
    -   **Value**: `1.0`.
    -   **Impact**: A higher value makes touch input more responsive, requiring smaller gestures for larger movements. A lower value makes it less responsive.

-   **`GYRO_SENSITIVITY`**:
    -   **Description**: Sensitivity multiplier for gyroscope input (e.g., for tilt controls on mobile devices).
    -   **Value**: `0.5`.
    -   **Impact**: A higher value makes the Katamari react more strongly to device tilting. A lower value requires more significant tilting for movement.

---

## POWER_UPS

Defines types and durations for in-game power-ups.

-   **`TYPES`**:
    -   **Description**: An array of strings listing the available types of power-ups in the game.
    -   **Value**: `['magnetism', 'speedBoost', 'stickyCoating', 'vacuumBoost']`.
    -   **Impact**: Determines which power-ups can appear in the game. Adding or removing types here requires corresponding game logic for their effects.

-   **`DURATION`**:
    -   **Description**: The default duration for power-ups once activated.
    -   **Value**: `5000` (milliseconds, or 5 seconds).
    -   **Impact**: Controls how long power-up effects last. A longer duration makes power-ups more impactful.

---

## CAMERA

Parameters controlling the game camera's behavior, position, and movement.

-   **`INITIAL_POSITION`**:
    -   **Description**: The initial position of the camera in 3D space when the game starts or a level loads.
    -   **Value**: `{ x: 0, y: 15, z: 30 }`.
    -   **Impact**: Sets the starting viewpoint for the player.

-   **`LOOK_AT_POSITION`**:
    -   **Description**: The point in 3D space the camera initially looks at.
    -   **Value**: `{ x: 0, y: 0, z: 0 }`.
    -   **Impact**: Defines the initial focal point of the camera.

-   **`BASE_DISTANCE`**:
    -   **Description**: The base distance of the camera from the Katamari. This is the minimum distance the camera will try to maintain.
    -   **Value**: `20`.
    -   **Impact**: A larger base distance provides a wider view of the surroundings. A smaller distance offers a more intimate, zoomed-in perspective.

-   **`HEIGHT_OFFSET`**:
    -   **Description**: The base height offset of the camera above the Katamari.
    -   **Value**: `15`.
    -   **Impact**: Determines how high the camera is positioned relative to the Katamari.

-   **`DISTANCE_MULTIPLIER`**:
    -   **Description**: A multiplier for how much the camera distance increases with the Katamari's size. This makes the camera pull back as the Katamari grows.
    -   **Value**: `2`.
    -   **Impact**: A higher multiplier causes the camera to zoom out more aggressively as the Katamari grows, keeping more of the environment in view.

-   **`FOLLOW_LERP_SPEED`**:
    -   **Description**: The linear interpolation (LERP) speed for smoothing camera position changes. LERP is used to smoothly transition between two values.
    -   **Value**: `0.05`.
    -   **Impact**: A higher value makes the camera follow the Katamari more tightly and responsively. A lower value introduces more lag, creating a smoother, more cinematic feel.

-   **`LOOK_AT_LERP_SPEED`**:
    -   **Description**: The linear interpolation (LERP) speed for smoothing the camera's look-at target.
    -   **Value**: `0.1`.
    -   **Impact**: Similar to `FOLLOW_LERP_SPEED`, it affects how smoothly the camera adjusts its focus point.

---

## WORLD

Defines global properties and boundaries of the game world.

-   **`MAP_BOUNDARY`**:
    -   **Description**: The maximum boundary for Katamari movement, preventing it from going too far out of bounds. This is a larger boundary than `LEVEL.MAP_BOUNDARY` and typically defines the absolute edge of the playable universe.
    -   **Value**: `500`.
    -   **Impact**: Defines the overall size of the game world. Exceeding this boundary might trigger game over conditions or simply prevent further movement.

-   **`ITEM_SPAWN_RADIUS`**:
    -   **Description**: The default radius within which items are spawned around the Katamari.
    -   **Value**: `100`.
    -   **Impact**: Controls the density and distribution of items around the player.

-   **`ITEM_SPAWN_COUNT`**:
    -   **Description**: The default number of items to spawn at a time when new items are generated.
    -   **Value**: `200`.
    -   **Impact**: Directly affects the item density and the rate at which the player can collect items.

-   **`INITIAL_ITEM_SPAWN_RADIUS`**:
    -   **Description**: The radius for initial item spawning when a level begins. This can be different from `ITEM_SPAWN_RADIUS` to ensure a good starting density.
    -   **Value**: `180`.
    -   **Impact**: Influences the initial item distribution and the immediate challenge at the start of a level.

-   **`MIN_SPAWN_DISTANCE`**:
    -   **Description**: The minimum distance from the center (or Katamari) for item spawning to avoid immediate collection of newly spawned items.
    -   **Value**: `10`.
    -   **Impact**: Prevents items from spawning directly on top of the Katamari, giving the player a chance to react and move towards them.

---

## PERFORMANCE

Parameters for optimizing and monitoring game performance.

-   **`EXPENSIVE_OPERATIONS_FREQUENCY`**:
    -   **Description**: The probability (0-1) per frame for executing expensive operations (e.g., complex calculations, physics updates for many objects). This helps distribute heavy computations over multiple frames.
    -   **Value**: `0.1` (10% chance per frame).
    -   **Impact**: A lower frequency improves average frame rate but might introduce occasional visual hitches if the operations are very heavy. A higher frequency ensures more up-to-date calculations but can reduce overall frame rate.

-   **`UI_UPDATE_FREQUENCY`**:
    -   **Description**: The probability (0-1) per frame for updating UI elements. Updating UI every frame can be costly.
    -   **Value**: `0.3` (30% chance per frame).
    -   **Impact**: A lower frequency reduces UI responsiveness but improves performance. A higher frequency makes the UI more real-time but can impact frame rate.

-   **`SPEED_SMOOTHING_FACTOR`**:
    -   **Description**: A smoothing factor for the displayed Katamari speed, reducing jitter and providing a more stable reading.
    -   **Value**: `0.9`.
    -   **Impact**: A higher factor results in a smoother, more averaged speed display. A lower factor makes the display more reactive to instantaneous speed changes.

-   **`VELOCITY_SMOOTHING_FACTOR`**:
    -   **Description**: The contribution of raw velocity to the smoothed speed calculation.
    -   **Value**: `0.1`.
    -   **Impact**: Determines how much the immediate velocity influences the smoothed speed.

-   **`MOVEMENT_THRESHOLD`**:
    -   **Description**: The minimum velocity magnitude required to consider the Katamari as actively moving. Below this threshold, it might be considered idle.
    -   **Value**: `0.1`.
    -   **Impact**: Used for various game logic, such as triggering idle animations or applying idle damping.

-   **`PERFORMANCE_DEGRADATION_THRESHOLD`**:
    -   **Description**: A threshold (0-1) below which performance is considered degraded (e.g., 80% of target frame rate).
    -   **Value**: `0.8`.
    -   **Impact**: Used for internal performance monitoring and potentially triggering adaptive quality settings.

-   **`MAX_CONSECUTIVE_LOW_FRAMES`**:
    -   **Description**: The number of consecutive low-frame-rate frames before a performance alert is triggered or adaptive measures are taken.
    -   **Value**: `30`.
    -   **Impact**: Helps identify sustained performance issues rather than momentary dips.

-   **`FRAME_TIME_SMOOTHING`**:
    -   **Description**: A smoothing factor for averaging frame times, used for performance monitoring.
    -   **Value**: `0.95`.
    -   **Impact**: A higher factor provides a more stable average frame time, less susceptible to momentary spikes.

-   **`PHYSICS_TIME_BUDGET_RATIO`**:
    -   **Description**: The maximum proportion of a frame's time budget that physics calculations should consume. This helps prevent physics from monopolizing CPU time.
    -   **Value**: `0.5` (50% of frame time).
    -   **Impact**: Ensures that other game systems (rendering, AI, etc.) have enough time to execute, preventing bottlenecks.

---

## MOVEMENT

Parameters governing the Katamari's movement, including acceleration, speed limits, and damping.

-   **`BASE_ACCELERATION`**:
    -   **Description**: The base acceleration applied to the Katamari for movement.
    -   **Value**: `80`.
    -   **Impact**: Determines how quickly the Katamari speeds up from a standstill.

-   **`MAX_ACCELERATION`**:
    -   **Description**: The maximum acceleration the Katamari can achieve.
    -   **Value**: `200`.
    -   **Impact**: Caps the rate at which the Katamari can increase its speed.

-   **`ACCELERATION_RADIUS_MULTIPLIER`**:
    -   **Description**: How much acceleration increases with the Katamari's radius. This makes larger Katamaris accelerate faster.
    -   **Value**: `2`.
    -   **Impact**: A higher multiplier makes larger Katamaris feel more powerful and easier to maneuver at high speeds.

-   **`MAX_SPEED`**:
    -   **Description**: The maximum linear velocity (speed) the Katamari can reach.
    -   **Value**: `25`.
    -   **Impact**: Sets the upper limit for the Katamari's movement speed.

-   **`MAX_ANGULAR_SPEED`**:
    -   **Description**: The maximum angular velocity (rotation speed) the Katamari can reach.
    -   **Value**: `8`.
    -   **Impact**: Sets the upper limit for how fast the Katamari can rotate.

-   **`ACTIVE_LINEAR_DAMPING`**:
    -   **Description**: Linear damping applied when the Katamari is actively moving. Damping reduces velocity over time.
    -   **Value**: `0.05`.
    -   **Impact**: A higher value makes the Katamari slow down faster when actively moving, making it feel more responsive to input changes.

-   **`ACTIVE_ANGULAR_DAMPING`**:
    -   **Description**: Angular damping applied when the Katamari is actively moving.
    -   **Value**: `0.05`.
    -   **Impact**: Similar to linear damping, but for rotation.

-   **`IDLE_LINEAR_DAMPING`**:
    -   **Description**: Linear damping applied when the Katamari is not actively moving (at rest or very low velocity). This helps it come to a complete stop.
    -   **Value**: `0.9`.
    -   **Impact**: A higher value makes the Katamari stop more quickly when no input is given.

-   **`IDLE_ANGULAR_DAMPING`**:
    -   **Description**: Angular damping applied when the Katamari is not actively moving.
    -   **Value**: `0.9`.
    -   **Impact**: Similar to linear damping, but for rotation when idle.

-   **`GYRO_SENSITIVITY`**:
    -   **Description**: Sensitivity of gyroscope input for movement control.
    -   **Value**: `0.8`.
    -   **Impact**: A higher value makes the Katamari react more strongly to device tilting.

-   **`GYRO_THRESHOLD`**:
    -   **Description**: The minimum gyroscope input required to register movement. Input below this threshold is ignored.
    -   **Value**: `0.1`.
    -   **Impact**: Prevents minor, unintentional device movements from affecting the Katamari.

-   **`TORQUE_MULTIPLIER`**:
    -   **Description**: A multiplier used in calculating the torque applied to the Katamari based on input. Torque causes rotation.
    -   **Value**: `0.5`.
    -   **Impact**: A higher multiplier makes the Katamari turn more sharply.

---

## VISUAL

Parameters related to the visual appearance and animations of the Katamari and other game elements.

-   **`KATAMARI_GEOMETRY_SEGMENTS`**:
    -   **Description**: The number of segments used to define the Katamari's sphere geometry. More segments result in a smoother-looking sphere.
    -   **Value**: `32`.
    -   **Impact**: Higher values improve visual quality but increase polygon count and rendering load.

-   **`KATAMARI_MATERIAL_ROUGHNESS`**:
    -   **Description**: The roughness property of the Katamari's material (0 = perfectly smooth/glossy, 1 = completely rough/matte).
    -   **Value**: `0.6`.
    -   **Impact**: Affects how light reflects off the Katamari's surface.

-   **`KATAMARI_MATERIAL_METALNESS`**:
    -   **Description**: The metalness property of the Katamari's material (0 = dielectric/non-metal, 1 = metallic).
    -   **Value**: `0.1`.
    -   **Impact**: Influences how the Katamari interacts with light, giving it a more or less metallic appearance.

-   **`TEXTURE_SIZE`**:
    -   **Description**: The resolution of the Katamari's texture canvas (e.g., 512x512 pixels). This is where collected items are "painted" onto the Katamari's surface.
    -   **Value**: `512`.
    -   **Impact**: A higher resolution texture results in sharper, more detailed items on the Katamari's surface but consumes more VRAM.

-   **`OCEAN_SPOTS_COUNT`**:
    -   **Description**: The number of distinct 'ocean' spots or variations on the Katamari's texture. These are typically areas that remain relatively clear of collected items.
    -   **Value**: `20`.
    -   **Impact**: Affects the visual diversity and pattern of the Katamari's surface.

-   **`CONTINENT_COUNT`**:
    -   **Description**: The number of large 'continent' shapes on the Katamari's texture. These are areas where items tend to cluster.
    -   **Value**: `8`.
    -   **Impact**: Influences the distribution and clustering of items on the Katamari's surface.

-   **`ISLAND_COUNT`**:
    -   **Description**: The number of small 'island' shapes on the Katamari's texture.
    -   **Value**: `25`.
    -   **Impact**: Adds more granular detail to the item distribution.

-   **`MOUNTAIN_RANGE_COUNT`**:
    -   **Description**: The number of mountain range patterns on the Katamari's texture.
    -   **Value**: `15`.
    -   **Impact**: Contributes to the visual complexity of the Katamari's surface.

-   **`CLOUD_COUNT`**:
    -   **Description**: The number of cloud patterns on the Katamari's texture.
    -   **Value**: `30`.
    -   **Impact**: Adds atmospheric visual elements to the Katamari's surface.

-   **`GROWTH_LERP_BASE_SPEED`**:
    -   **Description**: The base linear interpolation (LERP) speed for the Katamari's size growth animation.
    -   **Value**: `0.08`.
    -   **Impact**: A higher value makes the Katamari grow more quickly and responsively.

-   **`GROWTH_LERP_MAX_SPEED`**:
    -   **Description**: The maximum linear interpolation speed for the Katamari's size growth animation.
    -   **Value**: `0.15`.
    -   **Impact**: Caps the speed of the growth animation, preventing it from becoming too fast.

-   **`GROWTH_LERP_ACCELERATION`**:
    -   **Description**: The acceleration factor for the Katamari's size growth animation.
    -   **Value**: `0.5`.
    -   **Impact**: A higher value makes the growth animation speed up more rapidly.

-   **`GROWTH_SNAP_THRESHOLD`**:
    -   **Description**: The threshold at which the Katamari's size snaps to the target size during the growth animation. This prevents tiny, lingering growth animations.
    -   **Value**: `0.01`.
    -   **Impact**: Ensures the growth animation concludes cleanly.

-   **`ITEM_ROTATION_Y_SPEED`**:
    -   **Description**: The rotation speed around the Y-axis for attached items.
    -   **Value**: `0.5`.
    -   **Impact**: Adds dynamic rotation to collected items on the Katamari's surface.

-   **`ITEM_ROTATION_X_SPEED`**:
    -   **Description**: The rotation speed around the X-axis for attached items.
    -   **Value**: `0.3`.
    -   **Impact**: Adds another dimension of dynamic rotation to collected items.

---

## UI

Parameters for user interface elements and their behavior.

-   **`ALERT_DURATION`**:
    -   **Description**: The default duration for on-screen alerts or notifications.
    -   **Value**: `3000` (milliseconds, or 3 seconds).
    -   **Impact**: Controls how long messages remain visible to the player.

-   **`DECIMAL_PLACES`**:
    -   **Description**: The number of decimal places to display for size and speed values in the UI.
    -   **Value**: `2`.
    -   **Impact**: Affects the precision of numerical displays.

-   **`PROGRESS_MAX`**:
    -   **Description**: The maximum value for progress bars (e.g., level completion, power-up duration).
    -   **Value**: `100`.
    -   **Impact**: Defines the scale of progress indicators.

-   **`POWER_UP_TIME_DECIMAL_PLACES`**:
    -   **Description**: The number of decimal places for the power-up countdown timer.
    -   **Value**: `1`.
    -   **Impact**: Affects the precision of the power-up timer display.

-   **`POWER_UP_TIME_DIVISOR`**:
    -   **Description**: A divisor used to convert power-up duration from milliseconds to seconds for display purposes.
    -   **Value**: `1000`.
    -   **Impact**: Ensures the timer is displayed in a human-readable format (seconds).

-   **`LOADING_SIMULATION_TIME`**:
    -   **Description**: Simulated loading time for UI elements or transitions. This can be used to provide a smoother user experience during asset loading or scene changes.
    -   **Value**: `1500` (milliseconds, or 1.5 seconds).
    -   **Impact**: A longer simulated time can mask actual loading delays but might make the UI feel sluggish.

---

## ITEM_GENERATION

Parameters controlling the spawning, fading, and physical properties of items in the game world.

-   **`FADE_DURATION`**:
    -   **Description**: The duration for item fade-in animation when spawned. This is a specific fade duration for newly generated items, potentially different from `RENDERING.ITEM_FADE_DURATION`.
    -   **Value**: `500` (milliseconds).
    -   **Impact**: Controls how quickly newly spawned items become fully visible.

-   **`CLEANUP_DISTANCE_THRESHOLD`**:
    -   **Description**: The distance from the Katamari at which items are removed from the scene to optimize performance. Items beyond this distance are considered irrelevant.
    -   **Value**: `180`.
    -   **Impact**: A smaller threshold means more aggressive cleanup, improving performance but potentially causing items to disappear abruptly. A larger threshold keeps more items in memory.

-   **`LINEAR_DAMPING`**:
    -   **Description**: Linear damping applied to item physics bodies, reducing their linear velocity over time. This makes items slow down naturally.
    -   **Value**: `0.1`.
    -   **Impact**: A higher value makes items slow down faster.

-   **`ANGULAR_DAMPING`**:
    -   **Description**: Angular damping applied to item physics bodies, reducing their rotational velocity over time.
    -   **Value**: `0.1`.
    -   **Impact**: A higher value makes items stop spinning faster.

-   **`DEFAULT_GEOMETRY_SIZE`**:
    -   **Description**: The default size multiplier for item geometries.
    -   **Value**: `1`.
    -   **Impact**: A global scaling factor for all item models.

-   **`SPHERE_WIDTH_SEGMENTS`**:
    -   **Description**: The number of width segments for sphere geometries used in items. More segments result in smoother spheres.
    -   **Value**: `8`.
    -   **Impact**: Affects the visual quality of spherical items.

-   **`SPHERE_HEIGHT_SEGMENTS`**:
    -   **Description**: The number of height segments for sphere geometries used in items.
    -   **Value**: `6`.
    -   **Impact**: Affects the visual quality of spherical items.

-   **`CYLINDER_RADIAL_SEGMENTS`**:
    -   **Description**: The number of radial segments for cylinder geometries used in items. More segments result in smoother cylinders.
    -   **Value**: `8`.
    -   **Impact**: Affects the visual quality of cylindrical items.

---

## ENVIRONMENT

Defines parameters for the game environment, such as cloud and mountain counts.

-   **`CLOUD_COUNT`**:
    -   **Description**: The number of clouds to generate in the environment.
    -   **Value**: `15`.
    -   **Impact**: Affects the visual density of clouds in the sky.

-   **`MOUNTAIN_COUNT`**:
    -   **Description**: The number of mountains to generate in the environment.
    -   **Value**: `8`.
    -   **Impact**: Affects the visual density of mountains in the background.

-   **`SAFE_ZONE_RADIUS`**:
    -   **Description**: The radius around the origin where mountains should not spawn to ensure a clear play area for the Katamari.
    -   **Value**: `50`.
    -   **Impact**: Prevents large environmental obstacles from blocking the initial gameplay area.

---

## LIGHTING

Parameters for configuring the lighting in the 3D scene.

-   **`AMBIENT_COLOR`**:
    -   **Description**: The color of the ambient light, which illuminates all objects equally from all directions. It provides a base level of illumination.
    -   **Value**: `0x404040` (a dark gray).
    -   **Impact**: A brighter ambient color makes the scene generally lighter, even in shadowed areas.

-   **`HEMISPHERE_SKY_COLOR`**:
    -   **Description**: The color of the sky part of the hemisphere light. Hemisphere light simulates light coming from the sky and ground.
    -   **Value**: `0xADD8E6` (light blue).
    -   **Impact**: Influences the color of light hitting the top surfaces of objects.

-   **`HEMISPHERE_GROUND_COLOR`**:
    -   **Description**: The color of the ground part of the hemisphere light.
    -   **Value**: `0x8B4513` (saddle brown).
    -   **Impact**: Influences the color of light hitting the bottom surfaces of objects.

-   **`HEMISPHERE_INTENSITY`**:
    -   **Description**: The intensity of the hemisphere light.
    -   **Value**: `0.8`.
    -   **Impact**: Controls the overall brightness of the hemisphere lighting.

-   **`DIRECTIONAL_COLOR`**:
    -   **Description**: The color of the directional light, which simulates sunlight or a distant light source. It casts parallel rays of light.
    -   **Value**: `0xffffff` (white).
    -   **Impact**: Determines the color of direct illumination and shadows.

-   **`DIRECTIONAL_INTENSITY`**:
    -   **Description**: The intensity of the directional light.
    -   **Value**: `1.5`.
    -   **Impact**: Controls the brightness of direct illumination.

-   **`DIRECTIONAL_POSITION`**:
    -   **Description**: The position of the directional light source. While directional light rays are parallel, its position affects the direction of the light and shadows.
    -   **Value**: `{ x: 20, y: 50, z: 20 }`.
    -   **Impact**: Changes the angle of sunlight and the direction of shadows.

-   **`SHADOW_CAMERA_SIZE`**:
    -   **Description**: The size of the camera used for rendering shadows from the directional light. This camera captures the scene from the light's perspective to create a shadow map.
    -   **Value**: `50`.
    -   **Impact**: A larger size captures a wider area for shadows but can reduce shadow map resolution within that area. A smaller size provides higher resolution shadows for a smaller area.

-   **`SHADOW_BIAS`**:
    -   **Description**: A small offset applied to shadow calculations to prevent "shadow acne" (self-shadowing artifacts) or "peter-panning" (shadows detaching from objects).
    -   **Value**: `-0.0005`.
    -   **Impact**: Adjusting this value helps fine-tune shadow appearance. Too high can cause peter-panning, too low can cause shadow acne.

---

## THEMES

Defines different game themes, each with a unique story, set of items, and visual properties. This is an array of theme objects.

Each theme object has the following properties:

-   **`themeName`**:
    -   **Description**: A human-readable name for the theme.
    -   **Example**: `"Our Green Earth"`
    -   **Impact**: Used for display in UI and for identifying the theme.

-   **`story`**:
    -   **Description**: A brief narrative or description for the theme, setting the context for the player.
    -   **Example**: `"The King of All Cosmos demands a pristine Earth! Roll up all the litter and grow your Katamari!"`
    -   **Impact**: Enhances the game's narrative and player engagement.

-   **`items`**:
    -   **Description**: An array of strings, where each string is the display name of an item that can appear in this theme. These names correspond to keys in `INSTANCED_ITEM_MAP`.
    -   **Example**: `["Rock", "Bush", "Flower", ...]`
    -   **Impact**: Determines the variety and type of objects the player will encounter and collect within a specific theme.

-   **`groundColor`**:
    -   **Description**: The hexadecimal color code for the ground in this theme.
    -   **Example**: `"#4CAF50"` (a shade of green).
    -   **Impact**: Sets the primary color of the terrain, contributing to the overall visual mood of the theme.

-   **`skyColor`**:
    -   **Description**: The hexadecimal color code for the sky in this theme.
    -   **Example**: `"#87CEEB"` (light blue).
    -   **Impact**: Sets the primary color of the sky, complementing the ground color and theme.

-   **`baseTargetSize`**:
    -   **Description**: The base target size for the Katamari in this specific theme. This overrides `KATAMARI.INITIAL_TARGET_SIZE` for themed levels.
    -   **Example**: `25`.
    -   **Impact**: Defines the objective size for the Katamari within this theme, influencing level duration and difficulty.

---

## INSTANCED_ITEM_MAP

Maps display names of items (used in `THEMES`) to their corresponding instanced mesh names for rendering. This allows for efficient rendering of many identical objects.

-   **Description**: An object where keys are the human-readable item names (as found in `THEMES.items`) and values are the internal, programmatic names used to reference the actual 3D models or instanced geometries.
-   **Example**:
    ```javascript
    'Rock': 'rock',
    'Bush': 'bush',
    'Traffic Cone': 'trafficCone',
    // ... and so on
    ```
-   **Impact**: Essential for connecting the thematic item lists to the actual renderable assets. If a new item type is added to a theme, it must have a corresponding entry here that maps to an existing or new 3D model.
