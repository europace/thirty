import { Middleware } from '../core';

export type LazyInject<TDeps> = <TTargetKey extends keyof TDeps>(
  key: TTargetKey,
) => TDeps[TTargetKey];
export type LazyInjector<TDeps> = {
  inject: LazyInject<TDeps>;
};
export type Deps<T> = { deps: T };
export type DepsFactories<T> = { [props: string]: (deps: T & LazyInjector<T>) => any };
export type DepsOf<T extends DepsFactories<DepsOf<T>>> = {
  [P in keyof T]: ReturnType<T[P]>;
};

export interface Injector {
  inject: <K extends keyof this>(id: K) => this[K];
}

export const inject =
  <T extends object, D extends DepsFactories<DepsOf<D>>, R>(
    depsFactories: D,
  ): Middleware<T, Deps<DepsOf<D>> & T, R, R> =>
  (handler) => {
    let container;
    return (event, ...args) => {
      if (!container) {
        container = createContainer(depsFactories);
      }
      return handler(Object.assign(event, { deps: container }), ...args);
    };
  };

export const createContainer = <D extends DepsFactories<DepsOf<D>>>(factories: D): DepsOf<D> => {
  const cache = {};
  const circularDepIndicator = {};
  const inject = (id) => container[id];
  let depChainKeys: string[] = [];
  const container = new Proxy(factories, {
    get(target, key: string) {
      if (key === 'inject') return inject;
      if (!(key in cache) && key in factories) {
        depChainKeys.push(String(key));
        if (circularDepIndicator[key]) {
          throw new Error(
            `Circular dependency detected ${depChainKeys.map((key) => `"${key}"`).join(' -> ')}`,
          );
        }
        circularDepIndicator[key] = true;
        cache[key] = factories[key](container as any);
        depChainKeys = [];
      }
      return cache[key];
    },
  }) as DepsOf<D>;
  return container;
};

export const withInject = (deps) => ({ ...deps, inject: (id) => deps[id] });
