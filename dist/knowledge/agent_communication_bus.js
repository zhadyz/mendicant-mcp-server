/**
 * Agent Communication Bus - Multi-Agent Coordination
 *
 * Currently agents run independently. The communication bus enables:
 * - Agents can send messages to each other
 * - Agents can request information from peers
 * - Agents can coordinate work distribution
 * - Agents can share intermediate results
 * - Complex multi-agent workflows
 *
 * Example workflow:
 * 1. Analyzer agent discovers issue
 * 2. Analyzer sends message to Implementation agent with details
 * 3. Implementation agent requests file context from Reader agent
 * 4. Reader agent responds with file content
 * 5. Implementation agent fixes issue and notifies Test agent
 * 6. Test agent validates fix
 *
 * This transforms Mendicant from parallel agent execution to
 * true collaborative multi-agent orchestration.
 */
/**
 * Agent Communication Bus - Central message routing and coordination
 */
export class AgentCommunicationBus {
    message_queues = new Map();
    message_history = [];
    pending_responses = new Map();
    stats = {
        total_sent: 0,
        total_received: 0,
        total_processed: 0,
        average_latency_ms: 0,
        messages_by_type: {
            info: 0,
            request: 0,
            response: 0,
            coordination: 0,
            error: 0,
            completion: 0
        },
        messages_by_priority: {
            low: 0,
            normal: 0,
            high: 0,
            urgent: 0
        }
    };
    /**
     * Register an agent on the bus
     */
    registerAgent(agent_id) {
        if (!this.message_queues.has(agent_id)) {
            this.message_queues.set(agent_id, {
                agent_id,
                messages: [],
                processing: false
            });
            console.log(`[CommBus] Registered agent: ${agent_id}`);
        }
    }
    /**
     * Unregister an agent from the bus
     */
    unregisterAgent(agent_id) {
        this.message_queues.delete(agent_id);
        console.log(`[CommBus] Unregistered agent: ${agent_id}`);
    }
    /**
     * Send a message from one agent to another
     */
    async sendMessage(from, to, type, content, options) {
        const message = {
            id: this.generateMessageId(),
            from,
            to,
            type,
            content,
            priority: options?.priority || 'normal',
            timestamp: Date.now(),
            requires_response: options?.requires_response || false,
            response_timeout_ms: options?.response_timeout_ms,
            metadata: options?.metadata
        };
        // Ensure recipient queue exists
        if (!this.message_queues.has(to)) {
            this.registerAgent(to);
        }
        // Add to recipient's queue
        const queue = this.message_queues.get(to);
        queue.messages.push(message);
        // Sort by priority
        this.sortQueueByPriority(queue);
        // Update stats
        this.stats.total_sent += 1;
        this.stats.messages_by_type[type] += 1;
        this.stats.messages_by_priority[message.priority] += 1;
        // Store in history
        this.message_history.push(message);
        console.log(`[CommBus] ${from} → ${to} (${type}, priority: ${message.priority})`);
        return message.id;
    }
    /**
     * Send a request and wait for response
     */
    async sendRequest(from, to, content, timeout_ms = 5000, options) {
        const message_id = await this.sendMessage(from, to, 'request', content, {
            priority: options?.priority,
            requires_response: true,
            response_timeout_ms: timeout_ms,
            metadata: options?.metadata
        });
        // Wait for response
        return new Promise((resolve, reject) => {
            // Set up response handler
            this.pending_responses.set(message_id, resolve);
            // Set timeout
            setTimeout(() => {
                if (this.pending_responses.has(message_id)) {
                    this.pending_responses.delete(message_id);
                    reject(new Error(`Request timeout: ${from} → ${to}`));
                }
            }, timeout_ms);
        });
    }
    /**
     * Send a response to a request
     */
    async sendResponse(from, to, parent_message_id, content, options) {
        const message_id = await this.sendMessage(from, to, 'response', content, {
            priority: options?.priority,
            metadata: options?.metadata
        });
        // Find the message in history and add parent_message_id
        const message = this.message_history.find(m => m.id === message_id);
        if (message) {
            message.parent_message_id = parent_message_id;
        }
        // Check if this is a response to a pending request
        const response_handler = this.pending_responses.get(parent_message_id);
        if (response_handler) {
            response_handler(message);
            this.pending_responses.delete(parent_message_id);
        }
        return message_id;
    }
    /**
     * Broadcast a message to all agents
     */
    async broadcast(from, type, content, options) {
        const message_ids = [];
        for (const [agent_id, _] of this.message_queues.entries()) {
            if (agent_id !== from) {
                const id = await this.sendMessage(from, agent_id, type, content, options);
                message_ids.push(id);
            }
        }
        console.log(`[CommBus] Broadcast from ${from} to ${message_ids.length} agents`);
        return message_ids;
    }
    /**
     * Get next message for an agent
     */
    async receiveMessage(agent_id) {
        const queue = this.message_queues.get(agent_id);
        if (!queue || queue.messages.length === 0) {
            return null;
        }
        // Get highest priority message
        const message = queue.messages.shift();
        // Update stats
        this.stats.total_received += 1;
        this.stats.total_processed += 1;
        const latency = Date.now() - message.timestamp;
        this.stats.average_latency_ms =
            (this.stats.average_latency_ms * (this.stats.total_processed - 1) + latency) /
                this.stats.total_processed;
        console.log(`[CommBus] ${agent_id} received message from ${message.from} (latency: ${latency}ms)`);
        return message;
    }
    /**
     * Peek at next message without removing it
     */
    peekMessage(agent_id) {
        const queue = this.message_queues.get(agent_id);
        if (!queue || queue.messages.length === 0) {
            return null;
        }
        return queue.messages[0];
    }
    /**
     * Get all pending messages for an agent
     */
    getPendingMessages(agent_id) {
        const queue = this.message_queues.get(agent_id);
        return queue ? [...queue.messages] : [];
    }
    /**
     * Get message count for an agent
     */
    getMessageCount(agent_id) {
        const queue = this.message_queues.get(agent_id);
        return queue ? queue.messages.length : 0;
    }
    /**
     * Check if agent has pending messages
     */
    hasPendingMessages(agent_id) {
        return this.getMessageCount(agent_id) > 0;
    }
    /**
     * Clear all messages for an agent
     */
    clearMessages(agent_id) {
        const queue = this.message_queues.get(agent_id);
        if (!queue)
            return 0;
        const count = queue.messages.length;
        queue.messages = [];
        console.log(`[CommBus] Cleared ${count} messages for ${agent_id}`);
        return count;
    }
    /**
     * Get message history
     */
    getMessageHistory(options) {
        let history = [...this.message_history];
        // Filter by agent
        if (options?.agent_id) {
            history = history.filter(m => m.from === options.agent_id || m.to === options.agent_id);
        }
        // Filter by type
        if (options?.type) {
            history = history.filter(m => m.type === options.type);
        }
        // Filter by timestamp
        if (options?.since) {
            history = history.filter(m => m.timestamp >= (options.since || 0));
        }
        // Limit results
        if (options?.limit) {
            history = history.slice(-options.limit);
        }
        return history;
    }
    /**
     * Get conversation thread for a message
     */
    getMessageThread(message_id) {
        const thread = [];
        const message = this.message_history.find(m => m.id === message_id);
        if (!message)
            return thread;
        // Add the message
        thread.push(message);
        // Find parent messages
        let current = message;
        while (current.parent_message_id) {
            const parent = this.message_history.find(m => m.id === current.parent_message_id);
            if (parent) {
                thread.unshift(parent);
                current = parent;
            }
            else {
                break;
            }
        }
        // Find child messages (responses)
        const children = this.message_history.filter(m => m.parent_message_id === message_id);
        thread.push(...children);
        return thread;
    }
    /**
     * Get statistics
     */
    getStats() {
        return { ...this.stats };
    }
    /**
     * Get active agents
     */
    getActiveAgents() {
        return Array.from(this.message_queues.keys());
    }
    /**
     * Get queue status for all agents
     */
    getQueueStatus() {
        return Array.from(this.message_queues.entries()).map(([agent_id, queue]) => ({
            agent_id,
            message_count: queue.messages.length,
            processing: queue.processing
        }));
    }
    /**
     * Reset the bus (clear all queues and history)
     */
    reset() {
        this.message_queues.clear();
        this.message_history = [];
        this.pending_responses.clear();
        this.stats = {
            total_sent: 0,
            total_received: 0,
            total_processed: 0,
            average_latency_ms: 0,
            messages_by_type: {
                info: 0,
                request: 0,
                response: 0,
                coordination: 0,
                error: 0,
                completion: 0
            },
            messages_by_priority: {
                low: 0,
                normal: 0,
                high: 0,
                urgent: 0
            }
        };
        console.log(`[CommBus] Bus reset`);
    }
    /**
     * Sort queue by priority
     */
    sortQueueByPriority(queue) {
        const priority_order = {
            urgent: 0,
            high: 1,
            normal: 2,
            low: 3
        };
        queue.messages.sort((a, b) => {
            const priority_diff = priority_order[a.priority] - priority_order[b.priority];
            if (priority_diff !== 0)
                return priority_diff;
            // If same priority, sort by timestamp (FIFO)
            return a.timestamp - b.timestamp;
        });
    }
    /**
     * Generate unique message ID
     */
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
/**
 * Singleton instance
 */
export const commBus = new AgentCommunicationBus();
/**
 * Example Usage Patterns:
 *
 * 1. Simple info message:
 *    await commBus.sendMessage('agent_a', 'agent_b', 'info', { data: 'value' });
 *
 * 2. Request/response:
 *    const response = await commBus.sendRequest('agent_a', 'agent_b', { query: 'status' });
 *    await commBus.sendResponse('agent_b', 'agent_a', response.parent_message_id!, { status: 'ok' });
 *
 * 3. Broadcast:
 *    await commBus.broadcast('coordinator', 'coordination', { task: 'distribute_work' });
 *
 * 4. Priority message:
 *    await commBus.sendMessage('agent_a', 'agent_b', 'error', { error: 'critical' }, { priority: 'urgent' });
 *
 * 5. Receive messages:
 *    const message = await commBus.receiveMessage('agent_b');
 *    if (message.requires_response) {
 *      await commBus.sendResponse('agent_b', message.from, message.id, { result: 'done' });
 *    }
 */
//# sourceMappingURL=agent_communication_bus.js.map