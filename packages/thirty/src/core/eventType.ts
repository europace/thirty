import { Middleware } from './Middleware';

export const eventType = <InitialType>(): Middleware<InitialType, InitialType> => handler => (
  ...args
) => handler(...args);
