import { registryProperty } from './constants';

export interface Container<R extends Registry> {
  provide<T extends Token, D extends (keyof R)[], V, RF extends Factory<R, D, V>>(
    token: T,
    deps: [...D],
    factory: RF
  ): Container<Union<R & { [K in T]: { factory: RF, inject: [...D] } }>>;

  resolve<T extends keyof R>(token: T): Promise<FactoryType<R[T]['factory']>>;

  readonly [registryProperty]: R;
}

export interface RegsitryRecord<R extends Registry, D extends (keyof R)[], V> {
  // @ts-ignore
  factory: (...deps: FactoryArgs<R, D>) => Promise<V>,
  inject: [...D]
}

export type Token = string | symbol;

export type ContainerRegistry<C> = C extends Container<infer R> ? R : never;

export interface Registry {
  [K: Token]: RegsitryRecord<Registry, (keyof Registry)[], any>;
}

export type Factory<R extends Registry, D extends (keyof R)[], V> = (...args: FactoryArgs<R, [...D]>) => Promise<V>;

export interface Ctor<R extends Registry, D extends (keyof R)[], V> {
  new(...args: FactoryArgs<R, [...D]>): V;
}

export type FactoryType<R> = R extends (...args: any[]) => Promise<infer V> ? V : never;

export type FactoryArgs<R extends Registry, D extends (keyof R)[]> = {
  [K in keyof D]: D[K] extends keyof R ? FactoryType<R[D[K]]['factory']> : never;
}

export type Union<U extends Registry> = U extends infer F ? { [K in keyof F]: F[K] } : never;

export type Join<A, B> = { [KA in Exclude<keyof A, keyof B>]: A[KA] } & { [KB in keyof B]: B[KB] };
