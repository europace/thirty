import { APIGatewayProxyEvent } from 'aws-lambda';
import Csrf from 'csrf';

import { Middleware } from '../core';
import { UnauthorizedError } from '../errors/UnauthorizedError';

export const XSRF_HEADER_NAME = 'x-xsrf-token';

type XsrfCheckOptions<T> = {
  getSecret: (props: { event: T }) => undefined | string | Promise<string | undefined>;
};
type XsrfCheckRequiredEvent = APIGatewayProxyEvent & {
  sanitizedHeaders: APIGatewayProxyEvent['headers'];
};
export const xsrfCheck = <T extends XsrfCheckRequiredEvent>({
  getSecret,
}: XsrfCheckOptions<T>): Middleware<T, T> => handler => {
  let csrf: Csrf | undefined;
  return async (event, ...rest) => {
    if (!csrf) {
      csrf = new Csrf({ saltLength: 256 });
    }

    const token = event.sanitizedHeaders[XSRF_HEADER_NAME];
    if (!token || !token.length) {
      throw new UnauthorizedError();
    }

    const secret = await getSecret({ event });
    if (!secret) {
      throw new UnauthorizedError();
    }

    if (!csrf.verify(secret, token)) {
      throw new UnauthorizedError();
    }

    return handler(event, ...rest);
  };
};
