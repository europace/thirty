import { APIGatewayEvent } from 'aws-lambda';

import { Middleware } from '../core';

export const jsonParser = <T extends APIGatewayEvent>(): Middleware<
  T,
  T & { jsonBody: object }
> => handler => (event, ...args) =>
  handler({ ...event, jsonBody: event.body ? JSON.parse(event.body) : {} }, ...args);
