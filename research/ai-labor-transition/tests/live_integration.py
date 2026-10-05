"""Explicit live acceptance; excluded from unittest discovery and offline tests."""
import argparse
import json
import sys
import tempfile
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
from pipeline import run, validate_archive
from core import canonical, sha256, require

def qualify(root):
    summary = run(root)
    require(validate_archive(root) == 4, "Incomplete live acceptance")
    require(all(h["status"] in ("CURRENT", "PARTIAL") and not h["usingLastValid"] for h in summary["dataHealth"].values()), "Source unavailable/stale/failed")
    cps = json.loads((root / "normalized/providers/cps.json").read_text())
    require(all(s["observations"][0]["period"] == "2015-01" for s in cps["series"]), "CPS history incomplete")
    btos = json.loads((root / "normalized/providers/btos.json").read_text())
    require(len(btos["series"]) == 4, "BTOS wording/expectation histories incomplete")
    print(json.dumps({"result": "PASS", "validatedProviders": 4, "sourceStates": {p: h["status"] for p, h in summary["dataHealth"].items()},
                      "providerHashes": {p: h["snapshotHash"] for p, h in summary["dataHealth"].items()},
                      "interpretationGuardrail": summary["interpretationGuardrail"]}, indent=2))

if __name__ == "__main__":
    parser = argparse.ArgumentParser(); parser.add_argument("--root", type=Path)
    args = parser.parse_args()
    if args.root: qualify(args.root)
    else:
        with tempfile.TemporaryDirectory(prefix="wil-ai-labor-live-") as directory: qualify(Path(directory))
