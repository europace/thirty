import { compose, eventType } from 'thirty/core';
import { httpErrorHandler } from 'thirty/httpErrorHandler';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { inject } from 'thirty/inject';
import { cors } from 'thirty/cors';
import { sanitizeHeaders } from 'thirty/sanitizeHeaders';

export const handler = compose(
  eventType<APIGatewayProxyEvent>(),
  inject({
    logger: () => console
  }),
  sanitizeHeaders(),
  cors(),
  httpErrorHandler(),
)(async event => {
  const {logger} = event.deps;
  logger.info();
  return {
    statusCode: 200,
    body: JSON.stringify({
      helloWorld: '123',
    }),
  };
});
