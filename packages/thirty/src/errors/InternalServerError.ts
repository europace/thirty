import { BaseError } from '@etianen/base-error';

export class InternalServerError extends BaseError {
  statusCode = 500;
}
