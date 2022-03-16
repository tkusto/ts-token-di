import { Union, Join, Registry } from './types';

export function merge<A,B>(a: A, b: B): Union<Join<A, B>> {
  // @ts-ignore
  return {
    ...a,
    ...b
  };
}

export function isRegistry(value: unknown): value is Registry {
  return typeof value === 'object' && value !== null;
}
