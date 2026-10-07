export const companies = ['MSFT','GOOG','AMZN','META']
export const chartMetrics = ['cashInvestmentIntensity','fcfMargin','operatingMargin']
export function chartSegments(points) {
 const segments=[];let active=[];
 for (const p of points) {
  if(p.breakBefore || !Number.isFinite(p.value)){if(active.length)segments.push(active);active=[];}
  if(Number.isFinite(p.value))active.push(p);
 }
 if(active.length)segments.push(active);return segments;
}
export function formatCapex(value,{signed=false,unit='PERCENT',decimals=unit==='USD_BILLIONS'?3:2}={}) {
 if(!Number.isFinite(value))return '—';
 const n=unit==='USD_BILLIONS'?value/1000:value;
 return `${signed?(n<0?'−':'+'):n<0?'−':''}${Math.abs(n).toFixed(decimals)}`;
}
