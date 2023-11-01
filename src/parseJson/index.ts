import { Middleware } from '../core';

export interface ParseJsonRequiredEvent {
  body: string | null;
}
export const parseJson = <T extends ParseJsonRequiredEvent, R1 extends R2, R2>(): Middleware<
  T,
  T & { jsonBody: object },
  R1,
  R2
> => handler => (event, ...args) =>
  handler(Object.assign(event, { jsonBody: event.body ? JSON.parse(event.body) : {} }), ...args);
