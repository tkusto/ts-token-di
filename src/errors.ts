export class NotFoundError extends Error {
  constructor(token: string) {
    super(`There is no provider for "${token}"`);
    this.name = 'NotFoundError';
  }
}
