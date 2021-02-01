import { BaseError } from './BaseError';

export class ForbiddenError extends BaseError {
  statusCode = 403;
  constructor(message: string) {
    super(message);
  }
}
