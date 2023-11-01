import { Middleware } from './Middleware';
import { Next } from './Next';
import { eventType } from './eventType';
import { inject } from '../inject';
import { parseJson } from '../parseJson';

// export function compose<A, B, C, D, E, F, G, H, J, K, L, M, N>(
//   f: Middleware<A, B>,
//   g: Middleware<B, C>,
//   h: Middleware<C, D>,
//   i: Middleware<D, E>,
//   j: Middleware<E, F>,
//   k: Middleware<F, G>,
//   l: Middleware<G, H>,
//   m: Middleware<H, J>,
//   n: Middleware<J, K>,
//   o: Middleware<K, L>,
//   p: Middleware<L, M>,
//   q: Middleware<M, N>,
// ): Middleware<A, N, { actual: Next<N> }>;
// export function compose<A, B, C, D, E, F, G, H, J, K, L, M>(
//   f: Middleware<A, B>,
//   g: Middleware<B, C>,
//   h: Middleware<C, D>,
//   i: Middleware<D, E>,
//   j: Middleware<E, F>,
//   k: Middleware<F, G>,
//   l: Middleware<G, H>,
//   m: Middleware<H, J>,
//   n: Middleware<J, K>,
//   o: Middleware<K, L>,
//   p: Middleware<L, M>,
// ): Middleware<A, M, { actual: Next<M> }>;
// export function compose<A, B, C, D, E, F, G, H, J, K, L>(
//   f: Middleware<A, B>,
//   g: Middleware<B, C>,
//   h: Middleware<C, D>,
//   i: Middleware<D, E>,
//   j: Middleware<E, F>,
//   k: Middleware<F, G>,
//   l: Middleware<G, H>,
//   m: Middleware<H, J>,
//   n: Middleware<J, K>,
//   o: Middleware<K, L>,
// ): Middleware<A, L, { actual: Next<L> }>;
// export function compose<A, B, C, D, E, F, G, H, J, K>(
//   f: Middleware<A, B>,
//   g: Middleware<B, C>,
//   h: Middleware<C, D>,
//   i: Middleware<D, E>,
//   j: Middleware<E, F>,
//   k: Middleware<F, G>,
//   l: Middleware<G, H>,
//   m: Middleware<H, J>,
//   n: Middleware<J, K>,
// ): Middleware<A, K, { actual: Next<K> }>;
// export function compose<A, B, C, D, E, F, G, H, J>(
//   f: Middleware<A, B>,
//   g: Middleware<B, C>,
//   h: Middleware<C, D>,
//   i: Middleware<D, E>,
//   j: Middleware<E, F>,
//   k: Middleware<F, G>,
//   l: Middleware<G, H>,
//   m: Middleware<H, J>,
// ): Middleware<A, J, { actual: Next<J> }>;
// export function compose<A, B, C, D, E, F, G, H>(
//   f: Middleware<A, B>,
//   g: Middleware<B, C>,
//   h: Middleware<C, D>,
//   i: Middleware<D, E>,
//   j: Middleware<E, F>,
//   k: Middleware<F, G>,
//   l: Middleware<G, H>,
// ): Middleware<A, H, { actual: Next<H> }>;
// export function compose<A, B, C, D, E, F, G>(
//   f: Middleware<A, B>,
//   g: Middleware<B, C>,
//   h: Middleware<C, D>,
//   i: Middleware<D, E>,
//   j: Middleware<E, F>,
//   k: Middleware<F, G>,
// ): Middleware<A, G, { actual: Next<G> }>;
// export function compose<A, B, C, D, E, F>(
//   f: Middleware<A, B>,
//   g: Middleware<B, C>,
//   h: Middleware<C, D>,
//   i: Middleware<D, E>,
//   j: Middleware<E, F>,
// ): Middleware<A, F, { actual: Next<F> }>;
// export function compose<A, B, C, D, E>(
//   f: Middleware<A, B>,
//   g: Middleware<B, C>,
//   h: Middleware<C, D>,
//   i: Middleware<D, E>,
// ): Middleware<A, E, { actual: Next<E> }>;
export function compose<A, B, C, D, R1, R2, R3, R4>(
  f: Middleware<A, B, R1, R2>,
  g: Middleware<B, C, R2, R3>,
  h: Middleware<C, D, R3, R4>,
): Middleware<A, D, R1, R4>;
export function compose<A, B, C, R1, R2, R3>(
  f: Middleware<A, B, R1, R2>,
  g: Middleware<B, C, R2, R3>,
): Middleware<A, C, R3, R1>;
// TODO Currently there is no 'actual' reference if 1 middleware is passed
// This is because of the callback passed to 'reduce' only gets called if
// more than 1 entry (in this case function) is set in the corresponding array
// -> Anyway: This should be fixed in the future
export function compose<A, B>(f: Middleware<A, B>): Middleware<A, B>;
export function compose(...fns) {
  return fns.reduce((f, g) => handler => Object.assign(f(g(handler)), { actual: handler }));
}


const httpResponse = <T, R1 extends {statusCode: number; body: object}, R2 extends {statusCode: number; body: string}>(): Middleware<T, T, Promise<R2>, Promise<R1>> =>
    handler =>
        async event => {
          const {statusCode, body} = await handler(event);
          return {
            statusCode,
            body: JSON.stringify(body),
          } as R2
        };
const m1 = <T, R>(): Middleware<T, T, R, R> => handler => event => handler(event);

const handler = compose(
  eventType<{body: string}, {statusCode: number; body: string}>(),
  m1(),
  httpResponse(),
 )(async event => {

  return {
    body: {},
    statusCode: 123,
  }
});

handler({body: ''}).then(res => res.body.replace('', ''))

