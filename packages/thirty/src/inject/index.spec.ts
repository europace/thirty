import { compose, eventType } from '../core';
import { inject } from './index';

let handler;
const aService = jest.fn().mockImplementation(deps => ({ a: 'a', test: () => deps.bService.b }));
const bService = jest.fn().mockImplementation(deps => ({ b: 'b', test: () => deps.aService.a }));

beforeAll(() => {
  handler = compose(
    eventType<{}>(),
    inject({
      aService,
      bService,
    }),
  )(async event => {
    const { aService, bService } = event.deps;
    return {
      fromA: aService.test(),
      fromB: bService.test(),
    };
  });
});

it('soll Services injecten und Returnwerte der Testfunktionen zurückgeben', async () => {
  const result = await handler({});
  const expectedResult = { fromA: 'b', fromB: 'a' };

  expect(result).toEqual(expectedResult);
});

it('soll Services injecten und cachen, sodass bei einem zweiten Aufruf der Cache verwendet wird', async () => {
  await handler({});
  await handler({});
  expect(aService).toBeCalledTimes(1);
});
