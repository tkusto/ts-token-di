import { noInstance } from '../constants';
import { Token, TokenMap } from '../types';
import { FactorySync, SyncResolver } from './types';

export class SingletonFactory<V> implements FactorySync<V>
{
  private instance: V | typeof noInstance = noInstance;

  constructor(
    private resolve: (...args: any[]) => V,
    private inject: Token[],
  ) { }

  create(container: SyncResolver<TokenMap>): V {
    if (this.instance === noInstance) {
      const inject = this.inject.map(token => container.resolve(token));
      this.instance = this.resolve(...inject);
    }
    return this.instance;
  }
}
