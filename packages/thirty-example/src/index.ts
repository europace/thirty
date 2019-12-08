import { compose, eventType } from 'thirty/core';
import { handleHttpErrors } from 'thirty/handleHttpErrors';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { inject } from 'thirty/inject';
import { handleCors } from 'thirty/handleCors';
import { sanitizeHeaders } from 'thirty/sanitizeHeaders';

export const handler = compose(
  eventType<APIGatewayProxyEvent>(),
  inject({
    logger: () => console
  }),
  sanitizeHeaders(),
  handleCors(),
  handleHttpErrors(),
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
