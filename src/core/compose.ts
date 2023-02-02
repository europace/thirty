import { Middleware } from './Middleware';
import { Handler } from './Handler';

export function compose<A, B, C, D, E, F, G, H, J, K, L, M, N>(
  f: Middleware<A, B>,
  g: Middleware<B, C>,
  h: Middleware<C, D>,
  i: Middleware<D, E>,
  j: Middleware<E, F>,
  k: Middleware<F, G>,
  l: Middleware<G, H>,
  m: Middleware<H, J>,
  n: Middleware<J, K>,
  o: Middleware<K, L>,
  p: Middleware<L, M>,
  q: Middleware<M, N>,
): Middleware<A, N, { actual: Handler<N> }>;
export function compose<A, B, C, D, E, F, G, H, J, K, L, M>(
  f: Middleware<A, B>,
  g: Middleware<B, C>,
  h: Middleware<C, D>,
  i: Middleware<D, E>,
  j: Middleware<E, F>,
  k: Middleware<F, G>,
  l: Middleware<G, H>,
  m: Middleware<H, J>,
  n: Middleware<J, K>,
  o: Middleware<K, L>,
  p: Middleware<L, M>,
): Middleware<A, M, { actual: Handler<M> }>;
export function compose<A, B, C, D, E, F, G, H, J, K, L>(
  f: Middleware<A, B>,
  g: Middleware<B, C>,
  h: Middleware<C, D>,
  i: Middleware<D, E>,
  j: Middleware<E, F>,
  k: Middleware<F, G>,
  l: Middleware<G, H>,
  m: Middleware<H, J>,
  n: Middleware<J, K>,
  o: Middleware<K, L>,
): Middleware<A, L, { actual: Handler<L> }>;
export function compose<A, B, C, D, E, F, G, H, J, K>(
  f: Middleware<A, B>,
  g: Middleware<B, C>,
  h: Middleware<C, D>,
  i: Middleware<D, E>,
  j: Middleware<E, F>,
  k: Middleware<F, G>,
  l: Middleware<G, H>,
  m: Middleware<H, J>,
  n: Middleware<J, K>,
): Middleware<A, K, { actual: Handler<K> }>;
export function compose<A, B, C, D, E, F, G, H, J>(
  f: Middleware<A, B>,
  g: Middleware<B, C>,
  h: Middleware<C, D>,
  i: Middleware<D, E>,
  j: Middleware<E, F>,
  k: Middleware<F, G>,
  l: Middleware<G, H>,
  m: Middleware<H, J>,
): Middleware<A, J, { actual: Handler<J> }>;
export function compose<A, B, C, D, E, F, G, H>(
  f: Middleware<A, B>,
  g: Middleware<B, C>,
  h: Middleware<C, D>,
  i: Middleware<D, E>,
  j: Middleware<E, F>,
  k: Middleware<F, G>,
  l: Middleware<G, H>,
): Middleware<A, H, { actual: Handler<H> }>;
export function compose<A, B, C, D, E, F, G>(
  f: Middleware<A, B>,
  g: Middleware<B, C>,
  h: Middleware<C, D>,
  i: Middleware<D, E>,
  j: Middleware<E, F>,
  k: Middleware<F, G>,
): Middleware<A, G, { actual: Handler<G> }>;
export function compose<A, B, C, D, E, F>(
  f: Middleware<A, B>,
  g: Middleware<B, C>,
  h: Middleware<C, D>,
  i: Middleware<D, E>,
  j: Middleware<E, F>,
): Middleware<A, F, { actual: Handler<F> }>;
export function compose<A, B, C, D, E>(
  f: Middleware<A, B>,
  g: Middleware<B, C>,
  h: Middleware<C, D>,
  i: Middleware<D, E>,
): Middleware<A, E, { actual: Handler<E> }>;
export function compose<A, B, C, D>(
  f: Middleware<A, B>,
  g: Middleware<B, C>,
  h: Middleware<C, D>,
): Middleware<A, D, { actual: Handler<D> }>;
export function compose<A, B, C>(
  f: Middleware<A, B>,
  g: Middleware<B, C>,
): Middleware<A, C, { actual: Handler<C> }>;
// TODO Currently there is no 'actual' reference if 1 middleware is passed
// This is because of the callback passed to 'reduce' only gets called if
// more than 1 entry (in this case function) is set in the corresponding array
// -> Anyway: This should be fixed in the future
export function compose<A, B>(f: Middleware<A, B>): Middleware<A, B>;
export function compose(...fns) {
  return fns.reduce((f, g) => handler => Object.assign(f(g(handler)), { actual: handler }));
}
