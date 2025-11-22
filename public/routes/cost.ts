import { Router } from 'express';
import { CostCalculator, RecommendationEngine } from '../../core/analytics/index.js';

export const costRouter = Router();
const calculator = new CostCalculator();
const recommendationEngine = new RecommendationEngine(calculator);

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
costRouter.post('/estimate', (req, res) => {
    try {
        const usage = req.body;
        const estimate = calculator.calculateCost(usage);
        res.json(estimate);
    } catch (error) {
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
costRouter.post('/recommendations', (req, res) => {
    try {
        const { resourceId, usage, utilization } = req.body;
        const recommendations = recommendationEngine.analyze(resourceId, usage, utilization);
        res.json(recommendations);
    } catch (error) {
        res.status(400).json({ error: 'Invalid request' });
    }
});
