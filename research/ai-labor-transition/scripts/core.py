"""Time, canonical bytes, immutable files and the schema subset used here."""
import calendar
import hashlib
import json
import math
import os
import re
import tempfile
from datetime import date, datetime, timezone
from pathlib import Path

class SourceError(ValueError):
    pass

def require(condition, message):
    if not condition:
        raise SourceError(message)

def canonical(value):
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2, allow_nan=False) + "\n").encode()

def sha256(value):
    return hashlib.sha256(value).hexdigest()

def iso_date(value):
    require(isinstance(value, str) and re.fullmatch(r"\d{4}-\d{2}-\d{2}", value), "Invalid calendar date")
    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise SourceError("Invalid calendar date") from exc

def timestamp(value):
    require(isinstance(value, str) and re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})", value), "Timestamp needs explicit timezone")
    try:
        result = datetime.fromisoformat(value.replace("Z", "+00:00"))
        iso_date(value[:10])
        return result
    except ValueError as exc:
        raise SourceError("Invalid timestamp") from exc

def now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")

def month_index(period):
    require(isinstance(period, str) and re.fullmatch(r"\d{4}-(0[1-9]|1[0-2])", period), "Invalid monthly period")
    year, month = map(int, period.split("-"))
    require(year >= 1900, "Unsupported year")
    return year * 12 + month - 1

def month_at(index):
    return f"{index // 12:04d}-{index % 12 + 1:02d}"

def month_bounds(period):
    month_index(period)
    y, m = map(int, period.split("-"))
    return f"{period}-01", f"{period}-{calendar.monthrange(y, m)[1]:02d}"

def write_atomic(path, value):
    path = Path(path); path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=path.parent)
    try:
        with os.fdopen(fd, "wb") as stream:
            stream.write(value)
        os.replace(tmp, path)
    finally:
        if os.path.exists(tmp): os.unlink(tmp)

def write_immutable(path, value):
    path = Path(path); path.parent.mkdir(parents=True, exist_ok=True)
    try:
        with path.open("xb") as stream: stream.write(value)
    except FileExistsError:
        require(path.read_bytes() == value, "Immutable artifact collision")

def validate_schema(value, schema, root=None, location="$"):
    """Fail closed on unsupported schema keywords; implements every keyword in our schema."""
    root = root or schema
    supported = {"$schema", "$id", "$defs", "$ref", "title", "description", "type", "properties", "required", "additionalProperties", "items", "enum", "pattern", "minimum", "maximum", "minItems", "minLength"}
    require(not set(schema) - supported, f"Unsupported schema keyword at {location}")
    if "$ref" in schema:
        target = root
        for key in schema["$ref"].removeprefix("#/").split("/"): target = target[key]
        return validate_schema(value, target, root, location)
    types = schema.get("type")
    if types:
        types = [types] if isinstance(types, str) else types
        checks = {"null": value is None, "object": isinstance(value, dict), "array": isinstance(value, list), "string": isinstance(value, str),
                  "boolean": isinstance(value, bool), "number": type(value) in (int, float) and math.isfinite(value), "integer": type(value) is int}
        require(any(checks[t] for t in types), f"Schema type at {location}")
    if "enum" in schema: require(value in schema["enum"], f"Schema enum at {location}")
    if isinstance(value, dict):
        require(set(schema.get("required", [])) <= set(value), f"Required fields at {location}")
        props = schema.get("properties", {})
        if schema.get("additionalProperties") is False: require(set(value) <= set(props), f"Unknown fields at {location}")
        for k, v in value.items():
            if k in props: validate_schema(v, props[k], root, location + "." + k)
    if isinstance(value, list):
        require(len(value) >= schema.get("minItems", 0), f"Too few items at {location}")
        if "items" in schema:
            for i, v in enumerate(value): validate_schema(v, schema["items"], root, f"{location}[{i}]")
    if isinstance(value, str):
        require(len(value) >= schema.get("minLength", 0), f"Empty string at {location}")
        if "pattern" in schema: require(re.search(schema["pattern"], value) is not None, f"Pattern at {location}")
    if type(value) in (int, float):
        if "minimum" in schema: require(value >= schema["minimum"], f"Minimum at {location}")
        if "maximum" in schema: require(value <= schema["maximum"], f"Maximum at {location}")
