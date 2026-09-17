import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {validateBank,validatePublications,parseBankDeposits,compareBank} from './lib/digital-money.mjs'
import {bankGrowth,bankCsv,digitalCsv} from '../src/utils/digitalMoney.js'
const read=async f=>JSON.parse(await readFile(new URL(`../data/digital-money/${f}.json`,import.meta.url),'utf8'))
const bank=await read('bank-deposits'),excerpts=await read('source-excerpts'),bundle={'stablecoins':await read('stablecoins'),'treasury-holdings':await read('treasury-holdings')}
validateBank(bank);validatePublications(bundle,excerpts)
const html=s=>`<table>${Object.entries({'Series ID':s.id,Title:s.title,Source:s.publisher,Units:s.units,Frequency:'Monthly','Seasonal Adjustment':'Seasonally Adjusted','Date Range':`${s.observations[0].date}-01 to ${s.observations.at(-1).date}-01`,'Last Updated':s.sourceUpdatedAt}).map(([k,v])=>`<th>${k}</th><td>${v}</td>`).join('')}</table><table id="data-table-observations">${s.observations.map(p=>`<th>${p.date}-01</th><td>${p.value??'.'}</td>`).join('')}</table>`
assert.deepEqual(parseBankDeposits(html(bank)).observations,bank.observations)
for(const text of [html(bank).replace('<td>Monthly</td>','<td>Weekly</td>'),html(bank).replace('<td>Seasonally Adjusted</td>','<td>Not Seasonally Adjusted</td>'),html(bank).replace('<td>Billions of U.S. Dollars</td>','<td>Millions of Dollars</td>')])assert.throws(()=>parseBankDeposits(text))
for(const mutate of [s=>s.observations.splice(5,1),s=>s.observations[1].date=s.observations[0].date,s=>s.observations[1].value=-1,s=>s.proxy=false,s=>s.coverage.end='2099-01']){const s=structuredClone(bank);mutate(s);assert.throws(()=>validateBank(s))}
const revised=structuredClone(bank);revised.observations.at(-1).value+=1;assert.equal(compareBank(bank,revised).revised,1);assert.equal(compareBank(bank,bank).total,0)
for(const change of [b=>b.stablecoins.records[1].observationDate=b.stablecoins.records[1].sourceUpdatedAt,b=>b['treasury-holdings'].records[0].units='percent of all Treasury debt',b=>b.stablecoins.records[2].value=100,b=>b.stablecoins.records[1].qualifier='exact']){const b=structuredClone(bundle);change(b);assert.throws(()=>validatePublications(b,excerpts))}
assert.equal(bundle.stablecoins.records[0].observationDate,'2026-04-06')
assert.equal(bundle.stablecoins.records[1].observationDate,null)
assert.equal(bundle['treasury-holdings'].records[0].value,2)
const q={observations:[{date:'2020-01',value:100},{date:'2020-02',value:null},{date:'2021-01',value:110},{date:'2021-02',value:120}]}
assert.ok(Math.abs(bankGrowth(q)[2].value-10)<1e-10);assert.equal(bankGrowth(q)[3].value,null)
const csv=digitalCsv(bundle.stablecoins.records);assert.ok(csv.startsWith('\ufeff'));assert.match(csv,/"approximately"/);assert.match(csv,/"300","USD billion",""/)
assert.match(bankCsv(bank,bankGrowth(bank).slice(0,1),'yoy'),/"percent year-over-year"/)
console.log('PASS: independent digital-money snapshots; publication-vs-observation dates, approximate qualifiers and Treasury-bill denominator; bank parser, exact YoY gaps, revisions and CSV attribution')
