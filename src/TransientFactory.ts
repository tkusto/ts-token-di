import { DIContainer, Factory, Token, TokenMap } from './types';

export class TransientFactory<V>
  implements Factory<V>
{
  constructor(
    private resolve: (...args: any[]) => Promise<V>,
    private inject: Token[]
  ) { }

  async create(container: DIContainer<TokenMap>): Promise<V> {
    // @ts-ignore
    const args: any[] = await Promise.all(
      this.inject.map(token => container.resolve(token))
    );
    const instance = await this.resolve(...args);
    return instance;
  }
}
