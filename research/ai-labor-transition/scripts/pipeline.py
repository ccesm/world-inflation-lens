"""Independent refresh/acceptance, retained vintages and bounded descriptive output."""
import gzip
import json
import urllib.request
from pathlib import Path
from catalog import PROVIDERS, SERIES, BLS_API, BTOS_FILES, GUARDRAIL, CONFOUNDERS, SCHEMA_VERSION
from core import canonical, sha256, now, timestamp, iso_date, month_at, month_index, require, write_atomic, write_immutable, SourceError
from bls import requests_for, normalize_bls
from btos import normalize_btos
from validation import validate_dataset

def fetch_bytes(url, body=None):
    require(url.startswith((BLS_API, "https://www.census.gov/hfp/btos/downloads/")), "Unapproved source URL")
    headers = {"User-Agent": "WorldInflationLens-Research/1.0 (official aggregate data)", "Accept": "application/json, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}
    data = None if body is None else json.dumps(body).encode()
    if data is not None: headers["Content-Type"] = "application/json"
    request = urllib.request.Request(url, data=data, headers=headers)
    with urllib.request.urlopen(request, timeout=45) as response:
        require(response.status == 200, "Source HTTP failure")
        raw = response.read(12_000_001)
    require(0 < len(raw) <= 12_000_000, "Empty or oversized source")
    return raw

def capture(root, provider, start_year=2015, end_year=None, fetcher=fetch_bytes, retrieved_at=None):
    root = Path(root); cutoff = timestamp(retrieved_at or now())
    end_year = end_year or cutoff.year
    requests = requests_for(provider, start_year, end_year) if provider != "btos" else [{"url": url, "role": role} for role, url in BTOS_FILES.items()]
    entries = []
    for request in requests:
        raw = fetcher(request["url"], request.get("body"))
        digest = sha256(raw)
        write_immutable(root / "sources/raw" / (digest + ".gz"), gzip.compress(raw, mtime=0))
        entries.append({"request": request, "role": request.get("role", provider), "rawSha256": digest})
    manifest = {"schemaVersion": SCHEMA_VERSION, "provider": provider, "retrievedAt": retrieved_at or now(),
                "startPeriod": f"{start_year}-01" if provider != "btos" else None, "endYear": end_year,
                "interpretationGuardrail": GUARDRAIL, "files": entries}
    digest = sha256(canonical(manifest))
    write_immutable(root / "sources/manifests" / (digest + ".json"), canonical(manifest))
    return digest

def normalize(root, digest):
    root = Path(root)
    require(isinstance(digest, str) and len(digest) == 64 and all(c in "0123456789abcdef" for c in digest), "Invalid manifest hash")
    data = (root / "sources/manifests" / (digest + ".json")).read_bytes()
    require(sha256(data) == digest, "Manifest hash mismatch")
    manifest = json.loads(data); provider = manifest["provider"]
    require(provider in PROVIDERS and manifest["schemaVersion"] == SCHEMA_VERSION and manifest["interpretationGuardrail"] == GUARDRAIL, "Manifest contract changed")
    timestamp(manifest["retrievedAt"])
    expected_requests = requests_for(provider, int(manifest["startPeriod"][:4]), manifest["endYear"]) if provider != "btos" else [{"url": url, "role": role} for role, url in BTOS_FILES.items()]
    require([e["request"] for e in manifest["files"]] == expected_requests, "Request/endpoint coverage changed")
    raws = []
    for entry in manifest["files"]:
        h = entry["rawSha256"]
        require(len(h) == 64 and all(c in "0123456789abcdef" for c in h), "Invalid raw identity")
        raw = gzip.decompress((root / "sources/raw" / (h + ".gz")).read_bytes())
        require(sha256(raw) == h, "Raw source hash mismatch")
        raws.append(raw)
    series = normalize_btos(raws, manifest) if provider == "btos" else normalize_bls(provider, raws, manifest)
    dataset = {"schemaVersion": SCHEMA_VERSION, "provider": provider, "scope": "RESEARCH_ONLY", "mode": "CURRENT_VINTAGE_DESCRIPTIVE",
               "interpretationGuardrail": GUARDRAIL, "confounders": CONFOUNDERS, "inputManifestHash": digest, "series": series}
    validate_dataset(dataset)
    return dataset

def revisions(previous, current):
    changes = []
    old = {} if previous is None else {s["id"]: s for s in previous["series"]}
    for series in current["series"]:
        prior = {o["period"]: o for o in old.get(series["id"], {}).get("observations", [])}
        present = {o["period"]: o for o in series["observations"]}
        for period in sorted(set(prior) | set(present)):
            before, after = prior.get(period), present.get(period)
            if before == after: continue
            reason = "NEW_OBSERVATION" if before is None else "OBSERVATION_WITHDRAWN" if after is None else "ECONOMIC_REVISION" if before["value"] != after["value"] else "METADATA_REVISION"
            changes.append({"seriesId": series["id"], "period": period, "reason": reason, "before": before, "after": after})
    return {"previousManifestHash": None if previous is None else previous["inputManifestHash"],
            "currentManifestHash": current["inputManifestHash"], "rawArtifactChanged": previous is not None and [s["source"]["rawSha256"] for s in previous["series"]] != [s["source"]["rawSha256"] for s in current["series"]],
            "changes": changes, "interpretationGuardrail": GUARDRAIL}

def economic_hash(dataset):
    """Analytical identity excludes retrieval/run times and raw packaging identity."""
    keys = ["id", "unit", "frequency", "seasonalAdjustment", "population", "denominator", "geography", "ageBand", "industry", "evidenceType"]
    rows = [{**{k: s[k] for k in keys}, "wordingVersion": s.get("question", {}).get("wordingVersion"),
             "observations": [{k: o[k] for k in ("period", "periodStart", "periodEnd", "value", "status")} for o in s["observations"]],
             "missingPeriods": s["missingPeriods"]} for s in dataset["series"]]
    return sha256(canonical(rows))

def load_provider(root, provider):
    pointer = Path(root) / "normalized/providers" / (provider + ".json")
    if not pointer.exists(): return None
    dataset = json.loads(pointer.read_bytes()); validate_dataset(dataset)
    immutable = Path(root) / "normalized/vintages" / provider / (sha256(canonical(dataset)) + ".json")
    require(immutable.exists() and immutable.read_bytes() == canonical(dataset), "Current pointer has no accepted immutable vintage")
    return dataset

def accept(root, dataset):
    root = Path(root); validate_dataset(dataset)
    # Independent re-normalization proves values/provenance against the pinned raw archive.
    require(canonical(normalize(root, dataset["inputManifestHash"])) == canonical(dataset), "Pinned semantic validation failed")
    previous = load_provider(root, dataset["provider"])
    audit = revisions(previous, dataset)
    payload = canonical(dataset); digest = sha256(payload)
    write_immutable(root / "normalized/vintages" / dataset["provider"] / (digest + ".json"), payload)
    audit_bytes = canonical(audit)
    write_immutable(root / "normalized/revisions" / dataset["provider"] / (sha256(audit_bytes) + ".json"), audit_bytes)
    write_atomic(root / "normalized/providers" / (dataset["provider"] + ".json"), payload)
    return audit

def health(provider, dataset, run_at, failure=None):
    config = PROVIDERS[provider]; cutoff = timestamp(run_at).date()
    base = {"provider": provider, "publisher": config["publisher"], "officialSourcePage": config["url"],
            "interpretationGuardrail": GUARDRAIL, "releaseLag": config["releaseLag"],
            "maxObservationAgeDays": config["maxObservationAgeDays"], "freshnessPolicy": "Research monitoring allowance; not a publisher release calendar",
            "lastSuccessfulFetch": None, "observationThrough": None, "sourceReleaseDate": None, "missingPeriods": {},
            "revisionFlag": "revision_unknown", "sourceChanged": False, "schemaValid": False, "failure": failure,
            "snapshotHash": None, "economicContentHash": None, "manifestHash": None, "usingLastValid": bool(failure and dataset), "coverageNotes": []}
    if dataset is None:
        base["status"] = "UNAVAILABLE"; return base
    validate_dataset(dataset)
    relevant = [s for s in dataset["series"] if provider != "btos" or s["question"]["wordingVersion"] == "business_functions"]
    ends = [s["observations"][-1]["periodEnd"] for s in relevant]
    base.update({"lastSuccessfulFetch": min(s["source"]["retrievedAt"] for s in relevant), "observationThrough": min(ends),
                 "sourceReleaseDate": max((s["source"]["releaseDate"] for s in relevant if s["source"]["releaseDate"]), default=None),
                 "schemaValid": True, "snapshotHash": sha256(canonical(dataset)), "economicContentHash": economic_hash(dataset), "manifestHash": dataset["inputManifestHash"],
                 "revisionFlag": "revisable_current_vintage"})
    for s in dataset["series"]:
        missing = sorted(set(s["missingPeriods"] + [o["period"] for o in s["observations"] if o["value"] is None]))
        if missing: base["missingPeriods"][s["id"]] = missing
    base["status"] = "FAILED" if failure else "STALE" if (cutoff - iso_date(min(ends))).days > config["maxObservationAgeDays"] else "PARTIAL" if base["missingPeriods"] else "CURRENT"
    if failure: base["sourceChanged"] = failure.startswith("VALIDATION:")
    if provider == "btos": base["coverageNotes"] = ["Original and broadened AI questions are separate histories", "No collection for 202521–202523; no synthetic backfill", "Original archive has no publication dates"]
    if provider == "cps": base["coverageNotes"] = ["Published subgroup cell sample counts/standard errors are not supplied by API", "October 2025 missing values remain null", "Age is not job seniority"]
    return base

def derive(series, period, operation, window):
    require(series["frequency"] == "monthly", "Monthly transform cannot use biweekly context")
    by_period = {o["period"]: o for o in series["observations"]}
    i = month_index(period)
    periods = [month_at(i - n) for n in range(window - 1, -1, -1)] if operation == "moving_average" else [month_at(i - window), period]
    operands = [{"seriesId": series["id"], "period": p, "value": by_period.get(p, {}).get("value")} for p in periods]
    values = [o["value"] for o in operands]
    complete = all(v is not None for v in values)
    if operation == "moving_average": value = sum(values) / window if complete else None; formula = "sum(values) / window"; unit = series["unit"]
    elif operation == "change": value = values[-1] - values[0] if complete else None; formula = "value(t) - value(t-window)"; unit = "percentage_points" if series["unit"] == "percent" else series["unit"]
    else: raise SourceError("Unknown transform")
    return {"operation": operation, "windowMonths": window, "minimumRequiredObservations": len(periods), "formula": formula,
            "period": period, "unit": unit, "status": "AVAILABLE" if complete else "UNAVAILABLE", "value": value, "inputs": operands}

def point(series, provider_health):
    latest = series["observations"][-1]
    value = {"seriesId": series["id"], "title": series["title"], "evidenceType": series["evidenceType"],
             "observation": latest, "unit": series["unit"], "frequency": series["frequency"], "seasonalAdjustment": series["seasonalAdjustment"],
             "ageBand": series["ageBand"], "sourceHealth": provider_health["status"], "usingLastValid": provider_health["usingLastValid"],
             "retrievedAt": series["source"]["retrievedAt"], "derived": []}
    if series["frequency"] == "monthly": value["derived"] = [derive(series, latest["period"], "moving_average", 3), derive(series, latest["period"], "moving_average", 6), derive(series, latest["period"], "change", 12)]
    return value

def exact_ratio(a, b):
    require(a["unit"] == b["unit"] and a["seasonalAdjustment"] == b["seasonalAdjustment"] and a["frequency"] == b["frequency"] == "monthly", "Ratio units/adjustment mismatch")
    oa = a["observations"][-1]; ob = next((o for o in b["observations"] if o["period"] == oa["period"]), None)
    good = ob is not None and oa["value"] is not None and ob["value"] is not None and ob["value"] > 0
    return {"formula": "monthly hires level / month-end openings level", "period": oa["period"], "unit": "flow_stock_ratio",
            "minimumRequiredObservations": 2, "status": "AVAILABLE" if good else "UNAVAILABLE", "value": oa["value"] / ob["value"] if good else None,
            "inputs": [{"seriesId": a["id"], "period": oa["period"], "value": oa["value"]}, {"seriesId": b["id"], "period": oa["period"], "value": ob["value"] if ob else None}]}

def divergence(a, b):
    require(a["metric"] == b["metric"] and a["unit"] == b["unit"] == "percent" and a["seasonalAdjustment"] == b["seasonalAdjustment"], "Divergence definitions mismatch")
    period = a["observations"][-1]["period"]
    oa = a["observations"][-1]; ob = next((o for o in b["observations"] if o["period"] == period), None)
    good = ob is not None and oa["value"] is not None and ob["value"] is not None
    return {"metric": a["metric"], "period": period, "comparisonAgeBand": b["ageBand"], "unit": "percentage_points",
            "formula": "20–24 published rate minus comparison-group published rate", "minimumRequiredObservations": 2,
            "status": "AVAILABLE" if good else "UNAVAILABLE", "value": oa["value"] - ob["value"] if good else None,
            "inputs": [{"seriesId": a["id"], "period": period, "value": oa["value"]}, {"seriesId": b["id"], "period": period, "value": ob["value"] if ob else None}],
            "interpretationGuardrail": GUARDRAIL}

def export(root, statuses, run_at, persist=True, return_artifacts=False):
    root = Path(root)
    datasets = {p: load_provider(root, p) for p in PROVIDERS}
    healths = {p: health(p, datasets[p], run_at, statuses.get(p, {}).get("failure")) for p in PROVIDERS}
    groups = {"labor-aggregate": [], "labor-flows": [], "young-worker": [], "ai-adoption-context": []}
    for p, dataset in datasets.items():
        if dataset is None: continue
        for s in dataset["series"]:
            key = "ai-adoption-context" if p == "btos" else "labor-flows" if p == "jolts" else "young-worker" if p == "cps" and s["ageBand"]["max"] is not None else "labor-aggregate"
            groups[key].append(s)
    # Exports are convenience views; immutable provider payloads are the source of truth.
    artifacts = {key + ".json": {"schemaVersion": SCHEMA_VERSION, "scope": "RESEARCH_ONLY", "interpretationGuardrail": GUARDRAIL,
                                 "confounders": CONFOUNDERS, "series": items, "providerHealth": healths} for key, items in groups.items()}
    summary = {"asOf": run_at[:10], "pipelineRunAt": run_at, "scope": "RESEARCH_ONLY", "mode": "CURRENT_VINTAGE_DESCRIPTIVE",
               "interpretationGuardrail": GUARDRAIL, "confounders": CONFOUNDERS, "dataHealth": healths,
               "aggregateLaborMarket": {}, "youngWorkerSignals": {}, "laborFlows": {}, "aiAdoptionContext": {}, "youngWorkerDivergence": []}
    summary_keys = {"labor-aggregate": "aggregateLaborMarket", "young-worker": "youngWorkerSignals", "labor-flows": "laborFlows", "ai-adoption-context": "aiAdoptionContext"}
    for key, items in groups.items():
        for s in items:
            p = "btos" if s["id"].startswith("BTOS_") else next(p for p, d in datasets.items() if d and any(x["id"] == s["id"] for x in d["series"]))
            summary[summary_keys[key]][s["id"]] = point(s, healths[p])
    if datasets["cps"]:
        by_id = {s["id"]: s for s in datasets["cps"]["series"]}
        for prefix in ("140", "123", "113"):
            for suffix in ("00", "89", "60"):
                comparison = divergence(by_id[f"LNS{prefix}00036"], by_id[f"LNS{prefix}000{suffix}"])
                comparison.update(sourceHealth=healths["cps"]["status"], usingLastValid=healths["cps"]["usingLastValid"])
                summary["youngWorkerDivergence"].append(comparison)
    if datasets["jolts"]:
        by_id = {s["id"]: s for s in datasets["jolts"]["series"]}
        summary["hiringToOpeningsRatio"] = exact_ratio(by_id["JTS000000000000000HIL"], by_id["JTS000000000000000JOL"])
        summary["hiringToOpeningsRatio"].update(sourceHealth=healths["jolts"]["status"], usingLastValid=healths["jolts"]["usingLastValid"])
    artifacts["data-health.json"] = {"pipelineRunAt": run_at, "interpretationGuardrail": GUARDRAIL, "providers": healths}
    artifacts["current-summary.json"] = summary
    if persist:
        for name, value in artifacts.items(): write_atomic(root / "normalized" / name, canonical(value))
    return artifacts if return_artifacts else summary

def run(root, action="refresh", providers=None, start_year=2015, end_year=None, fetcher=fetch_bytes, run_at=None):
    root = Path(root); run_at = run_at or now(); timestamp(run_at)
    selected = providers or list(PROVIDERS)
    require(set(selected) <= set(PROVIDERS) and len(set(selected)) == len(selected), "Invalid source selection")
    status_path = root / "sources/fetch-status.json"
    statuses = json.loads(status_path.read_text())["providers"] if status_path.exists() else {}
    for provider in selected:
        phase = "FETCH"
        try:
            if action in ("fetch", "refresh"):
                digest = capture(root, provider, start_year, end_year, fetcher)
                write_atomic(root / "sources/candidates" / (provider + ".json"), canonical({"manifestHash": digest}))
            else:
                digest = json.loads((root / "sources/candidates" / (provider + ".json")).read_text())["manifestHash"]
            if action != "fetch":
                phase = "VALIDATION"; dataset = normalize(root, digest); accept(root, dataset)
            statuses[provider] = {"status": "FETCHED" if action == "fetch" else "ACCEPTED", "attemptAt": run_at, "manifestHash": digest, "failure": None}
        except Exception as exc:
            # Source failures are isolated; broken exports/CLI errors still fail the command.
            statuses[provider] = {"status": "FAILED", "attemptAt": run_at, "failure": f"{phase}: {type(exc).__name__}: {exc}"}
    write_atomic(status_path, canonical({"pipelineRunAt": run_at, "interpretationGuardrail": GUARDRAIL, "providers": statuses}))
    return export(root, statuses, run_at)

def validate_archive(root):
    root = Path(root); count = 0
    for provider in PROVIDERS:
        dataset = load_provider(root, provider)
        if dataset is None: continue
        require(canonical(normalize(root, dataset["inputManifestHash"])) == canonical(dataset), "Pinned archive semantic mismatch")
        digest = sha256(canonical(dataset))
        require((root / "normalized/vintages" / provider / (digest + ".json")).read_bytes() == canonical(dataset), "Missing immutable normalized vintage")
        count += 1
    require(count > 0, "No validated provider datasets")
    status = json.loads((root / "sources/fetch-status.json").read_text()) if (root / "sources/fetch-status.json").exists() else None
    if status:
        expected = export(root, status["providers"], status["pipelineRunAt"], persist=False, return_artifacts=True)
        for name, value in expected.items():
            require((root / "normalized" / name).read_bytes() == canonical(value), f"Derived/view semantic mismatch: {name}")
    return count
