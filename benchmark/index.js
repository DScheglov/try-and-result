/* eslint-disable @typescript-eslint/no-var-requires */
const { t } = require('try');
const { Result: tryLibResult } = require('try');
const { _try } = require('try-to-result');
const resultLibResult = require('try-to-result');
const { runCase } = require('./runCase');
const { printMarkdownTable } = require('./printMdTable');

function div(a, b) {
  if (b !== 0) return a / b;
  throw new Error('Division by zero');
}

const jsonParseDestrOk =
  ({ tryFn }) =>
  () => {
    const [ok, error, value] = tryFn(JSON.parse, '{"foo": "bar"}');
    if (ok) {
      return { value };
    } else {
      return { error };
    }
  };

const jsonParseDestrErr =
  ({ tryFn }) =>
  () => {
    const [ok, error, value] = tryFn(JSON.parse, '{"foo": "bar"');
    if (ok) {
      return { value };
    } else {
      return { error };
    }
  };

const jsonParsePropOk =
  ({ tryFn }) =>
  () => {
    const result = tryFn(JSON.parse, '{"foo": "bar"}');
    if (result.ok) {
      return { value: result.value };
    } else {
      return { error: result.error };
    }
  };

const jsonParsePropErr =
  ({ tryFn }) =>
  () => {
    const result = tryFn(JSON.parse, '{"foo": "bar"');
    if (result.ok) {
      return { value: result.value };
    } else {
      return { error: result.error };
    }
  };

const divOk =
  ({ tryFn }) =>
  () => {
    const [ok, error, value] = tryFn(div, Math.random(), 2);
    if (ok) {
      return { value };
    } else {
      return { error };
    }
  };

const divErr =
  ({ tryFn }) =>
  () => {
    const [ok, error, value] = tryFn(div, Math.random(), 0);
    if (ok) {
      return { value };
    } else {
      return { error };
    }
  };

const divResultOk =
  ({ divFn }) =>
  () => {
    const [ok, error, value] = divFn(Math.random(), 3);
    if (ok) {
      return { value };
    } else {
      return { error };
    }
  };

const divResultErr =
  ({ divFn }) =>
  () => {
    const [ok, error, value] = divFn(Math.random(), 0);
    if (ok) {
      return { value };
    } else {
      return { error };
    }
  };

const cases = [
  ['JSON.parse - ok (destr)', jsonParseDestrOk], //
  ['JSON.parse - throws (destr)', jsonParseDestrErr],
  ['JSON.parse - ok (props)', jsonParsePropOk], //
  ['JSON.parse - throws (props)', jsonParsePropErr],
  ['Div - ok', divOk],
  ['Div - throws', divErr],
  ['Div - Result.ok', divResultOk],
  ['Div - Result.error', divResultErr],
];

const options = {
  minSamples: 20,
};

const tryLib = {
  tryFn: t,
  divFn(a, b) {
    if (b !== 0) return tryLibResult.ok(a / b);
    return tryLibResult.error('ERR_DIV_BY_ZERO');
  },
};
const tryResultLib = {
  tryFn: _try,
  divFn(a, b) {
    if (b !== 0) return resultLibResult.ok(a / b);
    return resultLibResult.error('ERR_DIV_BY_ZERO');
  },
};

async function main() {
  const results = [];
  for (const [name, caseFn] of cases)
    results.push(
      await runCase(options, name, caseFn(tryLib), caseFn(tryResultLib)),
    );
  printMarkdownTable(results);
}

main();
