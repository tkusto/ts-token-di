import { NotFoundError } from './errors';
import { Module } from './Module';

test('Should resolve instance w/o deps', async () => {
  const module = new Module({})
    .provide('simple', [], () => Promise.resolve('simple'));
  const simple = await module.resolve('simple');
  expect(simple).toBe('simple');
});

test('Should resolve instance w/ deps', async () => {
  const module = new Module({})
    .provide('c1', [], () => Promise.resolve('c1'))
    .provide('c2', ['c1'], (c1) => Promise.resolve(`${c1} c2`))
    .provide('c3', ['c1', 'c2'], (c1, c2) => Promise.resolve(`${c1} ${c2} c3`));
  const [c2, c3] = await Promise.all([
    module.resolve('c2'),
    module.resolve('c3')
  ]);
  expect(c2).toBe('c1 c2');
  expect(c3).toBe('c1 c1 c2 c3');
});

test('Should register and resolve class', async () => {
  class C2 {
    constructor(public c1: string) { }
    hello() {
      return `hello ${this.c1}!`;
    }
  }
  const module = new Module({})
    .provide('c1', [], () => Promise.resolve('c1'))
    .provideClass('C2', ['c1'], C2);
  const c2 = await module.resolve('C2');
  expect(c2.hello()).toBe('hello c1!');
});

test('Should fail if resource not exists', async () => {
  const module = new Module({})
    .provide('c1', [], () => Promise.resolve('c1'));
  expect(
    // @ts-expect-error
    module.resolve('c2')
      .catch((error) => Promise.reject(error instanceof NotFoundError ? 'not found' : error))
  ).rejects.toMatch('not found');
});

test('Should import defs from other modules', async () => {
  const mod1 = new Module({}).provide('c1', [], () => Promise.resolve('c1'));
  const mod2 = new Module({}).provide('c2', [], () => Promise.resolve('c2'));
  const mod3 = new Module({})
    .import(mod1)
    .import(mod2)
    .provide('c3', ['c1', 'c2'], (c1, c2) => Promise.resolve(`c3 <- ${c1}, ${c2}`));
  const c3 = await mod3.resolve('c3');
  expect(c3).toBe('c3 <- c1, c2');
});
