import { registryProperty, Scope } from './constants';
import { NotFoundError } from './errors';
import { SingletonFactory } from './SingletonFactory';
import { TransientFactory } from './TransientFactory';
import { Registry, Container, Token, InjectArgs, Union, Factory, FactoryResult, Join } from './types';

export class Module<R extends Registry>
  implements Container<R>
{
  constructor(
    private readonly registry: R
  ) { }

  provide<T extends Token, D extends (keyof R)[], V>(
    token: T,
    inject: [...D],
    resolve: (...args: InjectArgs<R, D>) => Promise<V>,
    scope: Scope = Scope.Singleton
  ): Module<Union<R & { [K in T]: Factory<R, V> }>> {
    const factory = this.createFactory(scope, resolve, inject);
    const registry: unknown = {
      ...this.registry,
      [token]: factory
    };
    return new Module(registry as Union<R & { [K in T]: Factory<R, V> }>);
  }

  provideSync<T extends Token, D extends (keyof R)[], V>(
    token: T,
    inject: [...D],
    resolve: (...args: InjectArgs<R, D>) => V,
    scope?: Scope
  ) {
    return this.provide(
      token,
      inject,
      (...args) => Promise.resolve<V>(resolve(...args)),
      scope
    );
  }

  provideClass<T extends Token, D extends (keyof R)[], V>(
    token: T,
    inject: [...D],
    ctor: {
      new(...args: InjectArgs<R, D>): V
    },
    scope?: Scope
  ) {
    return this.provide(
      token,
      inject,
      (...args) => Promise.resolve<V>(new ctor(...args)),
      scope
    );
  }

  async resolve<T extends keyof R>(token: T): Promise<FactoryResult<R[T]>> {
    const factory = this.registry[token];
    if (!factory) {
      throw new NotFoundError(String(token));
    }
    // @ts-ignore
    const result = await factory.create(this);
    return result;
  }

  get [registryProperty](): R {
    return this.registry;
  }

  import<R2 extends Registry>(importModule: Container<R2>): Module<Union<Join<R, R2>>> {
    const registry: unknown = {
      ...this.registry,
      ...importModule[registryProperty]
    };
    return new Module(registry as Union<Join<R, R2>>);
  }

  private createFactory<D extends (keyof R)[], V>(
    scope: Scope,
    resolve: (...args: InjectArgs<R, D>) => Promise<V>,
    inject: [...D],
  ) {
    switch (scope) {
      case Scope.Singleton:
        return new SingletonFactory(resolve, inject);
      case Scope.Transient:
        return new TransientFactory(resolve, inject);
    }
  }
}
