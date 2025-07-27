/* eslint-disable @typescript-eslint/no-var-requires */
const Benchmark = require('benchmark');

async function runCase(options, caseName, fnTry, fnTryResult) {
  let tryOps = 0,
    resultOps = 0;

  return new Promise((resolve) => {
    const suite = new Benchmark.Suite();

    global.gc && global.gc();

    suite
      .add('try-to-result', {
        ...options,
        fn: fnTryResult,
        onComplete: (e) => {
          resultOps = e.target.hz;
        },
      })
      .add('try', {
        ...options,
        fn: fnTry,
        onComplete: (e) => {
          tryOps = e.target.hz;
        },
      })

      .on('complete', function () {
        const winner =
          tryOps > resultOps
            ? 'try'
            : resultOps > tryOps
              ? 'try-to-result'
              : 'equal';
        resolve({
          case: caseName,
          tryOps,
          resultOps,
          winner,
        });
      })
      .run({ async: true });
  });
}

module.exports = {
  runCase,
};
