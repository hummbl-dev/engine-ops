import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { OptimizationRequest, OptimizationResult } from '../../core/interfaces.js';
export interface OptimizationProgress {
    requestId: string;
    progress: number;
    message: string;
    timestamp: number;
}
/**
 * WebSocket server for real-time optimization updates
 */
export declare class WebSocketServer {
    private io;
    constructor(httpServer: HTTPServer);
    private setupEventHandlers;
    /**
     * Emit optimization started event
     */
    emitOptimizationStart(request: OptimizationRequest): void;
    /**
     * Emit optimization progress event
     */
    emitOptimizationProgress(progress: OptimizationProgress): void;
    /**
     * Emit optimization complete event
     */
    emitOptimizationComplete(result: OptimizationResult): void;
    /**
     * Emit optimization error event
     */
    emitOptimizationError(requestId: string, error: Error): void;
    /**
     * Get Socket.IO server instance
     */
    getIO(): SocketIOServer;
}
//# sourceMappingURL=server.d.ts.map