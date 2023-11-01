import { compose, types } from '../core';

import { registerHttpErrorHandler } from './index';
import { inject } from '../inject';
import { APIGatewayEvent } from 'aws-lambda';
import { BadRequestError, InternalServerError, NotFoundError, UnauthorizedError } from '../errors';
import { ForbiddenError } from '../errors/ForbiddenError';
import { APIGatewayProxyResult } from '../types/APIGatewayProxyResult';

describe('simple setup', () => {
  let handler;
  let throwError: jest.Mock;

  beforeAll(() => {
    throwError = jest.fn();
    handler = compose(
      types<APIGatewayEvent, Promise<APIGatewayProxyResult>>(),
      registerHttpErrorHandler(),
    )(async (event) => {
      throwError();

      return {
        statusCode: 200,
      };
    });
  });

  it('should return response with statusCode and message of thrown error', async () => {
    const error = { message: 'BadRequest', statusCode: 400 };
    throwError.mockImplementation(() => {
      throw new BadRequestError('BadRequest');
    });
    const response = await handler({});

    expect(response).toEqual({
      statusCode: error.statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: error.message,
      }),
    });
  });

  it('should return InternalServerError, since unknown errors are obfuscated by default', async () => {
    throwError.mockImplementation(() => {
      throw new Error('Test');
    });
    const response = await handler({});

    expect(response).toEqual({
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'InternalServerError',
      }),
    });
  });

  it('should return InternalServerError with obfuscated error message', async () => {
    throwError.mockImplementation(() => {
      throw new InternalServerError('Sensitive data');
    });
    const response = await handler({});

    expect(response).toEqual({
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'InternalServerError',
      }),
    });
  });

  it('should return Unauthorized with obfuscated error message', async () => {
    throwError.mockImplementation(() => {
      throw new UnauthorizedError('Sensitive data');
    });
    const response = await handler({});

    expect(response).toEqual({
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Unauthorized',
      }),
    });
  });

  it('should return Forbidden with obfuscated error message', async () => {
    throwError.mockImplementation(() => {
      throw new ForbiddenError('Sensitive data');
    });
    const response = await handler({});

    expect(response).toEqual({
      statusCode: 403,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Forbidden',
      }),
    });
  });
});

describe('blacklist', () => {
  let handler;
  let throwError: jest.Mock;

  beforeAll(() => {
    throwError = jest.fn();
    handler = compose(
      types<APIGatewayEvent, Promise<APIGatewayProxyResult>>(),
      registerHttpErrorHandler({
        blacklist: [{ alternativeMessage: 'Error', statusCode: 404 }],
      }),
    )(async (event) => {
      throwError();

      return {
        statusCode: 200,
      };
    });
  });

  it('should return "Error" with statusCode "404"', async () => {
    throwError.mockImplementation(() => {
      throw new NotFoundError('Sensitive data');
    });
    const response = await handler({});

    expect(response).toEqual({
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Error',
      }),
    });
  });

  it('should not obfuscate error since it is not blacklisted', async () => {
    throwError.mockImplementation(() => {
      throw new UnauthorizedError('Sensitive data');
    });
    const response = await handler({});

    expect(response).toEqual({
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Sensitive data',
      }),
    });
  });
});

describe('event.deps.logger', () => {
  let handler;
  let throwError: jest.Mock;
  let logError: jest.Mock;

  beforeAll(() => {
    throwError = jest.fn();
    logError = jest.fn();
    handler = compose(
      types<APIGatewayEvent, Promise<APIGatewayProxyResult>>(),
      inject({
        logger: () => ({ error: logError }),
      }),
      registerHttpErrorHandler(),
    )(async (event) => {
      throwError();

      return {
        statusCode: 200,
      };
    });
  });

  it('should call logger.error with original message', async () => {
    const error = new Error('Something went wrong');
    throwError.mockImplementation(() => {
      throw error;
    });
    await handler({});
    expect(logError).toHaveBeenCalledWith(error);
  });
});

describe('options.logger', () => {
  let handler;
  let throwError: jest.Mock;
  let logError: jest.Mock;

  beforeAll(() => {
    throwError = jest.fn();
    logError = jest.fn();
    handler = compose(
      types<APIGatewayEvent, Promise<APIGatewayProxyResult>>(),
      registerHttpErrorHandler({
        logger: { error: logError },
      }),
    )(async (event) => {
      throwError();

      return {
        statusCode: 200,
      };
    });
  });

  it('should call logger.error with original message', async () => {
    const error = new Error('Something went wrong');
    throwError.mockImplementation(() => {
      throw error;
    });
    await handler({});
    expect(logError).toHaveBeenCalledWith(error);
  });
});

describe('options.logError', () => {
  let handler;
  let throwError: jest.Mock;
  let logError: jest.Mock;

  beforeAll(() => {
    throwError = jest.fn();
    logError = jest.fn();
    handler = compose(
      types<APIGatewayEvent, Promise<APIGatewayProxyResult>>(),
      registerHttpErrorHandler({
        logError,
      }),
    )(async (event) => {
      throwError();

      return {
        statusCode: 200,
      };
    });
  });

  it('should call logError with original message', async () => {
    const error = new Error('Something went wrong');
    throwError.mockImplementation(() => {
      throw error;
    });
    await handler({});
    expect(logError).toHaveBeenCalledWith(error);
  });
});
