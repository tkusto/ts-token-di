import type { TokenMap } from '../types';

export interface AsyncResolver<M extends TokenMap> {
  resolve<T extends keyof M>(token: T): Promise<M[T]>;
}
