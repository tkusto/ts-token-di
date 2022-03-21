# TypeScript token-based DI container

Idea is about to have well-typed kind-of-DI container, 
that allows to compose program units in DI way, with no
"magic" things such as
[reflect-metadata](https://www.npmjs.com/package/reflect-metadata),
[non-standard decorators](https://www.typescriptlang.org/docs/handbook/decorators.html) etc.

## Simple example

```typescript
// file: src/compositionRoot.ts
import DI, { Scope } from '@tkustov/ts-token-di';
import { ConfigService } from './services';
import { SendPingUsecase } from './domain/ping';
import { PingController } from './app/controllers';
import { App } from './app';

export const compositionRoot = DI
  .provideClass('configService', [], ConfigService, Scope.Singleton)
  .provideClass(
    'sendPingUseCase',
    ['configService'],
    SendPingUseCase,
    Scope.Transient
  )
  .provideClass(
    'pingController',
    ['configService', 'sendPingUseCase'],
    PingController,
    Scope.Transient
  )
  .provideSync(
    'app',
    ['configService', 'pingController'],
    (configService, pingController) => {
      const app = new App(configService);
      app.addController('/ping', pingController);
      return app;
    }
  );
```

```typescript
// file: src/index.ts
import { compositionRoot } from './compositionRoot';

main();

async main() {
  compositionRoot.inject(['configService'], async (configService) => {
    const DB_USER = process.env.DB_USER;
    const DB_PWD = process.env.DB_PASSWORD;
    const DB_NAME = process.env.DB_NAME;
    configService.setConfig({
      API_TOKEN: '411217ff-b27b-45ce-9c57-03b5c7eabe86',
      S3_BUCKET: 'example-bucket',
      DB_URI: `mongo://${DB_USER}:${DB_PWD}@mongodb.example.com:27017/${DB_NAME}`
    });
  });
  const app = await compositionRoot.resolve('app');
  app.listen(process.env.PORT ?? 3000);
}
```
