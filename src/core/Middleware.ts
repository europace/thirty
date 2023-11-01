import { Next } from './Next';

export type Middleware<InputType, NextType, ReturnTypeA = Promise<any>, ReturnTypeB = Promise<any>> = (
  next: Next<NextType, ReturnTypeB>,
) => Next<InputType, ReturnTypeA>
