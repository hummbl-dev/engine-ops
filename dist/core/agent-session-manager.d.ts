import { AgentSession, AgentSessionRequest, SessionState } from '../schemas/agent-session.js';
/**
 * Manages agent sessions for various workflow types
 */
export declare class AgentSessionManager {
    private sessions;
    private logger;
    constructor();
    /**
     * Create a new agent session
     */
    createSession(request: AgentSessionRequest): Promise<AgentSession>;
    /**
     * Get a session by ID
     */
    getSession(sessionId: string): AgentSession | undefined;
    /**
     * List all sessions, optionally filtered by type or state
     */
    listSessions(filters?: {
        sessionType?: string;
        state?: SessionState;
    }): AgentSession[];
    /**
     * Update session state
     */
    updateSessionState(sessionId: string, state: SessionState, result?: Record<string, unknown>, error?: string): Promise<AgentSession>;
    /**
     * Delete a session
     */
    deleteSession(sessionId: string): boolean;
    /**
     * Get session statistics
     */
    getStats(): {
        total: number;
        byType: Record<string, number>;
        byState: Record<string, number>;
    };
}
//# sourceMappingURL=agent-session-manager.d.ts.map