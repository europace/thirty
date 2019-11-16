import { Middleware } from './Middleware';

export const eventType = <IntialType>(): Middleware<IntialType, IntialType> => handler => (
  ...args
) => handler(...args);
