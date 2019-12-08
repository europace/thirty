import { APIGatewayProxyEvent } from 'aws-lambda';
import { compose, eventType } from '../core';
import { parseJson } from './index';

let handler;
const body = { name: 'bob', age: 12 };

beforeAll(() => {
  handler = compose(
    eventType<APIGatewayProxyEvent>(),
    parseJson(),
  )(async event => {
    return event.jsonBody;
  });
});

it('should return parseJson body', async () => {
  const jsonBody = await handler({ body: JSON.stringify(body) });
  expect(jsonBody).toEqual(body);
});
