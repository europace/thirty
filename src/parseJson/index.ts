import { Middleware } from '../core';

export interface ParseJsonRequiredEvent {
  body: string | null;
}
export const parseJson = <T extends ParseJsonRequiredEvent>(): Middleware<
  T,
  T & { jsonBody: object }
> => handler => (event, ...args) =>
  handler(Object.assign(event, { jsonBody: event.body ? JSON.parse(event.body) : {} }), ...args);
