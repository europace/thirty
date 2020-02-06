import { APIGatewayProxyEvent } from 'aws-lambda';

import { Middleware } from '../core';

interface HttpErrorHandlerOptions {
  logError?: (message: any) => any;
  logger?: { error: (message: any) => any };
  /**
   * List of errors with status codes, where error message should be obfuscated
   * @default [
   *  { message: 'Internal Server Error', statusCode: 500 },
   *  { message: 'Forbidden', statusCode: 403 },
   *  { message: 'Unauthorized', statusCode: 401 },
   *  ]
   */
  blacklist?: Array<{ message: string; statusCode: number }>;
}

const internalServerError = { message: 'InternalServerError', statusCode: 500 };
const forbiddenError = { message: 'Forbidden', statusCode: 403 };
const unauthorirzedError = { message: 'Unauthorized', statusCode: 401 };

export const registerHttpErrorHandler = <T extends APIGatewayProxyEvent>(
  options: HttpErrorHandlerOptions = {},
): Middleware<T, T> => handler => async (event, ...args) =>
  handler(event, ...args).catch(err => {
    const logError = options.logger?.error ?? options.logError ?? ((msg: any) => null);
    if (err?.message) {
      logError(err?.message);
    }
    const httpBlackList = options.blacklist ?? [
      internalServerError,
      forbiddenError,
      unauthorirzedError,
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

export const getSafeResponse = (
  blacklist: Array<{ message: string; statusCode: number }>,
  error?: any,
) => {
  const statusCode = error?.statusCode ?? internalServerError.statusCode;
  const hasErrorMessage = error?.message;
  const isInternalServerError = statusCode === internalServerError.statusCode;
  const message =
    isInternalServerError && !hasErrorMessage ? internalServerError.message : error?.message;
  return (
    blacklist.find(({ statusCode }) => error?.statusCode === statusCode) ?? {
      statusCode,
      message,
    }
  );
};
