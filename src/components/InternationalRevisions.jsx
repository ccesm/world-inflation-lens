import React from 'react'
import ledger from '../../data/international-dollar/revisions.json'
import { internationalCopy } from '../i18n/internationalDollar.js'
export function InternationalRevisions({language}) {
 const t=internationalCopy[language]
 return <section className="content-section" id="international-revisions"><h2>{t.revision}</h2><p>{t.revisionNote}</p><p>{language==='zh'?'首次导入':'First import'}: {ledger.initialImportAt}</p>{ledger.runs.length?ledger.runs.slice(0,10).map(run=><details key={run.checkedAt}><summary>{run.checkedAt} · {run.changes.reduce((sum,s)=>sum+s.total,0)} {language==='zh'?'变化':'changes'}</summary>{run.changes.map(s=><p key={s.id}>{s.id}: +{s.added} / {s.revised} {language==='zh'?'修订':'revised'} / {s.withdrawn} {language==='zh'?'撤回':'withdrawn'}</p>)}</details>):<p>{t.noRevisions}</p>}</section>
}
