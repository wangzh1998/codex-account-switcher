# codex-auth

A command-line tool that lets you manage and switch between multiple Codex accounts instantly, no more constant logins and logouts.

> [!WARNING]
> Not affiliated with OpenAI or Codex. Not an official tool.

## How it Works

Codex stores your authentication session in a single `auth.json` file. This tool works by creating named snapshots of that file for each of your accounts. When you want to switch, `codex-auth` copies the selected snapshot into the active `~/.codex/auth.json`.

This fork also writes a small `codex_auth_account` marker into the active auth file. The marker lets `codex-auth refresh` know which named snapshot should receive the current login state. Account switching itself is intentionally a pure switch: `codex-auth use <name>` updates `~/.codex/auth.json` but does not write back to any saved snapshot.

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

## Normal workflows

### Switch between saved accounts

```sh
codex-auth list
codex-auth use <name>
codex
```

If you want to continue the previous Codex conversation after switching accounts:

```sh
codex-auth use <name>
codex resume --last
```

`use` is intentionally non-mutating for saved snapshots. It only copies `~/.codex/accounts/<name>.json` into `~/.codex/auth.json` and updates the active marker.

### Add a new account

```sh
codex-auth new <name>
codex login
codex-auth refresh <name>
```

After that first login/save cycle, switching to the account is just:

```sh
codex-auth use <name>
```

### Re-login or refresh one account

When you intentionally re-login an account, save the refreshed `auth.json` back to that account explicitly:

```sh
codex login
codex-auth refresh <name>
```

Do not run `refresh <name>` unless you are sure the current Codex login is really that account. `refresh` is the command that overwrites a saved snapshot.

### Inspect state

```sh
codex-auth current
codex-auth list
```

### Command reference

- `codex-auth save <name>` – Validates `<name>`, ensures `auth.json` exists, marks it as `<name>`, then snapshots it to `~/.codex/accounts/<name>.json`.
- `codex-auth new <name>` – Creates an empty marked `~/.codex/accounts/<name>.json`, switches `auth.json` to it, and refuses to overwrite an existing snapshot. Run `codex login` next, then `codex-auth refresh <name>`.
- `codex-auth refresh [name]` – Copies the current `~/.codex/auth.json` to the marked or named account snapshot and records that name as active. If there is no marker, it refuses to guess from `~/.codex/current`; run `codex-auth refresh <name>` explicitly.
- `codex-auth use [name]` – Accepts a name or launches an interactive selector with the current account pre-selected. Copies the selected snapshot into place, writes the active marker to `auth.json`, and records the active name. It does not modify any saved account snapshot.
- `codex-auth list` – Lists all saved snapshots alphabetically and marks the active one with `*`.
- `codex-auth current` – Prints the active account name, or a friendly message if none is active.

Notes:

- Uses regular file copies on all platforms. It does not rely on symlinks.
- `codex-auth use <name>` refreshes the on-disk `~/.codex/auth.json`, but it cannot force an already-running Codex process to hot-reload its in-memory auth. For reliable switching, exit Codex, run `codex-auth use <name>`, then start Codex again or run `codex resume --last`.
- Because `use` never writes snapshots, run `codex-auth refresh <name>` after logging in to a new account or whenever you intentionally want to save the current `auth.json` back to a named snapshot.
- Do not commit `~/.codex/auth.json`, `~/.codex/accounts/*.json`, or `.backups/`; they contain credentials.
- Requires Node 18+.
