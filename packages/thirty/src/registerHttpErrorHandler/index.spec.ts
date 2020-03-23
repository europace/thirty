import { compose, eventType } from '../core';

import { registerHttpErrorHandler } from './index';
import { inject } from '../inject';
import { APIGatewayEvent } from 'aws-lambda';
import { BadRequestError, InternalServerError, NotFoundError, UnauthorizedError } from '../errors';
import { ForbiddenError } from '../errors/ForbiddenError';

describe('simple setup', () => {
  let handler;
  let throwError: jest.Mock;

  beforeAll(() => {
    throwError = jest.fn();
    handler = compose(
      eventType<{}>(),
      registerHttpErrorHandler(),
    )(async event => {
      throwError();
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
        error: error.message,
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
        error: 'InternalServerError',
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
        error: 'InternalServerError',
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
        error: 'Unauthorized',
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
        error: 'Forbidden',
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
      eventType<{}>(),
      registerHttpErrorHandler({
        blacklist: [{ alternativeMessage: 'Error', statusCode: 404 }],
      }),
    )(async event => {
      throwError();
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
        error: 'Error',
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
        error: 'Sensitive data',
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
      eventType<APIGatewayEvent>(),
      inject({
        logger: () => ({ error: logError }),
      }),
      registerHttpErrorHandler(),
    )(async event => {
      throwError();
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
      eventType<{}>(),
      registerHttpErrorHandler({
        logger: { error: logError },
      }),
    )(async event => {
      throwError();
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
      eventType<{}>(),
      registerHttpErrorHandler({
        logError,
      }),
    )(async event => {
      throwError();
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

describe('response', () => {
  let handler;
  let error;
  let enhancement;

  beforeAll(() => {
    error = new NotFoundError('Not found');
    enhancement = { headers: { additional: '1' } };
    handler = compose(
      eventType<{}>(),
      registerHttpErrorHandler(),
    )(async () => {
      return Promise.reject([error, enhancement]);
    });
  });

  it('should enhance responses', async () => {
    const response = await handler({});
    expect(response).toEqual({
      statusCode: 404,
      headers: {
        ...enhancement.headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Not found',
      }),
    });
  });
});
