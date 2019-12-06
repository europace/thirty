# λ thirty

Lightweight extensions that make AWS Lambda functions easy to develop, testable
and type safe.

> _In the system of Greek numerals lambda has a value of 30_ > https://en.wikipedia.org/wiki/Lambda

- [Install](#install)
- [Usage](#usage)
- [Testing](#testing)
- [`compose`](#compose)
- [Middlewares](#middlewares)
  - [`cookieParser`](#cookieParser)
  - [`cors`](#cors)
  - [`httpErrorHandler`](#httpErrorHandler)
  - [`inject`](#inject)
  - [`jsonParser`](#jsonParser)
  - [`jwtAuth`](#jwtAuth)
  - [`sanitizeHeaders`](#sanitizeHeaders)
  - [`xsrfCheck`](#xsrfCheck)
- [Routing](#routing)

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
import { inject } from 'thirty/inject';

export const handler = compose(
  eventType<APIGatewayProxyEvent>(),
  inject({
    authService: authServiceFactory,
    userService: userServiceFactory,
  }),
  errorHandler(),
  json(),
  jwtAuth({
    getToken: tokenFromHeaderFactory(),
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
    deps: { userService: userServiceMock /* ..*/ },
    /* ..*/
  };
  const { statusCode, body } = await handler.actual(eventMock);
  expect(statusCode).toBe(201);
  expect(body).toEqual(user);
});
```

## `compose`

`compose` is a common implementation of [Function_composition](https://en.wikipedia.org/wiki/Function_composition)
and the heart of _thirty_.

On top of that it provides typings so that TypeScript can infer the typings provided by the passed middlewares.

```typescript
export const handler = compose(
  eventType<{ someType: string }>(),
  someAuthMiddleware(),
)(async event => {
  event.someType;
  event.user;
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

### `cookieParser`

`cookieParser` is a middleware that parses the event cookie header and extends the event object by a cookie object:

```typescript
import { cookieParser } from 'thirty/cookieParser';

export const handler = compose(
  eventType<{ someType: string }>(),
  cookieParser(),
)(async event => {
  event.cookie;
});
```

### `cors`

`cors` is a middleware that creates a preflight response to `OPTIONS` requests and adds CORS headers to any other
request.

> Requires [`sanitizeHeaders` middleware](#sanitizeHeaders)

```typescript
import { sanitizeHeaders } from 'thirty/sanitizeHeaders';
import { cors } from 'thirty/cors';

export const handler = compose(
  eventType<APIGatewayProxyEvent>(),
  sanitizeHeaders(),
  cors(),
)(async event => {
  // ...
});
```

#### [`CorsOptions`](src/cors/index.ts)

### `httpErrorHandler`

`httpErrorHandler` is a middleware that wraps the actual handler, catches all errors and creates an error response:

```typescript
import { httpErrorHandler } from 'thirty/httpErrorHandler';
import { BadRequestError } from 'thirty/errors';

export const handler = compose(
  eventType<{ someType: string }>(),
  httpErrorHandler(),
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

### `inject`

`inject` is a middleware that provides lightweight dependency injection with the possibility of circular dependencies.

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

Each factory gets a reference to the created dependency container:

```typescript
export type AuthServiceDeps = { userService: UserService };
export type AuthService = ReturnType<typeof authServiceFactory>;

export const authServiceFactory = (deps: AuthServiceDeps) => ({
  authenticate() {
    const user = deps.userService.getUser();
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

### `jsonParser`

`jsonParser` is a middleware that parses the event body and extends the event object by a `jsonBody` object:

```typescript
import { cookieParser } from 'thirty/cookieParser';

export const handler = compose(
  eventType<{ someType: string }>(),
  jsonParser(),
)(async event => {
  event.jsonBody;
});
```

### `jwtAuth`

`jwtAuth` is a authentication middleware, which extends the event object by a `user` object and throws an
`UnauthorizedError` if the client is not authorized. Under the hood it uses the `jsonwebtoken` library.

```typescript
import { jwtAuth } from 'thirty/jwtAuth';

export const handler = compose(
  eventType<{ someType: string }>(),
  jwtAuth({
    getToken: event => event.headers.Authorization.split(' ')[1],
    getSecretOrPublic: ({ deps, event, decodedJwt }) => someSecretOrPublic,
  }),
)(async event => {
  event.jsonBody;
});
```

`thirty/jwtAuth` already provides factory functions to retrieve the token from headers or cookie:

- `tokenFromHeaderFactory` expects a header name (default is `'Authorization'`).

  ```typescript
  import { tokenFromHeaderFactory } from 'thirty/jwtAuth';

  {
    getToken: tokenFromHeaderFactory();
  }
  ```

- `tokenFromCookieFactory` requires `cookieParser` middleware and expects a key for cookie entry (default is `'authentication'`).

  ```typescript
  import { tokenFromCookieFactory } from 'thirty/jwtAuth';

  {
    getToken: tokenFromCookieFactory();
  }
  ```

**Options API**

- `getToken` - Function that expects the token that should be validated.
- `getSecretOrPublic` - Secret or public key provider for verifying token.
- All options that can be passed to [_jsonwebtoken_'s `verify`](https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback)

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

### `xsrfCheck`

`xsrfCheck` is a middleware that checks the XSRF Token provided in the request headers. It uses the [`csrf`](https://github.com/pillarjs/csrf) library.

```typescript
import { xsrfCheck } from 'thirty/xsrfCheck';

export const handler = compose(
  eventType<{ someType: string }>(),
  xsrfCheck({
    getSecret: ({event}) => secret,
  }),
)(async event => {
  event.sanitizedHeaders;
});
```

## Routing

`routing` is a wrapper for the actual handler function to define multiple routes and their corresponding handlers:

```typescript
import { routing } from 'thirty/routing';

export const handler = compose(
  eventType<APIGatewayProxyEvent>(),
  inject({
    userService: () => ({
      /*...*/
    }),
  }),
  jsonParser(),
)(
  routing(router => {
    router.get('/users', ({ deps }) => {
      return {
        statusCode: 200,
        body: JSON.stringify(deps.userService.getUsers()),
      };
    });

    router.post('/users', async ({ deps, jsonBody }) => {
      return {
        statusCode: 201,
        body: JSON.stringify(deps.userService.createUser(jsonBody)),
      };
    });

    router.get('/users/:id', async ({ deps, params }) => {
      const user = deps.userService.getUserById(params.id);
      if (user) {
        return {
          statusCode: 200,
          body: JSON.stringify(user),
        };
      }
      return {
        statusCode: 404,
      };
    });
  }),
);
```
