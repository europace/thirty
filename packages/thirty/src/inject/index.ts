import { Middleware } from '../core';

export type Deps<T> = { deps: T };
export type DepsFactories<T> = { [props: string]: (deps: T) => any };
export type DepsOf<T extends DepsFactories<DepsOf<T>>> = {
  [P in keyof T]: ReturnType<T[P]>;
};
export interface WithInject {
  inject: <K extends keyof this>(id: K) => this[K];
}

export const inject = <T extends object, D extends DepsFactories<DepsOf<D>>>(
  depsFactories: D,
): Middleware<T, Deps<DepsOf<D>> & T> => handler => {
  let container;
  return (event, ...args) => {
    if (!container) {
      container = createContainer(depsFactories);
    }
    return handler(Object.assign(event, { deps: container }, ...args));
  };
};

export const createContainer = factories => {
  const cache = {};
  const circularDepIndicator = {};
  const inject = id => container[id];
  const container = new Proxy(factories, {
    get(target, key) {
      if(key === 'inject') return inject;
      if (!cache[key]) {
        if (circularDepIndicator[key]) {
          throw new Error(`Circular dependency detected -> "${String(key)}"`);
        }
        circularDepIndicator[key] = true;
        cache[key] = factories[key](container);
      }
      return cache[key];
    }
  });
  return container;
};

export const withInject = deps => ({...deps, inject: id => deps[id]})
