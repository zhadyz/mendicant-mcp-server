/**
 * MCP Agent Discovery Test Suite
 *
 * Tests dynamic agent discovery from MCP context, environment, and known agents.
 * Validates capability parsing, categorization, and agent metadata extraction.
 */
import { MCPAgentDiscovery } from '../../discovery/mcp_agent_discovery.js';
describe('MCPAgentDiscovery', () => {
    let discovery;
    beforeEach(() => {
        discovery = new MCPAgentDiscovery();
        discovery.reset(); // Clear any previous discoveries
    });
    describe('Known Agent Discovery', () => {
        test('should discover all known agents', async () => {
            const agents = await discovery.discoverAvailableAgents();
            // Should discover at least the core agents
            expect(agents.length).toBeGreaterThan(0);
            // Check for specific core agents
            const agentIds = agents.map(a => a.name);
            expect(agentIds).toContain('hollowed_eyes');
            expect(agentIds).toContain('loveless');
            expect(agentIds).toContain('the_architect');
        });
        test('should parse agent capabilities correctly', async () => {
            const agents = await discovery.discoverAvailableAgents();
            const hollowedEyes = agents.find(a => a.name === 'hollowed_eyes');
            expect(hollowedEyes).toBeDefined();
            expect(hollowedEyes?.specialization).toBeTruthy();
            expect(hollowedEyes?.capabilities).toBeInstanceOf(Array);
            expect(hollowedEyes?.tools).toBeInstanceOf(Array);
            expect(hollowedEyes?.typical_use_cases).toBeInstanceOf(Array);
            expect(hollowedEyes?.avg_token_usage).toBeGreaterThan(0);
            expect(hollowedEyes?.success_rate).toBeDefined();
        });
        test('should infer tools from agent descriptions', async () => {
            const agents = await discovery.discoverAvailableAgents();
            const hollowedEyes = agents.find(a => a.name === 'hollowed_eyes');
            // hollowed_eyes description mentions GitHub and semantic search
            expect(hollowedEyes?.tools.length).toBeGreaterThan(0);
        });
        test('should set reasonable success rate defaults', async () => {
            const agents = await discovery.discoverAvailableAgents();
            agents.forEach(agent => {
                expect(agent.success_rate).toBeGreaterThanOrEqual(0);
                expect(agent.success_rate).toBeLessThanOrEqual(1);
            });
        });
    });
    describe('Agent Retrieval', () => {
        test('should retrieve specific agent by ID', async () => {
            await discovery.discoverAvailableAgents();
            const agent = discovery.getAgent('hollowed_eyes');
            expect(agent).toBeDefined();
            expect(agent?.name).toBe('hollowed_eyes');
        });
        test('should return null for non-existent agent', () => {
            const agent = discovery.getAgent('non_existent_agent');
            expect(agent).toBeNull();
        });
        test('should get all discovered agents', async () => {
            await discovery.discoverAvailableAgents();
            const agents = discovery.getAllAgents();
            expect(agents.length).toBeGreaterThan(0);
        });
    });
    describe('Agent Categorization', () => {
        test('should categorize development agents', async () => {
            const agents = await discovery.discoverAvailableAgents();
            const devAgents = discovery.getAgentsByCategory('development');
            expect(devAgents.length).toBeGreaterThan(0);
            // hollowed_eyes should be categorized as development
            const hollowedEyes = devAgents.find(a => a.name === 'hollowed_eyes');
            expect(hollowedEyes).toBeDefined();
        });
        test('should categorize QA/security agents', async () => {
            const agents = await discovery.discoverAvailableAgents();
            const qaAgents = discovery.getAgentsByCategory('qa_security');
            // loveless should be categorized as QA/security
            const loveless = qaAgents.find(a => a.name === 'loveless');
            expect(loveless).toBeDefined();
        });
        test('should categorize architecture agents', async () => {
            const agents = await discovery.discoverAvailableAgents();
            const archAgents = discovery.getAgentsByCategory('architecture');
            // the_architect should be categorized as architecture
            const architect = archAgents.find(a => a.name === 'the_architect');
            expect(architect).toBeDefined();
        });
        test('should categorize operations agents', async () => {
            const agents = await discovery.discoverAvailableAgents();
            const opsAgents = discovery.getAgentsByCategory('operations');
            // zhadyz should be categorized as operations (DevOps)
            const zhadyz = opsAgents.find(a => a.name === 'zhadyz');
            expect(zhadyz).toBeDefined();
        });
    });
    describe('Discovery Refresh', () => {
        test('should detect when refresh is needed', async () => {
            // Wait for auto-discovery to complete
            await new Promise(resolve => setTimeout(resolve, 100));
            // Immediately after discovery
            expect(discovery.needsRefresh()).toBe(false);
            // Reset to test stale condition
            discovery.reset();
            // After reset, should need refresh
            expect(discovery.needsRefresh()).toBe(true);
        });
        test('should detect stale discovery', async () => {
            await discovery.discoverAvailableAgents();
            // Wait a bit to ensure time passes
            await new Promise(resolve => setTimeout(resolve, 10));
            // Should need refresh after very short interval (5ms for testing)
            expect(discovery.needsRefresh(5)).toBe(true);
        });
        test('should allow manual reset', async () => {
            await discovery.discoverAvailableAgents();
            const agentsBefore = discovery.getAllAgents();
            expect(agentsBefore.length).toBeGreaterThan(0);
            discovery.reset();
            expect(discovery.needsRefresh()).toBe(true);
        });
    });
    describe('Environment Variable Discovery', () => {
        test('should handle missing CLAUDE_AGENTS env var', async () => {
            // Should not throw error when env var is missing
            await expect(discovery.discoverAvailableAgents()).resolves.not.toThrow();
        });
        test('should parse CLAUDE_AGENTS if present', async () => {
            const originalEnv = process.env.CLAUDE_AGENTS;
            try {
                // Set test env var
                process.env.CLAUDE_AGENTS = 'custom_agent_1,custom_agent_2';
                // Create fresh discovery instance and wait for auto-discovery
                const newDiscovery = new MCPAgentDiscovery();
                await new Promise(resolve => setTimeout(resolve, 150));
                // Get discovered agents
                const agents = newDiscovery.getAllAgents();
                // Should include custom agents
                const agentIds = agents.map(a => a.name);
                expect(agentIds).toContain('custom_agent_1');
                expect(agentIds).toContain('custom_agent_2');
            }
            finally {
                // Restore original env
                if (originalEnv) {
                    process.env.CLAUDE_AGENTS = originalEnv;
                }
                else {
                    delete process.env.CLAUDE_AGENTS;
                }
            }
        });
    });
    describe('Deduplication', () => {
        test('should deduplicate agents from multiple sources', async () => {
            // Discovery from known agents + environment
            const agents = await discovery.discoverAvailableAgents();
            const agentIds = agents.map(a => a.name);
            const uniqueIds = new Set(agentIds);
            // No duplicates
            expect(agentIds.length).toBe(uniqueIds.size);
        });
        test('should not re-discover agents on subsequent calls', async () => {
            const firstDiscovery = await discovery.discoverAvailableAgents();
            const secondDiscovery = await discovery.discoverAvailableAgents();
            expect(firstDiscovery.length).toBe(secondDiscovery.length);
        });
    });
    describe('Agent Metadata', () => {
        test('should generate use cases from descriptions', async () => {
            const agents = await discovery.discoverAvailableAgents();
            agents.forEach(agent => {
                expect(agent.typical_use_cases).toBeInstanceOf(Array);
                expect(agent.typical_use_cases.length).toBeGreaterThan(0);
            });
        });
        test('should estimate token usage by category', async () => {
            const agents = await discovery.discoverAvailableAgents();
            agents.forEach(agent => {
                expect(agent.avg_token_usage).toBeGreaterThan(0);
                // Should be within reasonable range
                expect(agent.avg_token_usage).toBeLessThan(100000);
            });
        });
        test('should extract technology keywords', async () => {
            const agents = await discovery.discoverAvailableAgents();
            const hollowedEyes = agents.find(a => a.name === 'hollowed_eyes');
            // Description mentions GitHub, semantic search
            expect(hollowedEyes?.tools.some(t => t.includes('github'))).toBe(true);
        });
    });
    describe('Error Handling', () => {
        test('should handle malformed agent descriptions gracefully', async () => {
            // Should not throw even with unusual data
            await expect(discovery.discoverAvailableAgents()).resolves.not.toThrow();
        });
        test('should provide fallback values for missing data', async () => {
            const agents = await discovery.discoverAvailableAgents();
            // All agents should have required fields with defaults
            agents.forEach(agent => {
                expect(agent.name).toBeTruthy();
                expect(agent.specialization).toBeTruthy();
                expect(agent.capabilities).toBeInstanceOf(Array);
                expect(agent.tools).toBeInstanceOf(Array);
                expect(agent.typical_use_cases).toBeInstanceOf(Array);
                expect(typeof agent.avg_token_usage).toBe('number');
                expect(typeof agent.success_rate).toBe('number');
            });
        });
    });
});
//# sourceMappingURL=mcp_agent_discovery.test.js.map