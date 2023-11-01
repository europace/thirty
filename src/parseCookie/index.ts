import { parse } from 'cookie';
import { APIGatewayRequestAuthorizerEventHeaders } from 'aws-lambda';

import { Middleware } from '../core';

export interface ParseCookieRequiredEvent {
  headers: APIGatewayRequestAuthorizerEventHeaders | null;
}
export const parseCookie =
  <T extends ParseCookieRequiredEvent, R>(): Middleware<T, T & { cookie: object }, R, R> =>
  (handler) =>
  (event: T, ...args) =>
    handler(
      Object.assign(event, { cookie: event.headers?.Cookie ? parse(event.headers.Cookie) : {} }),
      ...args,
    );
