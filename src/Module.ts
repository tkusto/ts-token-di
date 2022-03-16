import { registryProperty } from './constants';
import { NotFoundError } from './errors';
import type {
  Ctor,
  Container,
  Token,
  Union,
  Join,
  Registry,
  Factory,
  FactoryArgs,
  FactoryType,
} from './types';
import { merge } from './utils';

export class Module<R extends Registry> implements Container<R> {
  constructor(
    private readonly registry: R
  ) { }

  provide<T extends Token, D extends (keyof R)[], V, RF extends Factory<R, D, V>>(
    token: T,
    inject: [...D],
    factory: RF
  ): Module<Union<R & { [K in T]: { factory: RF, inject: [...D] } }>> {
    const registry: unknown = {
      ...this.registry,
      [token]: { factory, inject }
    };
    return new Module(registry as Union<R & { [K in T]: { factory: RF, inject: [...D] } }>);
  }

  provideClass<T extends Token, D extends (keyof R)[], V, Rfn extends Factory<R, D, V>>(
    token: T,
    deps: [...D],
    ctor: Ctor<R, D, V>
  ): Module<Union<R & { [K in T]: { factory: Rfn, inject: [...D] } }>> {
    const factory = (...args: FactoryArgs<R, D>) => Promise.resolve<V>(new ctor(...args));
    // @ts-ignore
    const def: { [K in T]: { factory: Rfn, inject: [...D] } } = {
      [token]: { factory, inject: deps }
    };
    const registry = merge(this.registry, def);
    return new Module(registry);
  }

  async resolve<T extends keyof R>(token: T): Promise<FactoryType<R[T]['factory']>> {
    const item = this.registry[token];
    if (item === undefined) {
      throw new NotFoundError(`Thre is no declaration for "${token.toString()}" found`);
    }
    const { factory, inject } = this.registry[token];
    const args = await Promise.all(inject.map(t => this.resolve(t)));
    const instance = await factory(...args);
    return instance;
  }

  get [registryProperty](): R {
    return this.registry;
  }

  // @ts-ignore
  import<R2>(module: Container<R2>): Module<Union<Join<R, R2>>> {
    const importRegistry = module[registryProperty];
    const registry = merge(this.registry, importRegistry);
    return new Module(registry);
  }
}
