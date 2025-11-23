"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerRouter = void 0;
const express_1 = require("express");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const yaml = __importStar(require("js-yaml"));
exports.swaggerRouter = (0, express_1.Router)();
// Load OpenAPI spec - try multiple locations
let openApiPath = path.join(__dirname, '../../docs/openapi.yaml');
if (!fs.existsSync(openApiPath)) {
    // Try from project root when running from dist
    openApiPath = path.join(process.cwd(), 'docs/openapi.yaml');
}
let openApiSpec = null;
if (fs.existsSync(openApiPath)) {
    openApiSpec = yaml.load(fs.readFileSync(openApiPath, 'utf8'));
}
else {
    console.warn('OpenAPI spec not found, Swagger UI will not be available');
}
// Swagger UI options
const swaggerOptions = {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Engine-Ops API Documentation'
};
// Serve Swagger UI only if spec is loaded
if (openApiSpec) {
    exports.swaggerRouter.use('/', swagger_ui_express_1.default.serve);
    exports.swaggerRouter.get('/', swagger_ui_express_1.default.setup(openApiSpec, swaggerOptions));
}
else {
    exports.swaggerRouter.get('/', (_req, res) => {
        res.status(503).json({ error: 'API documentation is not available' });
    });
}
// Serve raw OpenAPI spec
exports.swaggerRouter.get('/openapi.json', (_req, res) => {
    if (openApiSpec) {
        res.json(openApiSpec);
    }
    else {
        res.status(503).json({ error: 'API documentation is not available' });
    }
});
exports.swaggerRouter.get('/openapi.yaml', (_req, res) => {
    if (openApiSpec && fs.existsSync(openApiPath)) {
        res.type('text/yaml');
        res.send(fs.readFileSync(openApiPath, 'utf8'));
    }
    else {
        res.status(503).json({ error: 'API documentation is not available' });
    }
});
