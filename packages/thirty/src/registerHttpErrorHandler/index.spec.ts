import { compose, eventType } from '../core';

import { registerHttpErrorHandler } from './index';

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
      throw Object.assign(new Error(), error);
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
      throw Object.assign(new Error(), { statusCode: 500, message: 'Sensitive data' });
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
      throw Object.assign(new Error(), { statusCode: 401, message: 'Sensitive data' });
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
      throw Object.assign(new Error(), { statusCode: 403, message: 'Sensitive data' });
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
        blacklist: [{ alternativeMessage: 'Error', statusCode: 405 }],
      }),
    )(async event => {
      throwError();
    });
  });

  it('should return "Error" with statusCode "405"', async () => {
    throwError.mockImplementation(() => {
      throw Object.assign(new Error(), { statusCode: 405, message: 'Sensitive data' });
    });
    const response = await handler({});

    expect(response).toEqual({
      statusCode: 405,
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
      throw Object.assign(new Error(), { statusCode: 401, message: 'Sensitive data' });
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

describe('logger', () => {
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

describe('logError', () => {
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
