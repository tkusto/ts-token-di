import { Container, Factory, InjectArgs, Registry } from './types';

export class TransientFactory<R extends Registry, D extends (keyof R)[], V>
  implements Factory<R, V>
{
  constructor(
    private resolve: (...args: InjectArgs<R, D>) => Promise<V>,
    private inject: D
  ) {}

  async create(container: Container<R>): Promise<V> {
    // @ts-ignore
    const args: InjectArgs<R, D> = await Promise.all(
      this.inject.map(token => container.resolve(token))
    );
    const instance = await this.resolve(...args);
    return instance;
  }
}
