import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { productivitySources, censusSpecs } from './productivity-sources.mjs'
export function productivityHtml(s) {
 const spec=productivitySources.find(x=>x.id===s.id)
 const fields={'Series ID':s.id,Title:s.title,Source:s.publisher,Units:s.units,Frequency:spec.frequency,'Seasonal Adjustment':spec.adjustment,'Date Range':`${s.observations[0].date}-01 to ${s.observations.at(-1).date}-01`,'Last Updated':s.sourceUpdatedAt}
 return `<table>${Object.entries(fields).map(([k,v])=>`<th>${k}</th><td>${v}</td>`).join('')}</table><table id="data-table-observations">${s.observations.map(p=>`<th>${p.date}-01</th><td>${p.value??'.'}</td>`).join('')}</table>`
}
export async function productivityFixtures(root,input,{revise=false}={}) {
 const bundle=JSON.parse(await readFile(join(root,'data/productivity/series.json'),'utf8'))
 for(const spec of productivitySources){const s=bundle.series.find(x=>x.id===spec.id);if(revise&&s.id==='OPHNFB')s.observations.at(-1).value+=.01;await writeFile(join(input,`wil-${s.id}.html`),productivityHtml(s))}
 const sources=censusSpecs.map(spec=>bundle.series.find(s=>s.id===spec.id))
 const extracted={title:'Value of Private Construction Put in Place - Seasonally Adjusted Annual Rate',units:'Millions of dollars',release:sources[0].sourceUpdatedAt,sourceNote:'Source: U.S. Census Bureau',series:Object.fromEntries(sources.map(s=>[s.sourceColumn,s.observations]))}
 await writeFile(join(input,'construction-extracted.json'),JSON.stringify(extracted))
 await writeFile(join(input,'privsatime.xlsx'),'Offline fixture: use extracted JSON, not an official workbook')
}
