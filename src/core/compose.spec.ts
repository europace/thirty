import { compose } from './compose';

it('should apply middlewares in reverse', async () => {
  const order: any[] = [];
  const middleware1 = () => order.push(middleware1) as any;
  const middleware2 = () => order.push(middleware2) as any;

  compose(middleware1, middleware2)(async () => {});

  expect(order).toEqual([middleware2, middleware1]);
});

it('should execute middleware handlers in order', async () => {
  const order: any[] = [];
  const middleware1 =
    (handler) =>
    (...args) => {
      order.push(middleware1);
      return handler(...args);
    };
  const middleware2 =
    (handler) =>
    (...args) => {
      order.push(middleware2);
      return handler(...args);
    };

  compose(middleware1, middleware2)(async () => {})({});

  expect(order).toEqual([middleware1, middleware2]);
});

it('should provide actual handler reference via "actual" property', async () => {
  const middleware =
    (actual) =>
    (...args) =>
      actual(...args);
  const actualHandler = async () => {};
  const handler = compose(middleware, middleware)(actualHandler);

  expect(handler.actual).toBe(actualHandler);
});

it('should not provide actual handler reference via "actual" property in case of 1 middleware', async () => {
  const middleware =
    (actual) =>
    (...args) =>
      actual(...args);
  const actualHandler = async () => {};
  const handler = compose(middleware)(actualHandler);

  expect(handler['actual']).toBe(undefined);
});

it('should be able to enhance events through middlewares', async () => {
  const middleware =
    (actual) =>
    (event, ...args) =>
      actual(Object.assign(event, { test: 1 }), ...args);
  const actualHandler = async (event) => event.test;
  const handler = compose(middleware)(actualHandler);
  const event = {};

  await expect(handler(event)).resolves.toEqual(1);
  expect(event).toEqual({ test: 1 });
});
