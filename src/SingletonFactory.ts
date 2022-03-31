import { noInstance } from './constants';
import { DIContainer, Factory, Token, TokenMap } from './types';

export class SingletonFactory<V> implements Factory<V>
{
  private instance: Promise<V> | typeof noInstance = noInstance;

  constructor(
    private resolve: (...args: any[]) => Promise<V>,
    private inject: Token[],
  ) { }

  async create(container: DIContainer<TokenMap>): Promise<V> {
    if (this.instance === noInstance) {
      this.instance = Promise
        .all(this.inject.map(token => container.resolve(token)))
        // @ts-ignore
        .then((args: any[]) => this.resolve(...args));
    }
    const instance = await this.instance;
    return instance;
  }
}
