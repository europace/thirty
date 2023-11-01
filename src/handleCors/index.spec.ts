import { compose, types } from '../core';
import { handleCors } from './index';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { sanitizeHeaders } from '../sanitizeHeaders';
import { registerHttpErrorHandler } from '../registerHttpErrorHandler';
import { NotFoundError } from '../errors';
import { APIGatewayProxyResult } from '../types/APIGatewayProxyResult';

let handler;

beforeAll(() => {
  handler = compose(
    types<APIGatewayProxyEvent, Promise<APIGatewayProxyResult>>(),
    sanitizeHeaders(),
    handleCors(),
  )(async (event) => {
    return {
      statusCode: 200,
      headers: {
        'Set-Cookie': 'session=1234',
      },
    };
  });
});

it('should return preflight headers on OPTIONS request', async () => {
  const response = await handler({ httpMethod: 'OPTIONS' });
  expect(response).toEqual({
    headers: {
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
      'Access-Control-Allow-Origin': '*',
    },
    statusCode: 200,
  });
});

it('should add handleCors headers on any other request', async () => {
  const response = await handler({ httpMethod: 'GET' });
  expect(response).toEqual({
    headers: {
      'Set-Cookie': 'session=1234',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Origin': '*',
    },
    statusCode: 200,
  });
});

describe('with origin=test', () => {
  beforeAll(() => {
    handler = compose(
      types<APIGatewayProxyEvent, Promise<APIGatewayProxyResult>>(),
      sanitizeHeaders(),
      handleCors({ origin: 'test' }),
    )(async (event) => {
      return {
        statusCode: 200,
        headers: {
          'Set-Cookie': 'session=1234',
        },
      };
    });
  });

  it('should return Access-Control-Allow-Origin set to "test"', async () => {
    const response = await handler({ httpMethod: 'OPTIONS' });
    expect(response.headers).toEqual(
      expect.objectContaining({
        'Access-Control-Allow-Origin': 'test',
      }),
    );
  });
});

describe('with origin=[test]', () => {
  beforeAll(() => {
    handler = compose(
      types<APIGatewayProxyEvent, Promise<APIGatewayProxyResult>>(),
      sanitizeHeaders(),
      handleCors({ origin: ['test'] }),
    )(async (event) => {
      return {
        statusCode: 200,
        headers: {
          'Set-Cookie': 'session=1234',
        },
      };
    });
  });

  it('should return Access-Control-Allow-Origin set to "test" due to request header', async () => {
    const response = await handler({ httpMethod: 'OPTIONS', headers: { origin: 'test' } });
    expect(response.headers).toEqual(
      expect.objectContaining({
        'Access-Control-Allow-Origin': 'test',
      }),
    );
  });

  it('should return Access-Control-Allow-Origin set to "null" due to invalid request-origin', async () => {
    const response = await handler({
      httpMethod: 'OPTIONS',
      headers: { origin: 'invalid' },
    });
    expect(response.headers).toEqual(
      expect.objectContaining({
        'Access-Control-Allow-Origin': 'null',
      }),
    );
  });
});

describe('preflight', () => {
  beforeAll(() => {
    handler = compose(
      types<APIGatewayProxyEvent, Promise<APIGatewayProxyResult>>(),
      sanitizeHeaders(),
      handleCors({ preflight: false }),
    )(async (event) => {
      return {
        statusCode: 200,
        headers: {
          'Set-Cookie': 'session=1234',
        },
      };
    });
  });

  it('should not return preflight headers on OPTIONS request', async () => {
    const response = await handler({ httpMethod: 'OPTIONS' });
    expect(response).toEqual({
      headers: {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': '*',
        'Set-Cookie': 'session=1234',
      },
      statusCode: 200,
    });
  });
});

describe('registerHttpErrorHandler', () => {
  beforeAll(() => {
    handler = compose(
      types<APIGatewayProxyEvent, Promise<APIGatewayProxyResult>>(),
      sanitizeHeaders(),
      handleCors(),
      registerHttpErrorHandler(),
    )(async () => {
      throw new NotFoundError('Not found');
    });
  });

  it('should add access control headers after error appeared', async () => {
    const response = await handler({ httpMethod: 'GET' });
    expect(response).toEqual({
      headers: {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      statusCode: 404,
      body: JSON.stringify({
        message: 'Not found',
      }),
    });
  });
});
