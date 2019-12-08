import { APIGatewayProxyEvent } from 'aws-lambda';
import { decode, verify, VerifyOptions } from 'jsonwebtoken';

import { Middleware } from '../core';
import { UnauthorizedError } from '../errors/UnauthorizedError';
import { SanitizedHeadersEvent } from '../sanitizeHeaders';

export interface JwtAuthOptions<T> extends VerifyOptions {
  getToken: (event: T) => undefined | string | Promise<string | undefined>;
  getSecretOrPublic: (props: {
    token: string;
    event: T;
    decodedJwt: any;
  }) => undefined | string | Promise<string | undefined>;
}

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

type TokenFromHeaderRequiredEvent = APIGatewayProxyEvent & SanitizedHeadersEvent;
export const tokenFromHeaderFactory = <T extends TokenFromHeaderRequiredEvent>(
  headerName = 'authorization',
) => (event: T) => {
  const header = event.sanitizedHeaders[headerName];
  if (!header || !header.length) {
    throw new UnauthorizedError();
  }
  const [, token] = header.split(' ');
  return token;
};

type TokenFromCookieRequiredEvent = APIGatewayProxyEvent & { cookie: object };
export const tokenFromCookieFactory = <T extends TokenFromCookieRequiredEvent>(
  fieldName = 'authentication',
) => (event: T) => {
  const value = event.cookie[fieldName];
  if (!value || !value.length) {
    throw new UnauthorizedError();
  }
  return value;
};
