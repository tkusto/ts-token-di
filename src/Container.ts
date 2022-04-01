import { registryProperty, Scope } from './constants';
import { NotFoundError } from './errors';
import { SingletonFactory } from './SingletonFactory';
import { TransientFactory } from './TransientFactory';
import type { Registry, DIContainer, Token, InjectArgs, Union, TokenMap } from './types';

export class Container<M extends TokenMap> implements DIContainer<M> {
  constructor(
    private registry: Registry<M>
  ) { }

  provide<T extends Token, D extends Token[], R>(
    token: T,
    inject: D,
    resolve: (...args: InjectArgs<M, D>) => Promise<R>,
    scope: Scope = Scope.Singleton
  ): DIContainer<Union<M & { [K in T]: R; }>> {
    const factory = this.createFactory(scope, resolve, inject);
    const registry: Registry<Union<M & { [K in T]: R; }>> = {
      ...this.registry,
      [token]: factory
    };
    return new Container(registry);
  }

  provideSync<T extends Token, D extends Token[], R>(
    token: T,
    inject: [...D],
    resolve: (...args: InjectArgs<M, D>) => R,
    scope: Scope = Scope.Singleton
  ): DIContainer<Union<M & { [K in T]: R; }>> {
    return this.provide(token, inject, (...args) => Promise.resolve(resolve(...args)), scope);
  }

  provideConst<T extends Token, R>(token: T, value: R): DIContainer<Union<M & { [K in T]: R; }>> {
    return this.provide(token, [], () => Promise.resolve(value), Scope.Singleton);
  }

  provideClass<T extends Token, D extends Token[], R>(
    token: T,
    inject: [...D],
    ctor: new (...args: InjectArgs<M, D>) => R,
    scope: Scope = Scope.Singleton
  ): DIContainer<Union<M & { [K in T]: R; }>> {
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

  async run<D extends (keyof M)[], R>(inject: [...D], fn: (...args: InjectArgs<M, D>) => Promise<R>): Promise<R> {
    // @ts-ignore
    const args: InjectArgs<M, D> = await Promise.all(inject.map(token => this.resolve(token)));
    const result = await fn(...args);
    return result;
  }

  import<M2>(container: DIContainer<M2>): DIContainer<Union<{ [KA in Exclude<keyof M, keyof M2>]: M[KA]; } & { [KB in keyof M2]: M2[KB]; }>> {
    const registry: Registry<Union<{ [KA in Exclude<keyof M, keyof M2>]: M[KA]; } & { [KB in keyof M2]: M2[KB]; }>> = {
      ...this.registry,
      ...container[registryProperty]
    };
    return new Container(registry);
  }

  get [registryProperty](): Registry<M> {
    return this.registry;
  }

  private createFactory<V>(
    scope: Scope,
    resolve: (...args: any) => Promise<V>,
    inject: Token[],
  ) {
    switch (scope) {
      case Scope.Singleton:
        return new SingletonFactory(resolve, inject);
      case Scope.Transient:
        return new TransientFactory(resolve, inject);
    }
  }
}
