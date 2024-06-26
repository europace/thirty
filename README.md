<h1 align="center">
  <br>
  thirty
  <br>
</h1>

<h4 align="center">A middleware engine for AWS Lambda, that makes Lambda Functions type-safe, easy to develop and test.</h4>

<p align="center">
  <img src="https://img.shields.io/npm/v/thirty.svg">
  <img src="https://github.com/europace/thirty/actions/workflows/checks.yml/badge.svg">
</p>
<br>

- [Installation](#installation)
- [Getting started](#getting-started)
- [Testing](#testing)
- [`compose`](#compose)
- [Middlewares](#middlewares)
  - [`inject`](#inject)
  - [`doNotWaitForEmptyEventLoop`](#donotwaitforemptyeventloop)
  - [`serializeJson`](#serializejson)
  - [`parseJson`](#parsejson)
  - [`registerHttpErrorHandler`](#registerhttperrorhandler)
  - [`sanitizeHeaders`](#sanitizeheaders)
  - [`handleCors`](#handlecors)
  - [`decodeParameters`](#decodeparameters)
  - [`verifyJwt`](#verifyjwt)
  - [`verifyXsrfToken`](#verifyxsrftoken)
  - [`parseCookie`](#parsecookie)
  - [`forEachSqsRecord`](#foreachsqsrecord)
- [Publish](#publish)
<br>

## Installation

```shell script
npm install thirty
```

## Getting started

```typescript
import { APIGatewayProxyEvent } from 'aws-lambda';
import { compose, eventType } from 'thirty/core';
import { parseJson } from 'thirty/parseJson';
import { serializeJson } from 'thirty/serializeJson';
import { verifyJwt, tokenFromHeaderFactory } from 'thirty/verifyJwt';
import { registerHttpErrorHandler } from 'thirty/registerHttpErrorHandler';
import { inject } from 'thirty/inject';
import { APIGatewayProxyResult } from 'thrirty/types/APIGatewayProxyResult';

export const handler = compose(
  types<APIGatewayProxyEvent, Promise<APIGatewayProxyResult>>(),
  inject({
    authService: authServiceFactory,
    userService: userServiceFactory,
  }),
  registerHttpErrorHandler(),
  parseJson(),
  serializeJson(),
)(async event => {
  const { userService } = event.deps;
  const user = await userService.createUser(event.jsonBody);
  return {
    statusCode: 201,
    body: user,
  };
});
```

## Testing

The `compose`d handler function exposes a reference to the actual handler
via the `actual` property:

```typescript
// handler.spec.ts
import { handler } from './handler';

it('should return created user', async () => {
  const user = {
    /*...*/
  };
  const eventMock = {
    deps: { userService: userServiceMock /* ..*/ },
    /* ..*/
  };
  const { statusCode, body } = await handler.actual(eventMock);
  expect(statusCode).toBe(201);
  expect(body).toEqual(user);
});
```
This makes it possible to easily unit test the business code without retesting middleware-functionality again.

## `compose`

`compose` is a common implementation of [Function_composition](https://en.wikipedia.org/wiki/Function_composition)
and the heart of _thirty_.

On top of that `compose` provides typings so that the event type, which is extended by middlewares, can be inferred.

```typescript
export const handler = compose(
  types<{ inputA: number; inputB: number }, string>(),
  serializeJson(),
)(async event => {
  return event.inputA + event.inputB;
});
```

It also exposes a reference to the argument of the composed function:

```typescript
const actual = async () => {};
export const handler = compose()(actual);
// ...
handler.actual === actual; // true
```

## Middlewares

### `inject`

`inject` is a middleware that provides lightweight dependency injection.

In order to create a dependency injection container, just define an object, where its properties refer to factory
methods.

```typescript
import { inject } from 'thirty/inject';

export const handler = compose(
  eventType<APIGatewayProxyEvent>(),
  inject({
    authService: authServiceFactory,
    userService: userServiceFactory,
  }),
)(async event => {
  const { userService } = event.deps;
  // ...
});
```

Each factory gets access all dependencies defined in the container:

```typescript
export type AuthServiceDeps = { userService: UserService };
export type AuthService = ReturnType<typeof authServiceFactory>;

export const authServiceFactory = ({ userService }: AuthServiceDeps) => ({
  authenticate() {
    const user = userService.getUser();
    // ...
  },
});
```

This makes it easy to mock and test the actual handler:

```typescript
// handler.spec.ts
it('should return created user', async () => {
  const eventMock = {
    deps: { authService: authServiceMock, userService: userServiceMock },
    /* ..*/
  };
  const result = await handler.actual(eventMock);
  // assertion goes here
});
```

### `doNotWaitForEmptyEventLoop`

Sets `context.callbackWaitsForEmptyEventLoop` to false.

From [official documentation](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-context.html):
> callbackWaitsForEmptyEventLoop – Set to false to send the response right away when the callback runs, instead of waiting for the Node.js event loop to be empty. If this is false, any outstanding events continue to run during the next invocation.

```ts
const handler = compose(
  types<APIGatewayEvent, Promise<APIGatewayProxyResult>>(), 
  doNotWaitForEmptyEventLoop(),
)(async event => {

});
```

### `parseJson`

`parseJson` is a middleware that parses the request body and extends the event object by a `jsonBody` object:

```typescript
import { compose, types, of } from 'thirty/core';
import { parseJson } from 'thirty/parseJson';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

type SomeDto = { description: string };

export const handler = compose(
  types<APIGatewayProxyEvent, Promise<APIGatewayProxyResult>>(),
  parseJson(of<SomeDto>),
)(async event => {
  const { description } = event.jsonBody;
    
  return {
    statusCode: 200,
    body: JSON.stringify({ id: uuid(), description }),
  };
});
```

### `serializeJson`

Before that middleware you had to serialize your response body's manually and parse it back again in your tests in order to assert response bodys - especially partially.
```ts
type User = {id: string; name: string};
```
```ts
const handler = compose(
  types<APIGatewayEvent, Promise<APIGatewayProxyResult>>(),
)(async event => {
  return {
    statusCode: 200,
    body: JSON.stringify({id: 'USER_1', name: 'Marty'} as User),
  };
});

const response = await handler.actual({...});
expect(response.statusCode).toEqual(200);
expect(JSON.parse(response.body)).toEqual(expect.objectContaining({
     id: 'USER_1'
  }));

```
But `serializeJson` makes type-safe and testing less verbose:
```ts
const handler = compose(
  types<APIGatewayEvent, Promise<APIGatewayProxyResult>>(),
  serializeJson(of<User>),
)(async event => {
  return {
    statusCode: 200,
    body: {id: 'USER_1', name: 'Marty'},
  };
});

const response = await handler.actual({...});
expect(response).toEqual({
   statusCode: 200,
   body: expect.objectContaining({ id: 'USER_1' })
});
```

### `registerHttpErrorHandler`

`registerHttpErrorHandler` is a middleware that wraps the actual handler, catches all errors and creates an error response:

```typescript
import { registerHttpErrorHandler } from 'thirty/registerHttpErrorHandler';
import { BadRequestError } from 'thirty/errors';

export const handler = compose(
  eventType<{ someType: string }>(),
  registerHttpErrorHandler({
    logger: console,
    backlist: [{ statusCode: 401, message: 'Alternative message' }],
  }),
)(async event => {
  throw new BadRequestError('Parameter x missing');
});
```
The above example would create an error response that would look like:

```json
{
  "statusCode": 400,
  "headers": {
    "Content-Type": "application/json"
  },
  "body": "{\"error\":\"Parameter x missing\"}"
}
```

#### [`HttpErrorHandlerOptions`](src/registerHttpErrorHandler/index.ts)

### `sanitizeHeaders`

`sanitizeHeaders` is a middleware that lower cases all header properties and stores them in a new `event.sanitizedHeaders` object.
This is necessary because the header properties in `event.headers` aren't consolidated. Which means they are deserialized
as set in the header request.

```typescript
import { sanitizeHeaders } from 'thirty/sanitizeHeaders';

export const handler = compose(
  eventType<{ someType: string }>(),
  sanitizeHeaders(),
)(async event => {
  event.sanitizedHeaders;
});
```

### `handleCors`

`handleCors` is a middleware that creates a preflight response to `OPTIONS` requests and adds CORS headers to any other
request.

> Requires [`sanitizeHeaders`](#sanitizeHeaders) middleware

```typescript
import { sanitizeHeaders } from 'thirty/sanitizeHeaders';
import { handleCors } from 'thirty/handleCors';

export const handler = compose(
  eventType<APIGatewayProxyEvent>(),
  sanitizeHeaders(),
  handleCors(),
)(async event => {
  // ...
});
```

#### [`CorsOptions`](src/handleCors/index.ts)

### `decodeParameters`

`decodeParameters` is a middleware that decodes all parameter values with `decodeURIComponent` and stores them in 
`event.decodedPathParameters`,`event.decodedQueryParameters`, `event.decodedMultiValueQueryParameters`.

```typescript
import { decodeParameters } from 'thirty/decodeParameters';

export const handler = compose(
  eventType<{ someType: string }>(),
  decodeParameters(),
)(async event => {
  event.decodeParameters;
  event.decodedQueryParameters;
  event.decodedMultiValueQueryParameters;
});
```

### `verifyJwt`

`verifyJwt` is a authentication middleware, which extends the event object by a `user` object and throws an
`UnauthorizedError` if the client is not authorized. Under the hood it uses the `jsonwebtoken` library.

```typescript
import { verifyJwt } from 'thirty/verifyJwt';

export const handler = compose(
  eventType<{ someType: string }>(),
  verifyJwt({
    getToken: event => event.headers.Authorization.split(' ')[1],
    getSecretOrPublic: ({ deps, event, decodedJwt }) => someSecretOrPublic,
  }),
)(async event => {
  event.user;
});
```

`thirty/verifyJwt` already provides factory functions to retrieve the token from headers or cookie:

- `tokenFromHeaderFactory` expects a header name (default is `'Authorization'`).

  > Requires [`sanitizeHeaders`](#sanitizeHeaders) middleware

  ```typescript
  import { tokenFromHeaderFactory } from 'thirty/verifyJwt';

  {
    getToken: tokenFromHeaderFactory();
  }
  ```

- `tokenFromCookieFactory` requires `parseCookie` middleware and expects a key for cookie entry (default is `'authentication'`).

  ```typescript
  import { tokenFromCookieFactory } from 'thirty/verifyJwt';

  {
    getToken: tokenFromCookieFactory();
  }
  ```

**Options API**

- `getToken` - Function that expects the token that should be validated.
- `getSecretOrPublic` - Secret or public key provider for verifying token.
- All options that can be passed to [_jsonwebtoken_'s `verify`](https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback)

### `verifyXsrfToken`

`verifyXsrfToken` is a middleware that checks the XSRF Token provided in the request headers. It uses the [`csrf`](https://github.com/pillarjs/csrf) library.

> Requires [`sanitizeHeaders`](#sanitizeHeaders) middlware

```typescript
import { verifyXsrfToken } from 'thirty/verifyXsrfToken';

export const handler = compose(
  eventType<{ someType: string }>(),
  verifyXsrfToken({
    getSecret: ({ event }) => secret,
  }),
)(async event => {
  // ...
});
```

### `parseCookie`

`parseCookie` is a middleware that parses the event cookie header and extends the event object by a `cookie` object:

```typescript
import { parseCookie } from 'thirty/parseCookie';

export const handler = compose(
  eventType<{ someType: string }>(),
  parseCookie(),
)(async event => {
  event.cookie;
});
```

### `forEachSqsRecord`

Consider the following setup not using that middleware:
```ts
type SomeMesssage = {id: string; text: string};
```
```ts
const handler = compose(
  types<SQSEvent, Promise<SQSBatchResponse>>(),
)(async event => {
  return {
    batchItemFailures: (
      await Promise.all(
        event.Records.map((record) => {
          try {
            const message: SomeMessage = JSON.parse(record.body);
            // process message
          } catch (e) {
            return {
              itemIdentifier: record.messageId,
            };
          }
        }),
      )
    ).filter((maybeItemFailure): maybeItemFailure is SQSBatchItemFailure => !!maybeItemFailure),
  };
});
```
You have to do a lot of boilerplate code, which makes the actual business code of processing one message hard to read. `forEachSqsRecord` lets you process one message without any of that boilerplate:
```ts
const handler = compose(
  types<SQSEvent, Promise<SQSBatchResponse>>(),
  forEachSqsRecord({
    batchItemFailures: true,
    bodyType: of<SomeMessage>,
  })
)(async event => {
  const message = event.record.body;
  // process message
});
```

Use `sequential` set to `true` in order to iterate over the records in order. If one record fails to be processed, the 
processing of any upcoming records will be stopped, stopped too. If `batchItemFailures` is also set to `true`, 
all unprocessed records will be added to list of `batchItemFailures`.

## Publish

In order to publish a new version to npm, create a new release on github. 
1. Create a tag. The tag needs to follow semver (Don't prefix the version 
number with "v" as suggested by github). e.g. `1.7.0`
2. Define a release title
3. Generate release notes by clicking "Generate release notes"
4. Click "Publish release"

> ℹ️ The package will automatically bundled and published to npm via the 
> `publish.yml` workflow.
