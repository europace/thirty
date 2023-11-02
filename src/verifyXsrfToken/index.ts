import { APIGatewayProxyEvent } from 'aws-lambda';
import Csrf from 'csrf';

import { Middleware } from '../core';
import { UnauthorizedError } from '../errors/UnauthorizedError';
import { SanitizedHeadersEvent } from '../sanitizeHeaders';

export const XSRF_HEADER_NAME = 'x-xsrf-token';

type XsrfCheckOptions<T> = {
  getSecret: (props: { event: T }) => undefined | string | Promise<string | undefined>;
  headerName?: string;
};
type XsrfVerificationRequiredEvent = APIGatewayProxyEvent & SanitizedHeadersEvent;
export const verifyXsrfToken =
  <T extends XsrfVerificationRequiredEvent, R>({
    getSecret,
    headerName,
  }: XsrfCheckOptions<T>): Middleware<T, T, Promise<R>, R> =>
  (handler) => {
    let csrf: Csrf | undefined;
    return async (event, ...rest) => {
      if (!csrf) {
        csrf = new Csrf({ saltLength: 256 });
      }

      const token = event.sanitizedHeaders[headerName || XSRF_HEADER_NAME];
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
