function printMarkdownTable(rows) {
  const nfInt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
  const nfFloat = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

  const headers = [
    'case',
    'try ops/sec',
    'try-to-result ops/sec',
    'winner',
    '% faster',
  ];

  const table = [
    headers,
    ...rows.map((r) => [
      r.case,
      nfInt.format(r.tryOps),
      nfInt.format(r.resultOps),
      r.winner,
      nfFloat.format(
        (r.winner === 'try'
          ? r.tryOps / r.resultOps - 1
          : r.resultOps / r.tryOps - 1) * 100,
      ),
    ]),
  ];

  // Compute max width for each column
  const widths = table[0].map((_, colIndex) =>
    Math.max(...table.map((row) => String(row[colIndex]).length)),
  );

  function formatRow(row) {
    return (
      '| ' +
      row.map((cell, i) => String(cell).padEnd(widths[i], ' ')).join(' | ') +
      ' |'
    );
  }

  const headerLine = formatRow(table[0]);
  const separatorLine =
    '| ' + widths.map((w) => '-'.repeat(w)).join(' | ') + ' |';

  console.log(headerLine);
  console.log(separatorLine);
  for (let i = 1; i < table.length; i++) {
    console.log(formatRow(table[i]));
  }
}

module.exports = {
  printMarkdownTable,
};
