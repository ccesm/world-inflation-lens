"""Official API only. Units/denominators are bound to the reviewed registry, not guessed."""
import copy
import json
import re
from catalog import BY_ID, SERIES, PROVIDERS, BLS_API, LICENSE
from core import require, month_index, month_bounds, month_at, iso_date

def requests_for(provider, start_year, end_year):
    require(provider in ("cps", "ces", "jolts"), "Unknown BLS program")
    require(2015 <= start_year <= end_year <= 2100, "Invalid history range")
    ids = [s["id"] for s in SERIES if s["provider"] == provider]
    # Unregistered API: <=20 series/request and <=10 years. No secret needed.
    return [{"url": BLS_API, "body": {"seriesid": ids, "startyear": str(y), "endyear": str(min(y + 9, end_year))}}
            for y in range(start_year, end_year + 1, 10)]

def normalize_bls(provider, raw_files, manifest):
    expected = [s for s in SERIES if s["provider"] == provider]
    by_id = {s["id"]: [] for s in expected}
    for raw, entry in zip(raw_files, manifest["files"], strict=True):
        obj = json.loads(raw)
        require(obj.get("status") == "REQUEST_SUCCEEDED", "BLS request failed")
        # Warnings about omitted/truncated years or exhausted quotas are not success.
        allowed = {f"Unable to get Catalog Data for series {s['id']}" for s in expected}
        require(isinstance(obj.get("message"), list) and all(m in allowed for m in obj["message"]), "BLS returned a warning; review before accepting")
        rows = obj.get("Results", {}).get("series")
        require(isinstance(rows, list) and len(rows) == len(expected), "BLS series coverage changed")
        found = [r.get("seriesID") for r in rows]
        require(len(set(found)) == len(found) and set(found) == set(by_id), "BLS series identity changed")
        start = int(entry["request"]["body"]["startyear"]); end = int(entry["request"]["body"]["endyear"])
        for row in rows:
            identifier = row["seriesID"]
            require(isinstance(row.get("data"), list) and row["data"], "BLS empty series")
            for cell in row["data"]:
                require(set(["year", "period", "periodName", "value", "footnotes"]) <= set(cell), "BLS observation schema changed")
                require(re.fullmatch(r"\d{4}", cell["year"]) is not None, "Invalid BLS year")
                require(start <= int(cell["year"]) <= end, "BLS returned out-of-request year")
                if cell["period"] == "M13": continue  # Annual averages are not monthly observations.
                require(re.fullmatch(r"M(0[1-9]|1[0-2])", cell["period"]) is not None, "Nonmonthly BLS period")
                period = cell["year"] + "-" + cell["period"][1:]
                beginning, ending = month_bounds(period)
                require(iso_date(ending) <= iso_date(manifest["retrievedAt"][:10]), "Future BLS observation")
                text = cell["value"]
                require(isinstance(text, str), "BLS value must be source text")
                missing = text in ("-", ".", "")
                require(missing or re.fullmatch(r"-?\d+(?:\.\d+)?", text) is not None, "Invalid BLS value")
                value = None if missing else float(text)
                notes = cell["footnotes"]
                require(isinstance(notes, list) and all(isinstance(n, dict) and set(n) <= {"code", "text"} for n in notes), "BLS footnote schema changed")
                notes = sorted([n for n in notes if n], key=lambda n: (n.get("code", ""), n.get("text", "")))
                combined = " ".join(n.get("text", "").lower() for n in notes)
                revision = "preliminary" if any(n.get("code") == "P" for n in notes) or "preliminary" in combined else ("revised" if "revised" in combined else "revision_unknown")
                by_id[identifier].append({"period": period, "periodStart": beginning, "periodEnd": ending, "value": value,
                                          "status": "missing" if missing else "official", "revisionStatus": revision,
                                          "releaseDate": None, "standardError": None, "footnotes": notes,
                                          "collectionStart": None, "collectionEnd": None, "responseShares": None})
    result = []
    for definition in expected:
        series = copy.deepcopy(definition); series.pop("provider")
        obs = sorted(by_id[series["id"]], key=lambda p: p["period"])
        periods = [p["period"] for p in obs]
        require(len(periods) == len(set(periods)), "Duplicate BLS month")
        require(periods and periods[0] == manifest["startPeriod"], "BLS history truncated")
        missing = [month_at(i) for i in range(month_index(periods[0]), month_index(periods[-1]) + 1) if month_at(i) not in periods]
        source = PROVIDERS[provider]
        series.update({"source": {"publisher": source["publisher"], "url": source["url"], "apiEndpoint": BLS_API,
                                  "seriesId": series["id"], "tableId": None, "retrievedAt": manifest["retrievedAt"],
                                  "releaseDate": None, "releaseDateBasis": "Not supplied by BLS time-series API; retrieval is not release",
                                  "rawSha256": [e["rawSha256"] for e in manifest["files"]], "license": LICENSE,
                                  "revisionPolicy": source["revisionPolicy"]},
                       "observations": obs, "missingPeriods": missing,
                       "limitations": ["Current-vintage history, not real-time replay", "No causal AI attribution",
                                         "API omits cell sample size and uncertainty" if provider == "cps" else "Jobs are not unique people"]})
        if provider == "cps": series["limitations"].append("Age is not seniority; subgroup monthly volatility and population-control breaks remain")
        result.append(series)
    return result
