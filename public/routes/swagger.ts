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

import { Router, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

export const swaggerRouter = Router();

// Load OpenAPI spec
const openApiPath = path.join(__dirname, '../../docs/openapi.yaml');
const openApiSpec = yaml.load(fs.readFileSync(openApiPath, 'utf8')) as any;

// Swagger UI options
const swaggerOptions = {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Engine-Ops API Documentation'
};

// Serve Swagger UI
swaggerRouter.use('/', swaggerUi.serve);
swaggerRouter.get('/', swaggerUi.setup(openApiSpec, swaggerOptions));

// Serve raw OpenAPI spec
swaggerRouter.get('/openapi.json', (_req: Request, res: Response) => {
    res.json(openApiSpec);
});

swaggerRouter.get('/openapi.yaml', (_req: Request, res: Response) => {
    res.type('text/yaml');
    res.send(fs.readFileSync(openApiPath, 'utf8'));
});
