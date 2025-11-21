/*
 * Copyright (c) 2025, HUMMBL, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
export class WebSocketServer {
    private io: SocketIOServer;

    constructor(httpServer: HTTPServer) {
        this.io = new SocketIOServer(httpServer, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST']
            }
        });

        this.setupEventHandlers();
    }

    private setupEventHandlers(): void {
        this.io.on('connection', (socket) => {
            console.log(`Client connected: ${socket.id}`);

            socket.on('subscribe', (requestId: string) => {
                socket.join(`optimization:${requestId}`);
                console.log(`Client ${socket.id} subscribed to ${requestId}`);
            });

            socket.on('unsubscribe', (requestId: string) => {
                socket.leave(`optimization:${requestId}`);
                console.log(`Client ${socket.id} unsubscribed from ${requestId}`);
            });

            socket.on('disconnect', () => {
                console.log(`Client disconnected: ${socket.id}`);
            });
        });
    }

    /**
     * Emit optimization started event
     */
    public emitOptimizationStart(request: OptimizationRequest): void {
        this.io.to(`optimization:${request.id}`).emit('optimization:start', {
            requestId: request.id,
            type: request.type,
            timestamp: Date.now()
        });
    }

    /**
     * Emit optimization progress event
     */
    public emitOptimizationProgress(progress: OptimizationProgress): void {
        this.io.to(`optimization:${progress.requestId}`).emit('optimization:progress', progress);
    }

    /**
     * Emit optimization complete event
     */
    public emitOptimizationComplete(result: OptimizationResult): void {
        this.io.to(`optimization:${result.requestId}`).emit('optimization:complete', result);
    }

    /**
     * Emit optimization error event
     */
    public emitOptimizationError(requestId: string, error: Error): void {
        this.io.to(`optimization:${requestId}`).emit('optimization:error', {
            requestId,
            error: error.message,
            timestamp: Date.now()
        });
    }

    /**
     * Get Socket.IO server instance
     */
    public getIO(): SocketIOServer {
        return this.io;
    }
}
