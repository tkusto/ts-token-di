import { Token, TokenMap } from '../types';
import { AsyncResolver, FactoryAsync } from './types';

export class TransientFactory<V>
  implements FactoryAsync<V>
{
  constructor(
    private resolve: (...args: any[]) => Promise<V>,
    private inject: Token[]
  ) { }

  async create(container: AsyncResolver<TokenMap>): Promise<V> {
    // @ts-ignore
    const args: any[] = await Promise.all(
      this.inject.map(token => container.resolve(token))
    );
    const instance = await this.resolve(...args);
    return instance;
  }
}
