import { Middleware } from '../core';
import { TypeRef } from '../core/TypeRef';

export interface ParseJsonRequiredEvent {
  body: string | null;
}
export const parseJson =
  <T extends ParseJsonRequiredEvent, R, TBody = object>(
    bodyType?: TypeRef<TBody>,
  ): Middleware<T, T & { jsonBody: TBody }, R, R> =>
  (handler) =>
  (event, ...args) =>
    handler(Object.assign(event, { jsonBody: event.body ? JSON.parse(event.body) : {} }), ...args);
