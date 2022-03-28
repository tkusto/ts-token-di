import { Container } from './Container';

export { Container };
export { NotFoundError } from './errors';
export { Scope } from './constants';
export const Root = new Container({});
export default Root;
