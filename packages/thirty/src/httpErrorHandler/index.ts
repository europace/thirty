import { APIGatewayProxyEvent } from 'aws-lambda';

import { Middleware } from '../core';

export const httpErrorHandler = <T extends APIGatewayProxyEvent>(): Middleware<
  T,
  T
> => handler => async (event, ...args) =>
  handler(event, ...args).catch(err => {
    const statusCode = err?.statusCode ?? 500;
    const message = err?.statusCode !== 500 ? err.message : 'Internal server error';
    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: message,
      }),
    };
  });
