"""Phase 2 shares Phase 1's canonical bytes and strict validation primitives only."""
import sys
from pathlib import Path
PHASE1 = Path(__file__).resolve().parents[2] / 'scripts'
sys.path.append(str(PHASE1))
from core import canonical, sha256, require, SourceError, timestamp, now, write_atomic, write_immutable, validate_schema
ROOT = Path(__file__).resolve().parents[1]
GUARDRAIL = 'Exposure is not adoption, task automation, job loss or causal AI attribution. Platform usage is not national adoption. Age is not job seniority.'
VERSION = 'occupational-ai-crosswalk-v1'
