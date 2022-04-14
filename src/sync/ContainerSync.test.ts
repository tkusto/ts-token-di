import { Scope } from '../constants';
import { NotFoundError } from '../errors';
import { ContainerSync } from './ContainerSync';

describe('ContainerSync', () => {

  test('Should resolve instance w/o deps', () => {
    const mod = new ContainerSync({})
      .provideSync('simple', [], () => 'simple');
    const simple = mod.resolve('simple');
    expect(simple).toBe('simple');
  });

  test('Should resolve instance w/ deps provided by sync resolver', () => {
    const mod = new ContainerSync({})
      .provideSync('c1', [], () => 'c1')
      .provideSync('c2', ['c1'], (c1) => `${c1} c2`)
      .provideSync('c3', ['c1', 'c2'], (c1, c2) => `${c1} ${c2} c3`);
    const c2 = mod.resolve('c2');
    const c3 = mod.resolve('c3');
    expect(c2).toBe('c1 c2');
    expect(c3).toBe('c1 c1 c2 c3');
  });

  test('Should register and resolve class', () => {
    class C2 {
      constructor(public c1: string) { }
      hello() {
        return `hello ${this.c1}!`;
      }
    }
    const mod = new ContainerSync({})
      .provideSync('c1', [], () => 'c1')
      .provideClass('C2', ['c1'], C2);
    const c2 = mod.resolve('C2');
    expect(c2.hello()).toBe('hello c1!');
  });

  test('Should fail if resource not exists', () => {
    const mod = new ContainerSync({})
      .provideSync('c1', [], () => 'c1');
    try {
      // @ts-expect-error
      mod.resolve('c2');
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundError);
    }
  });

  test('Should import defs from other mods', () => {
    const mod1 = new ContainerSync({}).provideSync('c1', [], () => 'c1');
    const mod2 = new ContainerSync({}).provideSync('c2', [], () => 'c2');
    const mod3 = new ContainerSync({})
      .import(mod1)
      .import(mod2)
      .provideSync('c3', ['c1', 'c2'], (c1, c2) => `c3 <- ${c1}, ${c2}`);
    const c3 = mod3.resolve('c3');
    expect(c3).toBe('c3 <- c1, c2');
  });

  test('Should return same instance for Scope.Singleton', () => {
    class C1 { }
    const mod = new ContainerSync({})
      .provideClass('C1', [], C1, Scope.Singleton)
      .provideSync('c2', ['C1'], (c1) => ({ c1 }))
      .provideSync('c3', ['C1'], (c1) => ({ c1 }));
    const [c2, c3] = [
      mod.resolve('c2'),
      mod.resolve('c3')
    ];
    expect(c2.c1).toBe(c3.c1);
  });

  test('Should return different instance for Scope.Transient', () => {
    class C1 { }
    const mod = new ContainerSync({})
      .provideClass('C1', [], C1, Scope.Transient)
      .provideSync('c2', ['C1'], (c1) => ({ c1 }))
      .provideSync('c3', ['C1'], (c1) => ({ c1 }));
    const [c2, c3] = [
      mod.resolve('c2'),
      mod.resolve('c3')
    ];
    expect(c2.c1).not.toBe(c3.c1);
  });

  test('Should support definitions override', () => {
    const mod = new ContainerSync({})
      .provideSync('c1', [], () => 'c1')
      .provideSync('c2', ['c1'], (c1) => `${c1} c2`)
      .provideSync('c1', [], () => 'c?');
    const c2 = mod.resolve('c2');
    expect(c2).toBe('c? c2');
  });

  test('Should inject deps to run function', () => {
    const mod = new ContainerSync({})
      .provideSync('c1', [], () => 'c1')
      .provideSync('c2', ['c1'], (c1) => `${c1} c2`);
    const message = mod.run(['c1', 'c2'], (c1, c2) => `${c1} ${c2} message`);
    expect(message).toBe('c1 c1 c2 message');
  });

  test('Should provide constants', async () => {
    const mod = new ContainerSync({})
      .provideConst('c1', 'super constant')
      .provideConst('c2', 5)
      .provideSync('t3', ['c1', 'c2'], (c1, c2) => `${c1} ${c2} t3`);
    const [c1, c2, t3] = [
      mod.resolve('c1'),
      mod.resolve('c2'),
      mod.resolve('t3')
    ];
    expect(c1).toBe('super constant');
    expect(c2).toBe(5);
    expect(t3).toBe('super constant 5 t3');
  });

  test('Should handle deep imports', () => {
    class C1 {
      constructor(public msg: string) {}
    }
    const mod1 = new ContainerSync({}).provideConst('m1', 'mod1').provideClass('c1', ['m1'], C1);
    const mod2 = new ContainerSync({}).import(mod1).provideConst('m2', 'mod2');
    const mod3 = new ContainerSync({}).import(mod1).import(mod2);
    const mod4 = new ContainerSync({}).import(mod1).import(mod2).import(mod3);
    const mod5 = new ContainerSync({})
      .import(mod4)
      .provideSync('m5', ['m1', 'm2'], (m1, m2) => `${m1}, ${m2}`);
    const m5 = mod5.resolve('m5');
    const c1 = mod5.resolve('c1');
    expect(m5).toBe('mod1, mod2');
    expect(c1.msg).toBe('mod1');
  });

  test('Should have ability to run code with deps injected', () => {
    class C1 {
      constructor(public msg: string) {}
    }
    const mod1 = new ContainerSync({}).provideConst('m1', 'mod1').provideClass('c1', ['m1'], C1);
    const mod2 = new ContainerSync({}).import(mod1).provideConst('m2', 'mod2');
    const mod3 = new ContainerSync({}).import(mod1).import(mod2);
    const mod4 = new ContainerSync({}).import(mod1).import(mod2).import(mod3);
    const mod5 = new ContainerSync({})
      .import(mod4)
      .provideSync('m5', ['m1', 'm2'], (m1, m2) => `${m1}, ${m2}`);
    mod5.run(['c1'], (c1) => {
      expect(c1.msg).toBe('mod1');
    });
  });

});
