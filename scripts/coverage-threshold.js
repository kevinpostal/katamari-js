#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Coverage Threshold Checker
 * Validates coverage against defined thresholds and fails CI if below limits
 */

const COVERAGE_SUMMARY = './coverage/coverage-summary.json';

class CoverageThresholdChecker {
    constructor() {
        this.thresholds = {
            lines: 80,
            functions: 80,
            branches: 80,
            statements: 80
        };
        this.summaryData = null;
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

    checkThresholds() {
        const total = this.summaryData.total;
        const failures = [];
        
        console.log('🎯 COVERAGE THRESHOLD CHECK');
        console.log('============================');
        
        Object.keys(this.thresholds).forEach(metric => {
            const actual = total[metric].pct;
            const required = this.thresholds[metric];
            const status = actual >= required ? '✅' : '❌';
            
            console.log(`${status} ${metric.toUpperCase()}: ${actual}% (required: ${required}%)`);
            
            if (actual < required) {
                failures.push({
                    metric,
                    actual,
                    required,
                    deficit: required - actual
                });
            }
        });

        return failures;
    }

    generateFailureReport(failures) {
        console.log('\n❌ COVERAGE THRESHOLD FAILURES');
        console.log('===============================');
        
        failures.forEach(failure => {
            console.log(`${failure.metric.toUpperCase()}: ${failure.actual}% (${failure.deficit.toFixed(1)}% below threshold)`);
        });

        console.log('\n💡 To fix coverage issues:');
        console.log('1. Run `npm run coverage:analyze` for detailed analysis');
        console.log('2. Add tests for uncovered code areas');
        console.log('3. Focus on the metrics with largest deficits first');
        console.log('4. Use `npm run test:coverage:open` to see visual coverage report');
    }

    run() {
        console.log('🔍 Checking coverage thresholds...\n');
        
        this.loadCoverageData();
        const failures = this.checkThresholds();
        
        if (failures.length === 0) {
            console.log('\n✅ All coverage thresholds met!');
            console.log('🎉 Great job maintaining high code quality!');
            process.exit(0);
        } else {
            this.generateFailureReport(failures);
            console.log('\n💥 Coverage thresholds not met. Please add more tests.');
            process.exit(1);
        }
    }
}

// Run the threshold checker
const checker = new CoverageThresholdChecker();
checker.run();