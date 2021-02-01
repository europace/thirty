import { Middleware } from '../core';
import { SanitizedHeadersEvent } from '../sanitizeHeaders';

export interface CorsOptions {
  /**
   * When true, creates response on OPTIONS request with 'Access-Control-Allow-*'
   * headers
   * @default true
   */
  preflight?: boolean;

  /**
   * When true, uses 'Origin' header from request as 'Access-Control-Allow-Origin'
   * in response
   * @default '*'
   */
  origin?: true | string;

  /**
   * Specifies value for 'Access-Control-Allow-Credentials' header
   * @default true
   */
  credentials?: boolean;

  /**
   * Specifies value for 'Access-Control-Allow-Headers' header
   * When set to true, headers from 'Access-Control-Request-Headers' will be
   * used
   * @default ['Content-Type']
   */
  headers?: string[] | true;

  /**
   * Specifies values for 'Access-Control-Allow-Methods' header.
   * @default ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE']
   */
  methods?: string[];

  /**
   * Specifies values for 'Access-Control-Allow-Max-Age' header.
   * @default false
   */
  maxAge?: number | false;
}

type EvaluatedCorsOptions = Required<CorsOptions>;

export const defaultCorsOptions: EvaluatedCorsOptions = {
  preflight: true,
  origin: '*',
  credentials: true,
  headers: ['Content-Type'],
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  maxAge: false,
};

interface CorsRequiredEvent extends SanitizedHeadersEvent {
  httpMethod: string;
}

export const handleCors = <T extends CorsRequiredEvent>(
  options: CorsOptions = {},
): Middleware<T, T> => handler => async (event: T, ...rest) => {
  const evaluatedOptions = { ...defaultCorsOptions, ...options };
  if (evaluatedOptions.preflight && event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        ...accessControlAllowOrigin(evaluatedOptions, event),
        ...accessControlAllowCredentials(evaluatedOptions),
        ...accessControlAllowHeaders(evaluatedOptions, event),
        ...accessControlAllowMethods(evaluatedOptions),
        ...accessControlAllowMaxAge(evaluatedOptions),
      },
    };
  }
  let error;
  let response;
  try {
    response = await handler(event, ...rest);
  } catch (e) {
    error = e;
  }
  response = {
    ...response,
    headers: {
      ...accessControlAllowOrigin(evaluatedOptions, event),
      ...accessControlAllowCredentials(evaluatedOptions),
      ...response?.headers,
    },
  };
  if (error) {
    return Promise.reject([error, response]);
  }
  return response;
};

const accessControlAllowOrigin = ({ origin }: EvaluatedCorsOptions, event: CorsRequiredEvent) => ({
  'Access-Control-Allow-Origin': origin === true ? event.sanitizedHeaders['origin'] : origin,
});
const accessControlAllowCredentials = ({ credentials }: EvaluatedCorsOptions) => ({
  'Access-Control-Allow-Credentials': String(credentials),
});
const accessControlAllowHeaders = ({ headers }: EvaluatedCorsOptions, event: CorsRequiredEvent) => {
  const headerStr =
    headers === true
      ? event.sanitizedHeaders['access-control-request-headers'] ?? ''
      : headers.join(',');
  return headerStr ? { 'Access-Control-Allow-Headers': headerStr } : {};
};
const accessControlAllowMethods = ({ methods }: EvaluatedCorsOptions) =>
  methods.length ? { 'Access-Control-Allow-Methods': methods.join(',') } : {};
const accessControlAllowMaxAge = ({ maxAge }: EvaluatedCorsOptions) =>
  maxAge !== false ? { 'Access-Control-Allow-Max-Age': String(maxAge) } : {};
