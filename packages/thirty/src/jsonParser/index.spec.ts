import { APIGatewayProxyEvent } from 'aws-lambda';
import { compose, eventType } from '../core';
import { jsonParser } from './index';

let handler;
const body = { name: 'bob', age: 12 };

beforeAll(() => {
  handler = compose(
    eventType<APIGatewayProxyEvent>(),
    jsonParser(),
  )(async event => {
    return event.jsonBody;
  });
});

it('should return jsonParser body', async () => {
  const jsonBody = await handler({ body: JSON.stringify(body) });
  expect(jsonBody).toEqual(body);
});
