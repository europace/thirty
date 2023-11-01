import { Next } from './Next';

export type Middleware<
  TRequiredEvent,
  TNextEvent,
  TExpectedResult,
  TTransformedResult,
  TExtendedNext = {},
> = (
  next: Next<TNextEvent, TTransformedResult>,
) => Next<TRequiredEvent, TExpectedResult> & TExtendedNext;
