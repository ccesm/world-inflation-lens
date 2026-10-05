"""Read official XLSX directly with stdlib, including source-native date tables."""
import copy
import io
import posixpath
import re
import zipfile
import xml.etree.ElementTree as ET
from datetime import date, timedelta
from catalog import BTOS_QUESTIONS, BTOS_FILES, BTOS_METHOD, BTOS_BREAK, PROVIDERS, LICENSE, question_text
from core import require, iso_date, SourceError

NS = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
REL = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"

def read_workbook(raw):
    require(raw[:2] == b"PK", "BTOS download is not XLSX")
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        require(sum(i.file_size for i in archive.infolist()) < 80_000_000, "Workbook too large")
        strings = []
        if "xl/sharedStrings.xml" in archive.namelist():
            strings = ["".join(node.itertext()) for node in ET.fromstring(archive.read("xl/sharedStrings.xml"))]
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        require(workbook.find("s:workbookPr", NS) is None or workbook.find("s:workbookPr", NS).get("date1904") not in ("1", "true"), "Unsupported Excel date epoch")
        rels = {r.get("Id"): r.get("Target") for r in ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))}
        output = {}
        for sheet in workbook.findall("s:sheets/s:sheet", NS):
            name = sheet.get("name")
            if name not in ("Response Estimates", "Response Standard Errors", "National Estimates", "National SE", "Collection and Reference Dates"): continue
            target = rels[sheet.get(REL)]
            target = target.lstrip("/") if target.startswith("/") else posixpath.normpath(posixpath.join("xl", target))
            require(target.startswith("xl/worksheets/") and ".." not in target, "Invalid workbook relationship")
            rows = []
            for row in ET.fromstring(archive.read(target)).findall("s:sheetData/s:row", NS):
                values = {}
                for cell in row:
                    ref = cell.get("r"); require(ref and re.fullmatch(r"[A-Z]+\d+", ref), "Invalid cell reference")
                    key = re.sub(r"\d", "", ref)
                    require(key not in values, "Duplicate workbook cell")
                    require(cell.find("s:f", NS) is None, "Formula in source table requires review")
                    v = cell.find("s:v", NS); inline = cell.find("s:is", NS)
                    text = "".join(inline.itertext()) if inline is not None else (v.text if v is not None else "")
                    if cell.get("t") == "s": text = strings[int(text)]
                    values[key] = text or ""
                rows.append(values)
            require(name not in output, "Duplicate workbook sheet")
            output[name] = rows
        return output

def source_date(value):
    if re.fullmatch(r"\d+(?:\.0)?", value):
        return (date(1899, 12, 30) + timedelta(days=int(float(value)))).isoformat()
    if re.fullmatch(r"\d{2}/\d{2}/\d{4}", value):
        m, d, y = value.split("/"); value = f"{y}-{m}-{d}"
    return iso_date(value).isoformat()

def read_dates(rows):
    require(rows, "Missing BTOS dates")
    header = rows[0]
    # Two official workbook formats, not a fuzzy header guess.
    aliases = {"Smpdt": "period", "Collection Start": "collectionStart", "Col Start": "collectionStart", "Col End": "collectionEnd",
               "Reference Period Start": "periodStart", "Ref Start": "periodStart", "Ref End": "periodEnd", "Publication Date": "releaseDate"}
    columns = {v: k for k, label in header.items() if (v := aliases.get(label))}
    require({"period", "collectionStart", "collectionEnd", "periodStart", "periodEnd"} <= set(columns), "BTOS dates schema changed")
    result = {}
    for row in rows[1:]:
        period = row.get(columns["period"], "")
        if not period: continue  # Other rows may be sample-year explanatory headings.
        if period.startswith("Source: U.S. Census Bureau, Business Trends and Outlook Survey (BTOS)") and all(not v for k, v in row.items() if k != columns["period"]):
            continue  # Official archive's single-cell attribution footer, not a date row.
        require(re.fullmatch(r"\d{4}(0[1-9]|1\d|2[0-6])", period), "Invalid BTOS period ID")
        require(period not in result, "Duplicate BTOS date period")
        record = {key: source_date(row[columns[key]]) for key in columns if key != "period" and row.get(columns[key])}
        require({"periodStart", "periodEnd", "collectionStart", "collectionEnd"} <= set(record), "Incomplete BTOS date row")
        require(record["periodStart"] <= record["periodEnd"] < record["collectionStart"] <= record["collectionEnd"], "Contradictory BTOS dates")
        if "releaseDate" in record: require(record["releaseDate"] >= record["collectionEnd"], "Publication before collection closes")
        record.setdefault("releaseDate", None)
        result[period] = record
    return result

def percentage(text):
    if text in ("S", ".", "", "-"): return None
    require(re.fullmatch(r"\d+(?:\.\d+)?%", text) is not None, "BTOS percentage units changed")
    value = float(text[:-1]); require(0 <= value <= 100, "Invalid BTOS percentage")
    return value

def normalize_btos(raw_files, manifest):
    require(len(raw_files) == 2, "Both BTOS wording histories required")
    result = []
    for raw, entry in zip(raw_files, manifest["files"], strict=True):
        version = "business_functions" if entry["role"] == "current" else "original"
        workbook = read_workbook(raw)
        names = ("Response Estimates", "Response Standard Errors") if version == "business_functions" else ("National Estimates", "National SE")
        require(set(names) | {"Collection and Reference Dates"} <= set(workbook), "BTOS sheets changed")
        estimates, errors = [workbook[n] for n in names]
        require(estimates[0] == errors[0], "BTOS estimate/error periods mismatch")
        header = estimates[0]
        require([header.get(c) for c in ("A", "B", "C", "D")] == ["Question ID", "Question", "Answer ID", "Answer"], "BTOS response schema changed")
        columns = {k: v for k, v in header.items() if k not in ("A", "B", "C", "D")}
        require(columns and all(re.fullmatch(r"\d{4}(0[1-9]|1\d|2[0-6])", v) for v in columns.values()), "BTOS period columns changed")
        require(len(set(columns.values())) == len(columns), "Duplicate BTOS period column")
        dates = read_dates(workbook["Collection and Reference Dates"])
        rules = BTOS_QUESTIONS[version]
        for question in ("7", "24"):
            wanted = [r for r in estimates[1:] if r.get("A") == question]
            se = [r for r in errors[1:] if r.get("A") == question]
            require(len(wanted) == len(se) == 3, "BTOS AI response categories missing")
            for group in (wanted, se):
                require({(r.get("C"), r.get("D")) for r in group} == {("1", "Yes"), ("2", "No"), ("3", "Do not know")}, "BTOS categories changed")
                require(all(" ".join(r.get("B", "").split()) == question_text(version, question) for r in group), "BTOS question wording changed")
            responses = {r["C"]: r for r in wanted}; standard_errors = {r["C"]: r for r in se}
            observations = []
            for column, period in columns.items():
                if period < rules["first"] or (rules["last"] and period > rules["last"]):
                    require(all(responses[a].get(column, "") in ("", ".") for a in responses), "Out-of-version AI value")
                    continue
                require(period in dates, "Missing BTOS date mapping")
                timing = dates[period]
                require(timing["collectionEnd"] <= manifest["retrievedAt"][:10], "Future BTOS collection")
                require(timing["releaseDate"] is None or timing["releaseDate"] <= manifest["retrievedAt"][:10], "Future BTOS release")
                shares = {label: percentage(responses[a].get(column, "")) for a, label in [("1", "yes"), ("2", "no"), ("3", "do_not_know")]}
                if all(v is not None for v in shares.values()): require(abs(sum(shares.values()) - 100) <= 0.21, "BTOS category denominator changed")
                value = shares["yes"]; text = responses["1"].get(column, "")
                observations.append({"period": period, **timing, "value": value, "standardError": percentage(standard_errors["1"].get(column, "")),
                                     "status": "suppressed" if text == "S" else ("missing" if value is None else "official"),
                                     "revisionStatus": "revision_unknown", "footnotes": [], "responseShares": shares})
            observations.sort(key=lambda o: o["period"])
            require(observations and observations[0]["period"] == rules["first"], "BTOS history truncated")
            available = {o["period"] for o in observations}
            first_index = int(observations[0]["period"][:4]) * 26 + int(observations[0]["period"][4:]) - 1
            last_index = int(observations[-1]["period"][:4]) * 26 + int(observations[-1]["period"][4:]) - 1
            missing_periods = [f"{i // 26:04d}{i % 26 + 1:02d}" for i in range(first_index, last_index + 1) if f"{i // 26:04d}{i % 26 + 1:02d}" not in available]
            source = PROVIDERS["btos"]
            result.append({"id": f"BTOS_AI_{'CURRENT' if question == '7' else 'EXPECTED'}_{version.upper()}",
                           "title": "Business reported AI use" if question == "7" else "Business expected AI use within six months",
                           "metric": "business_ai_use" if question == "7" else "business_expected_ai_use", "unit": "percent",
                           "frequency": "biweekly", "seasonalAdjustment": "NSA", "denominator": "weighted in-scope employer businesses, including do-not-know responses",
                           "population": "BTOS in-scope employer businesses; single- and multi-location; published scope exclusions apply",
                           "geography": "US_DC_PUERTO_RICO_BTOS_SCOPE", "sex": "not_applicable", "ageBand": None, "industry": None, "occupation": None,
                           "evidenceType": "OBSERVED_AI_ADOPTION_CONTEXT" if question == "7" else "SURVEY_EXPECTATION_CONTEXT",
                           "question": {"id": question, "wordingVersion": version, "text": question_text(version, question),
                                        "responseCategories": ["Yes", "No", "Do not know"], "weighting": "Design weights with nonresponse adjustment; not worker/task/employment weighted",
                                        "methodologyUrl": BTOS_METHOD, "breakDocumentationUrl": BTOS_BREAK},
                           "source": {"publisher": source["publisher"], "url": source["url"], "apiEndpoint": None, "seriesId": None,
                                      "tableId": f"{names[0]}/Question {question}/Answer 1", "retrievedAt": manifest["retrievedAt"],
                                      "releaseDate": observations[-1]["releaseDate"], "releaseDateBasis": "Workbook dates; original AI archive supplies no publication date",
                                      "rawSha256": [entry["rawSha256"]], "license": LICENSE, "revisionPolicy": source["revisionPolicy"]},
                           "observations": observations, "missingPeriods": missing_periods,
                           "limitations": ["Wording histories are not spliced", "Expected use is an intention, not realized future adoption", "No causal AI attribution", "Collection and reference windows are different"]})
    return result
