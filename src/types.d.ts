import { registryProperty, Scope } from './constants';

export type Token = string | symbol;

export interface TokenMap {
  [token: Token]: any;
}

export interface Factory<R> {
  create(container: DIContainer<TokenMap>): Promise<R>;
}

export type Registry<M extends TokenMap> = {
  [K in keyof M]: Factory<TokenMap[K]>;
}

export type InjectArgs<M extends TokenMap, D extends (keyof M)[]> = {
  [K in (keyof D)]: D[K] extends keyof M ? M[D[K]]: never;
}

export interface DIContainer<M extends TokenMap> {
  provide<T extends Token, D extends Token[], R>(
    token: T,
    inject: [...D],
    resolve: (...args: InjectArgs<M, D>) => Promise<R>,
    scope?: Scope
  ): DIContainer<Union<M & { [K in T]: R }>>;

  provideSync<T extends Token, D extends Token[], R>(
    token: T,
    inject: [...D],
    resolve: (...args: InjectArgs<M, D>) => R,
    scope?: Scope
  ): DIContainer<Union<M & { [K in T]: R }>>;

  provideConst<T extends Token, R>(
    token: T,
    value: R
  ): DIContainer<Union<M & { [K in T]: R }>>;

  provideClass<T extends Token, D extends Token[], R>(
    token: T,
    inject: [...D],
    ctor: {
      new (...args: any[]): R
    },
    scope?: Scope
  ): DIContainer<Union<M & { [K in T]: R }>>;

  resolve<T extends keyof M>(token: T): Promise<M[T]>;

  run<D extends (keyof M)[], R>(inject: [...D], fn: (...args: InjectArgs<M, D>) => Promise<R>): Promise<R>; 

  import<M2>(container: DIContainer<M2>): DIContainer<Union<{ [KA in Exclude<keyof M, keyof M2>]: M[KA]; } & { [KB in keyof M2]: M2[KB]; }>>;

  readonly [registryProperty]: Registry<M>;
}

export type Union<U extends Registry> = U extends infer F ? { [K in keyof F]: F[K] } : never;
