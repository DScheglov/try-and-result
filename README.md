# try-to-result [![Coverage Status](https://coveralls.io/repos/github/DScheglov/try-to-result/badge.svg?branch=main)](https://coveralls.io/github/DScheglov/try-to-result?branch=main) [![npm version](https://img.shields.io/npm/v/try-to-result.svg?style=flat-square)](https://www.npmjs.com/package/try-to-result) [![npm downloads](https://img.shields.io/npm/dm/try-to-result.svg?style=flat-square)](https://www.npmjs.com/package/try-to-result) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/DScheglov/try-to-result/blob/master/LICENSE)

**TypeScript**-first emulation of the `try`‑operator proposed by [proposal-try-operator](https://github.com/arthurfiorette/proposal-try-operator),
including a polyfill of `Result` type.

## Installation

```bash
npm install try-to-result
```

or

```bash
yarn add try-to-result
```

---

## Usage

Wrap any synchronous or asynchronous computation in `Result.try`.
It never throws – instead it returns a discriminated union you can safely destructure, like tuple.

### Basic usage

```ts
import Result from 'try-to-result';

function div(a: number, b: number): number {
  if (b !== 0) return a / b;
  throw new Error('Division by zero');
}

const [ok, error, value] = Result.try(() => div(4, 2));

if (ok) {
  console.log(value * 2); // 4
} else {
  console.error('Failed:', error);
}
```

or the same but without creating a new function:

```ts
import Result from 'try-to-result';

const [ok, error, value] = await Result.try(div, 4, 2);

if (ok) {
  console.log(value * 2); // 4
} else {
  console.error('Failed:', error);
}
```

### Promises and async functions

You can also use `Result.try` with promises and async functions:

```ts
import Result from 'try-to-result';

type User = { id: string; name: string };

async function fetchUser(id: string): Promise<User | null> {
  const [ok, error, res] = await Result.try(
    fetch(`https://api.example.com/users/${id}`),
  );

  if (!ok) {
    // no response received
    throw new Error(`Failed to fetch user: ${error}`, { cause: error });
  }

  if (res.status === 404) {
    // user not found
    return null;
  }

  if (res.status !== 200) {
    // handle other HTTP errors
    throw new Error(`HTTP error on fetching user: ${res.status}`);
  }

  const [okJson, jsonError, data] = await Result.try(res.json());

  if (!okJson) {
    // failed to parse JSON response
    throw new Error(`Failed to parse user data: ${jsonError}`, { cause: jsonError });
  }

  return data as User;
}
```

### Accepting plain synchronous values

```ts
const result = Result.try(42);
// result = Result.ok(42)
```

---

## Returning Results

Instead of exceptions, you can return a typed `Result` from your functions:

```ts
import Result from 'try-to-result';

type DivError = 
  | 'ERR_DIV_BY_ZERO' // x / 0, x != 0
  | 'ERR_IND_FORM';   // 0 / 0

function div(a: number, b: number): Result<number, DivError> {
  if (b !== 0) return Result.ok(a / b);
  if (a !== 0) return Result.error('ERR_DIV_BY_ZERO');
  return Result.error('ERR_IND_FORM');
}

const result = div(4, 0);

if (result.ok) {
  console.log(result.value);
} else {
  console.error(result.error); // 'ERR_DIV_BY_ZERO'
}
```

### Returning Async Results

```ts
import Result from 'try-to-result';

type FetchError =
  | { code: 'NETWORK_ERROR', cause: unknown }
  | { code: 'HTTP_ERROR', status: number }
  | { code: 'PARSE_JSON_ERROR', cause: unknown }
  | { code: 'ABORTED' };

type FetchJsonResult = Result<unknown, FetchError>;

async function fetchJson(url: string, init?: RequestInit): Promise<FetchJsonResult> {
  const [ok, error, res] = await Result.try(fetch(url, init));

  if (!ok) {
    // no response received
    return (error as any)?.name === 'AbortError'
      ? Result.error({ code: 'ABORTED' })
      : Result.error({ code: 'NETWORK_ERROR', cause: error });
  }

  if (!res.ok) {
    // handle HTTP errors
    return Result.error({ code: 'HTTP_ERROR', status: res.status });
  }

  const [okJson, jsonError, data] = await Result.try(res.json());

  if (!okJson) {
    // failed to parse JSON response
    return Result.error({ code: 'PARSE_JSON_ERROR', cause: jsonError });
  }

  return Result.ok(data as unknown);
}

type User = { id: string; name: string; companyId: string };

export async function fetchUser(id: string): Promise<User | null> {
  const [ok, error, data] = await fetchJson(
    `https://api.example.com/users/${id}`,
  );

  if (ok) return data as User;

  if (error.code === 'ABORTED') {
    return null;
  }

  if (error.code !== 'HTTP_ERROR') {
    throw new Error(`Failed to fetch user: ${error.code}`, {
      cause: error.cause,
    });
  }

  if (error.status === 404) {
    return null;
  }

  throw new Error(`HTTP error on fetching user: ${error.status}`);
}
```

In the above example, `fetchJson` returns a `Promise` resolving to a `Result` and
delegates error handling to the caller. Thanks to return value of `fetchJson` is
strictly typed, the `fetchUser` function can confidently handle all error cases.

---

## Usage of typed results with `Result.do`

`Result.do` makes control flow easier by letting you **unpack results** inline with a generator:

```ts
type DivError = 
  | 'ERR_DIV_BY_ZERO' // x / 0, x != 0
  | 'ERR_IND_FORM';   // 0 / 0

function div(a: number, b: number): Result<number, DivError> {
  if (b !== 0) return Result.ok(a / b);
  if (a !== 0) return Result.error('ERR_DIV_BY_ZERO');
  return Result.error('ERR_IND_FORM');
}

type SqrError = 'ERR_NEGATIVE_SQUARE_ROOT';

function sqrt(x: number): Result<number, SqrError> {
  if (x < 0) return Result.error('ERR_NEGATIVE_SQUARE_ROOT');
  return Result.ok(Math.sqrt(x));
}

const result = Result.do(function* (_) {
  const x = yield* _(div(4, 2)); // unpack Result from div
  const y = yield* _(sqrt(x));    // unpack Result from sqrt
  return y * 2;                  // return final value
});
```

In this example, the `yield* _(result)` unpacks the `Result` values, only if they are `Result.ok`.
If the result is `Result.error`, the control flow stops and returns that error.
The function `Result.do` is in charge of returning yielded values as `Result.error`.

For async workflows, use an `async function*` and `await`:

```ts
type User = { id: string; name: string, companyId: string };

const result = await Result.do(async function* (_) {
  const user = yield* _(await fetchJson<User>('/users/1'));
  const company = yield* _(await fetchJson<Company>(
    `/companies/${user.companyId}`
  ));

  return `${user.name} works at ${company.name}`;
});

console.log(result); // Result.ok('John Doe works at Example Corp')
```

---

## Specification

| API                                  | Description                                                                             |
| ------------------------------------ | --------------------------------------------------------------------------------------- |
| `import Result from 'try-to-result'` | Default and named imports.                                                              |
| `Result.ok(value)`                   | Creates a successful result.                                                            |
| `Result.error(error)`                | Creates an error result.                                                                |
| `Result.try(value)`                  | Wraps a plain value in `Result.ok`.                                                     |
| `Result.try(promise)`                | Converts a Promise into `Promise<Result<T>>`.                                           |
| `Result.try(fn, ...args)`            | Calls a function (sync or async) with arguments, capturing thrown errors or rejections. |
| `Result.collect(results)`            | Collects multiple results into a single result of array of values. Returns the first error if any result is an ErrorResult. |
| `Result.do(function*)`               | Structured error handling with generator-based flow.                                    |
| `Result.do(async function*)`         | Structured error handling with async generator-based flow.                              |

---

### `Result.ok: ValueResult<T>`

Represents a successful value:

```ts
type ValueResult<T> = readonly [
  ok: true,
  error: undefined,
  value: T
] & { readonly ok: true; readonly value: T };
```

Constructed with:

```ts
Result.ok(value)
```

---

### `Result.error: ErrorResult<T>`

Represents an error value:

```ts
type ErrorResult<E> = readonly [
  ok: false,
  error: E,
  value: undefined
] & { readonly ok: false; readonly error: E };
```

Constructed with:

```ts
Result.error(error)
```

---

### `Result.try`

Wraps a value, function, or promise:

* `Result.try(value)` → wraps a plain value
* `Result.try(fn)` → executes a function and captures exceptions
* `Result.try(promise)` → converts a Promise into `Promise<Result<T>>`
* `Result.try(fn, ...args)` → calls a function with given arguments and wraps the result

Returns:

* `Result<T>` for synchronous values
* `Promise<Result<T>>` for async functions/promises

---

### `Result.collect`
Collects multiple results into a single result of an array of values:

```ts
const result = Result.collect([Result.ok(1), Result.ok(2), Result.error('Error')]);
// result = Result.error('Error')
```

### `Result.do`

Simplifies working with nested results using generator functions:

* For synchronous generators:

  ```ts
  const result = Result.do(function* (_) { ... });
  ```

  Returns a `Result`.

* For asynchronous generators:

  ```ts
  const result = await Result.do(async function* (_) { ... });
  ```

  Returns a `Promise<Result>`.

`yield* _(someResult)` unpacks a `Result`.
If `someResult` is `Result.error`, control flow stops and returns that error.


