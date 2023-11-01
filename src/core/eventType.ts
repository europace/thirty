import { Middleware } from './Middleware';

export const eventType = <InitialType, ReturnType>(): Middleware<InitialType, InitialType, Promise<ReturnType>, Promise<ReturnType>> => handler => (
  ...args
) => handler(...args);
