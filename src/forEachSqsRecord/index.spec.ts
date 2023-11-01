import { compose, types } from '../core';
import { SQSBatchResponse, SQSEvent, SQSRecord } from 'aws-lambda';
import { forEachSqsRecord } from './index';
import { t } from '../types/TypeRef';
import { mock } from '../types/mock';
import { inject } from '../inject';

interface SomeMessageBody {
  id: string;
  description: string;
  shouldFail?: boolean;
}

describe('given batchItemFailures are expected', () => {
  let logError: jest.Mock;

  const createHandler = () =>
    compose(
      types<SQSEvent, Promise<SQSBatchResponse>>(),
      inject({
        logger: () => ({ error: logError }),
      }),
      forEachSqsRecord({
        batchItemFailures: true,
        bodyType: t<SomeMessageBody>,
      }),
    )(async (event) => {
      if (event.record.body.shouldFail) {
        throw new Error(`Failed to process ${event.record.messageId}`);
      }
    });

  let handler: ReturnType<typeof createHandler>;
  let result: Awaited<ReturnType<typeof handler>>;

  beforeEach(() => {
    logError = jest.fn();
    handler = createHandler();
  });

  describe('and foreachRecord#batchItemFailures is set to true', () => {
    it('should throw a ts error', () => {
      compose(
        types<SQSEvent, Promise<SQSBatchResponse>>(),
        // @ts-expect-error
        forEachSqsRecord({
          batchItemFailures: false,
          bodyType: t<SomeMessageBody>,
        }),
      )(async (event) => {});
    });
  });

  describe('and all messages can be successfully processed', () => {
    beforeEach(async () => {
      result = await handler({
        Records: [
          mock<SQSRecord>({
            messageId: 'MESSAGE_1',
            body: JSON.stringify({
              id: 'MESSAGE_BODY_1',
              description: 'desc',
            } satisfies SomeMessageBody),
          }),
        ],
      });
    });

    it('should return SQSBatchResponse with empty failures', async () => {
      expect(result.batchItemFailures).toEqual([]);
    });

    it('should log no errors', async () => {
      expect(logError).not.toHaveBeenCalled();
    });
  });

  describe('and 1 message fails to be processed', () => {
    beforeEach(async () => {
      result = await handler({
        Records: [
          mock<SQSRecord>({
            messageId: 'MESSAGE_1',
            body: JSON.stringify({
              id: 'MESSAGE_BODY_1',
              description: 'desc',
              shouldFail: true,
            } satisfies SomeMessageBody),
          }),
          mock<SQSRecord>({
            messageId: 'MESSAGE_2',
            body: JSON.stringify({
              id: 'MESSAGE_BODY_2',
              description: 'desc',
            } satisfies SomeMessageBody),
          }),
        ],
      });
    });

    it('should return SQSBatchResponse with 1 failure', async () => {
      expect(result.batchItemFailures).toEqual([
        {
          itemIdentifier: 'MESSAGE_1',
        },
      ]);
    });

    it('should log an error', async () => {
      expect(logError).toHaveBeenCalledWith(new Error('Failed to process MESSAGE_1'));
    });
  });
});

describe('given no batchItemFailures are expected', () => {
  const createHandler = () =>
    compose(
      types<SQSEvent, Promise<void>>(),
      forEachSqsRecord({
        batchItemFailures: false,
        bodyType: t<SomeMessageBody>,
      }),
    )(async (event) => {
      if (event.record.body.shouldFail) {
        throw new Error(`Failed to process ${event.record.messageId}`);
      }
    });

  let handler: ReturnType<typeof createHandler>;
  let promise: ReturnType<typeof handler>;

  beforeEach(() => {
    handler = createHandler();
  });

  describe('and foreachRecord#batchItemFailures is set to false', () => {
    it('should throw a ts error', () => {
      compose(
        types<SQSEvent, Promise<void>>(),
        // @ts-expect-error
        forEachSqsRecord({
          batchItemFailures: true,
          bodyType: t<SomeMessageBody>,
        }),
      )(async (event) => {});
    });
  });

  describe('and all messages can be successfully processed', () => {
    beforeEach(() => {
      promise = handler({
        Records: [
          mock<SQSRecord>({
            messageId: 'MESSAGE_1',
            body: JSON.stringify({
              id: 'MESSAGE_BODY_1',
              description: 'desc',
            } satisfies SomeMessageBody),
          }),
          mock<SQSRecord>({
            messageId: 'MESSAGE_2',
            body: JSON.stringify({
              id: 'MESSAGE_BODY_2',
              description: 'desc',
            } satisfies SomeMessageBody),
          }),
        ],
      });
    });

    it('should not throw', async () => {
      await expect(promise).resolves.toBe(undefined);
    });
  });

  describe('and 1 message fails to be processed', () => {
    beforeEach(() => {
      promise = handler({
        Records: [
          mock<SQSRecord>({
            messageId: 'MESSAGE_1',
            body: JSON.stringify({
              id: 'MESSAGE_BODY_1',
              description: 'desc',
              shouldFail: true,
            } satisfies SomeMessageBody),
          }),
          mock<SQSRecord>({
            messageId: 'MESSAGE_2',
            body: JSON.stringify({
              id: 'MESSAGE_BODY_2',
              description: 'desc',
            } satisfies SomeMessageBody),
          }),
        ],
      });
    });

    it('should throw', async () => {
      await expect(promise).rejects.toEqual(new Error('Failed to process MESSAGE_1'));
    });
  });
});
