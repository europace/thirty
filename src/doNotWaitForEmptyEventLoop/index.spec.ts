import { compose, types } from '../core';
import { doNotWaitForEmptyEventLoop } from './index';
import { inject } from '../inject';

let handler;

beforeEach(() => {
  handler = compose(types<{}, any>(), inject({}), doNotWaitForEmptyEventLoop())(async () => {});
});

it('should set callbackWaitsForEmptyEventLoop to false', async () => {
  const context = {};
  await handler({}, context);
  expect(context).toEqual({
    callbackWaitsForEmptyEventLoop: false,
  });
});
