#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Coverage Analysis Script
 * Analyzes test coverage reports and identifies untested code areas
 */

const COVERAGE_DIR = './coverage';
const COVERAGE_JSON = path.join(COVERAGE_DIR, 'coverage-final.json');
const COVERAGE_SUMMARY = path.join(COVERAGE_DIR, 'coverage-summary.json');

class CoverageAnalyzer {
    constructor() {
        this.coverageData = null;
        this.summaryData = null;
        this.thresholds = {
            lines: 80,
            functions: 80,
            branches: 80,
            statements: 80
        };
    }

    async loadCoverageData() {
        try {
            if (fs.existsSync(COVERAGE_JSON)) {
                const data = fs.readFileSync(COVERAGE_JSON, 'utf8');
                this.coverageData = JSON.parse(data);
            }

            if (fs.existsSync(COVERAGE_SUMMARY)) {
                const data = fs.readFileSync(COVERAGE_SUMMARY, 'utf8');
                this.summaryData = JSON.parse(data);
            }

            if (!this.coverageData && !this.summaryData) {
                throw new Error('No coverage data found. Run tests with coverage first.');
            }
        } catch (error) {
            console.error('Error loading coverage data:', error.message);
            process.exit(1);
        }
    }

    analyzeOverallCoverage() {
        if (!this.summaryData) {
            console.log('No summary data available for overall analysis');
            return;
        }

        console.log('\n📊 OVERALL COVERAGE ANALYSIS');
        console.log('================================');

        const total = this.summaryData.total;
        const metrics = ['lines', 'statements', 'functions', 'branches'];

        metrics.forEach(metric => {
            const coverage = total[metric];
            const percentage = coverage.pct;
            const threshold = this.thresholds[metric];
            const status = percentage >= threshold ? '✅' : '❌';
            const covered = coverage.covered;
            const total_count = coverage.total;
            const uncovered = total_count - covered;

            console.log(`${status} ${metric.toUpperCase()}: ${percentage}% (${covered}/${total_count})`);
            
            if (percentage < threshold) {
                console.log(`   ⚠️  Below threshold of ${threshold}% (missing ${uncovered} ${metric})`);
            }
        });
    }

    analyzeFilesCoverage() {
        if (!this.summaryData) {
            console.log('No summary data available for file analysis');
            return;
        }

        console.log('\n📁 FILE-BY-FILE COVERAGE ANALYSIS');
        console.log('===================================');

        const files = Object.keys(this.summaryData)
            .filter(key => key !== 'total')
            .sort();

        const problematicFiles = [];

        files.forEach(filePath => {
            const fileData = this.summaryData[filePath];
            const fileName = path.basename(filePath);
            
            // Check if any metric is below threshold
            const issues = [];
            ['lines', 'statements', 'functions', 'branches'].forEach(metric => {
                const percentage = fileData[metric].pct;
                if (percentage < this.thresholds[metric]) {
                    issues.push(`${metric}: ${percentage}%`);
                }
            });

            if (issues.length > 0) {
                problematicFiles.push({
                    file: fileName,
                    path: filePath,
                    issues: issues,
                    overall: Math.min(
                        fileData.lines.pct,
                        fileData.statements.pct,
                        fileData.functions.pct,
                        fileData.branches.pct
                    )
                });
            }
        });

        if (problematicFiles.length === 0) {
            console.log('✅ All files meet coverage thresholds!');
        } else {
            console.log(`❌ ${problematicFiles.length} files below threshold:\n`);
            
            // Sort by worst coverage first
            problematicFiles
                .sort((a, b) => a.overall - b.overall)
                .forEach(file => {
                    console.log(`📄 ${file.file}`);
                    console.log(`   Path: ${file.path}`);
                    console.log(`   Issues: ${file.issues.join(', ')}`);
                    console.log('');
                });
        }
    }

    analyzeUncoveredLines() {
        if (!this.coverageData) {
            console.log('No detailed coverage data available for line analysis');
            return;
        }

        console.log('\n🔍 UNCOVERED CODE ANALYSIS');
        console.log('===========================');

        const uncoveredSections = [];

        Object.keys(this.coverageData).forEach(filePath => {
            const fileData = this.coverageData[filePath];
            const fileName = path.basename(filePath);
            
            // Analyze uncovered lines
            const uncoveredLines = [];
            Object.keys(fileData.s || {}).forEach(statementId => {
                if (fileData.s[statementId] === 0) {
                    const location = fileData.statementMap[statementId];
                    if (location) {
                        uncoveredLines.push(location.start.line);
                    }
                }
            });

            // Analyze uncovered functions
            const uncoveredFunctions = [];
            Object.keys(fileData.f || {}).forEach(functionId => {
                if (fileData.f[functionId] === 0) {
                    const location = fileData.fnMap[functionId];
                    if (location) {
                        uncoveredFunctions.push({
                            name: location.name,
                            line: location.decl.start.line
                        });
                    }
                }
            });

            // Analyze uncovered branches
            const uncoveredBranches = [];
            Object.keys(fileData.b || {}).forEach(branchId => {
                const branchHits = fileData.b[branchId];
                branchHits.forEach((hits, index) => {
                    if (hits === 0) {
                        const location = fileData.branchMap[branchId];
                        if (location) {
                            uncoveredBranches.push({
                                line: location.locations[index].start.line,
                                type: location.type
                            });
                        }
                    }
                });
            });

            if (uncoveredLines.length > 0 || uncoveredFunctions.length > 0 || uncoveredBranches.length > 0) {
                uncoveredSections.push({
                    file: fileName,
                    path: filePath,
                    uncoveredLines: [...new Set(uncoveredLines)].sort((a, b) => a - b),
                    uncoveredFunctions,
                    uncoveredBranches
                });
            }
        });

        if (uncoveredSections.length === 0) {
            console.log('✅ No uncovered code sections found!');
        } else {
            uncoveredSections.forEach(section => {
                console.log(`📄 ${section.file}`);
                
                if (section.uncoveredLines.length > 0) {
                    console.log(`   📍 Uncovered lines: ${this.formatLineRanges(section.uncoveredLines)}`);
                }
                
                if (section.uncoveredFunctions.length > 0) {
                    console.log(`   🔧 Uncovered functions:`);
                    section.uncoveredFunctions.forEach(func => {
                        console.log(`      - ${func.name} (line ${func.line})`);
                    });
                }
                
                if (section.uncoveredBranches.length > 0) {
                    console.log(`   🌿 Uncovered branches: ${section.uncoveredBranches.length} branch(es)`);
                }
                
                console.log('');
            });
        }
    }

    formatLineRanges(lines) {
        if (lines.length === 0) return '';
        
        const ranges = [];
        let start = lines[0];
        let end = lines[0];
        
        for (let i = 1; i < lines.length; i++) {
            if (lines[i] === end + 1) {
                end = lines[i];
            } else {
                ranges.push(start === end ? `${start}` : `${start}-${end}`);
                start = end = lines[i];
            }
        }
        ranges.push(start === end ? `${start}` : `${start}-${end}`);
        
        return ranges.join(', ');
    }

    generateRecommendations() {
        console.log('\n💡 RECOMMENDATIONS');
        console.log('===================');

        const recommendations = [
            '1. Focus on files with lowest coverage percentages first',
            '2. Add unit tests for uncovered functions',
            '3. Test edge cases and error conditions for uncovered branches',
            '4. Consider integration tests for complex interactions',
            '5. Use test-driven development for new features',
            '6. Review and update coverage thresholds as code quality improves'
        ];

        recommendations.forEach(rec => console.log(rec));
        
        console.log('\n📈 NEXT STEPS:');
        console.log('- Run `npm run test:coverage:open` to view detailed HTML report');
        console.log('- Use `npm run test:watch` for continuous testing during development');
        console.log('- Check `./coverage/lcov-report/index.html` for line-by-line coverage');
    }

    async run() {
        console.log('🔍 Starting Coverage Analysis...\n');
        
        await this.loadCoverageData();
        
        this.analyzeOverallCoverage();
        this.analyzeFilesCoverage();
        this.analyzeUncoveredLines();
        this.generateRecommendations();
        
        console.log('\n✅ Coverage analysis complete!');
    }
}

// Run the analyzer
const analyzer = new CoverageAnalyzer();
analyzer.run().catch(error => {
    console.error('Coverage analysis failed:', error);
    process.exit(1);
});