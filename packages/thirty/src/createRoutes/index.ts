import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import Router from 'router';

import { Handler } from '../core';

const methods = [
  'get',
  'head',
  'post',
  'put',
  'delete',
  'connect',
  'options',
  'trace',
  'patch',
] as const;

type Method = typeof methods extends ReadonlyArray<infer U> ? U : never;
type RouteEventAdditions = { params: { [param: string]: string } };
type Response = Promise<Partial<APIGatewayProxyResult>> | Partial<APIGatewayProxyResult>;
type RouteHandler<T> = { (event: T & RouteEventAdditions): Response };
type Route<T> = { (path: string | RegExp, handler: RouteHandler<T>) };
type IRouter<T> = { [P in Method]: Route<T> };

export const createRoutes = <T extends APIGatewayProxyEvent>(
  applyRoutes: (router: IRouter<T>) => any,
): Handler<T> => {
  const router = promisifyMethods(Router());
  applyRoutes(router);
  return (event: T) =>
    new Promise((resolve, reject) => router(mapEventToRequest(event), resolve, toReject(reject)));
};

const mapEventToRequest = (event: APIGatewayProxyEvent) => ({
  ...event,
  method: event.httpMethod,
  url: event.path,
});

const toReject = reject => err => (err ? reject(err) : reject({ statusCode: 404 }));

const promisifyMethods = (router): any =>
  methods.reduce((acc, method) => {
    const original = acc[method];
    acc[method] = (path, handler) => {
      const promisified = async (event, cb) => cb(await handler(event));
      return original.call(acc, path, promisified);
    };
    return acc;
  }, router);
