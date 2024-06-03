import { compose } from '../core';
import { streamifyResponse } from './index';

describe('given lambda is not invoked in RESPONSE_STREAM mode', () => {
  it('should throw', () => {
    expect(() => compose(streamifyResponse<{}>())(async () => {})).toThrow(
      new Error('Current function is not invoked in RESPONSE_STREAM mode.'),
    );
  });
});

describe('given lambda function is invoked properly', () => {
  const ref = {};

  beforeEach(() => {
    global.awslambda = {
      streamifyResponse: jest.fn().mockReturnValue(ref),
    };
  });

  afterEach(() => {
    global.awslambda = undefined;
  });

  it('should return a composed function with streamified reference', () => {
    const handler = compose(streamifyResponse<{}>())(async () => {});

    expect(handler).toBe(ref);
  });
});

describe('given handler function is called', () => {
  const stream = { name: 'stream' };
  beforeEach(() => {
    global.awslambda = {
      streamifyResponse: jest.fn().mockImplementation((next) => (event, context) => {
        return next(event, stream, context);
      }),
    };
  });

  afterEach(() => {
    global.awslambda = undefined;
  });

  it('should pass args including stream properly', async () => {
    let args;
    const handler = compose(streamifyResponse<{}>())(async (..._args) => {
      args = _args;
    });
    const event = { a: '1' };
    const context = { b: 2 };
    await handler(event, context);

    expect(args).toEqual([{ a: '1', responseStream: { name: 'stream' } }, { b: 2 }]);
  });
});
