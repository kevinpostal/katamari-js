import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // Use jsdom environment for DOM testing
        environment: 'jsdom',
        
        // Enable global test functions (describe, it, expect)
        globals: true,
        
        // Setup files to run before tests
        setupFiles: ['./tests/helpers/setup.js'],
        
        // Coverage configuration using v8
        coverage: {
            provider: 'v8',
            reporter: ['text', 'text-summary', 'json', 'json-summary', 'html', 'lcov', 'clover'],
            reportsDirectory: './coverage',
            
            // Coverage thresholds - fail if below these percentages
            thresholds: {
                lines: 80,
                functions: 80,
                branches: 80,
                statements: 80,
                // Per-file thresholds
                perFile: true,
                // Auto-update thresholds based on current coverage
                autoUpdate: false,
                // Threshold for individual files
                '100': false
            },
            
            // Files to include in coverage
            include: [
                'src/**/*.{js,mjs,cjs,ts,jsx,tsx}',
                'index.html'
            ],
            
            // Files to exclude from coverage
            exclude: [
                'node_modules/**',
                'tests/**',
                'coverage/**',
                'dist/**',
                'test-results/**',
                '*.config.js',
                '*.config.ts',
                '.vite/**',
                '.github/**',
                '.kiro/**',
                '.vscode/**',
                'docs/**'
            ],
            
            // Additional coverage options
            all: true,
            clean: true,
            cleanOnRerun: true,
            
            // Skip coverage for files with no tests
            skipFull: false,
            
            // Watermarks for coverage coloring
            watermarks: {
                statements: [50, 80],
                functions: [50, 80],
                branches: [50, 80],
                lines: [50, 80]
            }
        },
        
        // Mock configuration
        mockReset: true,
        restoreMocks: true,
        clearMocks: true,
        
        // Test file patterns
        include: [
            'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
        ],
        
        // Exclude patterns
        exclude: [
            'node_modules/**',
            'dist/**',
            '.git/**'
        ],
        
        // Test timeout
        testTimeout: 10000,
        
        // Hook timeout
        hookTimeout: 10000,
        
        // Reporter configuration
        reporter: ['default', 'json', 'html'],
        
        // Output directory for reports
        outputFile: {
            json: './test-results/results.json',
            html: './test-results/index.html'
        }
    },
    
    // Resolve configuration for imports
    resolve: {
        alias: {
            '@': './src'
        }
    }
});