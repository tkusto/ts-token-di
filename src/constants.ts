export const registryProperty = Symbol('Module::Registry');

export const noInstance = Symbol('Module::EmptyInstance');

export enum Scope {
  Singleton = 'singleton',
  Transient = 'transient'
}
