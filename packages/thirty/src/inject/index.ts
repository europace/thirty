import { Middleware } from '../core';

export type Deps<T> = { deps: T };
export type DepsFactories<T> = { [props: string]: (deps: T) => any };
export type DepsOf<T extends DepsFactories<DepsOf<T>>> = {
  [P in keyof T]: ReturnType<T[P]>;
};

export const inject = <T extends object, D extends DepsFactories<DepsOf<D>>>(
  depsFactories: D,
): Middleware<T, Deps<DepsOf<D>> & T> => handler => {
  let cachedDeps;
  return (event, ...args) => {
    if (!cachedDeps) {
      cachedDeps = resolveDepsFactories(depsFactories);
    }
    return handler(Object.assign(event, { deps: cachedDeps }, ...args));
  };
};

const resolveDepsFactories = factories =>
  Object.keys(factories).reduce((deps, key) => {
    deps[key] = factories[key](deps);
    return deps;
  }, {} as DepsOf<typeof factories>);
