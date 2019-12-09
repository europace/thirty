import { compose, eventType } from '../core';
import { inject, WithInject } from './index';

let handler;

type Deps = {cService; aService: {a};} & WithInject;

const aService = jest.fn().mockImplementation(deps => ({ a: 'a', test: () => deps.bService.b }));
const bService = jest.fn().mockImplementation(({cService, inject}: Deps) => ({ b: 'b', test: () => cService.c + inject('aService').a }));
const cService = jest.fn().mockImplementation(({aService}) => ({ c: 'c', test: () => aService.a }));

beforeAll(() => {
  handler = compose(
    eventType<{}>(),
    inject({
      aService,
      bService,
      cService,
    }),
  )(async event => {
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
