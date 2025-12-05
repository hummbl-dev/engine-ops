/*
 * Copyright (c) 2025, HUMMBL, LLC
 * Licensed under the Apache License, Version 2.0
 */

import { describe, it, expect, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import {
  ApiVersion,
  ApiVersionRequest,
  apiVersionMiddleware,
  deprecationWarningMiddleware,
  ApiVersionTransformer,
} from '../api-version.js';

// Mock Express objects
const mockRequest = (overrides = {}): Partial<Request> => ({
  path: '/api/v1/optimize',
  headers: {},
  query: {},
  ...overrides,
});

// Mock Express Response interface for testing
interface MockResponse extends Partial<Response> {
  statusCode: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: jest.MockedFunction<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  status: jest.MockedFunction<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setHeader: jest.MockedFunction<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getHeader: jest.MockedFunction<any>;
}

const mockResponse = (): MockResponse => {
  const headers: Record<string, string> = {};

  return {
    statusCode: 200,
    json: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    setHeader: jest.fn((key: string, value: string) => {
      headers[key] = value;
    }),
    getHeader: jest.fn((key: string) => headers[key]),
  };
};

const mockNext: NextFunction = jest.fn();

describe('apiVersionMiddleware', () => {
  it('should extract version from URL path', () => {
    const req = mockRequest({ path: '/api/v2/optimize' }) as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    apiVersionMiddleware(req, res, next);

    expect((req as ApiVersionRequest).apiVersion).toBe('v2');
    expect(next).toHaveBeenCalled();
  });

  it('should extract version from header', () => {
    const req = mockRequest({
      path: '/api/optimize',
      headers: { 'x-api-version': 'v2' },
    }) as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    apiVersionMiddleware(req, res, next);

    expect((req as ApiVersionRequest).apiVersion).toBe('v2');
    expect(next).toHaveBeenCalled();
  });

  it('should extract version from query parameter', () => {
    const req = mockRequest({
      path: '/api/optimize',
      query: { api_version: 'v2' },
    }) as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    apiVersionMiddleware(req, res, next);

    expect((req as ApiVersionRequest).apiVersion).toBe('v2');
    expect(next).toHaveBeenCalled();
  });

  it('should default to v1 when no version specified', () => {
    const req = mockRequest({ path: '/api/optimize' }) as Request;
    const res = mockResponse() as Response;

    apiVersionMiddleware(req, res, mockNext);

    expect((req as ApiVersionRequest).apiVersion).toBe('v1');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should reject invalid API version', () => {
    const req = mockRequest({
      path: '/api/optimize',
      headers: { 'x-api-version': 'v99' },
    }) as Request;
    const res = mockResponse() as Response;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const next = jest.fn() as any;

    apiVersionMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Invalid API version',
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should set X-API-Version response header', () => {
    const req = mockRequest({ path: '/api/v1/optimize' }) as Request;
    const res = mockResponse() as Response;

    apiVersionMiddleware(req, res, mockNext);

    expect(res.setHeader).toHaveBeenCalledWith('X-API-Version', 'v1');
  });
});

describe('deprecationWarningMiddleware', () => {
  it('should add deprecation headers for deprecated version', () => {
    const middleware = deprecationWarningMiddleware(
      ApiVersion.V1,
      'Please migrate to v2',
      '2025-12-31',
    );

    const req = mockRequest() as Request;
    (req as ApiVersionRequest).apiVersion = ApiVersion.V1;
    const res = mockResponse() as Response;
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('Warning', expect.stringContaining('deprecated'));
    expect(res.setHeader).toHaveBeenCalledWith('Sunset', '2025-12-31');
    expect(next).toHaveBeenCalled();
  });

  it('should not add headers for non-deprecated version', () => {
    const middleware = deprecationWarningMiddleware(ApiVersion.V1, 'Please migrate to v2');

    const req = mockRequest() as Request;
    (req as ApiVersionRequest).apiVersion = ApiVersion.V2;
    const res = mockResponse() as Response;
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

describe('ApiVersionTransformer', () => {
  describe('transformRequestV1ToV2', () => {
    it('should add default fields for v2', () => {
      const v1Request = {
        type: 'scheduling',
        tasks: [],
      };

      const v2Request = ApiVersionTransformer.transformRequestV1ToV2(v1Request);

      expect(v2Request).toHaveProperty('version');
      expect(v2Request).toHaveProperty('metadata');
      expect(v2Request.type).toBe('scheduling');
    });

    it('should preserve existing fields', () => {
      const v1Request = {
        type: 'scheduling',
        tasks: [],
        version: '1.5',
      };

      const v2Request = ApiVersionTransformer.transformRequestV1ToV2(v1Request);

      expect(v2Request.version).toBe('1.5');
    });
  });

  describe('transformResponseV2ToV1', () => {
    it('should remove v2-specific fields', () => {
      const v2Response = {
        result: { success: true },
        version: '2.0',
        metadata: { processed: true },
      };

      const v1Response = ApiVersionTransformer.transformResponseV2ToV1(v2Response);

      expect(v1Response).not.toHaveProperty('version');
      expect(v1Response).not.toHaveProperty('metadata');
      expect(v1Response).toHaveProperty('result');
    });
  });

  describe('transformRequest', () => {
    it('should transform v1 request body', () => {
      const req = mockRequest({
        body: { type: 'scheduling' },
      }) as Request;
      (req as ApiVersionRequest).apiVersion = ApiVersion.V1;

      const transformed = ApiVersionTransformer.transformRequest(req);

      expect(transformed).toHaveProperty('version');
      expect(transformed).toHaveProperty('metadata');
    });

    it('should not transform v2 request body', () => {
      const req = mockRequest({
        body: { type: 'scheduling' },
      }) as Request;
      (req as ApiVersionRequest).apiVersion = ApiVersion.V2;

      const transformed = ApiVersionTransformer.transformRequest(req);

      expect(transformed).toEqual({ type: 'scheduling' });
    });
  });

  describe('transformResponse', () => {
    it('should transform response for v1 client', () => {
      const data = {
        result: { success: true },
        version: '2.0',
        metadata: {},
      };

      const transformed = ApiVersionTransformer.transformResponse(data, ApiVersion.V1);

      expect(transformed).not.toHaveProperty('version');
      expect(transformed).not.toHaveProperty('metadata');
    });

    it('should not transform response for v2 client', () => {
      const data = {
        result: { success: true },
        version: '2.0',
      };

      const transformed = ApiVersionTransformer.transformResponse(data, ApiVersion.V2);

      expect(transformed).toHaveProperty('version');
    });
  });
});
