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
import { AgentId } from '../types.js';
export interface Message {
    id: string;
    from: AgentId;
    to: AgentId;
    type: MessageType;
    content: any;
    priority: Priority;
    timestamp: number;
    requires_response: boolean;
    response_timeout_ms?: number;
    parent_message_id?: string;
    metadata?: Record<string, any>;
}
export type MessageType = 'info' | 'request' | 'response' | 'coordination' | 'error' | 'completion';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';
export interface MessageQueue {
    agent_id: AgentId;
    messages: Message[];
    processing: boolean;
}
export interface MessageStats {
    total_sent: number;
    total_received: number;
    total_processed: number;
    average_latency_ms: number;
    messages_by_type: Record<MessageType, number>;
    messages_by_priority: Record<Priority, number>;
}
/**
 * Agent Communication Bus - Central message routing and coordination
 */
export declare class AgentCommunicationBus {
    private message_queues;
    private message_history;
    private pending_responses;
    private stats;
    /**
     * Register an agent on the bus
     */
    registerAgent(agent_id: AgentId): void;
    /**
     * Unregister an agent from the bus
     */
    unregisterAgent(agent_id: AgentId): void;
    /**
     * Send a message from one agent to another
     */
    sendMessage(from: AgentId, to: AgentId, type: MessageType, content: any, options?: {
        priority?: Priority;
        requires_response?: boolean;
        response_timeout_ms?: number;
        metadata?: Record<string, any>;
    }): Promise<string>;
    /**
     * Send a request and wait for response
     */
    sendRequest(from: AgentId, to: AgentId, content: any, timeout_ms?: number, options?: {
        priority?: Priority;
        metadata?: Record<string, any>;
    }): Promise<Message>;
    /**
     * Send a response to a request
     */
    sendResponse(from: AgentId, to: AgentId, parent_message_id: string, content: any, options?: {
        priority?: Priority;
        metadata?: Record<string, any>;
    }): Promise<string>;
    /**
     * Broadcast a message to all agents
     */
    broadcast(from: AgentId, type: MessageType, content: any, options?: {
        priority?: Priority;
        metadata?: Record<string, any>;
    }): Promise<string[]>;
    /**
     * Get next message for an agent
     */
    receiveMessage(agent_id: AgentId): Promise<Message | null>;
    /**
     * Peek at next message without removing it
     */
    peekMessage(agent_id: AgentId): Message | null;
    /**
     * Get all pending messages for an agent
     */
    getPendingMessages(agent_id: AgentId): Message[];
    /**
     * Get message count for an agent
     */
    getMessageCount(agent_id: AgentId): number;
    /**
     * Check if agent has pending messages
     */
    hasPendingMessages(agent_id: AgentId): boolean;
    /**
     * Clear all messages for an agent
     */
    clearMessages(agent_id: AgentId): number;
    /**
     * Get message history
     */
    getMessageHistory(options?: {
        agent_id?: AgentId;
        type?: MessageType;
        since?: number;
        limit?: number;
    }): Message[];
    /**
     * Get conversation thread for a message
     */
    getMessageThread(message_id: string): Message[];
    /**
     * Get statistics
     */
    getStats(): MessageStats;
    /**
     * Get active agents
     */
    getActiveAgents(): AgentId[];
    /**
     * Get queue status for all agents
     */
    getQueueStatus(): Array<{
        agent_id: AgentId;
        message_count: number;
        processing: boolean;
    }>;
    /**
     * Reset the bus (clear all queues and history)
     */
    reset(): void;
    /**
     * Sort queue by priority
     */
    private sortQueueByPriority;
    /**
     * Generate unique message ID
     */
    private generateMessageId;
}
/**
 * Singleton instance
 */
export declare const commBus: AgentCommunicationBus;
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
//# sourceMappingURL=agent_communication_bus.d.ts.map