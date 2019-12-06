import { APIGatewayEvent, APIGatewayProxyEvent } from 'aws-lambda';
import { Middleware } from '../core';

export const sanitizeHeaders = <T extends APIGatewayEvent>(): Middleware<
  T,
  T & { sanitizedHeaders: APIGatewayEvent['headers'] }
> => handler => (event, ...args) =>
  handler({ ...event, sanitizedHeaders: event.headers ? sanitize(event.headers) : {} }, ...args);

export const sanitize = (headers: object | null | undefined) => {
  const safeHeaders = headers ? headers : {};
  return Object.keys(headers ? headers : {}).reduce(
    (sanitizedHeaders, headerName) => ({
      ...sanitizedHeaders,
      [headerName.toLowerCase()]: safeHeaders[headerName],
    }),
    {} as APIGatewayProxyEvent['headers'],
  );
};
