#!/usr/bin/env python3
"""Helpers for nested Hugging Face Git working copies."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


def run_git(args: list[str], cwd: Path) -> None:
    subprocess.run(["git", *args], cwd=cwd, check=True)


def hf_repo_url(repo_id: str, repo_type: str) -> str:
    if repo_type == "dataset":
        return f"https://huggingface.co/datasets/{repo_id}"
    if repo_type == "model":
        return f"https://huggingface.co/{repo_id}"
    raise ValueError(f"Unsupported Hugging Face repo type: {repo_type}")


def is_git_worktree(path: Path) -> bool:
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        cwd=path,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        return False
    return Path(result.stdout.strip()).resolve() == path.resolve()


def ensure_nested_repo(local_dir: Path, repo_id: str, repo_type: str, revision: str | None = None) -> None:
    url = hf_repo_url(repo_id, repo_type)
    local_dir.parent.mkdir(parents=True, exist_ok=True)

    if not local_dir.exists():
        clone_args = ["clone", url, str(local_dir)]
        if revision:
            clone_args[1:1] = ["--branch", revision]
        run_git(clone_args, local_dir.parent)
        return

    local_dir.mkdir(parents=True, exist_ok=True)
    if not is_git_worktree(local_dir):
        if any(local_dir.iterdir()):
            run_git(["init"], local_dir)
            run_git(["remote", "add", "origin", url], local_dir)
            print(
                f"Initialized existing {local_dir} as a nested Git repo. "
                "Run git pull from inside it when you are ready to reconcile local files.",
                file=sys.stderr,
            )
            return

        run_git(["clone", url, str(local_dir)], local_dir.parent)
        return

    result = subprocess.run(
        ["git", "remote", "get-url", "origin"],
        cwd=local_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        run_git(["remote", "add", "origin", url], local_dir)
    elif result.stdout.strip() != url:
        run_git(["remote", "set-url", "origin", url], local_dir)

    run_git(["fetch", "origin"], local_dir)
    if revision:
        run_git(["checkout", revision], local_dir)
    else:
        run_git(["pull", "--ff-only"], local_dir)


def commit_and_push(local_dir: Path, message: str) -> None:
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
    ).stdout.strip()
    if not status:
        print(f"No changes to commit in {local_dir}.")
        return

    run_git(["commit", "-m", message], local_dir)
    run_git(["push", "origin", "HEAD"], local_dir)
