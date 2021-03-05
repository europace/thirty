import { APIGatewayProxyEvent } from 'aws-lambda';

import { eventType, compose } from '../core';
import { decodeParameters } from './index';

let handler;

beforeAll(() => {
  handler = compose(
    eventType<APIGatewayProxyEvent>(),
    decodeParameters(),
  )(
    async ({
      decodedPathParameters,
      decodedQueryStringParameters,
      decodedMultiValueQueryStringParameters,
    }) => {
      return {
        decodedPathParameters,
        decodedQueryStringParameters,
        decodedMultiValueQueryStringParameters,
      };
    },
  );
});

it('should return sanitized headers', async () => {
  const params = await handler({
    pathParameters: {
      a: '123',
      b: undefined,
      c: encodeURIComponent('some/V/alue'),
    },
    queryStringParameters: {
      a: '123',
      b: undefined,
      c: encodeURIComponent('some/V/alue'),
    },
    multiValueQueryStringParameters: {
      a: ['123'],
      b: undefined,
      c: [encodeURIComponent('some/V/alue')],
    },
  } as Partial<APIGatewayProxyEvent>);

  expect(params).toEqual({
    decodedPathParameters: {
      a: '123',
      b: undefined,
      c: 'some/V/alue',
    },
    decodedQueryStringParameters: {
      a: '123',
      b: undefined,
      c: 'some/V/alue',
    },
    decodedMultiValueQueryStringParameters: {
      a: ['123'],
      b: undefined,
      c: ['some/V/alue'],
    },
  });
});

it('should not throw and should return empty object if headers are falsy', async () => {
  await expect(handler({})).resolves.toEqual({});
});
