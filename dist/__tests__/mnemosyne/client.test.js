/**
 * MnemosyneClient Test Suite
 *
 * Comprehensive tests covering all client functionality:
 * - AgentProfile creation
 * - AgentExecution recording
 * - Performance metrics querying
 * - Similar objective finding
 * - Error handling when Mnemosyne is unavailable
 * - Retry logic with exponential backoff
 */
import { describe, test, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { MnemosyneClient } from '../../knowledge/mnemosyne/client.js';
// Mock MCP tools interface
const createMockMCPTools = () => ({
    create_entities: jest.fn().mockResolvedValue(undefined),
    create_relations: jest.fn().mockResolvedValue(undefined),
    semantic_search: jest.fn().mockResolvedValue([]),
    open_nodes: jest.fn().mockResolvedValue([])
});
describe('MnemosyneClient', () => {
    let client;
    let mockTools;
    beforeEach(() => {
        mockTools = createMockMCPTools();
        client = new MnemosyneClient(mockTools);
        jest.clearAllMocks();
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    describe('Connection Status', () => {
        test('should report connected when MCP tools provided', () => {
            expect(client.isConnected()).toBe(true);
        });
        test('should report not connected when no MCP tools', () => {
            const disconnectedClient = new MnemosyneClient();
            expect(disconnectedClient.isConnected()).toBe(false);
        });
        test('should allow setting MCP tools after construction', () => {
            const newClient = new MnemosyneClient();
            expect(newClient.isConnected()).toBe(false);
            newClient.setMCPTools(mockTools);
            expect(newClient.isConnected()).toBe(true);
        });
    });
    describe('createAgentProfile', () => {
        test('should create agent profile with correct entity structure', async () => {
            const agent = {
                name: 'test_agent',
                specialization: 'testing',
                capabilities: ['test_execution', 'verification'],
                tools: ['vitest', 'jest'],
                typical_use_cases: ['unit_testing', 'integration_testing'],
                avg_token_usage: 5000,
                success_rate: 0.85
            };
            await client.createAgentProfile(agent);
            expect(mockTools.create_entities).toHaveBeenCalledTimes(1);
            const entity = mockTools.create_entities.mock.calls[0][0][0];
            expect(entity.name).toBe('test_agent');
            expect(entity.entityType).toBe('AgentProfile');
            expect(entity.observations).toContain('Specialization: testing');
            expect(entity.observations).toContain('Capabilities: test_execution, verification');
            expect(entity.observations).toContain('Tools: vitest, jest');
        });
        test('should handle creation when not connected gracefully', async () => {
            const disconnectedClient = new MnemosyneClient();
            const agent = {
                name: 'test_agent',
                specialization: 'testing',
                capabilities: [],
                tools: [],
                typical_use_cases: [],
                avg_token_usage: 5000,
                success_rate: 0.85
            };
            // Should not throw, just skip silently
            await expect(disconnectedClient.createAgentProfile(agent)).resolves.toBeUndefined();
        });
        test('should retry on failure with exponential backoff', async () => {
            mockTools.create_entities
                .mockRejectedValueOnce(new Error('Network error'))
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce(undefined);
            const agent = {
                name: 'test_agent',
                specialization: 'testing',
                capabilities: [],
                tools: [],
                typical_use_cases: [],
                avg_token_usage: 5000,
                success_rate: 0.85
            };
            await client.createAgentProfile(agent);
            // Should have retried 3 times total
            expect(mockTools.create_entities).toHaveBeenCalledTimes(3);
        });
        test('should throw after max retries exhausted', async () => {
            mockTools.create_entities.mockRejectedValue(new Error('Persistent failure'));
            const agent = {
                name: 'test_agent',
                specialization: 'testing',
                capabilities: [],
                tools: [],
                typical_use_cases: [],
                avg_token_usage: 5000,
                success_rate: 0.85
            };
            await expect(client.createAgentProfile(agent)).rejects.toThrow('Persistent failure');
            expect(mockTools.create_entities).toHaveBeenCalledTimes(3);
        });
    });
    describe('recordExecution', () => {
        test('should record execution with full context', async () => {
            const execution = {
                agent_id: 'test_agent',
                objective: 'implement feature X',
                success: true,
                tokens_used: 12000,
                duration_ms: 3500,
                project_context: {
                    project_type: 'nextjs',
                    has_tests: true
                },
                timestamp: Date.now()
            };
            await client.recordExecution(execution);
            expect(mockTools.create_entities).toHaveBeenCalledTimes(1); // called once with both entities
            expect(mockTools.create_relations).toHaveBeenCalledTimes(1);
            const entities = mockTools.create_entities.mock.calls[0][0];
            expect(entities).toHaveLength(2); // execution + context
            const executionEntity = entities[0];
            expect(executionEntity.entityType).toBe('AgentExecution');
            expect(executionEntity.observations).toContainEqual(expect.stringContaining('Agent: test_agent'));
            expect(executionEntity.observations).toContainEqual(expect.stringContaining('Objective: implement feature X'));
            expect(executionEntity.observations).toContainEqual('Success: true');
            expect(executionEntity.observations).toContainEqual('Tokens: 12000');
            expect(executionEntity.observations).toContainEqual('Duration: 3500ms');
        });
        test('should create context signature when project context provided', async () => {
            const execution = {
                agent_id: 'test_agent',
                objective: 'fix bug Y',
                success: false,
                error_message: 'Type error in component',
                project_context: {
                    project_type: 'react',
                    has_tests: false,
                    recent_errors: ['TypeError: Cannot read property']
                },
                timestamp: Date.now()
            };
            await client.recordExecution(execution);
            const entities = mockTools.create_entities.mock.calls[0][0];
            const contextEntity = entities[1];
            expect(contextEntity.entityType).toBe('ContextSignature');
            expect(contextEntity.name).toMatch(/^ctx_[a-f0-9]{16}$/);
            expect(contextEntity.observations).toContain('Has Tests: false');
            expect(contextEntity.observations).toContain('Project Type: react');
        });
        test('should create relations between agent, execution, and context', async () => {
            const execution = {
                agent_id: 'test_agent',
                objective: 'deploy service',
                success: true,
                project_context: {
                    project_type: 'nodejs'
                },
                timestamp: Date.now()
            };
            await client.recordExecution(execution);
            const relations = mockTools.create_relations.mock.calls[0][0];
            expect(relations).toHaveLength(2);
            expect(relations[0]).toMatchObject({
                from: 'test_agent',
                relationType: 'executed'
            });
            expect(relations[1]).toMatchObject({
                relationType: 'matches_context'
            });
        });
        test('should handle execution without project context', async () => {
            const execution = {
                agent_id: 'test_agent',
                objective: 'simple task',
                success: true,
                timestamp: Date.now()
            };
            await client.recordExecution(execution);
            expect(mockTools.create_entities).toHaveBeenCalledTimes(1); // only execution, no context
            expect(mockTools.create_relations).toHaveBeenCalledTimes(1);
            const relations = mockTools.create_relations.mock.calls[0][0];
            expect(relations).toHaveLength(1); // only agent -> execution relation
        });
        test('should include error message in execution observations', async () => {
            const execution = {
                agent_id: 'test_agent',
                objective: 'failing task',
                success: false,
                error_message: 'Timeout after 30s',
                timestamp: Date.now()
            };
            await client.recordExecution(execution);
            const entity = mockTools.create_entities.mock.calls[0][0][0];
            expect(entity.observations).toContainEqual('Error: Timeout after 30s');
        });
    });
    describe('queryAgentPerformance', () => {
        test('should aggregate performance metrics correctly', async () => {
            const mockExecutions = [
                {
                    name: 'exec_1',
                    observations: [
                        'Agent: test_agent',
                        'Success: true',
                        'Tokens: 10000',
                        'Duration: 2000ms',
                        'Timestamp: 2024-01-01T00:00:00.000Z'
                    ]
                },
                {
                    name: 'exec_2',
                    observations: [
                        'Agent: test_agent',
                        'Success: false',
                        'Tokens: 15000',
                        'Duration: 3500ms',
                        'Timestamp: 2024-01-02T00:00:00.000Z'
                    ]
                },
                {
                    name: 'exec_3',
                    observations: [
                        'Agent: test_agent',
                        'Success: true',
                        'Tokens: 12000',
                        'Duration: 2500ms',
                        'Timestamp: 2024-01-03T00:00:00.000Z'
                    ]
                }
            ];
            mockTools.semantic_search.mockResolvedValue(mockExecutions);
            const metrics = await client.queryAgentPerformance('test_agent');
            expect(metrics).not.toBeNull();
            expect(metrics.agent_id).toBe('test_agent');
            expect(metrics.total_executions).toBe(3);
            expect(metrics.successful_executions).toBe(2);
            expect(metrics.failed_executions).toBe(1);
            expect(metrics.success_rate).toBeCloseTo(2 / 3, 2);
            expect(metrics.avg_tokens).toBeCloseTo(12333.33, 2);
            expect(metrics.avg_duration_ms).toBeCloseTo(2666.67, 2);
        });
        test('should return null when no executions found', async () => {
            mockTools.semantic_search.mockResolvedValue([]);
            const metrics = await client.queryAgentPerformance('unknown_agent');
            expect(metrics).toBeNull();
        });
        test('should return null when not connected', async () => {
            const disconnectedClient = new MnemosyneClient();
            const metrics = await disconnectedClient.queryAgentPerformance('test_agent');
            expect(metrics).toBeNull();
        });
        test('should handle malformed execution data gracefully', async () => {
            const mockExecutions = [
                {
                    name: 'exec_1',
                    observations: [
                        'Agent: test_agent',
                        'Success: true',
                        'Tokens: invalid',
                        'Duration: also_invalid',
                        'Timestamp: 2024-01-01T00:00:00.000Z'
                    ]
                }
            ];
            mockTools.semantic_search.mockResolvedValue(mockExecutions);
            const metrics = await client.queryAgentPerformance('test_agent');
            expect(metrics).not.toBeNull();
            expect(metrics.total_executions).toBe(1);
            expect(metrics.avg_tokens).toBe(0); // NaN should be excluded
            expect(metrics.avg_duration_ms).toBe(0);
        });
    });
    describe('findSimilarObjectives', () => {
        test('should find similar objectives with pattern matching', async () => {
            const mockPatterns = [
                {
                    name: 'pattern_1',
                    observations: [
                        'Objective: implement authentication',
                        'Type: implement',
                        'Success Count: 5',
                        'Failure Count: 1',
                        'Avg Tokens: 15000',
                        'Successful Agents: security_agent, backend_agent'
                    ],
                    similarity_score: 0.92
                },
                {
                    name: 'pattern_2',
                    observations: [
                        'Objective: implement user login',
                        'Type: implement',
                        'Success Count: 3',
                        'Failure Count: 2',
                        'Avg Tokens: 12000',
                        'Successful Agents: auth_agent'
                    ],
                    similarity_score: 0.87
                }
            ];
            mockTools.semantic_search.mockResolvedValue(mockPatterns);
            const matches = await client.findSimilarObjectives('implement auth system', 5);
            expect(matches).toHaveLength(2);
            expect(matches[0].pattern_name).toBe('pattern_1');
            expect(matches[0].objective_text).toBe('implement authentication');
            expect(matches[0].objective_type).toBe('implement');
            expect(matches[0].success_rate).toBeCloseTo(5 / 6, 2);
            expect(matches[0].avg_tokens).toBe(15000);
            expect(matches[0].recommended_agents).toEqual(['security_agent', 'backend_agent']);
            expect(matches[0].similarity_score).toBe(0.92);
        });
        test('should return empty array when no matches found', async () => {
            mockTools.semantic_search.mockResolvedValue([]);
            const matches = await client.findSimilarObjectives('completely unique objective');
            expect(matches).toEqual([]);
        });
        test('should return empty array when not connected', async () => {
            const disconnectedClient = new MnemosyneClient();
            const matches = await disconnectedClient.findSimilarObjectives('test objective');
            expect(matches).toEqual([]);
        });
        test('should filter out malformed pattern results', async () => {
            const mockPatterns = [
                {
                    name: 'pattern_1',
                    observations: [
                        'Objective: valid pattern',
                        'Type: implement',
                        'Success Count: 5',
                        'Failure Count: 1'
                    ]
                },
                {
                    name: 'pattern_2',
                    observations: [
                        // Missing required observations
                        'Success Count: 3'
                    ]
                }
            ];
            mockTools.semantic_search.mockResolvedValue(mockPatterns);
            const matches = await client.findSimilarObjectives('test');
            expect(matches).toHaveLength(1);
            expect(matches[0].pattern_name).toBe('pattern_1');
        });
        test('should respect limit parameter', async () => {
            const matches = await client.findSimilarObjectives('test objective', 3);
            expect(mockTools.semantic_search).toHaveBeenCalledWith('test objective', {
                entity_types: ['ObjectivePattern'],
                limit: 3,
                min_similarity: 0.7
            });
        });
    });
    describe('Error Handling and Retry Logic', () => {
        test('should retry failed operations with exponential backoff', async () => {
            const startTime = Date.now();
            mockTools.create_entities
                .mockRejectedValueOnce(new Error('Retry 1'))
                .mockRejectedValueOnce(new Error('Retry 2'))
                .mockResolvedValueOnce(undefined);
            const agent = {
                name: 'test_agent',
                specialization: 'testing',
                capabilities: [],
                tools: [],
                typical_use_cases: [],
                avg_token_usage: 5000,
                success_rate: 0.85
            };
            await client.createAgentProfile(agent);
            const duration = Date.now() - startTime;
            // Should have taken at least 1s (first retry) + 2s (second retry) = 3s
            // Using a buffer for timing variations
            expect(duration).toBeGreaterThanOrEqual(2800);
            expect(mockTools.create_entities).toHaveBeenCalledTimes(3);
        });
        test('should handle semantic search errors gracefully', async () => {
            mockTools.semantic_search.mockRejectedValue(new Error('Search failed'));
            const metrics = await client.queryAgentPerformance('test_agent');
            expect(metrics).toBeNull();
        });
        test('should handle relation creation errors gracefully', async () => {
            mockTools.create_relations.mockRejectedValue(new Error('Relation creation failed'));
            const execution = {
                agent_id: 'test_agent',
                objective: 'test task',
                success: true,
                timestamp: Date.now()
            };
            // Should throw because relations are part of the execution record
            await expect(client.recordExecution(execution)).rejects.toThrow();
        });
    });
});
//# sourceMappingURL=client.test.js.map