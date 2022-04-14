import { Container } from './async/Container';
import { ContainerSync } from './sync/ContainerSync';

export { Container, ContainerSync };
export { NotFoundError } from './errors';
export { Scope } from './constants';
export const Root = new Container({});
export const SyncRoot = new ContainerSync({});
export default Root;
