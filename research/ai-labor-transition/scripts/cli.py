#!/usr/bin/env python3
"""Research-only CLI. No production scripts import this module."""
import argparse
import json
import sys
from pathlib import Path
from pipeline import run, validate_archive
from core import now

def main():
    parser = argparse.ArgumentParser(description="Observed labor research: fetch/normalize/validate, without causal AI attribution")
    parser.add_argument("action", choices=["fetch", "normalize", "refresh", "validate", "inspect"])
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parent.parent)
    parser.add_argument("--providers", default="cps,ces,jolts,btos")
    parser.add_argument("--start-year", type=int, default=2015)
    parser.add_argument("--end-year", type=int)
    parser.add_argument("--run-at", help="Explicit timezone timestamp; pin for reproducibility")
    args = parser.parse_args()
    if args.action == "validate":
        print(json.dumps({"validatedProviders": validate_archive(args.root)})); return 0
    if args.action == "inspect":
        summary = json.loads((args.root / "normalized/current-summary.json").read_text())
    else:
        summary = run(args.root, args.action, args.providers.split(","), args.start_year, args.end_year, run_at=args.run_at)
    print(json.dumps({"asOf": summary["asOf"], "sources": {p: {"status": h["status"], "observationThrough": h["observationThrough"], "usingLastValid": h["usingLastValid"]} for p, h in summary["dataHealth"].items()}, "interpretationGuardrail": summary["interpretationGuardrail"]}, indent=2))
    # Fetch-only success means captured raw bytes, not accepted normalized data.
    if args.action == "fetch":
        statuses = json.loads((args.root / "sources/fetch-status.json").read_text())["providers"]
        print(json.dumps({"fetchStates": {p: statuses[p]["status"] for p in args.providers.split(",")}}))
        return 2 if any(statuses[p]["status"] == "FAILED" for p in args.providers.split(",")) else 0
    # Refresh can partly succeed, but a failed/unavailable selected source is visible to callers.
    return 2 if any(summary["dataHealth"][p]["status"] in ("FAILED", "UNAVAILABLE") for p in args.providers.split(",")) else 0

if __name__ == "__main__":
    try: sys.exit(main())
    except Exception as exc:
        print(f"Pipeline error: {type(exc).__name__}: {exc}", file=sys.stderr); sys.exit(1)
