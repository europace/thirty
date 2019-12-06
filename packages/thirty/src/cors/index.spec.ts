import { compose, eventType } from '../core';
import { cors } from './index';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { sanitizeHeaders } from '../sanitizeHeaders';

let handler;

beforeAll(() => {
  handler = compose(
    eventType<APIGatewayProxyEvent>(),
    sanitizeHeaders(),
    cors(),
  )(async event => {
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

it('should add cors headers on any other request', async () => {
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

describe('preflight', () => {
  beforeAll(() => {
    handler = compose(
      eventType<APIGatewayProxyEvent>(),
      sanitizeHeaders(),
      cors({ preflight: false }),
    )(async event => {
      return {
        statusCode: 200,
        headers: {
          'Set-Cookie': 'session=1234',
        },
      };
    });
  });

  it('should return not return preflight headers on OPTIONS request', async () => {
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
