#!/usr/bin/env node

/**
 * GitHub Pages Deployment Script
 * 
 * This script helps deploy the built dist folder to GitHub Pages
 * by pushing it to the gh-pages branch.
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

const DIST_DIR = 'dist';
const BRANCH = 'gh-pages';
const REPO_URL = 'https://github.com/kevinpostal/katamari-js.git';

function log(message) {
    console.log(`🚀 ${message}`);
}

function error(message) {
    console.error(`❌ ${message}`);
    process.exit(1);
}

function runCommand(command, description) {
    log(description);
    try {
        execSync(command, { stdio: 'inherit' });
    } catch (err) {
        error(`Failed to ${description.toLowerCase()}: ${err.message}`);
    }
}

function main() {
    log('Starting GitHub Pages deployment...');

    // Check if dist folder exists
    if (!existsSync(DIST_DIR)) {
        error(`${DIST_DIR} folder not found. Run 'npm run build' first.`);
    }

    // Check if dist has content
    try {
        const files = execSync(`ls ${DIST_DIR}`, { encoding: 'utf8' });
        if (!files.trim()) {
            error(`${DIST_DIR} folder is empty. Run 'npm run build' first.`);
        }
    } catch (err) {
        error(`Cannot read ${DIST_DIR} folder: ${err.message}`);
    }

    log('Dist folder validated ✅');

    // Build fresh version
    log('Building fresh version...');
    runCommand('npm run build', 'Building project');

    // Deploy to gh-pages branch
    log('Deploying to gh-pages branch...');
    
    const commands = [
        // Navigate to dist folder and initialize git if needed
        `cd ${DIST_DIR}`,
        // Initialize git repo in dist if not already
        `git init`,
        // Add all files
        `git add -A`,
        // Commit with timestamp
        `git commit -m "Deploy to GitHub Pages - ${new Date().toISOString()}"`,
        // Add remote if not exists (will fail silently if exists)
        `git remote add origin ${REPO_URL} 2>/dev/null || true`,
        // Force push to gh-pages branch (using HEAD to avoid branch name issues)
        `git push -f origin HEAD:${BRANCH}`
    ];

    const fullCommand = commands.join(' && ');
    
    try {
        execSync(fullCommand, { stdio: 'inherit' });
        log('✅ Deployment successful!');
        log(`🌐 Your site will be available at: https://kevinpostal.github.io/katamari-js/`);
        log('📝 Note: It may take a few minutes for changes to appear.');
    } catch (err) {
        error(`Deployment failed: ${err.message}`);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}