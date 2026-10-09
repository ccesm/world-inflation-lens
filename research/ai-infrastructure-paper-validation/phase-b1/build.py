"""Offline B1 funding bridges. USD integers, exact native periods, explicit vintage.

Reuses immutable Phase A SEC snapshots. No network, clock, balancing plug,
accepted-data promotion, or production write.
"""
import csv
import datetime as dt
import gzip
import hashlib
import json
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
A = ROOT.parent / 'phase-a'
BASE = 'b90080dd9f94cee2afa6d94f17467bab0d46649f'
AS_OF = '2026-10-08'
VERSION = 'b1.1'
CIKS = {'oracle': 1341439, 'amazon': 1018724}
# Explicit aliases are permitted only for compatible concepts. If two aliases
# disclose different values for the exact context, extraction fails closed.
FLOW = {
    'ocf': ['NetCashProvidedByUsedInOperatingActivities'],
    'investing_cf': ['NetCashProvidedByUsedInInvestingActivities'],
    'financing_cf': ['NetCashProvidedByUsedInFinancingActivities'],
    'fx': ['EffectOfExchangeRateOnCashCashEquivalentsRestrictedCashAndRestrictedCashEquivalentsIncludingDisposalGroupAndDiscontinuedOperations'],
    'reported_cash_change': ['CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalentsPeriodIncreaseDecreaseIncludingExchangeRateEffect'],
    'revenue': ['RevenueFromContractWithCustomerExcludingAssessedTax', 'Revenues'],
    'operating_income': ['OperatingIncomeLoss'],
    'finance_lease_principal': ['FinanceLeasePrincipalPayments'],
    'finance_lease_noncash_additions': ['RightOfUseAssetObtainedInExchangeForFinanceLeaseLiability'],
    'finance_lease_interest': ['FinanceLeaseInterestExpense'],
    'buybacks': ['PaymentsForRepurchaseOfCommonStock'],
    'cash_common_dividends': ['PaymentsOfDividendsCommonStock'],
    'cash_preferred_dividends': ['DividendsPreferredStockCash'],
    'customer_prepayments_rounded_note': ['ProceedsFromDepositsFromCustomers'],
    'deferred_revenue_cf_adjustment': ['IncreaseDecreaseInContractWithCustomerLiability'],
}
STOCK = {
    'cash': ['CashAndCashEquivalentsAtCarryingValue'],
    'deferred_revenue': ['ContractWithCustomerLiability'],
    'finance_lease_liability': ['FinanceLeaseLiability'],
    'finance_lease_current': ['FinanceLeaseLiabilityCurrent'],
    'finance_lease_noncurrent': ['FinanceLeaseLiabilityNoncurrent'],
    'operating_lease_liability': ['OperatingLeaseLiability'],
    'debt_next_12m_principal': ['LongTermDebtMaturitiesRepaymentsOfPrincipalInNextTwelveMonths'],
    'debt_year2_principal': ['LongTermDebtMaturitiesRepaymentsOfPrincipalInYearTwo'],
    'debt_year3_principal': ['LongTermDebtMaturitiesRepaymentsOfPrincipalInYearThree'],
    'debt_year4_principal': ['LongTermDebtMaturitiesRepaymentsOfPrincipalInYearFour'],
    'debt_year5_principal': ['LongTermDebtMaturitiesRepaymentsOfPrincipalInYearFive'],
    'debt_after5_principal': ['LongTermDebtMaturitiesRepaymentsOfPrincipalAfterYearFive'],
    'finance_lease_payments_total': ['FinanceLeaseLiabilityPaymentsDue'],
    'finance_lease_payments_next_12m': ['FinanceLeaseLiabilityPaymentsDueNextTwelveMonths'],
    'operating_lease_payments_total': ['LesseeOperatingLeaseLiabilityPaymentsDue'],
    'operating_lease_payments_next_12m': ['LesseeOperatingLeaseLiabilityPaymentsDueNextTwelveMonths'],
    'purchase_obligations_total': ['UnrecordedUnconditionalPurchaseObligationBalanceSheetAmount'],
    'purchase_obligations_next_fiscal_year': ['UnrecordedUnconditionalPurchaseObligationBalanceOnFirstAnniversary'],
}
COMPANY = {
    'oracle': {
        'flow': {'cash_capex': ['PaymentsToAcquirePropertyPlantAndEquipment'],
                 'cash_common_dividends': [],
                 'cash_stockholder_dividends': ['PaymentsOfDividendsCommonStock'],
                 'acquisitions_net_of_cash': ['PaymentsToAcquireBusinessesNetOfCashAcquired'],
                 'debt_proceeds': ['ProceedsFromIssuanceOfSeniorLongTermDebt', 'ProceedsFromIssuanceOfLongTermDebt'],
                 'debt_repayments': ['RepaymentsOfDebt'],
                 'commercial_paper_net': ['ProceedsFromRepaymentsOfCommercialPaper'],
                 'common_equity_proceeds': ['ProceedsFromIssuanceOfCommonStock'],
                 'preferred_equity_proceeds': ['ProceedsFromIssuanceOfConvertiblePreferredStock'],
                 'interest_expense': ['InterestExpense']},
        'stock': {'debt': ['DebtLongtermAndShorttermCombinedAmount'],
                  'borrowings_current': ['DebtCurrent'], 'borrowings_noncurrent': ['LongTermDebtNoncurrent'],
                  'short_term_investments': ['AvailableForSaleSecuritiesDebtSecuritiesCurrent'],
                  'combined_cash': ['CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalentsIncludingDisposalGroupAndDiscontinuedOperations']},
        'debt_definition': 'Reported current and noncurrent borrowings carrying amount; finance/operating lease liabilities separate',
    },
    'amazon': {
        'flow': {'cash_capex': ['PaymentsToAcquireProductiveAssets'],
                 'debt_proceeds': ['ProceedsFromIssuanceOfLongTermDebt'],
                 'debt_repayments': ['RepaymentsOfLongTermDebt'],
                 'short_term_proceeds_and_other': ['ProceedsFromShortTermDebt'],
                 'short_term_repayments_and_other': ['RepaymentsOfShortTermDebt'],
                 'interest_expense': ['InterestExpenseNonoperating', 'InterestExpense']},
        'stock': {'long_term_debt_face': ['LongTermDebt'], 'long_term_debt_current_carrying': ['LongTermDebtCurrent'],
                  'long_term_debt_noncurrent_carrying': ['LongTermDebtNoncurrent'], 'short_term_borrowings': ['ShortTermBorrowings'],
                  'short_term_investments': ['MarketableSecuritiesCurrent'],
                  'combined_cash': ['CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents']},
        'debt_definition': 'Current + noncurrent long-term debt carrying amounts + separately reported short-term borrowings; face value retained separately; leases/financing obligations excluded',
    },
}


def sha(b):
    return hashlib.sha256(b).hexdigest()


def dump(name, data):
    (ROOT / name).write_text(json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True) + '\n')


def total(*values):
    return None if any(v is None for v in values) else sum(values)


def divide(a, b):
    return None if a is None or b is None or b <= 0 else a / b


def measurement_kind(metric, duration):
    if 'payments_total' in metric or 'payments_next_12m' in metric or 'principal' in metric and metric.startswith('debt_') or metric.startswith('purchase_obligations'):
        return 'FUTURE_COMMITMENT'
    if metric == 'finance_lease_noncash_additions':
        return 'NONCASH_ADDITION'
    if metric in ('revenue', 'operating_income', 'interest_expense', 'finance_lease_interest'):
        return 'INCOME_STATEMENT'
    if metric == 'deferred_revenue_cf_adjustment':
        return 'INDIRECT_CASH_FLOW_ADJUSTMENT_NOT_CASH_RECEIPTS'
    return 'CASH_FLOW' if duration else 'BALANCE_SHEET_STOCK'


def validate_extracts(data):
    sources = {s['source_id']: s for s in data['sources']}
    if len(sources) != len(data['sources']):
        raise ValueError('Duplicate source')
    seen = set()
    for source in sources.values():
        url = urlparse(source['public_url'])
        if url.scheme != 'https' or url.hostname not in ('www.sec.gov', 'investor.oracle.com') or url.username or url.password:
            raise ValueError('Unofficial source')
        if source['publication_date'] > AS_OF:
            raise ValueError('Future disclosure')
    for row in data['observations']:
        source = sources.get(row['source_id'])
        if source is None or source['company'] != row['company']:
            raise ValueError('Source/issuer mismatch')
        if row['source_url'] != source['public_url'] or row['publication_date'] != source['publication_date']:
            raise ValueError('Provenance mismatch')
        if row['start'] > row['end'] or row['end'] > row['publication_date']:
            raise ValueError('Invalid economic/publication period')
        if row['vintage_policy'] not in ('ORIGINAL', 'EARLIER_OFFICIAL_RELEASE_SEPARATE'):
            raise ValueError('Unqualified vintage policy')
        if row['value_million'] is None or not isinstance(row['value_million'], (int, float)):
            raise ValueError('Missing values must not become extracted observations')
        key = (row['company'], row['start'], row['end'], row['metric'], row['source_id'])
        if key in seen:
            raise ValueError('Duplicate extract')
        seen.add(key)


def extract(us, tags, start, end, accession):
    candidates = [(tag, r) for tag in tags for r in us.get(tag, {}).get('units', {}).get('USD', [])
                  if r['accn'] == accession and r.get('start') == start and r['end'] == end
                  and r['filed'] <= AS_OF]
    values = {r['val'] for _, r in candidates}
    if len(values) > 1:
        return None, 'CONFLICT_REQUIRES_REVIEW', candidates
    if not candidates:
        return None, 'UNAVAILABLE', []
    return candidates[0][1]['val'], 'PRIMARY_XBRL_VERIFIED', candidates


def periods(us, company):
    out = []
    for y in range(2023, 2027 if company == 'oracle' else 2026):
        s, e = (f'{y-1}-06-01', f'{y}-05-31') if company == 'oracle' else (f'{y}-01-01', f'{y}-12-31')
        out.append((f'FY{y}' if company == 'oracle' else f'CY{y}', s, e, 'NATIVE_FISCAL_YEAR' if company == 'oracle' else 'CALENDAR_YEAR', '10-K'))
    out.append(('FY2027Q1', '2026-06-01', '2026-08-31', 'NATIVE_FISCAL_QUARTER', '10-Q') if company == 'oracle'
               else ('2026H1', '2026-01-01', '2026-06-30', 'CALENDAR_HALF_YEAR', '10-Q'))
    selected = []
    for label, s, e, basis, form in out:
        matches = [r for r in us['NetCashProvidedByUsedInOperatingActivities']['units']['USD']
                   if r.get('start') == s and r['end'] == e and r['form'] == form and r['filed'] <= AS_OF]
        if not matches:
            raise ValueError(f'Missing original filing anchor {company} {label}')
        r = min(matches, key=lambda x: (x['filed'], x['accn']))
        selected.append({'company': company, 'label': label, 'start': s, 'end': e, 'basis': basis,
                         'accession': r['accn'], 'filed': r['filed'], 'form': form,
                         'cohort': 'HISTORICAL_2023_2025' if label[-4:] in ('2023', '2024', '2025') else 'SEPARATE_2026_OBSERVATION',
                         'annualized': False})
    return selected


def build():
    locked = json.loads((ROOT / 'phase-a-input-lock.json').read_text())
    if locked['base_commit'] != BASE:
        raise ValueError('Wrong Phase A base')
    for name, expected in locked['files'].items():
        if sha((A / name).read_bytes()) != expected:
            raise ValueError('Phase A input lock mismatch')
    input_register = json.loads((A / 'source-register.json').read_text())
    captures = {x['company']: x for x in input_register['sources']}
    supplemental = json.loads((ROOT / 'primary-extracts.json').read_text())
    validate_extracts(supplemental)
    rows, bridges, revisions, docs, summaries = [], [], [], {}, []
    for company in ('oracle', 'amazon'):
        p = A / captures[company]['path']
        if sha(p.read_bytes()) != captures[company]['captured_sha256'] or sha(gzip.decompress(p.read_bytes())) != captures[company]['raw_sha256']:
            raise ValueError('Phase A immutable raw identity mismatch')
        us = json.loads(gzip.decompress(p.read_bytes()))['facts']['us-gaap']
        for period in periods(us, company):
            s, e, acc = period['start'], period['end'], period['accession']
            source_id = company + ':' + acc
            url = f'https://www.sec.gov/Archives/edgar/data/{CIKS[company]}/{acc.replace("-", "")}/{acc}-index.htm'
            docs[source_id] = {**period, 'source_id': source_id, 'url': url, 'snapshot': f'../phase-a/{captures[company]["path"]}',
                               'retrieved_at': captures[company]['retrieved_date'], 'source_hash': captures[company]['raw_sha256'],
                               'capture_method': 'Phase A immutable SEC companyfacts response, not full filing HTML'}
            metrics = {'FLOW': {**FLOW, **COMPANY[company]['flow']}, 'STOCK_OR_COMMITMENT': {**STOCK, **COMPANY[company]['stock']}}
            vals, refs = {}, {}
            for kind, spec in metrics.items():
                for metric, tags in spec.items():
                    value, status, candidates = extract(us, tags, s if kind == 'FLOW' else None, e, acc)
                    oid = f'{company}:{period["label"]}:{metric}'
                    vals[metric], refs[metric] = value, oid
                    rows.append({'observation_id': oid, **period, 'metric': metric, 'value_usd': value,
                                 'native_unit': 'USD', 'currency': 'USD', 'kind': measurement_kind(metric, kind == 'FLOW'), 'status': status,
                                 'tags': ['us-gaap:' + t for t in tags], 'selected_tags': sorted(set(t for t, _ in candidates)),
                                 'taxonomy_labels': sorted(set(us[t]['label'] for t, _ in candidates)),
                                 'original_line_label': None, 'label_status': 'Taxonomy label; per-vintage rendered statement label not captured',
                                 'source_id': source_id, 'url': url, 'source_locator': f'facts.us-gaap.<selected_tags>.units.USD exact start/end and accession',
                                 'source_hash': captures[company]['raw_sha256'], 'retrieved_at': captures[company]['retrieved_date'],
                                 'method': 'Exact consolidated SEC context in original filing anchor; aliases must agree; no frame/calendar or missing-zero inference'})
                    if value is not None:
                        later = [(t, r) for t in tags for r in us.get(t, {}).get('units', {}).get('USD', [])
                                 if r.get('start') == (s if kind == 'FLOW' else None) and r['end'] == e and r['filed'] <= AS_OF
                                 and r['filed'] > period['filed'] and r['val'] != value]
                        # Preserve all changed vintages; never substitute them into bridges.
                        for t, r in sorted({(t, r['accn'], r['val']): (t, r) for t, r in later}.values(), key=lambda x: (x[1]['filed'], x[0])):
                            revisions.append({'observation_id': oid, 'tag': t, 'original_value': value, 'later_value': r['val'],
                                              'original_accession': acc, 'later_accession': r['accn'], 'later_filed': r['filed'],
                                              'status': 'CHANGED_CONTEXT_REVIEW_REQUIRED', 'note': 'Difference retained; not necessarily an error correction/restatement'})
            begin = (dt.date.fromisoformat(s) - dt.timedelta(days=1)).isoformat()
            value, status, candidates = extract(us, COMPANY[company]['stock']['combined_cash'], None, begin, acc)
            oid = f'{company}:{period["label"]}:combined_cash_begin'
            rows.append({'observation_id': oid, **period, 'metric': 'combined_cash_begin', 'value_usd': value,
                         'native_unit': 'USD', 'currency': 'USD', 'kind': 'BALANCE_SHEET_STOCK', 'status': status,
                         'context_end': begin, 'source_id': source_id, 'source_hash': captures[company]['raw_sha256'],
                         'tags': COMPANY[company]['stock']['combined_cash'], 'source_locator': f'Exact instant {begin} in {acc}',
                         'method': 'Beginning cash is independently disclosed; not backed out from bridge', 'url': url})
            vals['combined_cash_begin'], refs['combined_cash_begin'] = value, oid
            for x in supplemental['observations']:
                if x['company'] != company or x['start'] != s or x['end'] != e:
                    continue
                oid = f'{company}:{period["label"]}:{x["metric"]}:rendered'
                # Explicit original-vintage extracts may resolve absent standard tags;
                # later comparative extracts remain separate instead of overwriting.
                if x.get('vintage_policy') == 'ORIGINAL':
                    if x['accession'] != acc or x['publication_date'] != period['filed']:
                        raise ValueError('Original-vintage anchor mismatch')
                    if vals.get(x['metric']) is not None and vals[x['metric']] != x['value_million'] * 10**6:
                        raise ValueError('Rendered/XBRL conflict; requires explicit resolution')
                    if vals.get(x['metric']) is None:
                        vals[x['metric']], refs[x['metric']] = x['value_million'] * 10**6, oid
                rows.append({'observation_id': oid, **period, **x, 'value_usd': x['value_million'] * 10**6,
                             'native_unit': 'USD_MILLION', 'currency': 'USD', 'status': 'PRIMARY_RENDERED_VERIFIED',
                             'capture_method': 'Human checked official rendered statement; structured extract only, raw HTML not archived'})
            change = total(vals['ocf'], vals['investing_cf'], vals['financing_cf'], vals['fx'])
            stock_change = total(vals['combined_cash'], -vals['combined_cash_begin'] if vals['combined_cash_begin'] is not None else None)
            gross_residual = total(vals['ocf'], -vals['cash_capex'] if vals['cash_capex'] is not None else None)
            net_capex = total(vals['cash_capex'], -vals.get('ppe_sales_incentives') if vals.get('ppe_sales_incentives') is not None else None) if company == 'amazon' else vals['cash_capex']
            fcf = total(vals['ocf'], -net_capex if net_capex is not None else None)
            debt = total(vals['long_term_debt_current_carrying'], vals['long_term_debt_noncurrent_carrying'], vals['short_term_borrowings']) if company == 'amazon' else vals['debt']
            if company == 'oracle' and debt is None:
                debt = total(vals['borrowings_current'], vals['borrowings_noncurrent'])
            liquidity = total(vals['cash'], vals['short_term_investments'])
            b = {**period, 'source_id': source_id, 'source_refs': refs, 'reported_values_usd': vals,
                 'computed_cash_change_usd': change, 'reported_cash_change_usd': vals['reported_cash_change'],
                 'stock_cash_change_usd': stock_change,
                 'flow_reconciliation_difference_usd': total(change, -vals['reported_cash_change'] if vals['reported_cash_change'] is not None else None),
                 'stock_reconciliation_difference_usd': total(stock_change, -vals['reported_cash_change'] if vals['reported_cash_change'] is not None else None),
                 'gross_capex_ocf_ratio': divide(vals['cash_capex'], vals['ocf']),
                 'gross_ocf_minus_capex_usd': gross_residual, 'company_convention_net_cash_capex_usd': net_capex,
                 'company_convention_fcf_usd': fcf,
                 'fcf_definition': 'OCF - (gross PP&E purchases - proceeds from PP&E sales and incentives); finance leases separate' if company == 'amazon' else 'OCF - cash PP&E; customer financing prepayments remain inside reported OCF',
                 'cash_and_short_term_investments_usd': liquidity,
                 'borrowings_excluding_leases_usd': debt, 'debt_definition': COMPANY[company]['debt_definition'],
                 'net_debt_excluding_leases_usd': total(debt, -liquidity if liquidity is not None else None),
                 'debt_ocf_ratio': divide(debt, vals['ocf']) if period['form'] == '10-K' else None,
                 'debt_ocf_limitation': 'End-period borrowings / full native-year OCF; partial periods not annualized',
                 'operating_income_interest_expense_proxy': divide(vals['operating_income'], vals['interest_expense']),
                 'interest_proxy_limitation': 'GAAP operating income / reported interest expense, not covenant or cash debt-service coverage; capitalized interest/lease scope can differ',
                 'liquidity_to_next12m_debt_principal_only': divide(liquidity, vals['debt_next_12m_principal']) if period['form'] == '10-K' else None,
                 'liquidity_coverage_limitation': 'Narrow principal-only comparison, excluding interest, leases, purchases, operating expenses; not full obligation coverage or liquidity forecast',
                 'other_investing_cf_usd': total(vals['investing_cf'], vals['cash_capex']),
                 'other_investing_definition': 'Reported investing CF + gross cash PP&E; observed residual of reported total, not invented funding; includes PP&E sales/incentives, securities, acquisitions and other investing',
                 'ocf_coverage_limitation': 'Arithmetic coverage only; OCF also serves dividends, debt service and other cash uses. Cash is fungible; no dollar traced to AI investment.'}
            b['status'] = 'RECONCILED' if b['flow_reconciliation_difference_usd'] == 0 and b['stock_reconciliation_difference_usd'] == 0 else 'UNRESOLVED'
            bridges.append(b)
            summaries.append({k: v for k, v in b.items() if k not in ('source_refs', 'reported_values_usd')})
    dump('financial-observations.json', rows)
    dump('funding-bridges.json', bridges)
    dump('indicators.json', summaries)
    dump('vintage-differences.json', revisions)
    dump('primary-source-register.json', {'base_commit': BASE, 'as_of': AS_OF, 'snapshots': [captures[c] for c in CIKS],
                                        'filings': list(docs.values()), 'rendered_sources': supplemental['sources'],
                                        'extract_identity': sha((ROOT / 'primary-extracts.json').read_bytes()),
                                        'limitations': ['Standard SEC contexts are independently reproducible; custom/non-standard rendered cells are human-qualified structured extracts, not archived original HTML.',
                                                        'No raw source redownload; Phase A first-reported vintage preserved. No later comparative substitution.']})
    with (ROOT / 'company-financials.csv').open('w', newline='') as f:
        fields = ['company', 'label', 'start', 'end', 'basis', 'cohort', 'annualized', 'accession', 'filed', 'status'] + sorted({k for b in bridges for k in b['reported_values_usd']})
        w = csv.DictWriter(f, fieldnames=fields, lineterminator='\n')
        w.writeheader()
        for b in bridges:
            w.writerow({**{k: b[k] for k in fields if k in b}, **b['reported_values_usd']})
    identity_files = ['financial-observations.json', 'funding-bridges.json', 'indicators.json', 'vintage-differences.json', 'primary-source-register.json', 'company-financials.csv']
    dump('content-identity.json', {'implementation': VERSION, 'base_commit': BASE, 'as_of': AS_OF,
                                'files': {n: sha((ROOT / n).read_bytes()) for n in identity_files},
                                'counts': {'source_verified_numeric_observations': sum(r['value_usd'] is not None for r in rows),
                                           'unique_company_period_metric_numeric_observations': len({(r['company'], r['start'], r['end'], r['metric']) for r in rows if r['value_usd'] is not None}),
                                           'xbrl_verified_numeric_observations': sum(r['status'] == 'PRIMARY_XBRL_VERIFIED' for r in rows),
                                           'rendered_numeric_observations': sum(r['status'] == 'PRIMARY_RENDERED_VERIFIED' for r in rows),
                                           'unavailable_or_conflicting': sum(r['value_usd'] is None for r in rows),
                                           'reconciled_periods': sum(b['status'] == 'RECONCILED' for b in bridges),
                                           'vintage_differences': len(revisions)}})
    for b in bridges:
        print(b['company'], b['label'], b['status'], 'CapEx/OCF', b['gross_capex_ocf_ratio'], 'FCF', b['company_convention_fcf_usd'])


if __name__ == '__main__':
    build()
