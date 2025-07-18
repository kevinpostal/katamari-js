#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Coverage Summary Generator
 * Provides a quick overview of test coverage metrics
 */

const COVERAGE_SUMMARY = './coverage/coverage-summary.json';

class CoverageSummaryGenerator {
    constructor() {
        this.summaryData = null;
        this.thresholds = {
            lines: 80,
            functions: 80,
            branches: 80,
            statements: 80
        };
    }

    loadCoverageData() {
        try {
            if (!fs.existsSync(COVERAGE_SUMMARY)) {
                throw new Error('Coverage summary not found. Run tests with coverage first.');
            }

            const data = fs.readFileSync(COVERAGE_SUMMARY, 'utf8');
            this.summaryData = JSON.parse(data);
        } catch (error) {
            console.error('❌ Error loading coverage data:', error.message);
            process.exit(1);
        }
    }

    generateSummary() {
        const total = this.summaryData.total;
        
        console.log('📊 TEST COVERAGE SUMMARY');
        console.log('========================');
        console.log('');

        // Overall metrics
        const metrics = [
            { name: 'Lines', key: 'lines', icon: '📏' },
            { name: 'Statements', key: 'statements', icon: '📝' },
            { name: 'Functions', key: 'functions', icon: '🔧' },
            { name: 'Branches', key: 'branches', icon: '🌿' }
        ];

        metrics.forEach(metric => {
            const data = total[metric.key];
            const percentage = data.pct;
            const threshold = this.thresholds[metric.key];
            const status = percentage >= threshold ? '✅' : '❌';
            const bar = this.generateProgressBar(percentage);
            
            console.log(`${metric.icon} ${metric.name.padEnd(12)} ${status} ${percentage.toString().padStart(6)}% ${bar} (${data.covered}/${data.total})`);
        });

        console.log('');
        this.generateOverallStatus();
        this.generateFileStats();
        this.generateQuickActions();
    }

    generateProgressBar(percentage, width = 20) {
        const filled = Math.round((percentage / 100) * width);
        const empty = width - filled;
        const bar = '█'.repeat(filled) + '░'.repeat(empty);
        return `[${bar}]`;
    }

    generateOverallStatus() {
        const total = this.summaryData.total;
        const allMetrics = [total.lines.pct, total.statements.pct, total.functions.pct, total.branches.pct];
        const averageCoverage = allMetrics.reduce((sum, pct) => sum + pct, 0) / allMetrics.length;
        const allThresholdsMet = allMetrics.every((pct, index) => 
            pct >= Object.values(this.thresholds)[index]
        );

        console.log('🎯 OVERALL STATUS');
        console.log('-----------------');
        
        if (allThresholdsMet) {
            console.log('✅ All coverage thresholds met!');
            console.log(`🎉 Average coverage: ${averageCoverage.toFixed(1)}%`);
        } else {
            console.log('❌ Some thresholds not met');
            console.log(`📈 Average coverage: ${averageCoverage.toFixed(1)}%`);
            
            const failingMetrics = [];
            Object.keys(this.thresholds).forEach(key => {
                if (total[key].pct < this.thresholds[key]) {
                    failingMetrics.push(key);
                }
            });
            console.log(`⚠️  Failing metrics: ${failingMetrics.join(', ')}`);
        }
        console.log('');
    }

    generateFileStats() {
        const files = Object.keys(this.summaryData).filter(key => key !== 'total');
        const fileCount = files.length;
        
        if (fileCount === 0) {
            return;
        }

        console.log('📁 FILE STATISTICS');
        console.log('------------------');
        console.log(`📄 Total files: ${fileCount}`);

        // Calculate files meeting thresholds
        let filesPassingThreshold = 0;
        const worstFiles = [];

        files.forEach(filePath => {
            const fileData = this.summaryData[filePath];
            const fileName = path.basename(filePath);
            
            const meetsThreshold = ['lines', 'statements', 'functions', 'branches'].every(metric => 
                fileData[metric].pct >= this.thresholds[metric]
            );

            if (meetsThreshold) {
                filesPassingThreshold++;
            } else {
                const avgCoverage = ['lines', 'statements', 'functions', 'branches']
                    .reduce((sum, metric) => sum + fileData[metric].pct, 0) / 4;
                
                worstFiles.push({
                    name: fileName,
                    path: filePath,
                    coverage: avgCoverage
                });
            }
        });

        console.log(`✅ Files meeting thresholds: ${filesPassingThreshold}/${fileCount} (${((filesPassingThreshold/fileCount)*100).toFixed(1)}%)`);
        
        if (worstFiles.length > 0) {
            console.log(`❌ Files needing attention: ${worstFiles.length}`);
            
            // Show top 3 worst files
            const topWorst = worstFiles
                .sort((a, b) => a.coverage - b.coverage)
                .slice(0, 3);
            
            console.log('   📉 Lowest coverage files:');
            topWorst.forEach((file, index) => {
                console.log(`   ${index + 1}. ${file.name} (${file.coverage.toFixed(1)}%)`);
            });
        }
        console.log('');
    }

    generateQuickActions() {
        console.log('🚀 QUICK ACTIONS');
        console.log('----------------');
        console.log('📊 npm run coverage:analyze    - Detailed coverage analysis');
        console.log('🌐 npm run coverage:open       - Open HTML coverage report');
        console.log('🎯 npm run coverage:threshold  - Check threshold compliance');
        console.log('👀 npm run test:coverage:watch - Watch mode with coverage');
        console.log('');
    }

    run() {
        this.loadCoverageData();
        this.generateSummary();
    }
}

// Run the summary generator
const generator = new CoverageSummaryGenerator();
generator.run();