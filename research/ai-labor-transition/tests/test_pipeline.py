"""Offline fixtures and independent negative mutations, never live internet."""
import copy
import gzip
import io
import json
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch

BASE = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE.parent / "scripts"))
from catalog import SERIES, GUARDRAIL, BLS_API, BTOS_FILES
from core import SourceError, canonical, sha256, iso_date, timestamp, month_index, write_immutable, validate_schema
from pipeline import capture, normalize, accept, revisions, run, health, derive, divergence, exact_ratio, validate_archive, fetch_bytes
from btos import read_workbook, read_dates, percentage, source_date
from validation import validate_dataset, SCHEMA
from bls import requests_for

STAMP = "2026-10-05T20:00:00Z"

def fixture_fetch(url, body=None):
    if url == BLS_API:
        identifier = body["seriesid"][0]
        provider = "cps" if identifier.startswith("LNS") else "ces" if identifier.startswith("CES") else "jolts"
        return (BASE / "fixtures" / (provider + ".json")).read_bytes()
    return (BASE / "fixtures" / ("current.xlsx" if url == BTOS_FILES["current"] else "original.xlsx")).read_bytes()

class PipelineTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup); self.root = Path(self.tmp.name)
        self.datasets = {}
        for provider in ["cps", "ces", "jolts", "btos"]:
            digest = capture(self.root, provider, 2025, 2026, fixture_fetch, STAMP)
            self.datasets[provider] = normalize(self.root, digest)

    def test_all_sources_and_series(self):
        self.assertEqual({p: len(d["series"]) for p, d in self.datasets.items()}, {"cps": 12, "ces": 6, "jolts": 8, "btos": 4})
        for dataset in self.datasets.values(): self.assertTrue(validate_dataset(dataset))

    def test_expected_age_bounds_and_sa(self):
        bands = {(s["ageBand"]["min"], s["ageBand"]["max"]) for s in self.datasets["cps"]["series"]}
        self.assertEqual(bands, {(16, None), (20, 24), (25, 34), (25, 54)})
        self.assertTrue(all(s["seasonalAdjustment"] == "SA" for s in self.datasets["cps"]["series"]))

    def test_btos_native_period_and_version_separation(self):
        current = self.datasets["btos"]["series"][0]
        self.assertEqual(current["observations"][0]["period"], "202524")
        self.assertEqual(current["observations"][0]["periodEnd"], "2025-11-16")
        self.assertEqual(current["observations"][0]["collectionEnd"], "2025-11-30")
        self.assertEqual(current["observations"][0]["releaseDate"], "2025-12-04")
        self.assertEqual(current["observations"][0]["value"], 17.3)
        original = self.datasets["btos"]["series"][2]
        self.assertEqual(original["observations"][0]["period"], "202319")
        self.assertIsNone(original["source"]["releaseDate"])
        self.assertEqual(self.datasets["btos"]["series"][1]["evidenceType"], "SURVEY_EXPECTATION_CONTEXT")

    def test_current_vintage_bls_does_not_fabricate_release(self):
        for dataset in [self.datasets[p] for p in ("cps", "ces", "jolts")]:
            for s in dataset["series"]:
                self.assertIsNone(s["source"]["releaseDate"])
                self.assertTrue(all(o["releaseDate"] is None for o in s["observations"]))

    def test_normalization_byte_stable(self):
        for d in self.datasets.values():
            a = canonical(normalize(self.root, d["inputManifestHash"])); b = canonical(normalize(self.root, d["inputManifestHash"]))
            self.assertEqual(a, b); self.assertEqual(sha256(a), sha256(b))

    def test_raw_archive_tampering_rejected(self):
        d = self.datasets["cps"]
        h = d["series"][0]["source"]["rawSha256"][0]
        (self.root / "sources/raw" / (h + ".gz")).write_bytes(gzip.compress(b"{}", mtime=0))
        with self.assertRaisesRegex(SourceError, "Raw source hash mismatch"): normalize(self.root, d["inputManifestHash"])

    def test_manifest_tampering_rejected(self):
        d = self.datasets["cps"]; p = self.root / "sources/manifests" / (d["inputManifestHash"] + ".json")
        p.write_bytes(p.read_bytes() + b" ")
        with self.assertRaisesRegex(SourceError, "Manifest hash"): normalize(self.root, d["inputManifestHash"])

    def test_semantic_validation_against_raw_archive(self):
        d = copy.deepcopy(self.datasets["cps"]); d["series"][0]["observations"][0]["value"] += 1
        # Plausible values pass structural checks, but cannot pass pinned archive acceptance.
        self.assertTrue(validate_dataset(d))
        with self.assertRaisesRegex(SourceError, "Pinned semantic"): accept(self.root, d)
        self.assertFalse((self.root / "normalized/providers/cps.json").exists())

    def test_immutable_vintages_and_revision_ledger(self):
        d = self.datasets["ces"]; a = accept(self.root, d); accept(self.root, d)
        self.assertTrue(a["changes"])
        self.assertEqual(validate_archive(self.root), 1)
        self.assertEqual(len(list((self.root / "normalized/vintages/ces").glob("*.json"))), 1)

    def test_revision_value_metadata_withdrawal(self):
        old = self.datasets["ces"]; new = copy.deepcopy(old)
        new["series"][0]["observations"][0]["value"] += 1
        new["series"][0]["observations"][1]["revisionStatus"] = "revised"
        new["series"][0]["observations"].pop()
        self.assertEqual([c["reason"] for c in revisions(old, new)["changes"]], ["ECONOMIC_REVISION", "METADATA_REVISION", "OBSERVATION_WITHDRAWN"])

    def test_raw_identity_change_is_not_economic_revision(self):
        old = self.datasets["ces"]; new = copy.deepcopy(old)
        new["series"][0]["source"]["rawSha256"] = ["a" * 64]
        audit = revisions(old, new); self.assertTrue(audit["rawArtifactChanged"]); self.assertEqual(audit["changes"], [])

    def test_analytical_hash_is_separate_from_artifact_identity(self):
        from pipeline import economic_hash
        a = self.datasets["ces"]; b = copy.deepcopy(a)
        b["series"][0]["source"].update(retrievedAt="2026-10-06T00:00:00Z", rawSha256=["a" * 64])
        self.assertEqual(economic_hash(a), economic_hash(b)); self.assertNotEqual(sha256(canonical(a)), sha256(canonical(b)))
        b["series"][0]["observations"][0]["value"] += 1
        self.assertNotEqual(economic_hash(a), economic_hash(b))

    def test_failure_isolation_and_last_valid_preservation(self):
        for d in self.datasets.values(): accept(self.root, d)
        old = (self.root / "normalized/providers/cps.json").read_bytes()
        def failing(url, body=None):
            if url == BLS_API and body["seriesid"][0].startswith("LNS"): raise TimeoutError("test timeout")
            return fixture_fetch(url, body)
        summary = run(self.root, start_year=2025, end_year=2026, fetcher=failing, run_at=STAMP)
        self.assertEqual(summary["dataHealth"]["cps"]["status"], "FAILED")
        self.assertTrue(summary["dataHealth"]["cps"]["usingLastValid"])
        self.assertEqual((self.root / "normalized/providers/cps.json").read_bytes(), old)
        for provider in ("ces", "jolts", "btos"): self.assertNotIn(summary["dataHealth"][provider]["status"], ["FAILED", "UNAVAILABLE"])
        self.assertTrue(next(iter(summary["aggregateLaborMarket"].values()))["usingLastValid"])

    def test_btos_schema_failure_does_not_stop_labor(self):
        for d in self.datasets.values(): accept(self.root, d)
        old = (self.root / "normalized/providers/btos.json").read_bytes()
        def bad_btos(url, body=None): return b"<html>error</html>" if url != BLS_API else fixture_fetch(url, body)
        summary = run(self.root, start_year=2025, end_year=2026, fetcher=bad_btos, run_at=STAMP)
        self.assertEqual(summary["dataHealth"]["btos"]["status"], "FAILED")
        self.assertTrue(summary["dataHealth"]["btos"]["sourceChanged"])
        self.assertEqual((self.root / "normalized/providers/btos.json").read_bytes(), old)
        for p in ("cps", "ces", "jolts"): self.assertNotIn(summary["dataHealth"][p]["status"], ["FAILED", "UNAVAILABLE"])

    def test_no_prior_snapshot_is_unavailable(self):
        summary = run(self.root, providers=["cps"], fetcher=lambda *a: (_ for _ in ()).throw(ConnectionError("test")), run_at=STAMP)
        self.assertEqual(summary["dataHealth"]["cps"]["status"], "UNAVAILABLE")
        self.assertEqual(summary["aggregateLaborMarket"], {})

    def test_health_expected_lag_not_daily(self):
        d = self.datasets["jolts"]
        self.assertEqual(health("jolts", d, "2025-05-30T00:00:00Z")["status"], "CURRENT")
        self.assertEqual(health("jolts", d, "2025-09-30T00:00:00Z")["status"], "STALE")

    def test_missing_null_health_is_partial(self):
        d = copy.deepcopy(self.datasets["cps"]); o = d["series"][0]["observations"][0]; o.update(value=None, status="missing")
        h = health("cps", d, "2025-04-05T00:00:00Z")
        self.assertEqual(h["status"], "PARTIAL"); self.assertEqual(h["missingPeriods"][d["series"][0]["id"]], ["2025-01"])

    def test_derived_exact_windows_and_lineage(self):
        s = self.datasets["cps"]["series"][0]; values = [o["value"] for o in s["observations"]]
        result = derive(s, "2025-03", "moving_average", 3)
        self.assertEqual(result["value"], sum(values) / 3); self.assertEqual(len(result["inputs"]), 3)
        self.assertIsNone(derive(s, "2025-03", "change", 12)["value"])
        self.assertIsNone(derive(s, "2025-03", "moving_average", 6)["value"])

    def test_exact_lag_not_previous_available_value(self):
        s = copy.deepcopy(self.datasets["cps"]["series"][0]); s["observations"].pop(1)
        self.assertEqual(derive(s, "2025-03", "moving_average", 3)["status"], "UNAVAILABLE")

    def test_null_operand_is_not_zero(self):
        s = copy.deepcopy(self.datasets["cps"]["series"][0]); s["observations"][0]["value"] = None
        self.assertIsNone(derive(s, "2025-03", "moving_average", 3)["value"])

    def test_biweekly_context_cannot_be_monthly_smoothed(self):
        with self.assertRaises(SourceError): derive(self.datasets["btos"]["series"][0], "2025-03", "moving_average", 3)

    def test_divergence_is_difference_between_same_period_rates(self):
        s = self.datasets["cps"]["series"]; by_id = {x["id"]: x for x in s}
        young = by_id["LNS14000036"]; prime = by_id["LNS14000060"]
        result = divergence(young, prime)
        self.assertEqual(result["value"], young["observations"][-1]["value"] - prime["observations"][-1]["value"])
        self.assertEqual(result["unit"], "percentage_points")
        prime = copy.deepcopy(prime); prime["observations"].pop()
        self.assertEqual(divergence(young, prime)["status"], "UNAVAILABLE")

    def test_comparisons_reject_mixed_sa_nsa(self):
        a, b = copy.deepcopy(self.datasets["cps"]["series"][:2]); b["metric"] = a["metric"]; b["seasonalAdjustment"] = "NSA"
        with self.assertRaises(SourceError): divergence(a, b)

    def test_flow_stock_ratio_exact_alignment(self):
        s = {s["id"]: s for s in self.datasets["jolts"]["series"]}
        hires, openings = s["JTS000000000000000HIL"], s["JTS000000000000000JOL"]
        r = exact_ratio(hires, openings)
        self.assertEqual(r["value"], hires["observations"][-1]["value"] / openings["observations"][-1]["value"])
        b = copy.deepcopy(openings); b["observations"][-1]["value"] = 0
        self.assertIsNone(exact_ratio(hires, b)["value"])

    def test_request_partition_and_no_keys(self):
        r = requests_for("cps", 2015, 2026)
        self.assertEqual([(x["body"]["startyear"], x["body"]["endyear"]) for x in r], [("2015", "2024"), ("2025", "2026")])
        self.assertTrue(all(len(x["body"]["seriesid"]) <= 20 and "registrationkey" not in x["body"] for x in r))

    def test_fetch_success_and_http_failure(self):
        class Response(io.BytesIO): status = 200
        with patch("urllib.request.urlopen", return_value=Response(b'{"status":"REQUEST_SUCCEEDED"}')) as call:
            self.assertTrue(fetch_bytes(BLS_API, {"seriesid": []}).startswith(b"{"))
            self.assertEqual(call.call_args.kwargs["timeout"], 45)
        class Bad(Response): status = 500
        with patch("urllib.request.urlopen", return_value=Bad(b"error")):
            with self.assertRaises(SourceError): fetch_bytes(BLS_API)

    def test_fetch_rejects_nonofficial_endpoint(self):
        with self.assertRaises(SourceError): fetch_bytes("https://example.com/private")

    def test_strict_date_and_timestamp(self):
        self.assertEqual(iso_date("2020-02-29").day, 29)
        self.assertEqual(timestamp("2026-10-05T20:00:00Z").year, 2026)
        for value in ["2021-02-29", "2022-02-30", "2022-04-31", "2022-13-01", "2022-00-10", "2022-01-00"]:
            with self.assertRaises(SourceError): iso_date(value)
        for value in ["2022-02-30T00:00:00Z", "2026-10-05T25:00:00Z", "2026-10-05T20:00:00"]:
            with self.assertRaises(SourceError): timestamp(value)

    def test_immutable_collision_rejected(self):
        p = self.root / "immutable.json"; write_immutable(p, b"one"); write_immutable(p, b"one")
        with self.assertRaises(SourceError): write_immutable(p, b"two")

    def test_schema_unknown_keyword_fails(self):
        with self.assertRaises(SourceError): validate_schema("value", {"type": "string", "unimplemented": True})

    def test_btos_dates_and_percentage_semantics(self):
        self.assertEqual(source_date("45995"), "2025-12-04")
        self.assertEqual(source_date("12/04/2025"), "2025-12-04")
        self.assertIsNone(percentage("S")); self.assertIsNone(percentage(".")); self.assertEqual(percentage("0.0%"), 0)
        for v in ["17.3", "101%", "NaN%"]:
            with self.assertRaises(SourceError): percentage(v)

    def test_btos_wording_schema_change(self):
        from btos import normalize_btos
        with patch("btos.question_text", return_value="changed"):
            with self.assertRaisesRegex(SourceError, "wording"): normalize(self.root, self.datasets["btos"]["inputManifestHash"])

    def test_btos_missing_categories(self):
        from btos import read_workbook as real
        def mutate(raw):
            w = real(raw)
            for name in ["Response Estimates", "National Estimates"]:
                if name in w: w[name] = [r for r in w[name] if not (r.get("A") == "7" and r.get("C") == "3")]
            return w
        with patch("btos.read_workbook", side_effect=mutate):
            with self.assertRaisesRegex(SourceError, "categories"): normalize(self.root, self.datasets["btos"]["inputManifestHash"])

    def test_btos_missing_date_mapping(self):
        with patch("btos.read_dates", return_value={}):
            with self.assertRaisesRegex(SourceError, "date mapping"): normalize(self.root, self.datasets["btos"]["inputManifestHash"])

    def test_btos_duplicate_date_period_rejected(self):
        w = read_workbook((BASE / "fixtures/current.xlsx").read_bytes())
        rows = w["Collection and Reference Dates"]
        with self.assertRaisesRegex(SourceError, "Duplicate"): read_dates(rows + [rows[1]])

    def test_btos_window_contradiction_rejected(self):
        w = read_workbook((BASE / "fixtures/current.xlsx").read_bytes())
        rows = copy.deepcopy(w["Collection and Reference Dates"]); rows[1]["H"] = "46000"
        with self.assertRaisesRegex(SourceError, "Contradictory"): read_dates(rows)

    def test_btos_denominator_change_rejected(self):
        from btos import read_workbook as real
        def mutate(raw):
            w = real(raw)
            if "Response Estimates" in w:
                row = next(r for r in w["Response Estimates"] if r.get("A") == "7" and r.get("C") == "2")
                row["Y"] = "1.0%"
            return w
        with patch("btos.read_workbook", side_effect=mutate):
            with self.assertRaisesRegex(SourceError, "denominator"): normalize(self.root, self.datasets["btos"]["inputManifestHash"])

    def test_future_btos_release_rejected(self):
        from btos import read_dates as real
        def mutate(rows):
            d = real(rows)
            for timing in d.values(): timing["releaseDate"] = "2030-01-01"
            return d
        with patch("btos.read_dates", side_effect=mutate):
            with self.assertRaisesRegex(SourceError, "Future BTOS release"): normalize(self.root, self.datasets["btos"]["inputManifestHash"])

    def test_preliminary_and_revised_status_from_source(self):
        s = self.datasets["ces"]["series"][0]
        def mutate(url, body=None):
            j = json.loads(fixture_fetch(url, body))
            j["Results"]["series"][0]["data"][0]["footnotes"] = [{"code": "P", "text": "preliminary"}]
            j["Results"]["series"][0]["data"][1]["footnotes"] = [{"code": "R", "text": "revised"}]
            return canonical(j)
        d = normalize(self.root, capture(self.root, "ces", 2025, 2026, mutate, STAMP))
        self.assertEqual([o["revisionStatus"] for o in d["series"][0]["observations"]][-2:], ["revised", "preliminary"])

    def test_summary_and_views_are_validated(self):
        run(self.root, start_year=2025, end_year=2026, fetcher=fixture_fetch, run_at=STAMP)
        self.assertEqual(validate_archive(self.root), 4)
        p = self.root / "normalized/current-summary.json"; payload = json.loads(p.read_text())
        payload["aggregateLaborMarket"]["LNS14000000"]["observation"]["value"] = 99
        p.write_bytes(canonical(payload))
        with self.assertRaisesRegex(SourceError, "Derived/view semantic mismatch"): validate_archive(self.root)

    def test_false_view_metadata_rejected(self):
        run(self.root, start_year=2025, end_year=2026, fetcher=fixture_fetch, run_at=STAMP)
        p = self.root / "normalized/young-worker.json"; payload = json.loads(p.read_text())
        payload["series"][0]["source"]["publisher"] = "fabricated"
        p.write_bytes(canonical(payload))
        with self.assertRaisesRegex(SourceError, "Derived/view semantic mismatch"): validate_archive(self.root)

    def test_pointer_tampering_rejected(self):
        accept(self.root, self.datasets["cps"])
        p = self.root / "normalized/providers/cps.json"; d = json.loads(p.read_text()); d["series"][0]["observations"][0]["value"] += 1; p.write_bytes(canonical(d))
        with self.assertRaisesRegex(SourceError, "accepted immutable vintage"): validate_archive(self.root)

    def test_runtime_timestamp_does_not_change_normalization(self):
        d = self.datasets["cps"]; before = canonical(d)
        with patch("pipeline.now", return_value="2026-11-01T00:00:00Z"):
            self.assertEqual(canonical(normalize(self.root, d["inputManifestHash"])), before)

    def test_live_summary_has_no_causal_or_score_fields(self):
        for d in self.datasets.values(): accept(self.root, d)
        from pipeline import export
        s = export(self.root, {}, STAMP)
        self.assertEqual(len(s["youngWorkerDivergence"]), 9)
        self.assertEqual(len(s["aiAdoptionContext"]), 4)
        self.assertEqual(s["interpretationGuardrail"], GUARDRAIL)
        self.assertFalse(set(s) & {"score", "forecast", "aiCaused", "probability"})


def dataset_mutation(field, mutate, provider="cps"):
    def test(self):
        d = copy.deepcopy(self.datasets[provider]); mutate(d)
        with self.assertRaises((SourceError, ValueError, KeyError)): validate_dataset(d)
    test.__name__ = "test_contract_" + field
    return test

MUTATIONS = {
    "publisher": lambda d: d["series"][0]["source"].update(publisher="Wrong"),
    "source_url": lambda d: d["series"][0]["source"].update(url="https://example.com"),
    "series_identity": lambda d: d["series"][0].update(id="LNS14009999"),
    "units": lambda d: d["series"][0].update(unit="thousand_jobs"),
    "frequency": lambda d: d["series"][0].update(frequency="biweekly"),
    "adjustment": lambda d: d["series"][0].update(seasonalAdjustment="NSA"),
    "age_lower": lambda d: d["series"][0]["ageBand"].update(min=18),
    "age_upper": lambda d: d["series"][0]["ageBand"].update(max=25),
    "subgroup_label": lambda d: d["series"][0].update(title="Junior workers"),
    "population": lambda d: d["series"][0].update(population="All residents"),
    "denominator": lambda d: d["series"][0].update(denominator="All jobs"),
    "missing_source": lambda d: d["series"][0].pop("source"),
    "empty_provenance": lambda d: d["series"][0]["source"].update(rawSha256=[]),
    "unordered": lambda d: d["series"][0]["observations"].reverse(),
    "duplicate": lambda d: d["series"][0]["observations"].append(d["series"][0]["observations"][0]),
    "impossible_month": lambda d: d["series"][0]["observations"][0].update(period="2025-13"),
    "period_mismatch": lambda d: d["series"][0]["observations"][0].update(periodEnd="2025-02-28"),
    "nonfinite": lambda d: d["series"][0]["observations"][0].update(value=float("nan")),
    "all_null": lambda d: [o.update(value=None,status="missing") for o in d["series"][0]["observations"]],
    "missing_zero": lambda d: d["series"][0]["observations"][0].update(value=0,status="missing"),
    "future_observation": lambda d: d["series"][0]["observations"][-1].update(periodEnd="2030-01-31"),
    "fake_release": lambda d: d["series"][0]["source"].update(releaseDate="2025-04-01"),
    "missing_guardrail": lambda d: d.update(interpretationGuardrail="AI caused this"),
    "false_missing_report": lambda d: d["series"][0].update(missingPeriods=["2025-02"]),
}
for name, mutation in MUTATIONS.items(): setattr(PipelineTests, "test_contract_" + name, dataset_mutation(name, mutation))


class RawAdapterTests(unittest.TestCase):
    def test_raw_bls_mutations_and_safe_gaps(self):
        cases = {
            "wrong_series": lambda j: j["Results"]["series"][0].update(seriesID="LNS99999999"),
            "duplicate_series": lambda j: j["Results"]["series"].append(j["Results"]["series"][0]),
            "empty_series": lambda j: j["Results"]["series"][0].update(data=[]),
            "schema": lambda j: j["Results"]["series"][0]["data"][0].pop("periodName"),
            "frequency": lambda j: j["Results"]["series"][0]["data"][0].update(period="Q01"),
            "value": lambda j: j["Results"]["series"][0]["data"][0].update(value="not a number"),
            "duplicate_month": lambda j: j["Results"]["series"][0]["data"].append(j["Results"]["series"][0]["data"][0]),
            "truncated_history": lambda j: [s.update(data=[o for o in s["data"] if o["period"] != "M01"]) for s in j["Results"]["series"]],
            "quota_warning": lambda j: j.update(message=["Request limit reached"]),
            "source_failure": lambda j: j.update(status="REQUEST_FAILED"),
        }
        for name, mutation in cases.items():
            with self.subTest(name=name), tempfile.TemporaryDirectory() as root:
                def bad(url, body=None):
                    j=json.loads(fixture_fetch(url,body));mutation(j);return canonical(j)
                h=capture(root,"cps",2025,2026,bad,STAMP)
                with self.assertRaises((SourceError, KeyError)): normalize(root,h)

    def test_missing_period_retained_and_reported(self):
        with tempfile.TemporaryDirectory() as root:
            def gap(url, body=None):
                j=json.loads(fixture_fetch(url,body));j["Results"]["series"][0]["data"]=[o for o in j["Results"]["series"][0]["data"] if o["period"]!="M02"];return canonical(j)
            d=normalize(root,capture(root,"cps",2025,2026,gap,STAMP))
            self.assertEqual(d["series"][0]["missingPeriods"],["2025-02"])

    def test_source_missing_marker_and_annual_average(self):
        with tempfile.TemporaryDirectory() as root:
            def missing(url, body=None):
                j=json.loads(fixture_fetch(url,body));s=j["Results"]["series"][0];s["data"][0].update(value="-",footnotes=[{"code":"9","text":"Data unavailable"}]);annual=copy.deepcopy(s["data"][0]);annual.update(period="M13",periodName="Annual",value="5.0");s["data"].append(annual);return canonical(j)
            d=normalize(root,capture(root,"cps",2025,2026,missing,STAMP));s=d["series"][0]
            self.assertEqual(len(s["observations"]),3);self.assertEqual(s["observations"][-1]["status"],"missing");self.assertIsNone(s["observations"][-1]["value"])

if __name__ == "__main__": unittest.main()
