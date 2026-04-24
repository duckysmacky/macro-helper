'use strict';

function formatMacroLines(lines, options = {}) {
  if (!Array.isArray(lines) || lines.length === 0) {
    return [];
  }

  const mode = options.mode === 'all' ? 'all' : 'exceptLast';
  const gap = normalizePositiveInteger(options.gap, 2);
  const tabSize = normalizePositiveInteger(options.tabSize, 4);
  const strippedLines = lines.map(stripContinuation);
  const maxWidth = strippedLines.reduce(
    (widest, line) => Math.max(widest, getVisualWidth(line, tabSize)),
    0
  );
  const backslashColumn = maxWidth + gap;
  const lastContinuationIndex = mode === 'all' ? lines.length - 1 : lines.length - 2;

  return strippedLines.map((line, index) => {
    if (index > lastContinuationIndex) {
      return line;
    }

    const paddingWidth = Math.max(1, backslashColumn - getVisualWidth(line, tabSize));
    return line + ' '.repeat(paddingWidth) + '\\';
  });
}

function stripContinuation(line) {
  return String(line).replace(/[ \t]*\\?[ \t]*$/, '');
}

function getVisualWidth(text, tabSize) {
  let width = 0;

  for (const character of text) {
    if (character === '\t') {
      width += tabSize - (width % tabSize || 0);
      continue;
    }

    width += 1;
  }

  return width;
}

function normalizePositiveInteger(value, fallback) {
  if (Number.isInteger(value) && value > 0) {
    return value;
  }

  const numericValue = Number(value);
  if (Number.isInteger(numericValue) && numericValue > 0) {
    return numericValue;
  }

  return fallback;
}

module.exports = {
  formatMacroLines,
  getVisualWidth,
  stripContinuation
};
