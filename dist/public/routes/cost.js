"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.costRouter = void 0;
const express_1 = require("express");
const index_js_1 = require("../../core/analytics/index.js");
exports.costRouter = (0, express_1.Router)();
const calculator = new index_js_1.CostCalculator();
const recommendationEngine = new index_js_1.RecommendationEngine(calculator);
/**
 * @openapi
 * /cost/estimate:
 *   post:
 *     summary: Calculate cost estimate
 *     tags: [Cost]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cpuCores:
 *                 type: number
 *               memoryGB:
 *                 type: number
 *               storageGB:
 *                 type: number
 *               durationHours:
 *                 type: number
 *     responses:
 *       200:
 *         description: Cost estimate
 */
exports.costRouter.post('/estimate', (req, res) => {
    try {
        const usage = req.body;
        const estimate = calculator.calculateCost(usage);
        res.json(estimate);
    }
    catch {
        res.status(400).json({ error: 'Invalid request' });
    }
});
/**
 * @openapi
 * /cost/recommendations:
 *   post:
 *     summary: Get cost optimization recommendations
 *     tags: [Cost]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resourceId:
 *                 type: string
 *               usage:
 *                 type: object
 *               utilization:
 *                 type: object
 *     responses:
 *       200:
 *         description: List of recommendations
 */
exports.costRouter.post('/recommendations', (req, res) => {
    try {
        const { resourceId, usage, utilization } = req.body;
        const recommendations = recommendationEngine.analyze(resourceId, usage, utilization);
        res.json(recommendations);
    }
    catch {
        res.status(400).json({ error: 'Invalid request' });
    }
});
