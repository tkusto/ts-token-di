import { Container } from './Container';

export { Container };
export { NotFoundError } from './errors';
export { Scope } from './constants';
export const root = new Container({});
export default root;
