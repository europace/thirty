import { decode, verify, VerifyOptions } from 'jsonwebtoken';
import { Middleware } from '../core';
import { UnauthorizedError } from '../errors/UnauthorizedError';
import { SanitizedHeadersEvent } from '../sanitizeHeaders';

export interface JwtAuthOptions<T> extends VerifyOptions {
  getToken: (event: T) => Promise<string | undefined>;
  getSecretOrPublic: (props: {
    token: string;
    event: T;
    decodedJwt: any;
  }) => undefined | string | Promise<string | undefined>;
}

export const verifyJwt =
  <T extends object, R>({
    getToken,
    getSecretOrPublic,
    ...verifyOptions
  }: JwtAuthOptions<T>): Middleware<T, { user } & T, Promise<R>, R> =>
  (handler) =>
  async (event, ...rest) => {
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
    return handler(Object.assign(event, { user }) as any, ...rest);
  };

export const getDecoded = (token) => {
  const decoded = decode(token, { complete: true });
  if (!decoded || typeof decoded !== 'object') {
    throw new Error('Could not decode token');
  }
  return decoded;
};

type TokenFromHeaderRequiredEvent = SanitizedHeadersEvent;
export const tokenFromHeaderFactory =
  <T extends TokenFromHeaderRequiredEvent>(headerName = 'authorization') =>
  (event: T) => {
    const header = event.sanitizedHeaders[headerName];
    if (!header || !header.length) {
      throw new UnauthorizedError();
    }
    const [, token] = header.split(' ');
    return token;
  };

type TokenFromCookieRequiredEvent = { cookie: object };
export const tokenFromCookieFactory =
  <T extends TokenFromCookieRequiredEvent>(fieldName = 'authentication') =>
  (event: T) => {
    const value = event.cookie[fieldName];
    if (!value || !value.length) {
      throw new UnauthorizedError();
    }
    return value;
  };
