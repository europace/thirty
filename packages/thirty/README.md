# thirty

Lightweight extensions that makes AWS Lambda functions easy to develop, testable
and type safe.

> _In the system of Greek numerals lambda has a value of 30_
> https://en.wikipedia.org/wiki/Lambda

- [Install](#install)
- [Usage](#usage)
- [Testing](#testing)
- [API](#api)
    - [`compose`](#compose)
    - [`inject`](#inject)
    - [`routing`](#routing)

## Install

```shell script
npm install thirty
```

## Usage

```typescript
// handler.ts
import { APIGatewayProxyEvent } from 'aws-lambda';
import { compose, eventType } from 'thirty/core';
import { json } from 'thirty/jsonParser';
import { jwtAuth, tokenFromHeaderFactory } from 'thirty/jwtAuth';
import { errorHandler } from 'thirty/httpErrorHandler';
import { inject } from 'thirty/injection';

export const handler = compose(
  eventType<APIGatewayProxyEvent>(),
  inject({
    authService: authServiceFactory,
    userService: userServiceFactory,
  }),
  errorHandler(),
  json(),
  jwtAuth({
    getToken: tokenFromHeaderFactory,
    getSecretOrPublic: ({ deps }) => deps.authService.getSecret(),
  }),
)(async event => {
  const { userService } = event.deps;
  const user = await userService.createUser(event.jsonObject);
  return {
    statusCode: 201,
    body: JSON.stringify(user),
  };
});
```

## Testing

The `compose`d handler function also provides a reference to the actual handler 
via the `actual` property:

```typescript
// handler.spec.ts
import { handler } from './handler';

it('should return created user', async () => {
  const user = {
    /*...*/
  };
  const eventMock = {
    deps: {userService: userServiceMock, /* ..*/}
    /* ..*/
  };
  const { statusCode, body } = await handler.actual(eventMock);
  expect(statusCode).toBe(201);
  expect(body).toEqual(user);
});
```

## API
TODO

### `compose`
### `inject`
### `routing`


