import { verifyJwt, tokenFromCookieFactory, tokenFromHeaderFactory } from './index';
import { sign } from 'jsonwebtoken';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { compose, eventType } from '../core';
import { UnauthorizedError } from '../errors/UnauthorizedError';

let handler;
let token;
let spy: jest.Mock;
const secret = 'testsecret';
const payload = { name: 'bob' };

beforeEach(() => {
  spy = jest.fn();
  handler = compose(
    eventType<{}>(),
    verifyJwt({
      getToken: () => token,
      getSecretOrPublic: () => secret,
    }),
  )(async (event) => {
    spy(event.user);
  });
});

it('should return payload', async () => {
  token = sign(payload, secret, { noTimestamp: true });

  await handler({});
  expect(spy).toHaveBeenCalledWith(payload);
});

it('should throw UnauthorizedError due to expired token', async () => {
  token = sign(payload, secret, { noTimestamp: true, expiresIn: 0 });

  await expect(handler({})).rejects.toThrow('User is not authorized');
  expect(spy).not.toHaveBeenCalled();
});

describe('tokenFromHeaderFactory', () => {
  it('should create a function which retrieves token from header object', () => {
    const TOKEN = 'TOKEN';
    const getTokenFromHeader = tokenFromHeaderFactory();
    const result = getTokenFromHeader({
      sanitizedHeaders: { authorization: `Bearer ${TOKEN}` },
    } as Partial<APIGatewayProxyEvent> as any);

    expect(result).toEqual(TOKEN);
  });
  it('should create a function which retrieves token from header object by custom header name', () => {
    const TOKEN = 'TOKEN';
    const CUSTOM_HEADER_NAME = 'auth';
    const getTokenFromHeader = tokenFromHeaderFactory(CUSTOM_HEADER_NAME);
    const result = getTokenFromHeader({
      sanitizedHeaders: { [CUSTOM_HEADER_NAME]: `Bearer ${TOKEN}` },
    } as Partial<APIGatewayProxyEvent> as any);

    expect(result).toEqual(TOKEN);
  });
  it('should throw UnauthorizedError if header is missing', () => {
    const getTokenFromHeader = tokenFromHeaderFactory();

    expect(() =>
      getTokenFromHeader({ sanitizedHeaders: {} } as Partial<APIGatewayProxyEvent> as any),
    ).toThrow(UnauthorizedError);
  });
});

describe('tokenFromCookieFactory', () => {
  it('should create a function which retrieves token from cookie object', () => {
    const TOKEN = 'TOKEN';
    const getTokenFromCookie = tokenFromCookieFactory();
    const result = getTokenFromCookie({
      cookie: { authentication: TOKEN },
    } as Partial<APIGatewayProxyEvent> as any);

    expect(result).toEqual(TOKEN);
  });
  it('should throw UnauthorizedError if cookie value is missing', () => {
    const getTokenFromCookie = tokenFromCookieFactory();

    expect(() =>
      getTokenFromCookie({ cookie: {} } as Partial<APIGatewayProxyEvent> as any),
    ).toThrow(UnauthorizedError);
  });
});
