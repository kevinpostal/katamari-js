#!/usr/bin/env node

/**
 * CI Cache Management Script
 * Helps optimize CI execution by managing test and dependency caches
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CICacheManager {
    constructor() {
        this.cacheDir = path.join(process.cwd(), '.cache');
        this.packageLockPath = path.join(process.cwd(), 'package-lock.json');
        this.vitestConfigPath = path.join(process.cwd(), 'vitest.config.js');
    }

    /**
     * Generate cache key based on package-lock.json and test configuration
     */
    generateCacheKey() {
        const files = [this.packageLockPath, this.vitestConfigPath];
        const hash = crypto.createHash('sha256');
        
        files.forEach(filePath => {
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                hash.update(content);
            }
        });
        
        return hash.digest('hex').substring(0, 16);
    }

    /**
     * Check if cache is valid
     */
    isCacheValid(cacheKey) {
        const cacheKeyFile = path.join(this.cacheDir, 'cache-key');
        
        if (!fs.existsSync(cacheKeyFile)) {
            return false;
        }
        
        const storedKey = fs.readFileSync(cacheKeyFile, 'utf8').trim();
        return storedKey === cacheKey;
    }

    /**
     * Save cache key
     */
    saveCacheKey(cacheKey) {
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
        
        const cacheKeyFile = path.join(this.cacheDir, 'cache-key');
        fs.writeFileSync(cacheKeyFile, cacheKey);
    }

    /**
     * Clean old cache files
     */
    cleanCache() {
        if (fs.existsSync(this.cacheDir)) {
            fs.rmSync(this.cacheDir, { recursive: true, force: true });
        }
        console.log('Cache cleaned successfully');
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        if (!fs.existsSync(this.cacheDir)) {
            return { exists: false, size: 0, files: 0 };
        }

        let totalSize = 0;
        let fileCount = 0;

        const calculateSize = (dirPath) => {
            const items = fs.readdirSync(dirPath);
            
            items.forEach(item => {
                const itemPath = path.join(dirPath, item);
                const stats = fs.statSync(itemPath);
                
                if (stats.isDirectory()) {
                    calculateSize(itemPath);
                } else {
                    totalSize += stats.size;
                    fileCount++;
                }
            });
        };

        calculateSize(this.cacheDir);

        return {
            exists: true,
            size: totalSize,
            files: fileCount,
            sizeFormatted: this.formatBytes(totalSize)
        };
    }

    /**
     * Format bytes to human readable format
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Main execution
     */
    run() {
        const command = process.argv[2];
        
        switch (command) {
            case 'key':
                console.log(this.generateCacheKey());
                break;
                
            case 'check':
                const cacheKey = this.generateCacheKey();
                const isValid = this.isCacheValid(cacheKey);
                console.log(JSON.stringify({ valid: isValid, key: cacheKey }));
                break;
                
            case 'save':
                const keyToSave = this.generateCacheKey();
                this.saveCacheKey(keyToSave);
                console.log(`Cache key saved: ${keyToSave}`);
                break;
                
            case 'clean':
                this.cleanCache();
                break;
                
            case 'stats':
                const stats = this.getCacheStats();
                console.log(JSON.stringify(stats, null, 2));
                break;
                
            default:
                console.log(`
CI Cache Manager

Usage:
  node scripts/ci-cache.js <command>

Commands:
  key     - Generate cache key
  check   - Check if cache is valid
  save    - Save current cache key
  clean   - Clean cache directory
  stats   - Show cache statistics

Examples:
  node scripts/ci-cache.js key
  node scripts/ci-cache.js check
  node scripts/ci-cache.js stats
                `);
        }
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const manager = new CICacheManager();
    manager.run();
}

export default CICacheManager;