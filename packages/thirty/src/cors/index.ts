import { APIGatewayProxyEvent } from 'aws-lambda';

import { Middleware } from '../core';

/**
 * TODO WIP
 */
export const cors = <T extends APIGatewayProxyEvent>(): Middleware<T, T> => handler => async (
  event: T,
  ...rest
) => {
  const response = await handler(event, ...rest);
  return {
    ...response,
    headers: {
      ...{
        'Access-Control-Allow-Origin': event.headers['origin'],
        'Access-Control-Allow-Credentials': 'true',
      },
      ...(response.headers ? response.headers : {}),
    },
  };
};
