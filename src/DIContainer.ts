import { RegistryProperty } from './RegistryProperty';

export interface DIContainer<R extends Registry> {
  add<T extends DIToken, D extends (keyof R)[], V, RF extends Resolve<R, D, V>>(
    token: T,
    deps: [...D],
    resolve: RF
  ): DIContainer<FlattenUnion<R & { [K in T]: { resolve: RF, deps: [...D] } }>>;

  get<T extends keyof R>(token: T): Promise<ResolveType<R[T]['resolve']>>;

  readonly [RegistryProperty]: R;
}

export interface Inject<R extends Registry, D extends (keyof R)[], V> {
  // @ts-ignore
  resolve: (...deps: ResolvedDeps<R, D>) => Promise<V>,
  deps: [...D]
}

export type DIToken = string | symbol;

export interface Registry {
  [K: DIToken]: Inject<Registry, (keyof Registry)[], any>;
}

export type Resolve<R extends Registry, D extends (keyof R)[], V> = (...args: ResolvedDeps<R, [...D]>) => Promise<V>;

export interface Ctor<R extends Registry, D extends (keyof R)[], V> {
  new(...args: ResolvedDeps<R, [...D]>): V;
}

export type ResolveType<R> = R extends (...args: any[]) => Promise<infer V> ? V : never;

export type ResolvedDeps<R extends Registry, D extends (keyof R)[]> = {
  [K in keyof D]: D[K] extends keyof R ? ResolveType<R[D[K]]['resolve']> : never;
}

export type FlattenUnion<U extends Registry> = U extends infer F ? { [K in keyof F]: F[K] } : never;

export type Merge<A, B> = { [KA in Exclude<keyof A, keyof B>]: A[KA] } & { [KB in keyof B]: B[KB] };
