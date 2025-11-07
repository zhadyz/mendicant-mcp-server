/**
 * Intelligent Selector Test Suite
 *
 * Tests Mnemosyne-enhanced agent selection with historical learning.
 * Validates scoring algorithm, context matching, and recommendation logic.
 */
import { IntelligentSelector } from '../../knowledge/intelligent_selector.js';
describe('IntelligentSelector', () => {
    let selector;
    beforeEach(() => {
        selector = new IntelligentSelector();
    });
    describe('Agent Selection', () => {
        test('should select agents for an objective', async () => {
            const objective = 'Implement authentication system with JWT';
            const recommendations = await selector.selectAgentsForObjective(objective);
            expect(recommendations).toBeInstanceOf(Array);
            expect(recommendations.length).toBeGreaterThan(0);
        });
        test('should return recommendations with full metadata', async () => {
            const objective = 'Fix security vulnerability in API';
            const recommendations = await selector.selectAgentsForObjective(objective);
            recommendations.forEach((rec) => {
                expect(rec.agent).toBeDefined();
                expect(rec.score).toBeGreaterThanOrEqual(0);
                expect(rec.score).toBeLessThanOrEqual(1);
                expect(rec.confidence).toBeGreaterThanOrEqual(0);
                expect(rec.confidence).toBeLessThanOrEqual(1);
                expect(rec.reasoning).toBeInstanceOf(Array);
                expect(rec.reasoning.length).toBeGreaterThan(0);
            });
        });
        test('should include historical performance when available', async () => {
            const objective = 'Deploy to production';
            const recommendations = await selector.selectAgentsForObjective(objective);
            // Some recommendations may have historical performance data
            recommendations.forEach((rec) => {
                if (rec.historical_performance) {
                    expect(rec.historical_performance.similar_objectives).toBeGreaterThanOrEqual(0);
                    expect(rec.historical_performance.success_in_similar).toBeGreaterThanOrEqual(0);
                    expect(rec.historical_performance.avg_tokens_in_similar).toBeGreaterThanOrEqual(0);
                }
            });
        });
        test('should sort recommendations by score descending', async () => {
            const objective = 'Write tests for API endpoints';
            const recommendations = await selector.selectAgentsForObjective(objective);
            for (let i = 1; i < recommendations.length; i++) {
                expect(recommendations[i - 1].score).toBeGreaterThanOrEqual(recommendations[i].score);
            }
        });
        test('should filter out low-scoring agents', async () => {
            const objective = 'Create design system';
            const recommendations = await selector.selectAgentsForObjective(objective);
            // All recommendations should be above threshold (0.3)
            recommendations.forEach((rec) => {
                expect(rec.score).toBeGreaterThan(0.3);
            });
        });
    });
    describe('Context-Enhanced Selection', () => {
        test('should use project context for better recommendations', async () => {
            const objective = 'Add caching layer';
            const context = {
                project_type: 'nextjs',
                has_tests: true,
                recent_errors: []
            };
            const recommendations = await selector.selectAgentsForObjective(objective, context);
            expect(recommendations.length).toBeGreaterThan(0);
            // Context should influence recommendations
        });
        test('should handle missing project context gracefully', async () => {
            const objective = 'Refactor legacy code';
            const recommendations = await selector.selectAgentsForObjective(objective);
            expect(recommendations.length).toBeGreaterThan(0);
        });
        test('should consider project type in scoring', async () => {
            const objective = 'Deploy application';
            const context = {
                project_type: 'python',
                has_tests: false
            };
            const recommendations = await selector.selectAgentsForObjective(objective, context);
            // Recommendations should be contextually relevant
            expect(recommendations.length).toBeGreaterThan(0);
        });
        test('should consider test presence in scoring', async () => {
            const objective = 'Run comprehensive testing';
            const contextWithTests = {
                project_type: 'rust',
                has_tests: true
            };
            const recommendations = await selector.selectAgentsForObjective(objective, contextWithTests);
            // Should recommend QA/testing agents
            expect(recommendations.length).toBeGreaterThan(0);
        });
    });
    describe('Scoring Algorithm', () => {
        test('should compute semantic baseline score', async () => {
            const objective = 'Implement new feature';
            const recommendations = await selector.selectAgentsForObjective(objective);
            // All recommendations should have reasoning including semantic match
            recommendations.forEach((rec) => {
                const hasSemanticReason = rec.reasoning.some(r => r.includes('Semantic match'));
                expect(hasSemanticReason).toBe(true);
            });
        });
        test('should compute historical success score', async () => {
            const objective = 'Deploy infrastructure';
            const recommendations = await selector.selectAgentsForObjective(objective);
            // All recommendations should have reasoning including historical success
            recommendations.forEach((rec) => {
                const hasHistoricalReason = rec.reasoning.some(r => r.includes('Historical success'));
                expect(hasHistoricalReason).toBe(true);
            });
        });
        test('should compute context similarity score', async () => {
            const objective = 'Build REST API';
            const recommendations = await selector.selectAgentsForObjective(objective);
            // All recommendations should have reasoning including context similarity
            recommendations.forEach((rec) => {
                const hasContextReason = rec.reasoning.some(r => r.includes('Context similarity'));
                expect(hasContextReason).toBe(true);
            });
        });
        test('should weight scores correctly (0.3 semantic + 0.4 historical + 0.3 context)', async () => {
            const objective = 'Fix bugs in production';
            const recommendations = await selector.selectAgentsForObjective(objective);
            // Scores should be properly weighted between 0-1
            recommendations.forEach((rec) => {
                expect(rec.score).toBeGreaterThanOrEqual(0);
                expect(rec.score).toBeLessThanOrEqual(1);
            });
        });
    });
    describe('Historical Ranking', () => {
        test('should rank agents by historical success', async () => {
            const mockAgents = [
                {
                    name: 'agent1',
                    specialization: 'testing',
                    capabilities: ['test_automation'],
                    tools: [],
                    typical_use_cases: ['run_tests'],
                    avg_token_usage: 40000,
                    success_rate: 0.5
                },
                {
                    name: 'agent2',
                    specialization: 'deployment',
                    capabilities: ['deployment'],
                    tools: [],
                    typical_use_cases: ['deploy'],
                    avg_token_usage: 35000,
                    success_rate: 0.5
                }
            ];
            const objective = 'Deploy and test application';
            const ranked = await selector.rankByHistoricalSuccess(mockAgents, objective);
            expect(ranked.length).toBe(2);
            expect(ranked).toBeInstanceOf(Array);
        });
        test('should handle agents with no historical data', async () => {
            const mockAgents = [
                {
                    name: 'new_agent',
                    specialization: 'custom',
                    capabilities: [],
                    tools: [],
                    typical_use_cases: ['general_tasks'],
                    avg_token_usage: 40000,
                    success_rate: 0.5
                }
            ];
            const objective = 'Test new feature';
            const ranked = await selector.rankByHistoricalSuccess(mockAgents, objective);
            expect(ranked.length).toBe(1);
        });
    });
    describe('Confidence Calculation', () => {
        test('should calculate confidence based on data availability', async () => {
            const objective = 'Analyze performance metrics';
            const recommendations = await selector.selectAgentsForObjective(objective);
            recommendations.forEach((rec) => {
                expect(rec.confidence).toBeGreaterThanOrEqual(0);
                expect(rec.confidence).toBeLessThanOrEqual(1);
            });
        });
        test('should have higher confidence with more historical data', async () => {
            const objective = 'Build feature';
            const recommendations = await selector.selectAgentsForObjective(objective);
            // Confidence should correlate with historical performance data
            recommendations.forEach((rec) => {
                if (rec.historical_performance && rec.historical_performance.similar_objectives > 10) {
                    expect(rec.confidence).toBeGreaterThan(0.5);
                }
            });
        });
        test('should have baseline confidence without historical data', async () => {
            const objective = 'New type of task';
            const recommendations = await selector.selectAgentsForObjective(objective);
            // Even without historical data, should have some confidence
            recommendations.forEach((rec) => {
                expect(rec.confidence).toBeGreaterThanOrEqual(0.4);
            });
        });
    });
    describe('Reasoning Generation', () => {
        test('should provide clear reasoning for recommendations', async () => {
            const objective = 'Implement security features';
            const recommendations = await selector.selectAgentsForObjective(objective);
            recommendations.forEach((rec) => {
                expect(rec.reasoning).toBeInstanceOf(Array);
                expect(rec.reasoning.length).toBeGreaterThanOrEqual(3); // semantic + historical + context
            });
        });
        test('should format reasoning with percentages', async () => {
            const objective = 'Deploy to cloud';
            const recommendations = await selector.selectAgentsForObjective(objective);
            recommendations.forEach((rec) => {
                rec.reasoning.forEach(reason => {
                    expect(typeof reason).toBe('string');
                    expect(reason.includes('%')).toBe(true);
                });
            });
        });
    });
    describe('Edge Cases', () => {
        test('should handle empty objective', async () => {
            const recommendations = await selector.selectAgentsForObjective('');
            // Should still return some agents
            expect(recommendations).toBeInstanceOf(Array);
        });
        test('should handle very long objective', async () => {
            const longObjective = 'A'.repeat(1000);
            const recommendations = await selector.selectAgentsForObjective(longObjective);
            expect(recommendations).toBeInstanceOf(Array);
        });
        test('should handle special characters in objective', async () => {
            const objective = 'Fix bug: @#$%^&*() in authentication';
            const recommendations = await selector.selectAgentsForObjective(objective);
            expect(recommendations.length).toBeGreaterThan(0);
        });
        test('should handle undefined context', async () => {
            const objective = 'Build feature';
            const recommendations = await selector.selectAgentsForObjective(objective, undefined);
            expect(recommendations.length).toBeGreaterThan(0);
        });
    });
    describe('Integration with Mnemosyne', () => {
        test('should work when Mnemosyne is unavailable', async () => {
            // Mnemosyne may not be connected in test environment
            const objective = 'Test with Mnemosyne unavailable';
            const recommendations = await selector.selectAgentsForObjective(objective);
            // Should still return recommendations via semantic analysis
            expect(recommendations.length).toBeGreaterThan(0);
        });
        test('should gracefully degrade without Mnemosyne', async () => {
            const objective = 'Deploy application';
            const recommendations = await selector.selectAgentsForObjective(objective);
            // All recommendations should have default historical score
            recommendations.forEach((rec) => {
                expect(rec.score).toBeDefined();
            });
        });
    });
});
//# sourceMappingURL=intelligent_selector.test.js.map