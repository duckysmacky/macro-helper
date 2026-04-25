# C Macro Helper

C Macro Helper (or just Macro Helper) is a VS Code extension focused on making the creation of C/C++ multiline macros less tedious

## About

This extension aims to eliminate the problem of needing to manually add and align backslashes (`\`) to the end of each multiline macro's line.

It provides two commands:

- `Macro Helper: Add and Align Backslashes`
- `Macro Helper: Finalize Multiline Macro`

Both commands align the backslashes into a single vertical column, with a configurable gap from the longest line in the block

## Installation

- Install C Macro Helper from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=nikdor.macro-helper)
- Or download the latest `.vsix` file from the [GitHub releases page](https://github.com/duckysmacky/macro-helper/releases/latest).

## Example usage

When you write a multiline macro like this one:

```c
#define LOG_AND_RETURN(value)
    log_value(value);
    return value;
```

You can select the lines you want to add backslashes to and run the `Add and Align Backslashes` command, which turns it into:

```c
#define LOG_AND_RETURN(value)  \
    log_value(value);          \
    return value;              \
```

It will do two things:

1. Add a `\` at the end of the selected lines
2. Align new and existing `\` symbols to the longest line within the selected + defined offset (default: `8` spaces)

The `Finalize Multiline Macro` will do the same, but it leaves the last line plain:

```c
#define LOG_AND_RETURN(value)  \
    log_value(value);          \
    return value;
```

It is useful for selecting the whole macro to format it, while the first command is better used on separate lines.

## Usage

1. Select the lines you want to turn into a macro block.
2. Run one of the commands from the command palette or the editor context menu.
3. If you already have an existing multiline macro, you can also place the cursor inside it and run a command without making a selection.

Default shortcuts:

- `Ctrl+Alt+\` / `Cmd+Alt+\`: add and align backslashes on every selected line
- `Ctrl+Alt+Shift+\` / `Cmd+Alt+Shift+\`: align the block and remove the backslash from the final line

## Configuration

- `macroHelper.alignmentGap`: how many spaces to leave between the longest code line and the backslash column. Default: `8`
