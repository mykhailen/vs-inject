# vs-inject

Minimal typed dependency-injection container for TypeScript. Tokens double as
parameter decorators, resolution is lazy-singleton, circular dependencies are
detected and reported with the full chain. About 160 lines, zero runtime
dependencies, ESM + CJS.

```ts
import { Container, Inject, token } from "vs-inject";

interface Logger { info(msg: string): void; }
const Logger = token<Logger>("logger");          // one name: type + token

class ConsoleLogger implements Logger {
  info(msg: string) { console.log(msg); }
}

class Cache { readonly size = 100; }

class Service {
  constructor(
    @Logger private readonly log: Logger,        // interface seam: token is the decorator
    @Inject(Cache) private readonly cache: Cache // concrete class: @Inject(Class)
  ) {}
  run() { this.log.info(`cache size ${this.cache.size}`); }
}

const c = new Container()
  .register(Logger, ConsoleLogger)   // bind a token to a class
  .register(Cache)                   // a concrete class as its own key
  .register(Service);

c.get(Service).run();                // "cache size 100"
```

## Install

```sh
npm install vs-inject
```

### Required tsconfig

The container relies on **parameter decorators**, which exist only under
TypeScript's legacy decorator implementation:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true
  }
}
```

`emitDecoratorMetadata` is **not** required and not used. esbuild, tsup, tsc
and swc all support `experimentalDecorators`.

## Usage

### Define a token next to its interface

```ts
export interface IConfig { readonly debug: boolean; }
export const IConfig = token<IConfig>("config");
```

TypeScript merges the interface and the `const`, so `IConfig` is both the type
and the injection key. The string is a description used in error messages.

### Three registration forms

```ts
c.register(IConfig, FileConfig);                                   // token -> class (lazy singleton)
c.register(StatusStore);                                           // class as its own key
c.register(IConfig, () => ({ debug: true }));                      // factory (values, pre-built objects)
c.register(CacheSize, (di) => (di.get(IConfig).debug ? 10 : 1000)); // factory using other deps
```

Registrations are order-independent; nothing is instantiated until the first
`get`. Re-registering a key before it is instantiated replaces the factory
(last wins). Re-registering after instantiation throws.

### Declaring constructor dependencies

| Dependency kind | Decorator | Why |
|---|---|---|
| Interface / token | `@IConfig cfg: IConfig` (or `@IConfig()`) | a `Token` is itself a parameter decorator |
| Concrete class | `@Inject(StatusStore) store: StatusStore` | a class can't be called without `new`, so it can't be its own decorator |
| Token via `Inject` | `@Inject(IConfig) cfg: IConfig` | also works, for uniformity |

Every required constructor parameter of a class you `register` must carry a
decorator; registration throws otherwise (see Errors). Classes never import the
container: only your composition root does.

### Resolving

```ts
const app = c.get(App);      // typed as App
const cfg = c.get(IConfig);  // typed as IConfig
```

## Errors

All errors are plain `Error`s whose message starts with `vs-inject:`.

| Situation | When | Message contains |
|---|---|---|
| A registered class has an undecorated required parameter | `register` | `class Foo has 2 required constructor parameter(s) but only 1 carry an injection decorator` |
| `register(token)` with no implementation | `register` | `token "x" needs an implementation` |
| Key was never registered | `get` | `no factory registered for "x"` |
| Circular dependency | `get` | `circular dependency: a -> b -> a` |
| Re-register after instantiation | `register` | `cannot re-register "x" after it was instantiated` |

## Design notes

- **No `reflect-metadata`, no `emitDecoratorMetadata`.** Bundlers such as
  esbuild do not emit `design:paramtypes`, and interface seams have no runtime
  type anyway. Keys are always explicit, so the container works identically
  bundled or not.
- **Singletons only, lazy.** One instance per key per container. No transient
  or scoped lifetimes; create a second `Container` if you need a second graph.
- **Factories, not a provider zoo.** A value is `() => value`; a class is a
  class; anything else is a factory that receives the container.
- **Accepted trade-off.** A parameter decorated with the *wrong* token compiles
  fine and fails at `get` time (parameter decorators carry no type link).
  Registration does validate that every parameter has *some* decorator.

## License

MIT
