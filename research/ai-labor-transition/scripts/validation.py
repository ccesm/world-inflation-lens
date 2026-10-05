"""Schema plus pinned source semantics; no self-declared units/age identities."""
import json
import re
from pathlib import Path
from catalog import SCHEMA_VERSION, GUARDRAIL, CONFOUNDERS, BY_ID, SERIES, PROVIDERS, BTOS_FILES, BTOS_QUESTIONS, question_text, LICENSE, BLS_API
from core import require, validate_schema, timestamp, iso_date, month_index, month_at, month_bounds

SCHEMA = json.loads((Path(__file__).resolve().parent.parent / "schemas/dataset.schema.json").read_text())

def validate_dataset(dataset):
    validate_schema(dataset, SCHEMA)
    require(dataset["interpretationGuardrail"] == GUARDRAIL and dataset["confounders"] == CONFOUNDERS, "Missing attribution guardrail")
    provider = dataset["provider"]
    ids = [s["id"] for s in dataset["series"]]
    expected = {s["id"] for s in SERIES if s["provider"] == provider} if provider != "btos" else {
        f"BTOS_AI_{kind}_{version.upper()}" for kind in ("CURRENT", "EXPECTED") for version in BTOS_QUESTIONS}
    require(len(ids) == len(set(ids)) and set(ids) == expected, "Dataset series coverage/identity")
    for series in dataset["series"]:
        source = series["source"]
        require(source["publisher"] == PROVIDERS[provider]["publisher"] and source["url"] == PROVIDERS[provider]["url"], "Source provenance changed")
        require(source["revisionPolicy"] == PROVIDERS[provider]["revisionPolicy"] and source["license"] == LICENSE, "Source policy changed")
        retrieved = timestamp(source["retrievedAt"]).date()
        if source["releaseDate"]: require(iso_date(source["releaseDate"]) <= retrieved, "Future source release")
        if provider != "btos":
            definition = BY_ID[series["id"]]
            require(all(series[k] == v for k, v in definition.items() if k != "provider"), "Pinned units/frequency/subgroup/definition changed")
            require(source["apiEndpoint"] == BLS_API and source["seriesId"] == series["id"] and source["tableId"] is None, "BLS identity provenance")
            require(source["releaseDate"] is None, "BLS API does not prove publication date")
        else:
            question = series.get("question", {})
            version = question.get("wordingVersion"); q = question.get("id")
            require(version in BTOS_QUESTIONS and q in ("7", "24"), "BTOS question identity")
            require(question.get("text") == question_text(version, q), "BTOS wording provenance")
            require(question.get("responseCategories") == ["Yes", "No", "Do not know"], "BTOS categories")
            require(series["unit"] == "percent" and series["frequency"] == "biweekly" and series["seasonalAdjustment"] == "NSA", "BTOS units/frequency")
            require(series["ageBand"] is None and series["industry"] is None and series["occupation"] is None, "BTOS unsupported subgroup")
            require(series["evidenceType"] == ("OBSERVED_AI_ADOPTION_CONTEXT" if q == "7" else "SURVEY_EXPECTATION_CONTEXT"), "Expected use relabeled as adoption")
        periods = [o["period"] for o in series["observations"]]
        require(periods == sorted(set(periods)), "Periods not strictly ordered or duplicate")
        require(any(o["value"] is not None for o in series["observations"]), "All-null series")
        for o in series["observations"]:
            require(iso_date(o["periodStart"]) <= iso_date(o["periodEnd"]) <= retrieved, "Observation dates")
            require((o["value"] is None) == (o["status"] != "official"), "Missing observation mislabeled")
            if o["value"] is not None:
                require(o["value"] >= 0 and (series["unit"] != "percent" or o["value"] <= 100), "Invalid economic value")
            if o["releaseDate"]: require(iso_date(o["periodEnd"]) <= iso_date(o["releaseDate"]) <= retrieved, "Observation release chronology")
            if provider != "btos":
                require((o["periodStart"], o["periodEnd"]) == month_bounds(o["period"]), "Month semantics changed")
                require(o["collectionStart"] is None and o["collectionEnd"] is None and o["releaseDate"] is None and o["responseShares"] is None, "Fabricated BLS metadata")
            else:
                require(re.fullmatch(r"\d{4}(0[1-9]|1\d|2[0-6])", o["period"]), "BTOS period ID")
                rule = BTOS_QUESTIONS[version]
                require(o["period"] >= rule["first"] and (rule["last"] is None or o["period"] <= rule["last"]), "Wording boundary")
                require(iso_date(o["periodEnd"]) < iso_date(o["collectionStart"]) <= iso_date(o["collectionEnd"]) <= retrieved, "BTOS window chronology")
                if o["releaseDate"]: require(o["collectionEnd"] <= o["releaseDate"], "BTOS publication before collection")
                require(o["standardError"] is None or o["standardError"] >= 0, "BTOS standard error")
                require(isinstance(o["responseShares"], dict) and set(o["responseShares"]) == {"yes", "no", "do_not_know"}, "BTOS denominator evidence")
                require(o["responseShares"]["yes"] == o["value"], "BTOS yes share mismatch")
        if provider != "btos":
            expected_missing = [month_at(i) for i in range(month_index(periods[0]), month_index(periods[-1]) + 1) if month_at(i) not in periods]
            require(series["missingPeriods"] == expected_missing, "Missing-period report false")
    return True
