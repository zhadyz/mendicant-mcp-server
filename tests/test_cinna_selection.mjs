import { intelligentSelector } from '../dist/knowledge/intelligent_selector.js';
import { agentRegistry } from '../dist/knowledge/agent_registry.js';

// First check if cinna exists in registry
await agentRegistry.initialize();
const allAgents = await agentRegistry.getAllAgents();

console.log('=== All Agents in Registry ===');
Object.entries(allAgents).forEach(([id, agent]) => {
  console.log(`- ${id} (${agent.specialization})`);
});

console.log('\n=== Looking for cinna ===');
const cinnaInRegistry = allAgents['cinna'];
if (cinnaInRegistry) {
  console.log('✅ cinna exists in registry');
  console.log('Specialization:', cinnaInRegistry.specialization);
  console.log('Capabilities:', cinnaInRegistry.capabilities);
} else {
  console.log('❌ cinna NOT in registry');
}

// Now test selection
console.log('\n=== Testing Selection for Design Task ===');
const objective = 'Design a modern UI with dark mode';
const selected = await intelligentSelector.selectAgentsForObjective(objective);

console.log(`\nSelected ${selected.length} agents:`);
selected.forEach((agent, idx) => {
  const agentId = agent.agent_id || agent.name || 'UNDEFINED';
  console.log(`${idx + 1}. ${agentId} - Score: ${(agent.score * 100).toFixed(1)}%`);
});

// Specifically look for cinna
const cinnaSelected = selected.find(a => a.agent_id === 'cinna' || a.name === 'cinna');
if (cinnaSelected) {
  const rank = selected.findIndex(a => a.agent_id === 'cinna' || a.name === 'cinna') + 1;
  console.log(`\n✅ cinna FOUND at rank #${rank} with ${(cinnaSelected.score * 100).toFixed(1)}% score`);
} else {
  console.log('\n❌ cinna NOT in selected agents');
}

process.exit(0);
