import { parse } from 'cookie';
import { APIGatewayRequestAuthorizerEventHeaders } from 'aws-lambda';

import { Middleware } from '../core';

export interface ParseCookieRequiredEvent {
  headers: APIGatewayRequestAuthorizerEventHeaders | null;
}
export const parseCookie = <T extends ParseCookieRequiredEvent>(): Middleware<
  T,
  T & { cookie: object }
> => handler => (event: T, ...args) =>
  handler(
    Object.assign(event, { cookie: event.headers?.Cookie ? parse(event.headers.Cookie) : {} }),
    ...args,
  );
