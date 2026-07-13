#!/usr/bin/env python3
"""Helpers for nested Hugging Face Git working copies."""

from __future__ import annotations

import subprocess
import sys
import time
from pathlib import Path

GIT_TIMEOUT = 120  # seconds per git command
MAX_RETRIES = 3
RETRY_DELAY = 5  # seconds


class GitError(Exception):
    """Raised when a git command fails."""


def run_git(
    args: list[str],
    cwd: Path,
    retries: int = 0,
    timeout: int = GIT_TIMEOUT,
) -> None:
    """Run a git command, raising GitError on failure."""
    for attempt in range(retries + 1):
        try:
            result = subprocess.run(
                ["git", *args],
                cwd=cwd,
                timeout=timeout,
                capture_output=True,
                text=True,
            )
            if result.returncode == 0:
                return
            # Don't retry on non-network errors
            err = (result.stderr or "").lower()
            is_network = any(kw in err for kw in ["timeout", "network", "unreachable", "resolve", "connection"])
            if attempt < retries and is_network:
                print(f"  Git command failed (network), retrying in {RETRY_DELAY}s... ({attempt + 1}/{retries})", file=sys.stderr)
                time.sleep(RETRY_DELAY)
                continue
            raise GitError(f"git {' '.join(args)} failed:\n{result.stderr.strip()}")
        except subprocess.TimeoutExpired:
            if attempt < retries:
                print(f"  Git command timed out, retrying in {RETRY_DELAY}s... ({attempt + 1}/{retries})", file=sys.stderr)
                time.sleep(RETRY_DELAY)
                continue
            raise GitError(f"git {' '.join(args)} timed out after {timeout}s")
    raise GitError(f"git {' '.join(args)} failed after {retries + 1} attempts")


def git_output(
    args: list[str],
    cwd: Path,
    check: bool = True,
    timeout: int = GIT_TIMEOUT,
) -> str:
    """Run a git command and return stripped stdout."""
    for attempt in range(MAX_RETRIES):
        try:
            result = subprocess.run(
                ["git", *args],
                cwd=cwd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=timeout,
            )
            if result.returncode == 0:
                return result.stdout.strip()
            if not check:
                return result.stdout.strip()
            err = (result.stderr or "").lower()
            is_network = any(kw in err for kw in ["timeout", "network", "unreachable", "resolve", "connection"])
            if attempt < MAX_RETRIES - 1 and is_network:
                print(f"  Git command failed (network), retrying in {RETRY_DELAY}s... ({attempt + 1}/{MAX_RETRIES})", file=sys.stderr)
                time.sleep(RETRY_DELAY)
                continue
            raise GitError(f"git {' '.join(args)} failed:\n{result.stderr.strip()}")
        except subprocess.TimeoutExpired:
            if attempt < MAX_RETRIES - 1:
                print(f"  Git command timed out, retrying in {RETRY_DELAY}s... ({attempt + 1}/{MAX_RETRIES})", file=sys.stderr)
                time.sleep(RETRY_DELAY)
                continue
            raise GitError(f"git {' '.join(args)} timed out after {timeout}s")
    return ""


def hf_repo_url(repo_id: str, repo_type: str) -> str:
    """Construct the Hugging Face repo URL."""
    if repo_type == "dataset":
        return f"https://huggingface.co/datasets/{repo_id}"
    if repo_type == "model":
        return f"https://huggingface.co/{repo_id}"
    raise ValueError(f"Unsupported Hugging Face repo type: {repo_type}")


def is_git_worktree(path: Path) -> bool:
    """Check if path is the root of a Git repository."""
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--show-toplevel"],
            cwd=path,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True,
            check=False,
            timeout=10,
        )
        if result.returncode != 0:
            return False
        return Path(result.stdout.strip()).resolve() == path.resolve()
    except (subprocess.TimeoutExpired, OSError):
        return False


def _has_remote_commits(local_dir: Path, branch: str) -> bool:
    """Check if remote branch exists."""
    result = subprocess.run(
        ["git", "rev-parse", "--verify", f"origin/{branch}"],
        cwd=local_dir,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=False,
        timeout=10,
    )
    return result.returncode == 0


def ensure_nested_repo(
    local_dir: Path,
    repo_id: str,
    repo_type: str,
    revision: str | None = None,
    sync_strategy: str = "ff-only",
) -> None:
    """Clone or update a nested Hugging Face Git working copy."""
    url = hf_repo_url(repo_id, repo_type)
    local_dir.parent.mkdir(parents=True, exist_ok=True)

    # Fresh clone
    if not local_dir.exists():
        print(f"Cloning {repo_type} repo: {repo_id}...")
        clone_args = ["clone", "--depth", "1", url, str(local_dir)]
        if revision:
            clone_args[2:2] = ["--branch", revision]
        run_git(clone_args, local_dir.parent, retries=MAX_RETRIES)
        return

    local_dir.mkdir(parents=True, exist_ok=True)

    # Directory exists but is not a git repo
    if not is_git_worktree(local_dir):
        if any(local_dir.iterdir()):
            print(f"Initializing {local_dir} as a nested Git repo...")
            run_git(["init"], local_dir)
            run_git(["remote", "add", "origin", url], local_dir)
            print(
                f"Initialized existing {local_dir} as a nested Git repo.\n"
                "Run git pull from inside it when you are ready to reconcile local files.",
                file=sys.stderr,
            )
            return
        print(f"Cloning {repo_type} repo: {repo_id}...")
        run_git(["clone", url, str(local_dir)], local_dir.parent, retries=MAX_RETRIES)
        return

    # Already a git repo — fetch and merge
    print(f"Updating {repo_type} repo: {repo_id}...")
    result = subprocess.run(
        ["git", "remote", "get-url", "origin"],
        cwd=local_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        text=True,
        check=False,
        timeout=10,
    )
    if result.returncode != 0:
        run_git(["remote", "add", "origin", url], local_dir)
    elif result.stdout.strip() != url:
        run_git(["remote", "set-url", "origin", url], local_dir)

    run_git(["fetch", "origin"], local_dir, retries=MAX_RETRIES)

    if revision:
        run_git(["checkout", revision], local_dir)
        return

    has_head = subprocess.run(
        ["git", "rev-parse", "--verify", "HEAD"],
        cwd=local_dir,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=False,
        timeout=10,
    ).returncode == 0
    local_changes = git_output(["status", "--porcelain"], local_dir)
    branch = git_output(["branch", "--show-current"], local_dir, check=False) or "main"

    if not has_head and local_changes:
        print(
            f"{local_dir} has local files but no commits yet. Skipping pull.",
            file=sys.stderr,
        )
        return

    remote_branch = f"origin/{branch}"
    remote_exists = _has_remote_commits(local_dir, branch)

    if remote_exists:
        ahead_behind = git_output(
            ["rev-list", "--left-right", "--count", f"HEAD...{remote_branch}"],
            local_dir,
        )
        parts = ahead_behind.split()
        if len(parts) == 2:
            ahead, behind = int(parts[0]), int(parts[1])
            if ahead and behind and sync_strategy == "ff-only":
                print(
                    f"{local_dir} has diverged from {remote_branch}: "
                    f"ahead {ahead}, behind {behind}.\n"
                    "Run one of:\n"
                    f"  git -C {local_dir} pull --rebase origin {branch}\n"
                    f"  git -C {local_dir} pull --no-ff origin {branch}\n"
                    f"  git -C {local_dir} reset --hard {remote_branch}",
                    file=sys.stderr,
                )
                return
            if ahead and not behind:
                print(f"{local_dir} is up to date with {remote_branch} plus {ahead} local commit(s).")
                return

    # Pull
    upstream = git_output(
        ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"],
        local_dir,
        check=False,
    )
    strategy_flag = {"rebase": "--rebase", "merge": "--no-ff"}.get(sync_strategy, "--ff-only")

    if upstream:
        run_git(["pull", strategy_flag], local_dir, retries=MAX_RETRIES)
    elif remote_exists:
        run_git(["branch", "--set-upstream-to", remote_branch, branch], local_dir)
        run_git(["pull", strategy_flag], local_dir, retries=MAX_RETRIES)


def commit_and_push(local_dir: Path, message: str) -> None:
    """Stage all changes, commit, and push to origin."""
    if not local_dir.is_dir() or not is_git_worktree(local_dir):
        print(f"Error: {local_dir} is not a nested Git repository.", file=sys.stderr)
        sys.exit(1)

    run_git(["add", "-A"], local_dir)

    status = subprocess.run(
        ["git", "status", "--porcelain"],
        cwd=local_dir,
        stdout=subprocess.PIPE,
        text=True,
        check=True,
        timeout=10,
    ).stdout.strip()

    if not status:
        print(f"No changes to commit in {local_dir}.")
        return

    run_git(["commit", "-m", message], local_dir)
    run_git(["push", "-u", "origin", "HEAD"], local_dir, retries=MAX_RETRIES)
    print(f"Pushed to origin from {local_dir}.")
