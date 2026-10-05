"""Pinned source identities; exposure is deliberately absent from Phase 1."""

SCHEMA_VERSION = "ai-labor-observed-v1"
GUARDRAIL = "Observed labor-market changes are not attributed to AI. Age is not job seniority."
CONFOUNDERS = ["business cycle", "interest rates", "industry demand", "post-pandemic normalization",
               "offshoring", "restructuring", "demographics", "AI adoption", "other technology"]
BLS_API = "https://api.bls.gov/publicAPI/v2/timeseries/data/"
BTOS_BASE = "https://www.census.gov/hfp/btos/downloads/"
PROVIDERS = {
    "cps": {"publisher": "U.S. Bureau of Labor Statistics", "url": "https://www.bls.gov/cps/data.htm",
            "maxObservationAgeDays": 75, "releaseLag": "Monthly, normally early following month; API omits release dates",
            "revisionPolicy": "Seasonal revisions, population controls and source corrections; not final by default"},
    "ces": {"publisher": "U.S. Bureau of Labor Statistics", "url": "https://www.bls.gov/ces/",
            "maxObservationAgeDays": 75, "releaseLag": "Monthly, normally early following month; API omits release dates",
            "revisionPolicy": "Two ordinary monthly revisions, annual benchmark and seasonal revisions"},
    "jolts": {"publisher": "U.S. Bureau of Labor Statistics", "url": "https://www.bls.gov/jlt/",
              "maxObservationAgeDays": 110, "releaseLag": "Monthly, generally several weeks after reference month; API omits release dates",
              "revisionPolicy": "Preliminary latest release, subsequent monthly and annual revisions"},
    "btos": {"publisher": "U.S. Census Bureau", "url": "https://www.census.gov/hfp/btos/data_downloads",
             "maxObservationAgeDays": 60, "releaseLag": "Biweekly; use workbook publication and collection/reference dates",
             "revisionPolicy": "Revision status unknown unless comparing retained releases; corrections and sample/content changes possible"},
}

def spec(provider, identifier, title, metric, unit, denominator, population, age=None, industry=None):
    return {"provider": provider, "id": identifier, "title": title, "metric": metric, "unit": unit,
            "frequency": "monthly", "seasonalAdjustment": "SA", "denominator": denominator,
            "population": population, "ageBand": age, "sex": "all", "geography": "US_50_STATES_DC",
            "industry": industry, "occupation": None, "evidenceType": "OBSERVED_LABOR_MARKET"}

SERIES = []
for suffix, label, age in [("00", "16 years and over", {"min": 16, "max": None}),
                           ("36", "20–24 years", {"min": 20, "max": 24}),
                           ("89", "25–34 years", {"min": 25, "max": 34}),
                           ("60", "25–54 years", {"min": 25, "max": 54})]:
    for prefix, metric, title, denominator in [
        ("140", "unemployment_rate", "Unemployment rate", "civilian labor force in stated age band"),
        ("123", "employment_population_ratio", "Employment-population ratio", "civilian noninstitutional population in stated age band"),
        ("113", "participation_rate", "Labor-force participation rate", "civilian noninstitutional population in stated age band")]:
        SERIES.append(spec("cps", f"LNS{prefix}000{suffix}", f"{title}, {label}", metric, "percent",
                           denominator, "civilian noninstitutional population", age))
SERIES += [
    spec("ces", "CES0000000001", "Total nonfarm payroll employment", "payroll_employment", "thousand_jobs", "payroll jobs", "all nonfarm payroll employees"),
    spec("ces", "CES0500000002", "Average weekly hours, total private", "average_weekly_hours", "hours_per_week", "all employees on private nonfarm payrolls", "private nonfarm payroll employees"),
    spec("ces", "CES0500000003", "Average hourly earnings, total private", "average_hourly_earnings", "USD_per_hour_nominal", "all employees on private nonfarm payrolls", "private nonfarm payroll employees"),
]
for identifier, label, ces_code, naics in [("CES5000000001", "Information", "50", "51"),
                                          ("CES5500000001", "Financial activities", "55", ["52", "53"]),
                                          ("CES6000000001", "Professional and business services", "60", ["54", "55", "56"])]:
    SERIES.append(spec("ces", identifier, f"Payroll employment, {label}", "payroll_employment", "thousand_jobs", "payroll jobs", "nonfarm payroll employees",
                       industry={"title": label, "cesSupersector": ces_code, "naicsCodes": naics, "naicsVersion": "2022"}))
for code, metric, title, rate_denominator in [
    ("HI", "hires", "Hires", "payroll employment"), ("JO", "openings", "Job openings", "payroll employment plus job openings"),
    ("LD", "layoffs_discharges", "Layoffs and discharges", "payroll employment"), ("QU", "quits", "Quits", "payroll employment")]:
    for tail, unit in [("L", "thousand_jobs"), ("R", "percent")]:
        SERIES.append(spec("jolts", f"JTS000000000000000{code}{tail}", f"{title}, total nonfarm, {'level' if tail == 'L' else 'rate'}",
                           metric + ("_level" if tail == "L" else "_rate"), unit,
                           "jobs (openings stock; other metrics monthly flows)" if tail == "L" else rate_denominator, "total nonfarm establishments"))
BY_ID = {s["id"]: s for s in SERIES}

BTOS_QUESTIONS = {
    "original": {"phrase": "in producing goods or services", "first": "202319", "last": "202520"},
    "business_functions": {"phrase": "in any of its business functions", "first": "202524", "last": None},
}
def question_text(version, question):
    phrase = BTOS_QUESTIONS[version]["phrase"]
    lead = "In the last two weeks, did this business use" if question == "7" else "During the next six months, do you think this business will be using"
    return f"{lead} Artificial Intelligence (AI) {phrase}? (Examples of AI: machine learning, natural language processing, virtual agents, voice recognition, etc.)"

BTOS_FILES = {"current": BTOS_BASE + "National.xlsx", "original": BTOS_BASE + "AI%20Core%20Questions.xlsx"}
BTOS_METHOD = BTOS_BASE + "methodology/Business_Trends_and_Outlook_Survey_Methodology_V6.pdf"
BTOS_BREAK = BTOS_BASE + "AI%20Question%20Wording%20Updates.pdf"
LICENSE = "Official U.S. federal statistical data; attribution requested. No confidential microdata or third-party content is redistributed."
