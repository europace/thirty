import { Writable } from 'stream';
import { Middleware } from '../core';

declare const awslambda: { streamifyResponse?: any } | undefined;

interface ResponseStream extends Writable {
  setContentType(contentType: string);
}

export const streamifyResponse =
  <T extends {}>(): Middleware<
    T,
    T & { responseStream: ResponseStream },
    Promise<void>,
    Promise<void>
  > =>
  (next) => {
    if (typeof awslambda === 'undefined' || typeof awslambda.streamifyResponse === 'undefined') {
      throw new Error('Current function is not invoked in RESPONSE_STREAM mode.');
    }
    return awslambda.streamifyResponse(async (event, responseStream, context) =>
      next(
        {
          ...event,
          responseStream,
        },
        context,
      ),
    );
  };
