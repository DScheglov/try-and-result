class ResultOk<T> {
  readonly ok: true;
  readonly value: T;

  constructor(value: T) {
    this.ok = true;
    this.value = value;
  }

  *[Symbol.iterator]() {
    yield true;
    yield undefined;
    yield this.value;
  }
}

Object.defineProperty(ResultOk, 'name', {
  value: 'Result',
  writable: false,
  enumerable: false,
  configurable: false,
});

class ResultError<E = unknown> {
  readonly ok: false;
  readonly error: E;

  constructor(error: E) {
    this.ok = false;
    this.error = error;
  }

  *[Symbol.iterator]() {
    yield false;
    yield this.error;
    yield undefined;
  }
}

Object.defineProperty(ResultError, 'name', {
  value: 'Result',
  writable: false,
  enumerable: false,
  configurable: false,
});

export type ErrorResult<E = unknown> = readonly [
  ok: false, //
  error: E,
  value: undefined,
] & {
  readonly ok: false;
  readonly error: E;
};

export type OnlyErrorResult = ErrorResult<unknown>;

export type ValueResult<T> = readonly [
  ok: true, //
  error: undefined,
  value: T,
] & {
  readonly ok: true;
  readonly value: T;
};

type Result<T, E = unknown> = ValueResult<T> | ErrorResult<E>;

export const ok = <T>(value: T) => new ResultOk(value) as ValueResult<T>;

export const error = <E>(err: E) => new ResultError(err) as ErrorResult<E>;

const asResult = <T>(value: T): T extends Result<any, any> ? T : Result<T> =>
  value instanceof Result ? (value as any) : (ok(value) as any);

const isPromise = (value: unknown): value is PromiseLike<unknown> =>
  value != null && typeof (value as any).then === 'function';

export function doTry<Args extends unknown[]>(
  fn: (...args: Args) => never,
  ...args: Args
): OnlyErrorResult;
export function doTry<Args extends unknown[]>(
  fn: () => Promise<never>,
  ...args: Args
): Promise<OnlyErrorResult>;
export function doTry<T, Args extends unknown[]>(
  fn: () => Promise<T>,
  ...args: Args
): Promise<Result<T>>;
export function doTry<T, Args extends unknown[]>(
  fn: () => T,
  ...args: Args
): Result<T>;
export function doTry<T>(promise: Promise<T>): Promise<Result<T>>;
export function doTry<T>(value: T): Result<T>;
export function doTry<T, Args extends unknown[]>(
  fn: Promise<T> | ((...args: Args) => T | Promise<T>),
  ...args: Args
): any {
  if (isPromise(fn)) return fn.then(ok, error);
  if (typeof fn !== 'function') return ok(fn as T);
  try {
    const result = fn(...args);
    return isPromise(result) ? result.then(ok, error) : ok(result);
  } catch (err) {
    return error(err);
  }
}

function* unpackResult<S, F>(result: Result<S, F>): Generator<F, S> {
  if (result.ok) return result.value;
  yield result.error;
  throw new Error(
    'Unreachable code: unpackResult(result).next() should not be called more then once',
  );
}

type Unpack = typeof unpackResult;

type TypeOfValue<R> = R extends ValueResult<infer T> ? T : never;

type TypeOfError<R> = R extends ErrorResult<infer E> ? E : never;

type NonResult<T> = T extends Result<any, any> ? never : T;

const processIteratorResult = <T, E>({
  done,
  value,
}: IteratorResult<E, T>): Result<
  TypeOfValue<T> | NonResult<T>,
  E | TypeOfError<T>
> => (done ? asResult(value as any) : error(value));

function resultDo<T, E>(
  fn: (unpack: Unpack) => AsyncGenerator<E, T>,
): Promise<Result<TypeOfValue<T> | NonResult<T>, E | TypeOfError<T>>>;

function resultDo<T, E, This>(
  method: { (this: This, unpack: Unpack): AsyncGenerator<E, T> },
  thisArg: This,
): Promise<Result<TypeOfValue<T> | NonResult<T>, E | TypeOfError<T>>>;

function resultDo<T, E>(
  fn: (unpack: Unpack) => Generator<E, T>,
): Result<TypeOfValue<T> | NonResult<T>, E | TypeOfError<T>>;

function resultDo<T, E, This>(
  method: { (this: This, unpack: Unpack): Generator<E, T> },
  thisArg: This,
): Result<TypeOfValue<T> | NonResult<T>, E | TypeOfError<T>>;

function resultDo<E, T>(
  fn: (unpack: Unpack) => Generator<E, T> | AsyncGenerator<E, T>,
  thisArg?: unknown,
): any {
  const generated = fn.call(thisArg, unpackResult).next() as
    | IteratorResult<E, T>
    | Promise<IteratorResult<E, T>>;

  return isPromise(generated)
    ? generated.then(processIteratorResult)
    : processIteratorResult(generated);
}

function collectResults<R extends readonly Result<any, any>[]>(
  results: R,
): Result<
  { -readonly [K in keyof R]: TypeOfValue<R[K]> },
  { [K in keyof R]: TypeOfError<R[K]> }[number]
> {
  const values = [] as any[];

  for (const result of results) {
    if (result.ok) {
      values.push(result.value);
    } else {
      return result;
    }
  }

  return ok(values) as any;
}

const Result = class {
  static ok = ok;
  static error = error;
  static try = doTry;
  static do = resultDo;
  static collect = collectResults;

  constructor() {
    throw new TypeError(
      'Result is not constructible. Use Result.ok() or Result.error() instead.',
    );
  }
};

Object.setPrototypeOf(ResultOk.prototype, Result.prototype);
Object.setPrototypeOf(ResultError.prototype, Result.prototype);

export default Result;
