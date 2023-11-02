import { SQSBatchResponse, SQSEvent, SQSRecord, SQSBatchItemFailure } from 'aws-lambda';
import { Middleware } from '../core';
import { TypeRef } from '../types/TypeRef';

type ForeachRequiredEvent = SQSEvent & { deps?: { logger?: { error: (...args: any[]) => any } } };
type ForeachNextEvent<TEvent extends ForeachRequiredEvent, TBody> = Omit<TEvent, 'Records'> & {
  record: Omit<SQSRecord, 'body'> & { body: TBody };
};
interface ForeachRecordOptions<TBody, TBatchItemFailures> {
  bodyType: TypeRef<TBody>;
  batchItemFailures: TBatchItemFailures;
}

export const forEachSqsRecord =
  <TEvent extends ForeachRequiredEvent, TBody, TBatchItemFailures extends boolean>({
    batchItemFailures,
  }: ForeachRecordOptions<TBody, TBatchItemFailures>): Middleware<
    TEvent,
    ForeachNextEvent<TEvent, TBody>,
    Promise<TBatchItemFailures extends true ? SQSBatchResponse : void>,
    Promise<void>
  > =>
  (next) =>
  async ({ Records, ...event }, ...rest) => {
    const handleRecord = async ({ body, ...record }: SQSRecord) => {
      const parsedBody = JSON.parse(body) as TBody;
      await next({
        ...event,
        record: {
          ...record,
          body: parsedBody,
        },
      });
    };

    if (batchItemFailures) {
      return {
        batchItemFailures: (
          await Promise.all(
            Records.map(async (record) => {
              try {
                await handleRecord(record);
              } catch (e) {
                (event.deps?.logger ?? console).error(e);
                return {
                  itemIdentifier: record.messageId,
                } satisfies SQSBatchItemFailure;
              }
            }),
          )
        ).filter((failure): failure is SQSBatchItemFailure => !!failure),
      };
    }
    await Promise.all(Records.map(handleRecord));
    return undefined as any;
  };
