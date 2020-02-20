import { APIGatewayProxyEvent } from 'aws-lambda';

import { Middleware } from '../core';

export type BacklistItem = {
  alternativeMessage: string;
  statusCode: number | undefined;
  alternativeStatusCode?: number;
};

interface ErrorLogger {
  error(...args: any[]): any;
  [log: string]: any;
}

export interface HttpErrorHandlerOptions {
  logError?: (message: any) => any;
  logger?: ErrorLogger;
  /**
   * List of errors with status codes, where error message should be obfuscated
   * @default [
   *  { message: 'Internal Server Error', statusCode: 500 },
   *  { message: 'Forbidden', statusCode: 403 },
   *  { message: 'Unauthorized', statusCode: 401 },
   *  { message: 'InternalServerError', statusCode: undefined },
   *  ]
   */
  blacklist?: BacklistItem[];
}

const unknownError = {
  statusCode: undefined,
  alternativeMessage: 'InternalServerError',
  alternativeStatusCode: 500,
};
const internalServerError = { statusCode: 500, alternativeMessage: 'InternalServerError' };
const forbiddenError = { statusCode: 403, alternativeMessage: 'Forbidden' };
const unauthorirzedError = { statusCode: 401, alternativeMessage: 'Unauthorized' };

type HttpErrorHandlerRequiredEvents = APIGatewayProxyEvent & ({ deps?: { logger?: ErrorLogger } });

export const registerHttpErrorHandler = <T extends HttpErrorHandlerRequiredEvents>(
  options: HttpErrorHandlerOptions = {},
): Middleware<T, T> => handler => async (event, ...args) =>
  handler(event, ...args).catch(err => {
    const logger = event.deps?.logger ?? options.logger;
    const logError = logger
      ? (...args: any[]) => logger.error(...args)
      : options.logError ?? (() => null);
    if (err) {
      logError(err);
    }
    const httpBlackList = options.blacklist ?? [
      internalServerError,
      forbiddenError,
      unauthorirzedError,
      unknownError,
    ];
    const { statusCode, message } = getSafeResponse(httpBlackList, err);
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

export const getSafeResponse = (blacklist: BacklistItem[], error?: any) => {
  const blacklistItem = blacklist.find(({ statusCode }) => error?.statusCode === statusCode);
  if (blacklistItem) {
    return {
      message: blacklistItem.alternativeMessage,
      statusCode: blacklistItem.alternativeStatusCode ?? blacklistItem.statusCode,
    };
  }
  return error;
};
