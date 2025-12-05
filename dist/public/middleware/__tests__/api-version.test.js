'use strict';
/*
 * Copyright (c) 2025, HUMMBL, LLC
 * Licensed under the Apache License, Version 2.0
 */
Object.defineProperty(exports, '__esModule', { value: true });
const globals_1 = require('@jest/globals');
const api_version_js_1 = require('../api-version.js');
// Mock Express objects
const mockRequest = (overrides = {}) => ({
  path: '/api/v1/optimize',
  headers: {},
  query: {},
  ...overrides,
});
const mockResponse = () => {
  const headers = {};
  return {
    statusCode: 200,
    json: globals_1.jest.fn().mockReturnThis(),
    status: globals_1.jest.fn().mockReturnThis(),
    setHeader: globals_1.jest.fn((key, value) => {
      headers[key] = value;
    }),
    getHeader: globals_1.jest.fn((key) => headers[key]),
  };
};
const mockNext = globals_1.jest.fn();
(0, globals_1.describe)('apiVersionMiddleware', () => {
  (0, globals_1.it)('should extract version from URL path', () => {
    const req = mockRequest({ path: '/api/v2/optimize' });
    const res = mockResponse();
    const next = globals_1.jest.fn();
    (0, api_version_js_1.apiVersionMiddleware)(req, res, next);
    (0, globals_1.expect)(req.apiVersion).toBe('v2');
    (0, globals_1.expect)(next).toHaveBeenCalled();
  });
  (0, globals_1.it)('should extract version from header', () => {
    const req = mockRequest({
      path: '/api/optimize',
      headers: { 'x-api-version': 'v2' },
    });
    const res = mockResponse();
    const next = globals_1.jest.fn();
    (0, api_version_js_1.apiVersionMiddleware)(req, res, next);
    (0, globals_1.expect)(req.apiVersion).toBe('v2');
    (0, globals_1.expect)(next).toHaveBeenCalled();
  });
  (0, globals_1.it)('should extract version from query parameter', () => {
    const req = mockRequest({
      path: '/api/optimize',
      query: { api_version: 'v2' },
    });
    const res = mockResponse();
    const next = globals_1.jest.fn();
    (0, api_version_js_1.apiVersionMiddleware)(req, res, next);
    (0, globals_1.expect)(req.apiVersion).toBe('v2');
    (0, globals_1.expect)(next).toHaveBeenCalled();
  });
  (0, globals_1.it)('should default to v1 when no version specified', () => {
    const req = mockRequest({ path: '/api/optimize' });
    const res = mockResponse();
    (0, api_version_js_1.apiVersionMiddleware)(req, res, mockNext);
    (0, globals_1.expect)(req.apiVersion).toBe('v1');
    (0, globals_1.expect)(mockNext).toHaveBeenCalled();
  });
  (0, globals_1.it)('should reject invalid API version', () => {
    const req = mockRequest({
      path: '/api/optimize',
      headers: { 'x-api-version': 'v99' },
    });
    const res = mockResponse();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const next = globals_1.jest.fn();
    (0, api_version_js_1.apiVersionMiddleware)(req, res, next);
    (0, globals_1.expect)(res.status).toHaveBeenCalledWith(400);
    (0, globals_1.expect)(res.json).toHaveBeenCalledWith(
      globals_1.expect.objectContaining({
        error: 'Invalid API version',
      }),
    );
    (0, globals_1.expect)(next).not.toHaveBeenCalled();
  });
  (0, globals_1.it)('should set X-API-Version response header', () => {
    const req = mockRequest({ path: '/api/v1/optimize' });
    const res = mockResponse();
    (0, api_version_js_1.apiVersionMiddleware)(req, res, mockNext);
    (0, globals_1.expect)(res.setHeader).toHaveBeenCalledWith('X-API-Version', 'v1');
  });
});
(0, globals_1.describe)('deprecationWarningMiddleware', () => {
  (0, globals_1.it)('should add deprecation headers for deprecated version', () => {
    const middleware = (0, api_version_js_1.deprecationWarningMiddleware)(
      api_version_js_1.ApiVersion.V1,
      'Please migrate to v2',
      '2025-12-31',
    );
    const req = mockRequest();
    req.apiVersion = api_version_js_1.ApiVersion.V1;
    const res = mockResponse();
    const next = globals_1.jest.fn();
    middleware(req, res, next);
    (0, globals_1.expect)(res.setHeader).toHaveBeenCalledWith(
      'Warning',
      globals_1.expect.stringContaining('deprecated'),
    );
    (0, globals_1.expect)(res.setHeader).toHaveBeenCalledWith('Sunset', '2025-12-31');
    (0, globals_1.expect)(next).toHaveBeenCalled();
  });
  (0, globals_1.it)('should not add headers for non-deprecated version', () => {
    const middleware = (0, api_version_js_1.deprecationWarningMiddleware)(
      api_version_js_1.ApiVersion.V1,
      'Please migrate to v2',
    );
    const req = mockRequest();
    req.apiVersion = api_version_js_1.ApiVersion.V2;
    const res = mockResponse();
    const next = globals_1.jest.fn();
    middleware(req, res, next);
    (0, globals_1.expect)(next).toHaveBeenCalled();
  });
});
(0, globals_1.describe)('ApiVersionTransformer', () => {
  (0, globals_1.describe)('transformRequestV1ToV2', () => {
    (0, globals_1.it)('should add default fields for v2', () => {
      const v1Request = {
        type: 'scheduling',
        tasks: [],
      };
      const v2Request = api_version_js_1.ApiVersionTransformer.transformRequestV1ToV2(v1Request);
      (0, globals_1.expect)(v2Request).toHaveProperty('version');
      (0, globals_1.expect)(v2Request).toHaveProperty('metadata');
      (0, globals_1.expect)(v2Request.type).toBe('scheduling');
    });
    (0, globals_1.it)('should preserve existing fields', () => {
      const v1Request = {
        type: 'scheduling',
        tasks: [],
        version: '1.5',
      };
      const v2Request = api_version_js_1.ApiVersionTransformer.transformRequestV1ToV2(v1Request);
      (0, globals_1.expect)(v2Request.version).toBe('1.5');
    });
  });
  (0, globals_1.describe)('transformResponseV2ToV1', () => {
    (0, globals_1.it)('should remove v2-specific fields', () => {
      const v2Response = {
        result: { success: true },
        version: '2.0',
        metadata: { processed: true },
      };
      const v1Response = api_version_js_1.ApiVersionTransformer.transformResponseV2ToV1(v2Response);
      (0, globals_1.expect)(v1Response).not.toHaveProperty('version');
      (0, globals_1.expect)(v1Response).not.toHaveProperty('metadata');
      (0, globals_1.expect)(v1Response).toHaveProperty('result');
    });
  });
  (0, globals_1.describe)('transformRequest', () => {
    (0, globals_1.it)('should transform v1 request body', () => {
      const req = mockRequest({
        body: { type: 'scheduling' },
      });
      req.apiVersion = api_version_js_1.ApiVersion.V1;
      const transformed = api_version_js_1.ApiVersionTransformer.transformRequest(req);
      (0, globals_1.expect)(transformed).toHaveProperty('version');
      (0, globals_1.expect)(transformed).toHaveProperty('metadata');
    });
    (0, globals_1.it)('should not transform v2 request body', () => {
      const req = mockRequest({
        body: { type: 'scheduling' },
      });
      req.apiVersion = api_version_js_1.ApiVersion.V2;
      const transformed = api_version_js_1.ApiVersionTransformer.transformRequest(req);
      (0, globals_1.expect)(transformed).toEqual({ type: 'scheduling' });
    });
  });
  (0, globals_1.describe)('transformResponse', () => {
    (0, globals_1.it)('should transform response for v1 client', () => {
      const data = {
        result: { success: true },
        version: '2.0',
        metadata: {},
      };
      const transformed = api_version_js_1.ApiVersionTransformer.transformResponse(
        data,
        api_version_js_1.ApiVersion.V1,
      );
      (0, globals_1.expect)(transformed).not.toHaveProperty('version');
      (0, globals_1.expect)(transformed).not.toHaveProperty('metadata');
    });
    (0, globals_1.it)('should not transform response for v2 client', () => {
      const data = {
        result: { success: true },
        version: '2.0',
      };
      const transformed = api_version_js_1.ApiVersionTransformer.transformResponse(
        data,
        api_version_js_1.ApiVersion.V2,
      );
      (0, globals_1.expect)(transformed).toHaveProperty('version');
    });
  });
});
