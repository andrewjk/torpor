# torpor/check

A command line tool that checks Torpor files for errors.

## Features

- checks for build errors (e.g. unclosed tags)
- checks for script and type errors

## Installation

```bash
npm install --save-dev @torpor/check
```

## Usage

```
torp-check [path]
```

Checks all Torpor files in the given folder (or a single file), and prints any
errors found. If no path is given, the current folder is checked.
