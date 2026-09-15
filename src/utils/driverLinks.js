const isMonth = value => /^\d{4}-(0[1-9]|1[0-2])$/.test(value || '')

export function readDriverLink(hash, { topics, episodes, earliest, latest }) {
  const params = new URLSearchParams(hash.split('?')[1])
  const episode = episodes.find(item => item.id === params.get('episode')) || null
  const topic = topics.includes(params.get('topic')) ? params.get('topic') : episode?.topic || 'food'
  const defaultFrom = episode?.from || '2019-01'
  const defaultTo = episode?.to || latest
  const requestedFrom = params.get('from') || defaultFrom
  const requestedTo = params.get('to') || defaultTo
  const valid = isMonth(requestedFrom) && isMonth(requestedTo) && requestedFrom >= earliest && requestedTo <= latest && requestedFrom < requestedTo
  const from = valid ? requestedFrom : defaultFrom
  const to = valid ? requestedTo : defaultTo
  const requestedMonth = params.get('month') || to
  const month = isMonth(requestedMonth) && requestedMonth >= from && requestedMonth <= to ? requestedMonth : to
  return { topic, episode, from, to, month }
}

export function driverHash({ topic, from, to, month, episode }) {
  const params = new URLSearchParams({ topic, from, to, month })
  if (episode) params.set('episode', episode.id)
  return `#/drivers?${params}`
}
