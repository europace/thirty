import { APIGatewayProxyEvent } from 'aws-lambda';
import { compose, eventType } from '../core';
import { inject } from '../inject';
import { createRoutes } from './index';
import { parseJson } from '../parseJson';

let handler;

beforeEach(() => {
  handler = compose(
    eventType<APIGatewayProxyEvent>(),
    inject({
      userService: () => ({
        users: [],
        getUsers() {
          return this.users;
        },
        getUserById(id) {
          return this.users.find(user => user.id === id);
        },
        createUser(user) {
          const createdUser = { id: String(this.users.length + 1), ...user };
          this.users.push(createdUser);
          return createdUser;
        },
      }),
    }),
    parseJson(),
  )(
    createRoutes(router => {
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
});

it('should return response with list of empty users', async () => {
  const { statusCode, body } = await handler({
    path: '/users',
    httpMethod: 'get',
  } as APIGatewayProxyEvent);
  expect(body).toEqual(JSON.stringify([]));
  expect(statusCode).toEqual(200);
});

it('should return NotFound due to user does not exist', async () => {
  const { statusCode } = await handler({
    path: '/users/1',
    httpMethod: 'get',
  } as APIGatewayProxyEvent);
  expect(statusCode).toEqual(404);
});

it('should create and return user', async () => {
  const user = { name: 'bob' };
  const { statusCode, body } = await handler({
    path: '/users',
    httpMethod: 'post',
    body: JSON.stringify(user),
  } as APIGatewayProxyEvent);
  expect(body).toEqual(JSON.stringify({ id: '1', ...user }));
  expect(statusCode).toEqual(201);
});

it('should return user by id', async () => {
  const user = { name: 'bob' };
  const { body: createdUserStr } = await handler({
    path: '/users',
    httpMethod: 'post',
    body: JSON.stringify(user),
  } as APIGatewayProxyEvent);
  const createdUser = JSON.parse(createdUserStr);
  const { statusCode, body } = await handler({
    path: '/users/' + createdUser.id,
    httpMethod: 'get',
  } as APIGatewayProxyEvent);
  expect(body).toEqual(JSON.stringify({ id: '1', ...user }));
  expect(statusCode).toEqual(200);
});
