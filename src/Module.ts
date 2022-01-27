import { RegistryProperty } from './RegistryProperty';
import type {
  Ctor,
  DIContainer,
  DIToken,
  FlattenUnion,
  Merge,
  Registry,
  Resolve,
  ResolvedDeps,
  ResolveType,
} from './DIContainer';

export class Module<R extends Registry> implements DIContainer<R> {
  constructor(
    private readonly registry: R
  ) { }

  add<T extends DIToken, D extends (keyof R)[], V, RF extends Resolve<R, D, V>>(
    token: T,
    deps: [...D],
    resolve: RF
  ): Module<FlattenUnion<R & { [K in T]: { resolve: RF, deps: [...D] } }>> {
    const registry: unknown = {
      ...this.registry,
      [token]: { resolve, deps }
    };
    return new Module(registry as FlattenUnion<R & { [K in T]: { resolve: RF, deps: [...D] } }>);
  }

  addClass<T extends DIToken, D extends (keyof R)[], V, Rfn extends Resolve<R, D, V>>(
    token: T,
    deps: [...D],
    ctor: Ctor<R, D, V>
  ): Module<FlattenUnion<R & { [K in T]: { resolve: Rfn, deps: [...D] } }>> {
    const resolve = (...args: ResolvedDeps<R,D>) => Promise.resolve<V>(new ctor(...args));
    const registry: unknown = {
      ...this.registry,
      [token]: { resolve, deps }
    };
    return new Module(registry as FlattenUnion<R & { [K in T]: { resolve: Rfn, deps: [...D] } }>);
  }

  async get<T extends keyof R>(token: T): Promise<ResolveType<R[T]['resolve']>> {
    const { resolve, deps } = this.registry[token];
    const inject = await Promise.all(deps.map(dep => this.get(dep)));
    const instance = await resolve(...inject);
    return instance;
  }

  get [RegistryProperty]() {
    return this.registry;
  }

  // TODO: get rid of ts-ignore
  // @ts-ignore
  merge<R2>(module: DIContainer<R2>): Module<Merge<R, R2>> {
    const registry: Merge<R, R2> = {
      ...this.registry,
      ...module[RegistryProperty]
    };
    return new Module(registry);
  }
}
