import { Middleware } from './Middleware';

export const eventType =
  <InitialType, ReturnType = Promise<any>>(): Middleware<
    InitialType,
    InitialType,
    ReturnType,
    ReturnType
  > =>
  (handler) =>
  (...args) =>
    handler(...args);

export const types =
  <TEvent, TReturnValue>(): Middleware<TEvent, TEvent, TReturnValue, TReturnValue> =>
  (next) =>
  (...args) =>
    next(...args);
