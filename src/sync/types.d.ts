import { TokenMap } from '../types';

export interface SyncResolver<M extends TokenMap> {
  resolve<T extends keyof M>(token: T): M[T];
}

export interface FactorySync<R> {
  create(container: SyncResolver<TokenMap>): R;
}

export type RegistrySync<M extends TokenMap> = {
  [K in keyof M]: FactorySync<TokenMap[K]>;
}
