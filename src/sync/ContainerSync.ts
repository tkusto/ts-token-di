import { registryProperty, Scope } from '../constants';
import { NotFoundError } from '../errors';
import { InjectArgs, Token, TokenMap, Union } from '../types';
import type { FactorySync, RegistrySync } from './types';
import { SingletonFactory } from './SingletonFactory';
import { TransientFactory } from './TransientFactory';

export class ContainerSync<M extends TokenMap> {
  constructor(
    private registry: RegistrySync<M>
  ) {}

  provideSync<T extends Token, D extends (keyof M)[], R>(
    token: T,
    inject: [...D],
    resolve: (...args: InjectArgs<M, [...D]>) => R,
    scope: Scope = Scope.Singleton
  ): ContainerSync<Union<M & { [K in T]: R; }>> {
    const factory = this.createFactory(scope, resolve, inject);
    const registry: RegistrySync<Union<M & { [K in T]: R; }>> = {
      ...this.registry,
      [token]: factory
    };
    return new ContainerSync(registry);
  }

  provideConst<T extends Token, R>(token: T, value: R): ContainerSync<Union<M & { [K in T]: R; }>> {
    return this.provideSync(token, [], () => value, Scope.Singleton);
  }

  provideClass<T extends Token, D extends (keyof M)[], R>(
    token: T,
    inject: [...D],
    ctor: new (...args: InjectArgs<M, [...D]>) => R,
    scope: Scope = Scope.Singleton
  ): ContainerSync<Union<M & { [K in T]: R; }>> {
    return this.provideSync(token, inject, (...args) => new ctor(...args), scope);
  }

  resolve<T extends keyof M>(token: T): M[T] {
    const factory = this.registry[token];
    if (!factory) {
      throw new NotFoundError(String(token));
    }
    const result = factory.create(this);
    // @ts-ignore
    return result;
  }

  run<D extends (keyof M)[], R>(
    inject: [...D],
    fn: (...args: InjectArgs<M, [...D]>) => R
  ): R {
    const args = inject.map(token => this.resolve(token));
    // @ts-ignore
    const result = fn(...args);
    return result;
  }

  import<M2>(
    container: ContainerSync<M2>
  ): ContainerSync<Union<{ [KA in Exclude<keyof M, keyof M2>]: M[KA]; } & { [KB in keyof M2]: M2[KB]; }>> {
    const registry: RegistrySync<Union<{ [KA in Exclude<keyof M, keyof M2>]: M[KA]; } & { [KB in keyof M2]: M2[KB]; }>> = {
      ...this.registry,
      ...container[registryProperty]
    };
    return new ContainerSync(registry);
  }

  public get [registryProperty](): RegistrySync<M> {
    return this.registry;
  }

  private createFactory<V>(
    scope: Scope,
    resolve: (...args: any) => V,
    inject: any[],
  ): FactorySync<V> {
    switch (scope) {
      case Scope.Singleton:
        return new SingletonFactory(resolve, inject);
      case Scope.Transient:
        return new TransientFactory(resolve, inject);
    }
  }
}
