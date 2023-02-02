import { BaseError } from './BaseError';

export class NotFoundError extends BaseError {
  statusCode = 404;
  constructor(message: string) {
    super(message);
  }
}
