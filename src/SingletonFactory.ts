import { noInstance } from './constants';
import { Container, Factory, InjectArgs, Registry } from './types';

export class SingletonFactory<R extends Registry, D extends (keyof R)[], V>
  implements Factory<R, V>
{
  private instance: Promise<V> | typeof noInstance = noInstance;

  constructor(
    private resolve: (...args: InjectArgs<R, D>) => Promise<V>,
    private inject: [...D],
  ) { }

  async create(container: Container<R>): Promise<V> {
    if (this.instance === noInstance) {
      this.instance = Promise
        .all(this.inject.map(token => container.resolve(token)))
        // @ts-ignore
        .then((args: InjectArgs<R, D>) => this.resolve(...args));
    }
    const instance = await this.instance;
    return instance;
  }
}
