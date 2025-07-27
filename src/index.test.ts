import { describe, expect, it } from '@jest/globals';
import { Equal, Expect } from '@type-challenges/utils';
import Result, { ErrorResult, OnlyErrorResult, ValueResult } from './index';

describe('Result', () => {
  it('creates Result.ok as instance of Result', () => {
    const result = Result.ok(42);
    expect(result).toBeInstanceOf(Result);
  });

  it('creates Result.error as instance of Result', () => {
    const result = Result.error(new Error('Something went wrong'));
    expect(result).toBeInstanceOf(Result);
  });

  it('creates a ValueResult with ok true', () => {
    const result = Result.ok(42);
    expect(result.ok).toBeTruthy();
    expect(result.value).toBe(42);
    expect(result).not.toHaveProperty('error');
  });

  it('allows to create a void Ok Result', () => {
    const result = Result.ok();
    expect(result.ok).toBeTruthy();
    expect(result.value).toBeUndefined();
    expect(result).not.toHaveProperty('error');
  });

  it('correctly types the void Ok Result', () => {
    const result = Result.ok();
    const check: Expect<Equal<typeof result, ValueResult<void>>> = true;
    expect(check).toBeTruthy();
  });

  it('correctly types the result of ok', () => {
    const result = Result.ok(42);
    const check: Expect<Equal<typeof result, ValueResult<number>>> = true;
    expect(check).toBeTruthy();
  });

  it('is possible to destructure a ValueResult', () => {
    const [ok, error, value] = Result.ok(42);
    expect(ok).toBeTruthy();
    expect(value).toBe(42);
    expect(error).toBeUndefined();
  });

  it('creates an ErrorResult with ok false', () => {
    const result = Result.error(new Error('Something went wrong'));
    expect(result.ok).toBeFalsy();
    expect(result.error).toBeInstanceOf(Error);
    expect(result).not.toHaveProperty('value');
  });

  it('allows to create a void Error Result', () => {
    const result = Result.error();
    expect(result.ok).toBeFalsy();
    expect(result.error).toBeUndefined();
    expect(result).not.toHaveProperty('value');
  });

  it('correctly types the void Error Result', () => {
    const result = Result.error();
    const check: Expect<Equal<typeof result, ErrorResult<void>>> = true;
    expect(check).toBeTruthy();
  });

  it('correctly types the result of error', () => {
    const result = Result.error(new Error('Something went wrong'));
    const check: Expect<Equal<typeof result, ErrorResult<Error>>> = true;
    expect(check).toBeTruthy();
  });

  it('is possible to destructure an ErrorResult', () => {
    const [ok, error, value] = Result.error(new Error('Something went wrong'));
    expect(ok).toBeFalsy();
    expect(error).toBeInstanceOf(Error);
    expect(value).toBeUndefined();
  });

  it('is possible to discriminate a Result', () => {
    expect.assertions(1);
    const result = Result.ok(42) as Result<number>;
    if (result.ok) {
      const check: Expect<Equal<typeof result.value, number>> = true;
      expect(check).toBeTruthy();
    }
  });

  it('throws an error if Result is constructed directly', () => {
    expect(() => new Result()).toThrowError(
      'Result is not constructible. Use Result.ok() or Result.error() instead.',
    );
  });
});

describe('Result.do', () => {
  function div(
    a: number,
    b: number,
  ): Result<number, 'ERR_DIV_BY_ZERO' | 'ERR_IND_FORM'> {
    if (b !== 0) return Result.ok(a / b);
    if (a !== 0) return Result.error('ERR_DIV_BY_ZERO' as const);
    return Result.error('ERR_IND_FORM' as const);
  }

  it('returns a Result with ok true for successful synchronous operations', () => {
    const result = Result.do(function* (_) {
      const x = yield* _(div(4, 2));
      return x * 2;
    });

    expect(result).toEqual(Result.ok(4));
  });

  it('correctly types the unpacked value in Result.do', () => {
    expect.assertions(1);
    Result.do(function* (_) {
      const x = yield* _(div(4, 2));
      const check: Expect<Equal<typeof x, number>> = true;
      expect(check).toBeTruthy();
      return x * 2;
    });
  });

  it('correctly types the return value in Result.do', () => {
    expect.assertions(1);
    const result = Result.do(function* (_) {
      const x = yield* _(div(4, 2));
      return x * 2;
    });
    const check: Expect<
      Equal<typeof result, Result<number, 'ERR_DIV_BY_ZERO' | 'ERR_IND_FORM'>>
    > = true;
    expect(check).toBeTruthy();
  });

  it('returns a Result with ok false for failed synchronous operations', () => {
    const result = Result.do(function* (_) {
      const x = yield* _(div(4, 0));
      return x * 2;
    });

    expect(result).toEqual(Result.error('ERR_DIV_BY_ZERO'));
  });

  it('is possible to return error explicitly in Result.do', () => {
    const result = Result.do(function* (_) {
      const x = yield* _(div(4, 2));
      if (x === 2) return Result.error('ERR_UNEXPECTED_VALUE' as const);
      return x * 2;
    });

    expect(result).toEqual(Result.error('ERR_UNEXPECTED_VALUE'));
  });

  it('is correctly typed when returning error explicitly', () => {
    expect.assertions(1);
    const result = Result.do(function* (_) {
      const x = yield* _(div(4, 2));
      if (x === 2) return Result.error('ERR_UNEXPECTED_VALUE' as const);
      return x * 2;
    });

    const check: Expect<
      Equal<
        typeof result,
        Result<
          number,
          'ERR_DIV_BY_ZERO' | 'ERR_IND_FORM' | 'ERR_UNEXPECTED_VALUE'
        >
      >
    > = true;
    expect(check).toBeTruthy();
  });

  it('returns a Promise<Result> for asynchronous operations', async () => {
    const result = Result.do(async function* (_) {
      const x = yield* _(await div(4, 2));
      return x * 2;
    });

    await expect(result).resolves.toEqual(Result.ok(4));
  });

  it('correctly types the unpacked value in asynchronous Result.do', async () => {
    expect.assertions(1);
    await Result.do(async function* (_) {
      const x = yield* _(await div(4, 2));
      const check: Expect<Equal<typeof x, number>> = true;
      expect(check).toBeTruthy();
      return x * 2;
    });
  });

  it('correctly types the return value in asynchronous Result.do', async () => {
    expect.assertions(1);
    const result = await Result.do(async function* (_) {
      const x = yield* _(await div(4, 2));
      return x * 2;
    });
    const check: Expect<
      Equal<typeof result, Result<number, 'ERR_DIV_BY_ZERO' | 'ERR_IND_FORM'>>
    > = true;
    expect(check).toBeTruthy();
  });

  it('returns a Result with ok false for failed asynchronous operations', async () => {
    const result = await Result.do(async function* (_) {
      const x = yield* _(await div(4, 0));
      return x * 2;
    });

    expect(result).toEqual(Result.error('ERR_DIV_BY_ZERO'));
  });

  it('is possible to return error explicitly in asynchronous Result.do', async () => {
    const result = await Result.do(async function* (_) {
      const x = yield* _(await div(4, 2));
      if (x === 2) return Result.error('ERR_UNEXPECTED_VALUE' as const);
      return x * 2;
    });

    expect(result).toEqual(Result.error('ERR_UNEXPECTED_VALUE'));
  });

  it('is correctly typed when returning error explicitly in asynchronous Result.do', async () => {
    expect.assertions(1);
    const result = await Result.do(async function* (_) {
      const x = yield* _(await div(4, 2));
      if (x === 2) return Result.error('ERR_UNEXPECTED_VALUE' as const);
      return x * 2;
    });

    const check: Expect<
      Equal<
        typeof result,
        Result<
          number,
          'ERR_DIV_BY_ZERO' | 'ERR_IND_FORM' | 'ERR_UNEXPECTED_VALUE'
        >
      >
    > = true;
    expect(check).toBeTruthy();
  });

  it('throws an error if unpack-generator is called more than once', () => {
    expect.assertions(1);
    expect(() => {
      Result.do(function* (_) {
        const gen = _(Result.error('Test error'));
        gen.next(); // First call is fine
        gen.next(); // Second call should throw an error
      });
    }).toThrowError(
      'Unreachable code: unpackResult(result).next() should not be called more then once',
    );
  });
});

describe('Result.collect', () => {
  it('collects results into a single Result', () => {
    const results = [Result.ok(1), Result.ok(2), Result.ok(3)];
    const result = Result.collect(results);
    expect(result).toEqual(Result.ok([1, 2, 3]));
  });

  it('returns the first error if any result is an ErrorResult', () => {
    const results = [Result.ok(1), Result.error('Error 2'), Result.ok(3)];
    const result = Result.collect(results);
    expect(result).toEqual(Result.error('Error 2'));
  });

  it('correctly types the collected oks', () => {
    const results = [Result.ok(1), Result.ok(2), Result.ok(3)];
    const result = Result.collect(results);
    const check: Expect<Equal<typeof result, Result<number[], never>>> = true;
    expect(check).toBeTruthy();
  });

  it('correctly types the collected oks and errors', () => {
    const results = [
      Result.ok(1),
      Result.error('Error 2' as const),
      Result.ok(3),
    ] as const;
    const result = Result.collect(results);
    const check: Expect<
      Equal<typeof result, Result<[number, never, number], 'Error 2'>>
    > = true;
    expect(check).toBeTruthy();
  });

  it('returns an empty array for no results', () => {
    const results: Result<number>[] = [];
    const result = Result.collect(results);
    expect(result).toEqual(Result.ok([]));
  });

  it('correctly type the empty array result', () => {
    const results: Result<number>[] = [];
    const result = Result.collect(results);
    const check: Expect<Equal<typeof result, Result<number[]>>> = true;
    expect(check).toBeTruthy();
  });

  it('correctly types collection of a non-empty Result array', () => {
    const results = [
      Result.ok(1) as Result<number>,
      Result.ok('hello') as Result<string, Error>,
      Result.ok(true) as Result<boolean>,
    ] as const;

    const collected = Result.collect(results);
    const check: Expect<
      Equal<typeof collected, Result<[number, string, boolean], unknown>>
    > = true;
    expect(check).toBeTruthy();
  });

  it('correctly types collection of a non-empty Result array with typed errors', () => {
    const results = [
      Result.ok(1) as Result<number, Error>,
      Result.ok('hello') as Result<string, Error>,
      Result.ok(true) as Result<boolean, string>,
    ] as const;

    const collected = Result.collect(results);
    const check: Expect<
      Equal<typeof collected, Result<[number, string, boolean], Error | string>>
    > = true;
    expect(check).toBeTruthy();
  });
});

describe('Result.try', () => {
  it('handles synchronous functions', () => {
    const fn = () => 42;
    const result: Result<number> = Result.try(fn);
    expect(result).toEqual(Result.ok(42));
  });

  it('correctly types the result of synchronous functions', () => {
    const result = Result.try(() => 42);
    const check: Expect<Equal<typeof result, Result<number>>> = true;
    expect(check).toBeTruthy();
  });

  it('correctly types the result of synchronous functions that never returns', () => {
    const result = Result.try(() => {
      throw new Error('Something went wrong');
    });
    const check: Expect<Equal<typeof result, OnlyErrorResult>> = true;
    expect(check).toBeTruthy();
  });

  it('correctly types the [ok, error, value] of synchronous functions that never returns', () => {
    const [ok, error, value] = Result.try(() => {
      throw new Error('Something went wrong');
    });
    const checkErr: Expect<Equal<typeof error, unknown>> = true;
    const checkValue: Expect<Equal<typeof value, undefined>> = true;

    expect(ok).toBeFalsy();
    expect(checkErr).toBeTruthy();
    expect(checkValue).toBeTruthy();
  });

  it('correctly types the result of asynchronous functions that never >returns', () => {
    const result = Result.try(async () => {
      throw new Error('Something went wrong');
    });
    const check: Expect<Equal<typeof result, Promise<OnlyErrorResult>>> = true;
    expect(check).toBeTruthy();
  });

  it('correctly types the [ok, error, value] of asynchronous functions that never returns', async () => {
    expect.assertions(3);

    const [ok, error, value] = await Result.try(async () => {
      throw new Error('Something went wrong');
    });

    const checkErr: Expect<Equal<typeof error, unknown>> = true;
    const checkValue: Expect<Equal<typeof value, undefined>> = true;

    expect(ok).toBeFalsy();
    expect(checkErr).toBeTruthy();
    expect(checkValue).toBeTruthy();
  });

  it('correctly discriminates the result of synchronous functions (ok case)', () => {
    expect.assertions(2);
    const [ok, error, value] = Result.try(() => 42);

    if (!ok) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const check: Expect<Equal<typeof error, unknown>> = true;
    } else {
      const check: Expect<Equal<typeof value, number>> = true;
      expect(check).toBeTruthy();
    }

    if (ok) {
      const check: Expect<Equal<typeof value, number>> = true;
      expect(check).toBeTruthy();
    }
  });

  it('correctly discriminates the result of synchronous functions (error case)', () => {
    expect.assertions(2);
    const [ok, error, value] = Result.try((): number => {
      throw new Error('Something went wrong');
    });

    if (!ok) {
      const check: Expect<Equal<typeof error, unknown>> = true;
      expect(check).toBeTruthy();
    }

    if (ok) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const check: Expect<Equal<typeof value, number>> = true;
    } else {
      const check: Expect<Equal<typeof error, unknown>> = true;
      expect(check).toBeTruthy();
    }
  });

  it('correctly discriminates the result when function intentionally returns undefined', () => {
    expect.assertions(2);
    const [ok, error, value] = Result.try(() => undefined);

    if (!ok) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const check: Expect<Equal<typeof error, unknown>> = true;
    } else {
      const check: Expect<Equal<typeof value, undefined>> = true;
      expect(check).toBeTruthy();
    }

    if (ok) {
      const check: Expect<Equal<typeof value, undefined>> = true;
      expect(check).toBeTruthy();
    }
  });

  it('correctly discriminates the result when function intentionally returns T | undefined', () => {
    expect.assertions(2);
    const [ok, error, value] = Result.try((): number | undefined => 42);

    if (!ok) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const check: Expect<Equal<typeof error, unknown>> = true;
    } else {
      const check: Expect<Equal<typeof value, number | undefined>> = true;
      expect(check).toBeTruthy();
    }

    if (ok) {
      const check: Expect<Equal<typeof value, number | undefined>> = true;
      expect(check).toBeTruthy();
    }
  });

  it('handles synchronous functions that throw an error', () => {
    const fn = (): number => {
      throw new Error('Something went wrong');
    };
    const result: Result<number> = Result.try(fn);
    expect(result).toEqual(Result.error(new Error('Something went wrong')));
  });

  it('handles asynchronous functions', async () => {
    const fn = async () => {
      return new Promise<number>((resolve) => {
        setTimeout(() => {
          resolve(42);
        }, 0);
      });
    };
    const result: Promise<Result<number>> = Result.try(fn);
    await expect(result).resolves.toEqual(Result.ok(42));
  });

  it('handles asynchronous functions that reject', async () => {
    const fn = async () => {
      return new Promise<number>((resolve, reject) => {
        setTimeout(() => {
          reject(new Error('Something went wrong'));
        }, 0);
      });
    };
    const result: Promise<Result<number>> = Result.try(fn);
    await expect(result).resolves.toEqual(
      Result.error(new Error('Something went wrong')),
    );
  });

  it('returns Result.ok for synchronous values', () => {
    const value = 42;
    const result: Result<number> = Result.try(value);
    expect(result).toEqual(Result.ok(42));
  });

  it('correctly types the result of synchronous values', () => {
    const value = 42;
    const result = Result.try(value);
    const check: Expect<Equal<typeof result, Result<number>>> = true;
    expect(check).toBeTruthy();
  });

  it('returns Promise<Result.ok> for asynchronous functions', async () => {
    const result: Promise<Result<number>> = Result.try(Promise.resolve(42));
    await expect(result).resolves.toEqual(Result.ok(42));
  });

  it('works for example', () => {
    expect.assertions(1);

    function div(a: number, b: number): number {
      if (b !== 0) return a / b;
      if (a !== 0) throw new Error(`Division by Zero`);
      throw new Error('Indeterminate Form');
    }

    const [ok, , x] = Result.try(() => div(4, 2));

    if (ok) {
      const doubleX = x * 2;
      expect(doubleX).toBe(4);
    }
  });

  it('does not require discriminating the error if function never returns', () => {
    const [ok, error, value] = Result.try(() => {
      throw new Error('Something went wrong');
    });

    const checkOk: Expect<Equal<typeof ok, false>> = true;
    expect(checkOk).toBeTruthy();

    const checkErr: Expect<Equal<typeof error, unknown>> = true;
    expect(checkErr).toBeTruthy();

    const checkValue: Expect<Equal<typeof value, undefined>> = true;
    expect(checkValue).toBeTruthy();
  });

  it('fails to call then if function returning promise throws', () => {
    const fn = (): Promise<number> => {
      throw new Error('Something went wrong');
    };

    expect(() =>
      Result.try(fn).then(([, error, value]) => [
        error && TypeError((error as any).message),
        value,
      ]),
    ).toThrowError();
  });

  it('is possible to call then if function returning promise throws using async', async () => {
    const fn = (): Promise<number> => {
      throw new Error('Something went wrong');
    };

    const [error] = await Result.try(async () => fn()).then(
      ([, error, value]) =>
        [error && TypeError((error as any).message), value] as const,
    );

    expect(error).toEqual(new TypeError('Something went wrong'));
  });
});
