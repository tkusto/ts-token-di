import { Token, TokenMap } from '../types';
import { SyncResolver, FactorySync } from './types';

export class TransientFactory<V> implements FactorySync<V>
{
  constructor(
    private resolve: (...args: any[]) => V,
    private inject: Token[]
  ) { }

  create(container: SyncResolver<TokenMap>): V {
    const inject = this.inject.map(token => container.resolve(token));
    const instance = this.resolve(...inject);
    return instance;
  }
}
