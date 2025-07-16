# Requirements Document

## Introduction

The Katamari-JS game has been refactored from a working single-file structure to a modular structure, but this refactoring has introduced critical bugs that are affecting gameplay. The main issues are items hovering in the air instead of falling properly due to physics simulation problems, and severe performance degradation causing very low FPS. The working backup (index.html.backup) contains the functional single-file version that can be used as reference to identify and fix the bugs in the modular implementation.

## Requirements

### Requirement 1

**User Story:** As a player, I want items to fall and behave realistically with proper physics, so that the game feels natural and engaging.

#### Acceptance Criteria

1. WHEN items are spawned THEN they SHALL fall to the ground under gravity
2. WHEN items collide with the ground THEN they SHALL rest on the surface without hovering
3. WHEN the katamari approaches items THEN physics bodies SHALL be properly activated for realistic interaction
4. WHEN items are collected THEN their physics bodies SHALL be properly removed from the physics world
5. IF an item is too far from the katamari THEN its physics body SHALL be deactivated to optimize performance

### Requirement 2

**User Story:** As a player, I want the game to run smoothly at 60 FPS, so that the gameplay experience is fluid and responsive.

#### Acceptance Criteria

1. WHEN the game is running THEN it SHALL maintain consistent 60 FPS performance
2. WHEN multiple items are present THEN the physics simulation SHALL not cause frame drops
3. WHEN items are generated dynamically THEN the performance SHALL remain stable
4. WHEN physics bodies are activated/deactivated THEN there SHALL be no performance spikes
5. IF the FPS drops below acceptable levels THEN the system SHALL automatically optimize by reducing active physics bodies

### Requirement 3

**User Story:** As a player, I want the katamari to interact properly with items, so that I can collect objects and grow as intended.

#### Acceptance Criteria

1. WHEN the katamari touches a collectible item THEN the item SHALL be absorbed into the katamari
2. WHEN an item is collected THEN the katamari size SHALL increase appropriately
3. WHEN the katamari approaches items THEN they SHALL be attracted with proper physics forces
4. WHEN items are too large to collect THEN they SHALL still interact physically with the katamari
5. IF the katamari collides with the ground THEN it SHALL roll realistically without clipping

### Requirement 4

**User Story:** As a developer, I want the modular code structure to maintain the same functionality as the working backup, so that the refactoring benefits are preserved without losing game features.

#### Acceptance Criteria

1. WHEN comparing modular vs backup versions THEN all core game mechanics SHALL function identically
2. WHEN physics systems are modularized THEN they SHALL maintain the same simulation quality
3. WHEN item management is modularized THEN collection and spawning SHALL work as in the backup
4. WHEN audio systems are modularized THEN sound effects SHALL trigger at appropriate times
5. IF any functionality differs from the backup THEN it SHALL be corrected to match the working implementation

### Requirement 5

**User Story:** As a player, I want the game to load and initialize properly, so that I can start playing without technical issues.

#### Acceptance Criteria

1. WHEN the game loads THEN all modules SHALL initialize without errors
2. WHEN the physics world is created THEN it SHALL be properly configured with correct gravity and constraints
3. WHEN the scene is initialized THEN all visual elements SHALL render correctly
4. WHEN audio systems initialize THEN they SHALL be ready for sound playback
5. IF any module fails to load THEN the system SHALL provide clear error messages for debugging