import { registryProperty, Scope } from '../constants';
import { NotFoundError } from '../errors';
import type { Token, InjectArgs, Union, TokenMap } from '../types';
import type { RegistryAsync } from './types';
import { SingletonFactory } from './SingletonFactory';
import { TransientFactory } from './TransientFactory';

export class Container<M extends TokenMap> {
  constructor(
    private registry: RegistryAsync<M>
  ) { }

  provide<T extends Token, D extends (keyof M)[], R>(
    token: T,
    inject: D,
    resolve: (...args: InjectArgs<M, [...D]>) => Promise<R>,
    scope: Scope = Scope.Singleton
  ): Container<Union<M & { [K in T]: R; }>> {
    const factory = this.createFactory(scope, resolve, inject);
    const registry: RegistryAsync<Union<M & { [K in T]: R; }>> = {
      ...this.registry,
      [token]: factory
    };
    return new Container(registry);
  }

  provideSync<T extends Token, D extends (keyof M)[], R>(
    token: T,
    inject: [...D],
    resolve: (...args: InjectArgs<M, [...D]>) => R,
    scope: Scope = Scope.Singleton
  ): Container<Union<M & { [K in T]: R; }>> {
    return this.provide(token, inject, (...args) => Promise.resolve(resolve(...args)), scope);
  }

  provideConst<T extends Token, R>(token: T, value: R): Container<Union<M & { [K in T]: R; }>> {
    return this.provide(token, [], () => Promise.resolve(value), Scope.Singleton);
  }

  provideClass<T extends Token, D extends (keyof M)[], R>(
    token: T,
    inject: [...D],
    ctor: new (...args: InjectArgs<M, [...D]>) => R,
    scope: Scope = Scope.Singleton
  ): Container<Union<M & { [K in T]: R; }>> {
    return this.provide(token, inject, (...args) => Promise.resolve(new ctor(...args)), scope);
  }

  async resolve<T extends keyof M>(token: T): Promise<M[T]> {
    const factory = this.registry[token];
    if (!factory) {
      throw new NotFoundError(String(token));
    }
    const result = await factory.create(this);
    return result;
  }

  async run<D extends (keyof M)[], R>(inject: [...D], fn: (...args: InjectArgs<M, [...D]>) => Promise<R>): Promise<R> {
    // @ts-ignore
    const args: InjectArgs<M, [...D]> = await Promise.all(inject.map(token => this.resolve(token)));
    const result = await fn(...args);
    return result;
  }

  import<M2>(container: Container<M2>): Container<Union<{ [KA in Exclude<keyof M, keyof M2>]: M[KA]; } & { [KB in keyof M2]: M2[KB]; }>> {
    const registry: RegistryAsync<Union<{ [KA in Exclude<keyof M, keyof M2>]: M[KA]; } & { [KB in keyof M2]: M2[KB]; }>> = {
      ...this.registry,
      ...container[registryProperty]
    };
    return new Container(registry);
  }

  get [registryProperty](): RegistryAsync<M> {
    return this.registry;
  }

  private createFactory<V>(
    scope: Scope,
    resolve: (...args: any) => Promise<V>,
    inject: any[],
  ) {
    switch (scope) {
      case Scope.Singleton:
        return new SingletonFactory(resolve, inject);
      case Scope.Transient:
        return new TransientFactory(resolve, inject);
    }
  }
}
