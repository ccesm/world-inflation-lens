import history from '../../data/history/events.json'

export const driverEpisodes = [
  { id: 'oil', eventId: 'great-inflation', from: '1972-01', to: '1976-12', start: '1973-10', end: '1974-03', topic: 'energy', source: { name: 'Federal Reserve History · Oil Shock of 1973–74', url: 'https://www.federalreservehistory.org/essays/oil-shock-of-1973-74' } },
  { id: 'volcker', eventId: 'volcker', from: '1978-01', to: '1984-12', start: '1979-10', end: '1982-12', topic: 'rates' },
  { id: 'crisis', eventId: 'recession', from: '2006-01', to: '2011-12', start: '2008-01', end: '2009-12', topic: 'energy' },
  { id: 'pandemic', eventId: 'pandemic', from: '2019-01', to: '2025-12', start: '2020-01', end: '2024-12', topic: 'food' },
].map(item => ({ ...item, chapter: history.find(event => event.id === item.eventId) }))

export function driverLinkForChapter(id) {
  const episode = driverEpisodes.find(item => item.eventId === id)
  return episode ? `#/drivers?topic=${episode.topic}&episode=${episode.id}` : null
}
