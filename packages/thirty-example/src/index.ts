import { compose, eventType } from 'thirty/core';
import { registerHttpErrorHandler } from 'thirty/registerHttpErrorHandler';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { inject } from 'thirty/inject';
import { handleCors } from 'thirty/handleCors';
import { sanitizeHeaders } from 'thirty/sanitizeHeaders';

export const handler = compose(
  eventType<APIGatewayProxyEvent>(),
  inject({
    logger: () => console,
  }),
  sanitizeHeaders(),
  handleCors(),
  registerHttpErrorHandler(),
)(async event => {
  const { logger } = event.deps;
  logger.info();
  return {
    statusCode: 200,
    body: JSON.stringify({
      helloWorld: '123',
    }),
  };
});
