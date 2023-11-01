import { APIGatewayRequestAuthorizerEventHeaders } from 'aws-lambda';
import { Middleware } from '../core';

export interface SanitizedHeadersRequiredEvent {
  headers: APIGatewayRequestAuthorizerEventHeaders | null;
}
export interface SanitizedHeadersEvent {
  sanitizedHeaders: { [name: string]: string };
}

export const sanitizeHeaders =
  <T extends SanitizedHeadersRequiredEvent, R>(): Middleware<T, T & SanitizedHeadersEvent, R, R> =>
  (handler) =>
  (event, ...args) =>
    handler(
      Object.assign(event, { sanitizedHeaders: event.headers ? sanitize(event.headers) : {} }),
      ...args,
    );

export const sanitize = (headers: object | null | undefined) => {
  const safeHeaders = headers ? headers : {};
  return Object.keys(headers ? headers : {}).reduce(
    (sanitizedHeaders, headerName) => ({
      ...sanitizedHeaders,
      [headerName.toLowerCase()]: safeHeaders[headerName],
    }),
    {} as SanitizedHeadersEvent['sanitizedHeaders'],
  );
};
