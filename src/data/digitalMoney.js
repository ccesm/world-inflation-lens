import stablecoins from '../../data/digital-money/stablecoins.json'
import treasury from '../../data/digital-money/treasury-holdings.json'
import bank from '../../data/digital-money/bank-deposits.json'
export const digitalPublications = [...stablecoins.records, ...treasury.records]
export const digitalBank = bank
export const digitalSources = {
 market: {name:'Federal Reserve / FEDS Notes · 2026-04-08',url:digitalPublications[0].sourceUrl},
 dollarization: {name:'IMF · 2026-08-07',url:digitalPublications[1].sourceUrl},
 treasury: {name:'IMF · 2026-05-11',url:treasury.records[0].sourceUrl},
 banking: {name:'Federal Reserve / FEDS Notes · 2026-05-01',url:'https://www.federalreserve.gov/econres/notes/feds-notes/banks-in-the-age-of-stablecoins-lessons-from-their-historical-responses-to-financial-innovations-20260501.html'},
 money: {name:'Federal Reserve / FEDS Notes · 2026-09-04',url:'https://www.federalreserve.gov/econres/notes/feds-notes/new-forms-of-money-and-the-u-s-monetary-aggregates-20260904.html'},
}
