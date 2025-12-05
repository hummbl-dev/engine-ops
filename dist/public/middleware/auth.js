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
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.authenticate = authenticate;
exports.generateToken = generateToken;
const jsonwebtoken_1 = __importDefault(require('jsonwebtoken'));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const API_KEYS = new Set(process.env.API_KEYS?.split(',') || ['demo-api-key']);
/**
 * Authentication middleware
 * Supports both API keys and JWT tokens
 */
function authenticate(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const authHeader = req.headers.authorization;
  // Check API key
  if (apiKey && API_KEYS.has(apiKey)) {
    req.user = { id: 'api-key-user', role: 'user' };
    next();
    return;
  }
  // Check JWT token
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
      return;
    } catch {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
  }
  res.status(401).json({ error: 'Authentication required' });
}
/**
 * Generate JWT token
 */
function generateToken(userId, role = 'user') {
  return jsonwebtoken_1.default.sign({ id: userId, role }, JWT_SECRET, { expiresIn: '24h' });
}
