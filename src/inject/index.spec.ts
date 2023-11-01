import { compose, eventType } from '../core';
import { inject, Injector, LazyInject } from './index';

let handler;

type Deps = { cService; aService: { a } } & Injector;

const aService = jest.fn().mockImplementation((deps) => ({ a: 'a', test: () => deps.bService.b }));
const bService = jest.fn().mockImplementation(({ cService, inject }: Deps) => ({
  b: 'b',
  test: () => cService.c + inject('aService').a,
}));
const cService = jest
  .fn()
  .mockImplementation(({ aService }) => ({ c: 'c', test: () => aService.a }));

beforeAll(() => {
  handler = compose(
    eventType<{}>(),
    inject({
      aService,
      bService,
      cService,
    }),
  )(async (event) => {
    const { aService, bService, cService } = event.deps;
    return {
      fromA: aService.test(),
      fromB: bService.test(),
      fromC: cService.test(),
    };
  });
});

it('should inject and return services', async () => {
  const result = await handler({});
  const expectedResult = { fromA: 'b', fromB: 'ca', fromC: 'a' };

  expect(result).toEqual(expectedResult);
});

it('should initialize service only once, so that cache is used on the second handler call', async () => {
  await handler({});
  await handler({});
  expect(aService).toBeCalledTimes(1);
});

it('should handle falsy values', async () => {
  const _handler = compose(
    eventType<{}>(),
    inject({
      value: () => '',
    }),
  )(async (event) => {
    event.deps.value;
    event.deps.value;
  });
  await expect(_handler({})).resolves.toBeUndefined();
});

it('should throw error due to circular dependency', async () => {
  const missConfiguredHandler = compose(
    eventType<{}>(),
    inject({
      aService: ({ bService }: any) => ({
        a() {
          bService.b();
        },
      }),
      bService: ({ aService }: any) => ({
        b() {
          aService.a();
        },
      }),
    }),
  )(async (event) => {
    event.deps.bService;
    event.deps.aService;
  });

  await expect(missConfiguredHandler({})).rejects.toEqual(
    new Error('Circular dependency detected "bService" -> "aService" -> "bService"'),
  );
});

it('should pass other handler arguments properly', async () => {
  const arg0 = {};
  const arg1 = 1;
  const arg2 = 2;
  const _handler = compose(
    eventType<{}>(),
    inject({}),
  )(async (...args: any[]) => {
    return args;
  });

  await expect(_handler(arg0, arg1, arg2)).resolves.toEqual([arg0, arg1, arg2]);
});

it('should handle access on properties that are not defined on dependency factory', async () => {
  const _handler = compose(
    eventType<{}>(),
    inject({
      value: () => '',
    }),
  )(async (event) => event.deps['undefinedDependency']);
  await expect(_handler({})).resolves.toBeUndefined();
});

describe('lazy injection', () => {
  it('should ', async () => {
    type B = ReturnType<typeof bFactory>;
    const bFactory = () => ({
      isB: true,
    });
    const aFactory = ({ inject }: { inject: LazyInject<{ b: B }> }) => ({
      getB() {
        return inject('b');
      },
    });
    const _handler = compose(
      eventType<{}>(),
      inject({
        a: aFactory,
        b: bFactory,
      }),
    )(async (event) => event.deps.a);
    const a = await _handler({});

    expect(a.getB()).toEqual({ isB: true });
  });
});
