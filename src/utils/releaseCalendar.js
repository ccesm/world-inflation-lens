export const releaseSchedules = {
  H15: { name: 'Federal Reserve H.15', zone: 'America/New_York', hour: 16, minute: 15, distributorGraceHours: 4, url: 'https://www.federalreserve.gov/releases/h15/' },
  H10: { name: 'Federal Reserve H.10', zone: 'America/New_York', hour: 16, minute: 15, distributorGraceHours: 4, url: 'https://www.federalreserve.gov/releases/h10/' },
  H41: { name: 'Federal Reserve H.4.1', zone: 'America/New_York', hour: 16, minute: 30, distributorGraceHours: 4, url: 'https://www.federalreserve.gov/releases/h41/' },
}
export const refreshSchedule = { cron: '40 17 * * *', timezone: 'America/Los_Angeles', label: '17:40 America/Los_Angeles' }
const day = value => new Date(`${value}T12:00:00Z`).getUTCDay()
export const addDays = (value, n) => new Date(Date.parse(`${value}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const nth = (year, month, weekday, occurrence) => {
  const first = `${year}-${String(month).padStart(2, '0')}-01`
  return addDays(first, (weekday - day(first) + 7) % 7 + (occurrence - 1) * 7)
}
const observed = date => day(date) === 6 ? addDays(date, -1) : day(date) === 0 ? addDays(date, 1) : date
function easter(year) {
  const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451)
  const month=Math.floor((h+l-7*m+114)/31),date=(h+l-7*m+114)%31+1
  return `${year}-${String(month).padStart(2,'0')}-${String(date).padStart(2,'0')}`
}
export function holidays(year, treasury = false) {
  const dates=[]
  for(const y of [year-1,year,year+1]) {
    dates.push(observed(`${y}-01-01`),nth(y,1,1,3),nth(y,2,1,3),addDays(nth(y,6,1,1),-7),observed(`${y}-07-04`),nth(y,9,1,1),nth(y,10,1,2),observed(`${y}-11-11`),nth(y,11,4,4),observed(`${y}-12-25`))
    if(y>=2021)dates.push(observed(`${y}-06-19`))
    if(treasury)dates.push(addDays(easter(y),-2))
  }
  return new Set(dates)
}
export function businessDay(date, treasury = false) { return ![0,6].includes(day(date)) && !holidays(Number(date.slice(0,4)),treasury).has(date) }
export function previousBusinessDay(date, treasury = false) { let d=addDays(date,-1);while(!businessDay(d,treasury))d=addDays(d,-1);return d }
const nextBusinessDay = date => { let d=date;while(!businessDay(d))d=addDays(d,1);return d }
export function zonedParts(now, zone='America/New_York') {
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now).map(p=>[p.type,p.value]))
  return {date:`${parts.year}-${parts.month}-${parts.day}`,hour:Number(parts.hour),minute:Number(parts.minute)}
}
export function zonedInstant(date,hour,minute,zone) {
  const wall=Date.parse(`${date}T${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}:00Z`)
  let instant=wall
  for(let i=0;i<3;i++){const p=zonedParts(new Date(instant),zone);const actual=Date.parse(`${p.date}T${String(p.hour).padStart(2,'0')}:${String(p.minute).padStart(2,'0')}:00Z`);instant+=wall-actual}
  return new Date(instant).toISOString()
}
export function releaseWindow(scheduleId, now=new Date()) {
  const spec=releaseSchedules[scheduleId];if(!spec || !Number.isFinite(now.getTime()))return null
  const today=zonedParts(now,spec.zone).date, releases=[]
  for(let n=-25;n<=10;n++){
    const anchor=addDays(today,n);let date,observation
    if(scheduleId==='H15' && businessDay(anchor)) {date=anchor;observation=previousBusinessDay(anchor,true)}
    if(scheduleId==='H10' && day(anchor)===1){date=nextBusinessDay(anchor);observation=previousBusinessDay(anchor)}
    if(scheduleId==='H41' && day(anchor)===4){date=nextBusinessDay(anchor);observation=addDays(anchor,-1)}
    if(!date)continue
    const publishedAt=zonedInstant(date,spec.hour,spec.minute,spec.zone)
    const captureDueAt=new Date(Date.parse(publishedAt)+spec.distributorGraceHours*3600000).toISOString()
    releases.push({publishedAt,captureDueAt,observation})
  }
  const mature=releases.filter(r=>Date.parse(r.captureDueAt)<=now.getTime()).at(-1)
  const next=releases.find(r=>Date.parse(r.captureDueAt)>now.getTime())
  return {...spec,mature,next,calendarLimit:'Estimated normal US federal/market calendar; exceptional closures and distributor delays can differ.'}
}
