import { compose, eventType } from 'thirty/core';
import { inject } from 'thirty/inject';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { jsonParser } from 'thirty/jsonParser';
import { httpErrorHandler } from 'thirty/httpErrorHandler';

export const handler = compose(
  eventType<APIGatewayProxyEvent>(),
  inject({
    userService: () => ({}),
  }),
  jsonParser(),
  httpErrorHandler(),
)(async event => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      helloWorld: '123',
    }),
  };
});
