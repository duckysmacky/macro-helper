'use strict';

const vscode = require('vscode');
const { formatMacroLines } = require('./src/formatter');

const SUPPORTED_LANGUAGES = new Set(['c', 'cpp']);

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'macroHelper.alignMacroContinuations',
      (editor) => applyMacroFormatting(editor, 'all')
    ),
    vscode.commands.registerTextEditorCommand(
      'macroHelper.alignMacroDefinition',
      (editor) => applyMacroFormatting(editor, 'exceptLast')
    )
  );
}

async function applyMacroFormatting(editor, mode) {
  if (!editor || !SUPPORTED_LANGUAGES.has(editor.document.languageId)) {
    vscode.window.showInformationMessage('Macro Helper works in C and C++ editors.');
    return;
  }

  const ranges = collectTargetLineRanges(editor);
  if (ranges.length === 0) {
    vscode.window.showInformationMessage('Select the macro lines, or place the cursor inside an existing multiline macro.');
    return;
  }

  const gap = getAlignmentGap(editor.document);
  const tabSize = getTabSize(editor);
  const eol = editor.document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
  const replacements = ranges.map((lineRange) =>
    buildReplacement(editor.document, lineRange, { mode, gap, tabSize, eol })
  );

  const success = await editor.edit((editBuilder) => {
    for (const replacement of replacements) {
      editBuilder.replace(replacement.range, replacement.text);
    }
  });

  if (!success) {
    vscode.window.showErrorMessage('Macro Helper could not update the selected macro lines.');
  }
}

function collectTargetLineRanges(editor) {
  const explicitRanges = editor.selections
    .filter((selection) => !selection.isEmpty)
    .map(selectionToLineRange)
    .filter(Boolean);

  if (explicitRanges.length > 0) {
    return mergeLineRanges(explicitRanges);
  }

  const detectedRanges = editor.selections
    .map((selection) => detectMacroBlock(editor.document, selection.active.line))
    .filter(Boolean);

  return mergeLineRanges(detectedRanges);
}

function selectionToLineRange(selection) {
  const startLine = selection.start.line;
  let endLine = selection.end.line;

  if (selection.end.character === 0 && endLine > startLine) {
    endLine -= 1;
  }

  if (endLine < startLine) {
    return null;
  }

  return { start: startLine, end: endLine };
}

function detectMacroBlock(document, activeLine) {
  const currentLine = document.lineAt(activeLine).text;

  if (startsMacroDefinition(currentLine)) {
    return expandMacroBlock(document, activeLine);
  }

  if (endsWithContinuation(currentLine)) {
    return expandMacroBlock(document, activeLine);
  }

  if (activeLine > 0 && endsWithContinuation(document.lineAt(activeLine - 1).text)) {
    return expandMacroBlock(document, activeLine - 1);
  }

  return null;
}

function expandMacroBlock(document, anchorLine) {
  let start = anchorLine;
  while (start > 0 && endsWithContinuation(document.lineAt(start - 1).text)) {
    start -= 1;
  }

  if (start > 0 && startsMacroDefinition(document.lineAt(start - 1).text)) {
    start -= 1;
  }

  if (!startsMacroDefinition(document.lineAt(start).text) && !endsWithContinuation(document.lineAt(anchorLine).text)) {
    return null;
  }

  let end = anchorLine;
  while (end < document.lineCount - 1 && endsWithContinuation(document.lineAt(end).text)) {
    end += 1;
  }

  return { start, end };
}

function buildReplacement(document, lineRange, options) {
  const lines = [];
  for (let lineNumber = lineRange.start; lineNumber <= lineRange.end; lineNumber += 1) {
    lines.push(document.lineAt(lineNumber).text);
  }

  const formattedLines = formatMacroLines(lines, {
    mode: options.mode,
    gap: options.gap,
    tabSize: options.tabSize
  });

  return {
    range: new vscode.Range(
      document.lineAt(lineRange.start).range.start,
      document.lineAt(lineRange.end).range.end
    ),
    text: formattedLines.join(options.eol)
  };
}

function mergeLineRanges(ranges) {
  if (ranges.length === 0) {
    return [];
  }

  const sorted = [...ranges].sort((left, right) => {
    if (left.start !== right.start) {
      return left.start - right.start;
    }

    return left.end - right.end;
  });

  const merged = [sorted[0]];
  for (let index = 1; index < sorted.length; index += 1) {
    const current = sorted[index];
    const previous = merged[merged.length - 1];

    if (current.start <= previous.end + 1) {
      previous.end = Math.max(previous.end, current.end);
      continue;
    }

    merged.push({ start: current.start, end: current.end });
  }

  return merged;
}

function getAlignmentGap(document) {
  const configuredGap = vscode.workspace
    .getConfiguration('macroHelper', document)
    .get('alignmentGap', 2);

  if (!Number.isFinite(configuredGap)) {
    return 2;
  }

  return Math.max(1, Math.floor(configuredGap));
}

function getTabSize(editor) {
  const tabSize = Number(editor.options.tabSize);
  if (Number.isInteger(tabSize) && tabSize > 0) {
    return tabSize;
  }

  const configuredTabSize = Number(
    vscode.workspace.getConfiguration('editor', editor.document).get('tabSize', 4)
  );

  if (Number.isInteger(configuredTabSize) && configuredTabSize > 0) {
    return configuredTabSize;
  }

  return 4;
}

function startsMacroDefinition(line) {
  return /^\s*#\s*define\b/.test(line);
}

function endsWithContinuation(line) {
  return line.replace(/[ \t]+$/, '').endsWith('\\');
}

function deactivate() {
  return;
}

module.exports = {
  activate,
  deactivate
};
