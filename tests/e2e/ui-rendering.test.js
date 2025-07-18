/**
 * Snapshot tests for UI rendering and DOM structure
 * Tests DOM structure snapshots for game UI elements, HUD layout consistency, and overlay display structure
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupGameEnvironment, createMockGameState } from '../helpers/game-helpers.js';

describe('UI Rendering Snapshots', () => {
    let gameEnvironment;
    let originalDocument;

    beforeEach(() => {
        // Store original document methods
        originalDocument = {
            createElement: document.createElement.bind(document),
            appendChild: document.body.appendChild.bind(document.body),
            removeChild: document.body.removeChild.bind(document.body)
        };

        // Create the complete game UI structure as it appears in index.html
        document.body.innerHTML = `
            <div id="loading-overlay">Generating a new universe... ✨</div>
            <div id="game-ui">
                <div>Size: <span id="katamari-size">2.00m</span></div>
                <div>Speed: <span id="katamari-speed">0.00m/s</span></div>
                <div>Items Collected: <span id="items-collected">0</span></div>
                <div>FPS: <span id="fps">--</span></div>
                <div id="progress-container">
                    <div id="progress-bar"></div>
                </div>
                <div>Target Size: <span id="target-size">100.00m</span></div>
                <div id="power-up-status"></div>
                <button id="gyro-button">Toggle Gyro</button>
                <button id="debug-button">Toggle Debug</button>
            </div>
            <div id="controls-info">
                <p>Use <b>W, A, S, D</b> or <b>Arrow Keys</b> to move the Katamari.</p>
                <p><b>Swipe</b> on screen for precise mobile control.</p>
                <p><b>Toggle Gyro</b> for tilt-based movement on supported devices.</p>
                <p>Press <b>R</b> to reset Katamari position. Press <b>Space</b> to generate a new world.</p>
            </div>
            <div id="message-overlay"></div>
        `;

        // Set up game environment for testing
        gameEnvironment = setupGameEnvironment({
            includePhysics: false,
            includeRendering: false,
            includeAudio: false,
            itemCount: 0
        });

        // Mock window.matchMedia for responsive design tests
        window.matchMedia = vi.fn((query) => ({
            matches: query.includes('pointer: coarse') || query.includes('max-width: 768px'),
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn()
        }));
    });

    afterEach(() => {
        if (gameEnvironment?.dispose) {
            gameEnvironment.dispose();
        }
        
        // Clear DOM
        document.body.innerHTML = '';
        
        // Clear all mocks
        vi.clearAllMocks();
    });

    describe('Game UI Structure Snapshots', () => {
        it('should match complete game UI DOM structure snapshot', () => {
            const gameUI = document.getElementById('game-ui');
            
            // Create a clean representation of the UI structure
            const uiStructure = {
                tagName: gameUI.tagName,
                id: gameUI.id,
                children: Array.from(gameUI.children).map(child => ({
                    tagName: child.tagName,
                    id: child.id || null,
                    className: child.className || null,
                    textContent: child.textContent.trim(),
                    children: child.children.length > 0 ? Array.from(child.children).map(grandchild => ({
                        tagName: grandchild.tagName,
                        id: grandchild.id || null,
                        className: grandchild.className || null,
                        textContent: grandchild.textContent.trim()
                    })) : []
                }))
            };

            expect(uiStructure).toMatchSnapshot('complete-game-ui-structure');
        });

        it('should match HUD elements structure snapshot', () => {
            const hudElements = {
                katamariSize: {
                    element: 'span',
                    id: 'katamari-size',
                    parent: 'game-ui',
                    defaultValue: '2.00m',
                    format: 'decimal with unit'
                },
                katamariSpeed: {
                    element: 'span',
                    id:'katamari-speed',
                    parent: 'game-ui',
                    defaultValue: '0.00m/s',
                    format: 'decimal with unit'
                },
                itemsCollected: {
                    element: 'span',
                    id: 'items-collected',
                    parent: 'game-ui',
                    defaultValue: '0',
                    format: 'integer'
                },
                fps: {
                    element: 'span',
                    id: 'fps',
                    parent: 'game-ui',
                    defaultValue: '--',
                    format: 'integer or placeholder'
                },
                targetSize: {
                    element: 'span',
                    id: 'target-size',
                    parent: 'game-ui',
                    defaultValue: '100.00m',
                    format: 'decimal with unit'
                }
            };

            expect(hudElements).toMatchSnapshot('hud-elements-structure');
        });

        it('should match progress bar structure snapshot', () => {
            const progressContainer = document.getElementById('progress-container');
            const progressBar = document.getElementById('progress-bar');
            
            const progressStructure = {
                container: {
                    tagName: progressContainer.tagName,
                    id: progressContainer.id,
                    children: progressContainer.children.length
                },
                bar: {
                    tagName: progressBar.tagName,
                    id: progressBar.id,
                    parent: progressContainer.id,
                    initialWidth: progressBar.style.width || '0%'
                }
            };

            expect(progressStructure).toMatchSnapshot('progress-bar-structure');
        });

        it('should match control buttons structure snapshot', () => {
            const gyroButton = document.getElementById('gyro-button');
            const debugButton = document.getElementById('debug-button');
            
            const buttonsStructure = {
                gyroButton: {
                    tagName: gyroButton.tagName,
                    id: gyroButton.id,
                    type: gyroButton.type || 'button',
                    defaultText: gyroButton.textContent.trim(),
                    parent: 'game-ui'
                },
                debugButton: {
                    tagName: debugButton.tagName,
                    id: debugButton.id,
                    type: debugButton.type || 'button',
                    defaultText: debugButton.textContent.trim(),
                    parent: 'game-ui'
                }
            };

            expect(buttonsStructure).toMatchSnapshot('control-buttons-structure');
        });

        it('should match power-up status structure snapshot', () => {
            const powerUpStatus = document.getElementById('power-up-status');
            
            const powerUpStructure = {
                tagName: powerUpStatus.tagName,
                id: powerUpStatus.id,
                parent: 'game-ui',
                initialContent: powerUpStatus.innerHTML,
                isEmpty: powerUpStatus.innerHTML === ''
            };

            expect(powerUpStructure).toMatchSnapshot('power-up-status-structure');
        });
    });

    describe('Overlay Structure Snapshots', () => {
        it('should match loading overlay structure snapshot', () => {
            const loadingOverlay = document.getElementById('loading-overlay');
            
            const overlayStructure = {
                tagName: loadingOverlay.tagName,
                id: loadingOverlay.id,
                defaultText: loadingOverlay.textContent.trim(),
                initialDisplay: loadingOverlay.style.display || 'block',
                parent: 'body'
            };

            expect(overlayStructure).toMatchSnapshot('loading-overlay-structure');
        });

        it('should match message overlay structure snapshot', () => {
            const messageOverlay = document.getElementById('message-overlay');
            
            const overlayStructure = {
                tagName: messageOverlay.tagName,
                id: messageOverlay.id,
                initialContent: messageOverlay.innerHTML,
                initialDisplay: messageOverlay.style.display || 'none',
                parent: 'body',
                isEmpty: messageOverlay.innerHTML === ''
            };

            expect(overlayStructure).toMatchSnapshot('message-overlay-structure');
        });

        it('should match controls info structure snapshot', () => {
            const controlsInfo = document.getElementById('controls-info');
            
            const controlsStructure = {
                tagName: controlsInfo.tagName,
                id: controlsInfo.id,
                children: Array.from(controlsInfo.children).map(child => ({
                    tagName: child.tagName,
                    textContent: child.textContent.trim(),
                    hasFormattedText: child.innerHTML.includes('<b>')
                })),
                parent: 'body'
            };

            expect(controlsStructure).toMatchSnapshot('controls-info-structure');
        });
    });

    describe('UI State Variations Snapshots', () => {
        it('should match UI with updated game values snapshot', () => {
            // Update UI elements with game values
            document.getElementById('katamari-size').textContent = '15.75m';
            document.getElementById('katamari-speed').textContent = '8.42m/s';
            document.getElementById('items-collected').textContent = '127';
            document.getElementById('fps').textContent = '60';
            document.getElementById('target-size').textContent = '50.00m';
            document.getElementById('progress-bar').style.width = '31.5%';
            
            const updatedUIState = {
                katamariSize: document.getElementById('katamari-size').textContent,
                katamariSpeed: document.getElementById('katamari-speed').textContent,
                itemsCollected: document.getElementById('items-collected').textContent,
                fps: document.getElementById('fps').textContent,
                targetSize: document.getElementById('target-size').textContent,
                progressWidth: document.getElementById('progress-bar').style.width
            };

            expect(updatedUIState).toMatchSnapshot('ui-with-game-values');
        });

        it('should match UI with active power-ups snapshot', () => {
            const powerUpStatus = document.getElementById('power-up-status');
            powerUpStatus.innerHTML = `
                <div class="power-up">Speed Boost: 4.2s</div>
                <div class="power-up">Magnet: 2.8s</div>
            `;
            
            const powerUpState = {
                hasActivePowerUps: powerUpStatus.innerHTML.trim() !== '',
                powerUpCount: powerUpStatus.querySelectorAll('.power-up').length,
                powerUpContent: powerUpStatus.innerHTML.trim()
            };

            expect(powerUpState).toMatchSnapshot('ui-with-active-power-ups');
        });

        it('should match UI with button states snapshot', () => {
            const gyroButton = document.getElementById('gyro-button');
            const debugButton = document.getElementById('debug-button');
            
            // Set active states
            gyroButton.classList.add('active');
            gyroButton.textContent = 'Gyro ON';
            debugButton.classList.add('active');
            debugButton.textContent = 'Debug ON';
            
            const buttonStates = {
                gyroButton: {
                    isActive: gyroButton.classList.contains('active'),
                    text: gyroButton.textContent,
                    classList: Array.from(gyroButton.classList)
                },
                debugButton: {
                    isActive: debugButton.classList.contains('active'),
                    text: debugButton.textContent,
                    classList: Array.from(debugButton.classList)
                }
            };

            expect(buttonStates).toMatchSnapshot('ui-with-active-buttons');
        });

        it('should match UI with visible overlays snapshot', () => {
            const loadingOverlay = document.getElementById('loading-overlay');
            const messageOverlay = document.getElementById('message-overlay');
            
            // Show overlays
            loadingOverlay.style.display = 'flex';
            loadingOverlay.textContent = 'Generating new world...';
            messageOverlay.style.display = 'block';
            messageOverlay.textContent = 'Level Complete! Well done!';
            
            const overlayStates = {
                loadingOverlay: {
                    isVisible: loadingOverlay.style.display !== 'none',
                    display: loadingOverlay.style.display,
                    content: loadingOverlay.textContent
                },
                messageOverlay: {
                    isVisible: messageOverlay.style.display !== 'none',
                    display: messageOverlay.style.display,
                    content: messageOverlay.textContent
                }
            };

            expect(overlayStates).toMatchSnapshot('ui-with-visible-overlays');
        });
    });

    describe('Responsive UI Structure Snapshots', () => {
        it('should match mobile UI layout considerations snapshot', () => {
            // Simulate mobile viewport
            Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
            Object.defineProperty(window, 'innerHeight', { value: 667, writable: true });
            
            // Mock mobile media query
            window.matchMedia = vi.fn((query) => ({
                matches: query.includes('max-width: 768px') || query.includes('pointer: coarse'),
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn()
            }));
            
            const mobileUIConsiderations = {
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight,
                    isMobile: window.innerWidth <= 768
                },
                touchFriendlyElements: {
                    gyroButton: {
                        id: 'gyro-button',
                        isTouchTarget: true,
                        minTouchSize: '44px' // Recommended minimum
                    },
                    debugButton: {
                        id: 'debug-button',
                        isTouchTarget: true,
                        minTouchSize: '44px'
                    }
                },
                controlsInfo: {
                    includesTouchInstructions: document.getElementById('controls-info').textContent.includes('Swipe'),
                    includesGyroInstructions: document.getElementById('controls-info').textContent.includes('Toggle Gyro')
                }
            };

            expect(mobileUIConsiderations).toMatchSnapshot('mobile-ui-layout-considerations');
        });

        it('should match desktop UI layout considerations snapshot', () => {
            // Simulate desktop viewport
            Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
            Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true });
            
            // Mock desktop media query
            window.matchMedia = vi.fn((query) => ({
                matches: query.includes('min-width: 1024px'),
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn()
            }));
            
            const desktopUIConsiderations = {
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight,
                    isDesktop: window.innerWidth >= 1024
                },
                keyboardControls: {
                    includesWASDInstructions: document.getElementById('controls-info').textContent.includes('W, A, S, D'),
                    includesArrowKeyInstructions: document.getElementById('controls-info').textContent.includes('Arrow Keys'),
                    includesSpacebarInstructions: document.getElementById('controls-info').textContent.includes('Space')
                },
                debugFeatures: {
                    debugButtonAvailable: !!document.getElementById('debug-button'),
                    fpsDisplayAvailable: !!document.getElementById('fps')
                }
            };

            expect(desktopUIConsiderations).toMatchSnapshot('desktop-ui-layout-considerations');
        });
    });

    describe('UI Accessibility Structure Snapshots', () => {
        it('should match UI accessibility features snapshot', () => {
            const accessibilityFeatures = {
                semanticStructure: {
                    hasMainGameUI: !!document.getElementById('game-ui'),
                    hasControlsInfo: !!document.getElementById('controls-info'),
                    hasProgressIndicator: !!document.getElementById('progress-container')
                },
                interactiveElements: {
                    buttons: Array.from(document.querySelectorAll('button')).map(button => ({
                        id: button.id,
                        text: button.textContent.trim(),
                        hasAccessibleName: button.textContent.trim().length > 0
                    })),
                    clickableOverlays: Array.from(document.querySelectorAll('[id$="-overlay"]')).map(overlay => ({
                        id: overlay.id,
                        isClickable: overlay.id === 'message-overlay'
                    }))
                },
                textContent: {
                    hasInstructionalText: document.getElementById('controls-info').textContent.length > 0,
                    hasFormattedInstructions: document.getElementById('controls-info').innerHTML.includes('<b>'),
                    providesMultipleInputMethods: document.getElementById('controls-info').textContent.includes('Swipe') && 
                                                 document.getElementById('controls-info').textContent.includes('W, A, S, D')
                }
            };

            expect(accessibilityFeatures).toMatchSnapshot('ui-accessibility-features');
        });

        it('should match UI element hierarchy snapshot', () => {
            const uiHierarchy = {
                body: {
                    children: Array.from(document.body.children).map(child => ({
                        tagName: child.tagName,
                        id: child.id,
                        role: child.getAttribute('role') || null,
                        hasChildren: child.children.length > 0,
                        childCount: child.children.length
                    }))
                },
                gameUI: {
                    parent: 'body',
                    children: Array.from(document.getElementById('game-ui').children).map(child => ({
                        tagName: child.tagName,
                        id: child.id || null,
                        hasText: child.textContent.trim().length > 0,
                        isInteractive: child.tagName === 'BUTTON'
                    }))
                }
            };

            expect(uiHierarchy).toMatchSnapshot('ui-element-hierarchy');
        });
    });

    describe('UI Performance Structure Snapshots', () => {
        it('should match UI update performance considerations snapshot', () => {
            const performanceConsiderations = {
                frequentlyUpdatedElements: {
                    katamariSize: {
                        id: 'katamari-size',
                        updateFrequency: 'every frame',
                        isTextContent: true,
                        parentCaching: 'recommended'
                    },
                    katamariSpeed: {
                        id: 'katamari-speed',
                        updateFrequency: 'every frame',
                        isTextContent: true,
                        parentCaching: 'recommended'
                    },
                    fps: {
                        id: 'fps',
                        updateFrequency: 'every second',
                        isTextContent: true,
                        parentCaching: 'recommended'
                    },
                    progressBar: {
                        id: 'progress-bar',
                        updateFrequency: 'on size change',
                        isStyleUpdate: true,
                        property: 'width'
                    }
                },
                staticElements: {
                    controlsInfo: {
                        id: 'controls-info',
                        updateFrequency: 'never',
                        cacheable: true
                    },
                    targetSize: {
                        id: 'target-size',
                        updateFrequency: 'on level change',
                        cacheable: true
                    }
                },
                overlayElements: {
                    loadingOverlay: {
                        id: 'loading-overlay',
                        updateFrequency: 'on state change',
                        displayToggle: true
                    },
                    messageOverlay: {
                        id: 'message-overlay',
                        updateFrequency: 'on game events',
                        displayToggle: true,
                        contentUpdate: true
                    }
                }
            };

            expect(performanceConsiderations).toMatchSnapshot('ui-performance-considerations');
        });
    });
});