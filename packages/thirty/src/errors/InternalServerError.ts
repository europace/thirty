import { BaseError } from './BaseError';

export class InternalServerError extends BaseError {
  statusCode = 500;
  constructor(message: string) {
    super(message);
  }
}
