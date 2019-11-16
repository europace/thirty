import { APIGatewayProxyEvent } from 'aws-lambda';
import { decode, verify, VerifyOptions } from 'jsonwebtoken';

import { Middleware } from '../core';
import { UnauthorizedError } from '../errors/UnauthorizedError';

type JwtAuthOptions<T> = {
  getToken: (event: T) => undefined | string | Promise<string | undefined>;
  getSecretOrPublic: (props: {
    token: string;
    event: T;
    decodedJwt: any;
  }) => undefined | string | Promise<string | undefined>;
} & VerifyOptions;

export const jwtAuth = <T extends APIGatewayProxyEvent>({
  getToken,
  getSecretOrPublic,
  ...verifyOptions
}: JwtAuthOptions<T>): Middleware<T, { user } & T> => handler => async (event, ...rest) => {
  let user;
  try {
    const token = await getToken(event);
    if (!token) {
      throw new UnauthorizedError();
    }
    const decodedJwt = getDecoded(token);
    const secretOrPublic = await getSecretOrPublic({ event, token, decodedJwt });
    if (!secretOrPublic) {
      throw new UnauthorizedError();
    }
    user = verify(token, secretOrPublic, verifyOptions);
  } catch (err) {
    throw new UnauthorizedError();
  }
  return handler(Object.assign(event, { user }), ...rest);
};

export const getDecoded = token => {
  const decoded = decode(token, { complete: true });
  if (!decoded || typeof decoded !== 'object') {
    throw new Error('Could not decode token');
  }
  return decoded;
};

export const tokenFromHeaderFactory = <T extends APIGatewayProxyEvent>(
  headerName = 'Authorization',
) => (event: T) => {
  const header = event.headers[headerName];
  if (!header || !header.length) {
    throw new UnauthorizedError();
  }
  const [, token] = header.split(' ');
  return token;
};

export const tokenFromCookieFactory = <T extends APIGatewayProxyEvent & { cookie: object }>(
  fieldName = 'authentication',
) => (event: T) => {
  const value = event.cookie[fieldName];
  if (!value || !value.length) {
    throw new UnauthorizedError();
  }
  return value;
};
