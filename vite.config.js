import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import replace from '@rollup/plugin-replace';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export default defineConfig(({ mode }) => ({
  // Root directory and entry point
  root: '.',
  
  // Plugins configuration
  plugins: [
    // Node resolve for better dependency resolution
    nodeResolve({
      preferBuiltins: false,
      browser: true
    }),
    
    // CommonJS support for legacy modules
    commonjs(),
    
    // Replace environment variables for optimization
    replace({
      preventAssignment: true,
      values: {
        __DEV__: mode === 'development',
        'process.env.NODE_ENV': JSON.stringify(mode === 'development' ? 'development' : 'production')
      }
    }),
    
    // Additional terser plugin for production builds
    ...(mode === 'production' ? [
      terser({
        compress: {
          // Advanced compression options
          drop_console: true,
          drop_debugger: true,
          dead_code: true,
          conditionals: true,
          comparisons: true,
          sequences: true,
          properties: true,
          unused: true,
          // Three.js specific optimizations
          pure_funcs: ['console.log', 'console.warn', 'debugLog', 'debugWarn', 'debugError'],
          // Remove unused imports
          side_effects: false
        },
        mangle: {
          toplevel: true,
          safari10: true,
          // Preserve specific function names that might be needed
          reserved: ['THREE', 'CANNON', 'Tone']
        },
        format: {
          comments: false,
          // Preserve license comments
          preserve_annotations: false
        }
      })
    ] : []),
    
    // Bundle analyzer (only in analyze mode)
    ...(mode === 'analyze' ? [
      visualizer({
        filename: 'dist/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
        template: 'treemap'
      })
    ] : [])
  ],

  // Development server configuration
  server: {
    port: 3000,
    open: true,
    host: true
  },
  
  // Base path for GitHub Pages deployment
  base: mode === 'production' ? '/katamari-js/' : '/',
  
  // Build configuration for single-file deployment
  build: {
    // Output directory
    outDir: 'dist',
    
    // Generate source maps for debugging (disable in production for smaller builds)
    sourcemap: mode === 'development',
    
    // Minify for production
    minify: mode === 'production' ? 'esbuild' : false,
    
    // Chunk size warning limit (increase for game assets)
    chunkSizeWarningLimit: 1000,
    
    // Rollup options for bundling
    rollupOptions: {
      output: {
        // Inline all assets into single files for simple deployment
        inlineDynamicImports: true,
        
        // Manual chunks configuration to optimize bundle
        manualChunks: undefined,
        
        // Asset file naming with shorter hashes
        assetFileNames: 'assets/[name].[hash:8][extname]',
        chunkFileNames: 'assets/[name].[hash:8].js',
        entryFileNames: 'assets/[name].[hash:8].js',
        
        // Optimize output format
        format: 'es',
        compact: true
      },
      
      // Tree shaking configuration optimized for Three.js
      treeshake: {
        // Enable aggressive tree shaking for better optimization
        moduleSideEffects: (id) => {
          // Preserve side effects for audio context and essential modules
          if (id.includes('tone') || id.includes('cannon-es')) {
            return true;
          }
          // Allow tree shaking for Three.js modules
          if (id.includes('three')) {
            return false;
          }
          // Be conservative with other modules
          return 'no-external';
        },
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false,
        // Aggressive tree shaking preset
        preset: 'smallest'
      },
      
      // External dependencies optimization (keep empty for bundling)
      external: [],
      
      // Additional rollup plugins for optimization
      plugins: []
    },
    
    // Target modern browsers (same as current implementation)
    target: 'es2020',
    
    // Optimize dependencies with specific configurations
    optimizeDeps: {
      include: ['three', 'cannon-es', 'tone'],
      force: true,
      // ESBuild options for dependency optimization
      esbuildOptions: {
        target: 'es2020',
        supported: {
          'top-level-await': true
        }
      }
    },
    
    // Asset inlining threshold (inline small assets)
    assetsInlineLimit: 4096,
    
    // CSS code splitting (disable for single-file deployment)
    cssCodeSplit: false,
    
    // Report compressed size
    reportCompressedSize: true,
    
    // Write bundle to disk
    write: true,
    
    // Empty output directory before build
    emptyOutDir: true,
    
    // Additional build optimizations
    assetsDir: 'assets'
  },
  
  // Define global constants for optimization
  define: {
    // Ensure compatibility with libraries expecting global scope
    global: 'globalThis',
    // Define production mode for conditional code
    __DEV__: mode === 'development',
    // Remove debug code in production
    'process.env.NODE_ENV': JSON.stringify(mode === 'development' ? 'development' : 'production'),
    // Three.js devtools - only define in development, let it be undefined in production
    ...(mode === 'development' ? {} : { __THREE_DEVTOOLS__: 'undefined' })
  },
  
  // Asset handling
  assetsInclude: ['**/*.gltf', '**/*.glb', '**/*.hdr', '**/*.wasm'],
  
  // CSS configuration with optimization
  css: {
    devSourcemap: mode === 'development',
    // CSS minification and optimization
    postcss: {
      plugins: []
    },
    // CSS modules configuration
    modules: false,
    // Preprocessor options
    preprocessorOptions: {}
  },
  
  // ESBuild configuration for faster builds and optimization
  esbuild: {
    // Remove console logs in production
    drop: mode === 'production' ? ['console', 'debugger'] : [],
    // Legal comments handling
    legalComments: 'none',
    // Target specification
    target: 'es2020',
    // Minify identifiers
    minifyIdentifiers: mode === 'production',
    // Minify syntax
    minifySyntax: mode === 'production',
    // Minify whitespace
    minifyWhitespace: mode === 'production'
  },

  // Resolve configuration for better tree shaking
  resolve: {
    alias: {
      // Optimize Three.js imports for better tree shaking
      'three/examples/jsm': 'three/examples/jsm',
      // Direct path to Three.js modules for better optimization
      'three$': 'three/build/three.module.js'
    },
    // Dedupe dependencies to reduce bundle size
    dedupe: ['three', 'cannon-es', 'tone'],
    // Extensions to resolve
    extensions: ['.js', '.ts', '.json', '.mjs'],
    // Main fields for package resolution
    mainFields: ['module', 'jsnext:main', 'jsnext', 'browser', 'main'],
    // Conditions for package exports
    conditions: ['import', 'module', 'browser', 'default']
  },

  // Worker configuration for potential web workers
  worker: {
    format: 'es',
    plugins: () => []
  },

  // Preview server configuration
  preview: {
    port: 4173,
    host: true,
    open: true
  }
}));