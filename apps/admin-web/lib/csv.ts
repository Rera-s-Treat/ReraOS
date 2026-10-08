type CsvValue = string | number | null | undefined;

function escapeCsvValue(value: CsvValue): string {
  if (value === null || value === undefined) return '';
  let str = String(value);
  // Neutralise spreadsheet formulas in free-text fields (customer names, notes)
  // so opening the file in Excel/Sheets can't execute them.
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function downloadCsv(filename: string, headers: string[], rows: CsvValue[][]) {
  const allRows = headers.length > 0 ? [headers, ...rows] : rows;
  const csv = allRows.map((row) => row.map(escapeCsvValue).join(',')).join('\n');
  // Leading BOM so Excel reads the file as UTF-8 (₦, accented names).
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
