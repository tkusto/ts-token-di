import { Scope } from './constants';
import { NotFoundError } from './errors';
import { Container } from './Container';

test('Should resolve instance w/o deps', async () => {
  const mod = new Container({})
    .provide('simple', [], () => Promise.resolve('simple'));
  const simple = await mod.resolve('simple');
  expect(simple).toBe('simple');
});

test('Should resolve instance w/ deps', async () => {
  const mod = new Container({})
    .provide('c1', [], () => Promise.resolve('c1'))
    .provide('c2', ['c1'], (c1) => Promise.resolve(`${c1} c2`))
    .provide('c3', ['c1', 'c2'], (c1, c2) => Promise.resolve(`${c1} ${c2} c3`));
  const [c2, c3] = await Promise.all([
    mod.resolve('c2'),
    mod.resolve('c3')
  ]);
  expect(c2).toBe('c1 c2');
  expect(c3).toBe('c1 c1 c2 c3');
});

test('Should resolve instance w/ deps provided by sync resolver', async () => {
  const mod = new Container({})
    .provideSync('c1', [], () => 'c1')
    .provideSync('c2', ['c1'], (c1) => `${c1} c2`)
    .provideSync('c3', ['c1', 'c2'], (c1, c2) => `${c1} ${c2} c3`);
  const [c2, c3] = await Promise.all([
    mod.resolve('c2'),
    mod.resolve('c3')
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
  const mod = new Container({})
    .provide('c1', [], () => Promise.resolve('c1'))
    .provideClass('C2', ['c1'], C2);
  const c2 = await mod.resolve('C2');
  expect(c2.hello()).toBe('hello c1!');
});

test('Should fail if resource not exists', async () => {
  const mod = new Container({})
    .provide('c1', [], () => Promise.resolve('c1'));
  expect(
    // @ts-expect-error
    mod.resolve('c2')
      .catch((error) => Promise.reject(
        error instanceof NotFoundError
          ? 'not found'
          : error
      ))
  ).rejects.toMatch('not found');
});

test('Should import defs from other mods', async () => {
  const mod1 = new Container({}).provide('c1', [], () => Promise.resolve('c1'));
  const mod2 = new Container({}).provide('c2', [], () => Promise.resolve('c2'));
  const mod3 = new Container({})
    .import(mod1)
    .import(mod2)
    .provide('c3', ['c1', 'c2'], (c1, c2) => Promise.resolve(`c3 <- ${c1}, ${c2}`));
  const c3 = await mod3.resolve('c3');
  expect(c3).toBe('c3 <- c1, c2');
});

test('Should return same instance for Scope.Singleton', async () => {
  class C1 { }
  const mod = new Container({})
    .provideClass('C1', [], C1, Scope.Singleton)
    .provide('c2', ['C1'], (c1) => Promise.resolve({ c1 }))
    .provide('c3', ['C1'], (c1) => Promise.resolve({ c1 }));
  const [c2, c3] = await Promise.all([
    mod.resolve('c2'),
    mod.resolve('c3')
  ]);
  expect(c2.c1).toBe(c3.c1);
});

test('Should return different instance for Scope.Transient', async () => {
  class C1 { }
  const mod = new Container({})
    .provideClass('C1', [], C1, Scope.Transient)
    .provide('c2', ['C1'], (c1) => Promise.resolve({ c1 }))
    .provide('c3', ['C1'], (c1) => Promise.resolve({ c1 }));
  const [c2, c3] = await Promise.all([
    mod.resolve('c2'),
    mod.resolve('c3')
  ]);
  expect(c2.c1).not.toBe(c3.c1);
});

test('Should support definitions override', async () => {
  const mod = new Container({})
    .provideSync('c1', [], () => 'c1')
    .provideSync('c2', ['c1'], (c1) => `${c1} c2`)
    .provideSync('c1', [], () => 'c?');
  const c2 = await mod.resolve('c2');
  expect(c2).toBe('c? c2');
});