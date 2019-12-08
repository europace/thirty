import { APIGatewayProxyEvent } from 'aws-lambda';
import { Middleware } from '../core';

export interface SanitizedHeadersEvent {
  sanitizedHeaders: { [name: string]: string };
}

export const sanitizeHeaders = <T extends APIGatewayProxyEvent>(): Middleware<
  T,
  T & SanitizedHeadersEvent
> => handler => (event, ...args) =>
  handler({ ...event, sanitizedHeaders: event.headers ? sanitize(event.headers) : {} }, ...args);

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
