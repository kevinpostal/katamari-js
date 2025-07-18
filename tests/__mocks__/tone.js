/**
 * Mock implementation for Tone.js audio synthesis library
 * Provides lightweight mocks for audio functionality without actual sound output
 */

import { vi } from 'vitest';

// Mock Tone namespace
const Tone = {
    // Mock context management
    context: {
        state: 'running',
        now: vi.fn(() => Date.now() / 1000), // Return current time in seconds like Tone.js
        resume: vi.fn(() => Promise.resolve()),
        suspend: vi.fn(() => Promise.resolve()),
        close: vi.fn(() => Promise.resolve()),
    },
    
    // Mock start method
    start: vi.fn(() => Promise.resolve()),
    
    // Mock Transport
    Transport: {
        start: vi.fn(),
        stop: vi.fn(),
        pause: vi.fn(),
        bpm: { value: 120 },
        position: '0:0:0',
        state: 'stopped'
    },
    
    // Mock Master/Destination
    Master: {
        volume: { value: 0 },
        mute: false
    },
    
    Destination: {
        volume: { value: 0 },
        mute: false
    }
};

// Mock Synth classes
export class Synth {
    constructor(options = {}) {
        this.oscillator = { type: options.oscillator?.type || 'sine' };
        this.envelope = options.envelope || {};
        this.volume = { value: -10 }; // Match COLLECTION_SYNTH_VOLUME
        this.state = 'stopped';
    }
    
    triggerAttack = vi.fn((time) => {
        this.state = 'started';
    });
    
    triggerRelease = vi.fn((time) => {
        this.state = 'stopped';
    });
    
    triggerAttackRelease = vi.fn();
    toDestination = vi.fn(() => this);
    connect = vi.fn(() => this);
    disconnect = vi.fn();
    dispose = vi.fn();
}

export class MembraneSynth {
    constructor(options = {}) {
        this.oscillator = options.oscillator || {};
        this.envelope = options.envelope || {};
        this.volume = { value: options.volume || -15 }; // Match SHED_SOUND_VOLUME
        this.state = 'stopped';
        this.pitchDecay = options.pitchDecay || 0.05;
        this.octaves = options.octaves || 2;
    }
    
    triggerAttack = vi.fn((time) => {
        this.state = 'started';
    });
    
    triggerRelease = vi.fn((time) => {
        this.state = 'stopped';
    });
    
    triggerAttackRelease = vi.fn();
    toDestination = vi.fn(() => this);
    connect = vi.fn(() => this);
    disconnect = vi.fn();
    dispose = vi.fn();
}

export class NoiseSynth {
    constructor(options = {}) {
        this.noise = { 
            type: options.noise?.type || 'white',
            playbackRate: 1
        };
        this.envelope = options.envelope || {};
        this.volume = { value: -30 }; // Match ROLLING_SYNTH_VOLUME
        this.state = 'stopped';
    }
    
    triggerAttack = vi.fn((time) => {
        this.state = 'started';
    });
    
    triggerRelease = vi.fn((time) => {
        this.state = 'stopped';
    });
    
    triggerAttackRelease = vi.fn();
    toDestination = vi.fn(() => this);
    connect = vi.fn(() => this);
    disconnect = vi.fn();
    dispose = vi.fn();
}

// Mock Effects
export class Reverb {
    constructor(roomSize = 0.7) {
        this.roomSize = { value: roomSize };
        this.wet = { value: 0.5 };
    }
    
    connect = vi.fn(() => this);
    disconnect = vi.fn();
    dispose = vi.fn();
    toDestination = vi.fn(() => this);
}

export class Filter {
    constructor(frequency = 350, type = 'lowpass') {
        this.frequency = { value: frequency };
        this.type = type;
        this.Q = { value: 1 };
    }
    
    connect = vi.fn(() => this);
    disconnect = vi.fn();
    dispose = vi.fn();
    toDestination = vi.fn(() => this);
}

export class Gain {
    constructor(gain = 1) {
        this.gain = { value: gain };
    }
    
    connect = vi.fn(() => this);
    disconnect = vi.fn();
    dispose = vi.fn();
    toDestination = vi.fn(() => this);
}

// Mock Oscillator class
export class Oscillator {
    constructor(options = {}) {
        this.frequency = { value: options.frequency || 440 };
        this.type = options.type || 'sine';
        this.volume = { value: options.volume || -40 }; // Match ATTRACTION_HUM_VOLUME
        this.state = 'stopped';
    }
    
    start = vi.fn((time) => {
        this.state = 'started';
        return this;
    });
    
    stop = vi.fn((time) => {
        this.state = 'stopped';
        return this;
    });
    
    connect = vi.fn(() => this);
    disconnect = vi.fn();
    dispose = vi.fn();
    toDestination = vi.fn(() => this);
}

// Mock Player class
export class Player {
    constructor(url, onload) {
        this.buffer = null;
        this.loaded = false;
        this.volume = { value: -12 };
        
        // Simulate async loading
        setTimeout(() => {
            this.loaded = true;
            if (onload) onload();
        }, 0);
    }
    
    start = vi.fn();
    stop = vi.fn();
    connect = vi.fn(() => this);
    disconnect = vi.fn();
    dispose = vi.fn();
    toDestination = vi.fn(() => this);
}

// Mock utility functions
export const now = vi.fn(() => 0);
export const immediate = vi.fn(() => 0);

// Export Tone as default
export default {
    ...Tone,
    NoiseSynth,
    Synth,
    MembraneSynth,
    Oscillator,
    Reverb,
    Filter,
    Gain,
    Player,
    now,
    immediate
};

// Also export individual classes
export { 
    Tone,
    NoiseSynth,
    Synth,
    MembraneSynth,
    Oscillator,
    Reverb,
    Filter,
    Gain,
    Player,
    now,
    immediate
};