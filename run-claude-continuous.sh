#!/usr/bin/env bash
# Runs Claude Code continuously against TASKS.md.
# - acceptEdits mode (set in .claude/settings.json) means file edits aren't gated.
# - When Claude stops (task done or quota hit) the loop resumes the same session.
# - Stop any time with Ctrl-C.

set -u
PROMPT="Work through TASKS.md in order. Run the relevant tests/build after each task and only check it off when verified. Keep going until every box is checked. If you finish, stop."

# First run starts a fresh session for this prompt; later runs resume it.
echo "[$(date)] starting continuous run"
claude -p "$PROMPT"

while true; do
  echo "[$(date)] resuming (Ctrl-C to stop)"
  # --continue resumes the most recent session in this directory.
  # If quota is exhausted claude exits non-zero; wait and retry.
  if ! claude --continue -p "Continue with TASKS.md. Resume where you left off."; then
    echo "[$(date)] claude exited non-zero (likely quota). Sleeping 15m before retry..."
    sleep 900
  fi
done
