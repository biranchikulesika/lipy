"""
Command-line interface for the LiPy registry.
"""

from __future__ import annotations

import argparse
import sys

from registry import bootstrap, build, graphemes, validate
from registry.exceptions import RegistryError


def build_all() -> None:
    """Generate Unicode artifacts, then grapheme artifacts."""

    build.run()
    graphemes.build_run()


def create_parser() -> argparse.ArgumentParser:
    """Create the command-line argument parser."""

    parser = argparse.ArgumentParser(
        prog="generate_registry",
        description="LiPy Registry Tool",
    )

    parser.add_argument(
        "command",
        choices=[
            "bootstrap",
            "validate",
            "build",
            "validate-graphemes",
            "build-graphemes",
            "build-all",
        ],
        help="Registry command to execute.",
    )

    return parser


def main() -> int:
    """CLI entry point."""

    parser = create_parser()
    args = parser.parse_args()

    commands = {
        "bootstrap": bootstrap.run,
        "validate": validate.run,
        "build": build.run,
        "validate-graphemes": graphemes.validate_run,
        "build-graphemes": graphemes.build_run,
        "build-all": build_all,
    }

    try:
        commands[args.command]()

    except RegistryError as exc:
        print(f"✗ {exc}", file=sys.stderr)
        return 1

    except KeyboardInterrupt:
        print("\nOperation cancelled.", file=sys.stderr)
        return 130

    except Exception as exc:
        print(f"Unexpected error: {exc}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
