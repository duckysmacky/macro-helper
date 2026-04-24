'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { formatMacroLines, getVisualWidth, stripContinuation } = require('../src/formatter');

test('aligns all selected lines and keeps a fixed backslash column', () => {
  const actual = formatMacroLines(['foo();', 'return 42;'], {
    mode: 'all',
    gap: 2,
    tabSize: 4
  });

  assert.deepEqual(actual, ['foo();      \\', 'return 42;  \\']);
});

test('finalizes a macro by leaving the last line without a backslash', () => {
  const actual = formatMacroLines(['short();\\', 'much_longer_final_statement();\\'], {
    mode: 'exceptLast',
    gap: 3,
    tabSize: 4
  });

  assert.deepEqual(actual, ['short();                         \\', 'much_longer_final_statement();']);
});

test('normalizes existing trailing spaces and misaligned backslashes', () => {
  const actual = formatMacroLines(['alpha();    \\  ', 'beta();\\', 'gamma();   \\'], {
    mode: 'exceptLast',
    gap: 2,
    tabSize: 4
  });

  assert.deepEqual(actual, ['alpha();  \\', 'beta();   \\', 'gamma();']);
});

test('computes visual width with tab expansion', () => {
  assert.equal(getVisualWidth('\tmacro();', 4), 12);
  assert.equal(getVisualWidth('  \tmacro();', 4), 12);
});

test('strips one trailing macro continuation backslash and trailing spaces', () => {
  assert.equal(stripContinuation('call();   \\  '), 'call();');
  assert.equal(stripContinuation('printf("\\\\");\\'), 'printf("\\\\");');
});
