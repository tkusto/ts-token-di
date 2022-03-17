import { Container } from './Module';

export { Container };
export { NotFoundError } from './errors';
export const root = new Container({});
export default root;
