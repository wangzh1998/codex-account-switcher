# codex-auth

A command-line tool that lets you manage and switch between multiple Codex accounts instantly, no more constant logins and logouts.

> [!WARNING]
> Not affiliated with OpenAI or Codex. Not an official tool.

## How it Works

Codex stores your authentication session in a single `auth.json` file. This tool works by creating named snapshots of that file for each of your accounts. When you want to switch, `codex-auth` copies the selected snapshot into the active `~/.codex/auth.json`.

This fork also writes a small `codex_auth_account` marker into each managed auth snapshot. The marker lets `codex-auth use <name>` safely save the currently active account before switching away from it, without relying on symlinks that newer Codex CLI versions may replace during `codex login`.

## Requirements

- Node.js 18 or newer

## Install

Install this fork from GitHub:

```sh
npm install -g https://github.com/wangzh1998/codex-account-switcher/archive/refs/heads/main.tar.gz
```

Or install from a local checkout:

```sh
git clone https://github.com/wangzh1998/codex-account-switcher.git
cd codex-account-switcher
npm install
npm link
```

If this fork is later published to npm under a separate package name, use that package name instead.

```sh
# Original upstream package:
npm install -g codex-auth
```

## Usage

```sh
# save the current logged-in token as a named account
codex-auth save <name>

# create a new account snapshot name and switch to it
codex-auth new <name>

# switch active account
codex-auth use <name>

# refresh the current marked account after running `codex login`
codex-auth refresh

# or explicitly refresh a named account
codex-auth refresh <name>

# or pick interactively
codex-auth use

# list accounts
codex-auth list

# show current account name
codex-auth current
```

### Command reference

- `codex-auth save <name>` – Validates `<name>`, ensures `auth.json` exists, marks it as `<name>`, then snapshots it to `~/.codex/accounts/<name>.json`.
- `codex-auth new <name>` – Creates `~/.codex/accounts/<name>.json` from the current auth state, tags it with the new account marker, switches `auth.json` to that snapshot, and refuses to overwrite an existing snapshot.
- `codex-auth refresh [name]` – Copies the current `~/.codex/auth.json` to the marked or named account snapshot and records that name as active. After a fresh `codex login` removes the marker, run `codex-auth refresh <name>` once.
- `codex-auth use [name]` – Accepts a name or launches an interactive selector with the current account pre-selected. If the current `auth.json` has a `codex_auth_account` marker, first syncs it back to that snapshot, then copies the selected snapshot into place and records the active name.
- `codex-auth list` – Lists all saved snapshots alphabetically and marks the active one with `*`.
- `codex-auth current` – Prints the active account name, or a friendly message if none is active.

Notes:

- Uses regular file copies on all platforms. It does not rely on symlinks.
- `codex-auth use <name>` refreshes the on-disk `~/.codex/auth.json`, but it cannot force an already-running Codex process to hot-reload its in-memory auth. For reliable switching, exit Codex, run `codex-auth use <name>`, then start Codex again or run `codex resume --last`.
- Do not commit `~/.codex/auth.json`, `~/.codex/accounts/*.json`, or `.backups/`; they contain credentials.
- Requires Node 18+.
