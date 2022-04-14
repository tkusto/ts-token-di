import { TokenMap } from '../types';

export interface AsyncResolver<M extends TokenMap> {
  resolve<T extends keyof M>(token: T): M[T];
}

export interface FactoryAsync<R> {
  create(container: AsyncResolver<TokenMap>): Promise<R>;
}

export type RegistryAsync<M extends TokenMap> = {
  [K in keyof M]: FactoryAsync<TokenMap[K]>;
}
