import { Container } from './Container';

export { Container };
export { NotFoundError } from './errors';
export const root = new Container({});
export default root;
