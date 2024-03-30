import { APIGatewayProxyResult } from '../types/APIGatewayProxyResult';
import { Middleware } from '../core';
import { TypeRef } from '../core/TypeRef';

export type SerializeJsonOptions<TBody = object> = Omit<APIGatewayProxyResult, 'body'> & {
  body?: TBody;
};
export const serializeJson =
  <E, R1 extends APIGatewayProxyResult, R2 extends SerializeJsonOptions<TBody>, TBody>(
    bodyType?: TypeRef<TBody>,
  ): Middleware<E, E, Promise<R1>, Promise<R2>> =>
  (next) =>
  async (...args) => {
    const { body, ...rest } = await next(...args);
    return {
      ...rest,
      body: JSON.stringify(body),
    } satisfies APIGatewayProxyResult as unknown as R1;
  };
