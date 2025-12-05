'use strict';
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
Object.defineProperty(exports, '__esModule', { value: true });
exports.WebSocketServer = void 0;
const socket_io_1 = require('socket.io');
/**
 * WebSocket server for real-time optimization updates
 */
class WebSocketServer {
  io;
  constructor(httpServer) {
    this.io = new socket_io_1.Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });
    this.setupEventHandlers();
  }
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);
      socket.on('subscribe', (requestId) => {
        socket.join(`optimization:${requestId}`);
        console.log(`Client ${socket.id} subscribed to ${requestId}`);
      });
      socket.on('unsubscribe', (requestId) => {
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
  emitOptimizationStart(request) {
    this.io.to(`optimization:${request.id}`).emit('optimization:start', {
      requestId: request.id,
      type: request.type,
      timestamp: Date.now(),
    });
  }
  /**
   * Emit optimization progress event
   */
  emitOptimizationProgress(progress) {
    this.io.to(`optimization:${progress.requestId}`).emit('optimization:progress', progress);
  }
  /**
   * Emit optimization complete event
   */
  emitOptimizationComplete(result) {
    this.io.to(`optimization:${result.requestId}`).emit('optimization:complete', result);
  }
  /**
   * Emit optimization error event
   */
  emitOptimizationError(requestId, error) {
    this.io.to(`optimization:${requestId}`).emit('optimization:error', {
      requestId,
      error: error.message,
      timestamp: Date.now(),
    });
  }
  /**
   * Get Socket.IO server instance
   */
  getIO() {
    return this.io;
  }
}
exports.WebSocketServer = WebSocketServer;
