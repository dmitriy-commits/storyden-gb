#!/usr/bin/env bash
set -euo pipefail

mkdir -p "$HOME/.ssh"
chmod 700 "$HOME/.ssh"

# Optionally expose host SSH config/known_hosts to the standard location.
if [ -d "$HOME/.ssh-host" ]; then
  if [ -f "$HOME/.ssh-host/config" ] && [ ! -e "$HOME/.ssh/config" ]; then
    cp "$HOME/.ssh-host/config" "$HOME/.ssh/config"
    chmod 600 "$HOME/.ssh/config"
  fi

  if [ -f "$HOME/.ssh-host/known_hosts" ] && [ ! -e "$HOME/.ssh/known_hosts" ]; then
    cp "$HOME/.ssh-host/known_hosts" "$HOME/.ssh/known_hosts"
    chmod 644 "$HOME/.ssh/known_hosts"
  fi
fi

# Prefer forwarded SSH agent when available.
if [ -S "${SSH_AUTH_SOCK:-}" ]; then
  echo "Using forwarded SSH agent at $SSH_AUTH_SOCK"
else
  echo "No forwarded SSH agent detected. GitHub SSH may require running ssh-agent on the host first."
fi

# Sensible Git defaults if unset.
if ! git config --global --get init.defaultBranch >/dev/null 2>&1; then
  git config --global init.defaultBranch main
fi

if ! git config --global --get pull.rebase >/dev/null 2>&1; then
  git config --global pull.rebase false
fi

if command -v delta >/dev/null 2>&1; then
  git config --global core.pager delta
fi
