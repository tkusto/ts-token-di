import { registryProperty } from './constants';

export type Token = string | symbol;

export interface Factory<R extends Registry, V> {
  create(container: DIContainer<R>): Promise<V>;
}

export type FactoryResult<F> = F extends Factory<any, infer V> ? V : never;

export type Registry = {
  [K: Token]: Factory<Registry, any>;
};

export type InjectArgs<R extends Registry, D extends (keyof R)[]> = {
  [K in keyof D]: D[K] extends keyof R ? FactoryResult<R[D[K]]> : never;
}

export interface DIContainer<R extends Registry> {
  provide<T extends Token, D extends (keyof R)[], V>(
    token: T,
    inject: [...D],
    resolve: (...args: InjectArgs<R, D>) => Promise<V>
  ): DIContainer<Union<R & { [K in T]: Factory<R, V> }>>;

  provideSync<T extends Token, D extends (keyof R)[], V>(
    token: T,
    inject: [...D],
    resolve: (...args: InjectArgs<R, D>) => V
  ): DIContainer<Union<R & { [K in T]: Factory<R, V> }>>;

  provideClass<T extends Token, D extends (keyof R)[], V>(
    token: T,
    inject: [...D],
    ctor: {
      new(...args: InjectArgs<R, D>): V
    }
  ): DIContainer<Union<R & { [K in T]: Factory<R, V> }>>;

  resolve<T extends keyof R>(token: T): Promise<FactoryResult<R[T]>>;

  run<D extends (keyof R)[], V>(
    tokens: [...D],
    resolve: (...args: InjectArgs<R,D>) => Promise<V>
  ): Promise<V>;

  import<R2 extends Registry>(container: DIContainer<R2>): DIContainer<Union<Join<R, R2>>>;

  readonly [registryProperty]: R;
}

export type Union<U extends Registry> = U extends infer F ? { [K in keyof F]: F[K] } : never;

export type Join<A, B> = { [KA in Exclude<keyof A, keyof B>]: A[KA] } & { [KB in keyof B]: B[KB] };
