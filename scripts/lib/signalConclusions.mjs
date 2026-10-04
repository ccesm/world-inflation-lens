// Presentation only. No economic calculations, votes, runtime clock or network.
export const CONCLUSION_VERSION = 'deterministic-signal-conclusions/1'
const pair = (zh, en) => ({ zh, en })
const transition = title => pair(
  `${title.zh}的完整确认窗口既未满足方向区间，也未完全处于稳定区间，因此目前不确认持续方向。`,
  `The complete confirmation window for ${title.en} satisfies neither a directional band nor the quiet band, so no persistent direction is currently confirmed.`)
const quiet = title => pair(
  `${title.zh}的完整确认窗口处于规则定义的稳定区间，变化较小。`,
  `The complete confirmation window for ${title.en} is within the rule-defined quiet band, indicating little change.`)
const missing = title => pair(`${title.zh}的数据不足，目前无法评估。`, `Data are insufficient to assess ${title.en}.`)
function factor(title, positiveState, positive, negativeState, negative) {
  return { title, sentences: { [positiveState]: positive, [negativeState]: negative,
    LITTLE_CHANGE: quiet(title), TRANSITION: transition(title), INSUFFICIENT_DATA: missing(title) } }
}
export const FACTOR_TEMPLATES = {
  'inflation-persistence': factor(pair('核心 PCE 通胀动能', 'Core PCE Inflation Momentum'),
    'CORE_INFLATION_ACCELERATING', pair('核心 PCE 同比通胀的加速动能在确认窗口内持续成立。', 'Accelerating momentum in year-over-year core PCE inflation is confirmed across the confirmation window.'),
    'CORE_INFLATION_DECELERATING', pair('核心 PCE 同比通胀的减速动能在确认窗口内持续成立。', 'Decelerating momentum in year-over-year core PCE inflation is confirmed across the confirmation window.')),
  'observed-productivity': factor(pair('已观测劳动生产率', 'Observed Productivity'),
    'OUTPUT_PER_HOUR_GROWING', pair('已观测非农商业部门每小时产出同比增长，为生产能力提供一定支持。', 'Observed nonfarm business output per hour is growing year over year, providing some support to productive capacity.'),
    'OUTPUT_PER_HOUR_CONTRACTING', pair('已观测非农商业部门每小时产出同比下降，生产率提供的供给侧支持减弱。', 'Observed nonfarm business output per hour is contracting year over year, reducing productivity-related supply-side support.')),
  'supply-chain-pressure': factor(pair('全球供应链压力趋势', 'Global Supply-Chain Pressure Trend'),
    'SUPPLY_CHAIN_PRESSURE_RISING', pair('全球供应链压力指数的三个月均值变化确认了压力上升趋势。', 'Changes in the three-month average of the Global Supply Chain Pressure Index confirm a rising pressure trend.'),
    'SUPPLY_CHAIN_PRESSURE_FALLING', pair('全球供应链压力指数的三个月均值变化确认了压力下降趋势。', 'Changes in the three-month average of the Global Supply Chain Pressure Index confirm a falling pressure trend.')),
  'policy-rate-direction': factor(pair('有效政策利率方向', 'Effective Policy-Rate Direction'),
    'POLICY_RATE_RISING', pair('月均有效联邦基金利率的三个月变化确认了上升方向。', 'The three-month change in the monthly average effective federal funds rate confirms a rising direction.'),
    'POLICY_RATE_FALLING', pair('月均有效联邦基金利率的三个月变化确认了下降方向。', 'The three-month change in the monthly average effective federal funds rate confirms a falling direction.')),
  'reserve-share': factor(pair('美元储备份额趋势', 'USD Reserve-Share Trend'),
    'USD_RESERVE_SHARE_RISING', pair('美元在全球官方外汇储备中的份额在八个季度比较中呈持续上升趋势。', 'The dollar share of world official foreign-exchange reserves shows a confirmed rising trend over the eight-quarter comparison.'),
    'USD_RESERVE_SHARE_FALLING', pair('美元在全球官方外汇储备中的份额在八个季度比较中呈持续下降趋势，与储备多元化压力相符。', 'The dollar share of world official foreign-exchange reserves shows a confirmed falling trend over the eight-quarter comparison, consistent with reserve-diversification pressure.')),
  'foreign-treasury-holdings': factor(pair('外国持有美国国债规模趋势', 'Foreign Treasury Holdings Trend'),
    'FOREIGN_TREASURY_HOLDINGS_EXPANDING', pair('外国持有美国国债的名义美元余额同比扩张得到确认。', 'A year-over-year expansion in nominal dollar foreign holdings of U.S. Treasury securities is confirmed.'),
    'FOREIGN_TREASURY_HOLDINGS_CONTRACTING', pair('外国持有美国国债的名义美元余额同比收缩得到确认。', 'A year-over-year contraction in nominal dollar foreign holdings of U.S. Treasury securities is confirmed.')),
  'offshore-usd-credit': factor(pair('美国境外美元信贷余额趋势', 'Offshore USD Credit Outstanding Trend'),
    'OFFSHORE_USD_CREDIT_EXPANDING', pair('美国境外非银行借款人的美元信贷余额同比扩张，表明美元继续用于全球融资。', 'Dollar credit outstanding to non-bank borrowers outside the United States is expanding year over year, indicating continued use of dollar financing globally.'),
    'OFFSHORE_USD_CREDIT_CONTRACTING', pair('美国境外非银行借款人的美元信贷余额同比收缩，反映该融资规模下降。', 'Dollar credit outstanding to non-bank borrowers outside the United States is contracting year over year, indicating a reduction in this financing volume.')),
}
export const FACTOR_IDS = Object.keys(FACTOR_TEMPLATES)
export const QUALITY = ['HIGH', 'MEDIUM', 'LOW', 'UNASSESSED']
const qualityNames = { HIGH: pair('高', 'High'), MEDIUM: pair('中等', 'Medium'), LOW: pair('低', 'Low'), UNASSESSED: pair('未评估', 'Unassessed') }
const caution = pair('当前证据有限，该解释需谨慎看待。', 'Current evidence is limited; this interpretation should be treated cautiously.')
const domesticLimit = pair('这些因素分别描述通胀动能、生产率、供应链和利率，不能合并为国内购买力的净方向，也不足以单独确认再通胀或快速通胀降温。', 'These factors describe inflation momentum, productivity, supply chains and rates separately; they do not establish a net purchasing-power direction or alone confirm reflation or rapid disinflation.')
const internationalLimit = pair('储备配置、国债持有量和美元融资是不同功能；这些变化不能合并为美元整体国际角色的强化或弱化判断。', 'Reserve allocation, Treasury holdings and dollar financing are distinct functions; their changes do not establish an overall strengthening or weakening of the dollar’s international role.')
const limitations = pair('解释局限：生产率增长不能归因于 AI；GSCPI 不涵盖全部外部通胀压力；利率方向不能单独衡量货币政策松紧。COFER 含 IMF 估算且不含货币黄金；TIC 是名义持有量而非资金流量，受托管、估值和国债供给影响；BIS 信贷变化也受名义增长、信贷周期和杠杆影响。各因素保留原生频率、各自观测期和确认窗口，并非同步测量。', 'Interpretive limits: productivity growth is not attributed to AI; GSCPI does not cover all external inflation pressure; rate direction alone does not measure overall monetary restraint. COFER includes IMF imputations and excludes monetary gold; TIC measures nominal holdings, not flows, and reflects custody, valuation and Treasury supply; BIS credit also reflects nominal growth, credit cycles and leverage. Factors retain native frequencies, distinct observation periods and confirmation windows, rather than measuring conditions simultaneously.')
export function normalizeAssessments(input) {
  if (!Array.isArray(input) || input.length !== 7) throw Error('INVALID_CONCLUSION_FACTORS')
  const seen = new Map()
  for (const f of input) {
    if (!f || JSON.stringify(Object.keys(f).sort()) !== JSON.stringify(['factorId', 'state', 'evidenceQuality', 'sensitivity'].sort()) ||
      !Object.hasOwn(FACTOR_TEMPLATES, f.factorId) || seen.has(f.factorId) ||
      !Object.hasOwn(FACTOR_TEMPLATES[f.factorId].sentences, f.state) || !QUALITY.includes(f.evidenceQuality) ||
      !['THRESHOLD_SENSITIVE', 'NOT_SENSITIVE', 'NOT_EVALUATED'].includes(f.sensitivity)) throw Error('INVALID_CONCLUSION_SEMANTICS')
    // The frozen engine never treats an unavailable factor as neutral/assessed.
    if ((f.state === 'INSUFFICIENT_DATA') !== (f.evidenceQuality === 'UNASSESSED') || f.state === 'INSUFFICIENT_DATA' && f.sensitivity !== 'NOT_EVALUATED') throw Error('INCONSISTENT_CONCLUSION_AVAILABILITY')
    seen.set(f.factorId, f)
  }
  return FACTOR_IDS.map(id => Object.fromEntries(['factorId', 'state', 'evidenceQuality', 'sensitivity'].map(k => [k, seen.get(id)[k]])))
}
export function generateConclusions(input) {
  const factors = normalizeAssessments(input)
  const factorInterpretations = Object.fromEntries(factors.map(f => {
    const base = FACTOR_TEMPLATES[f.factorId].sentences[f.state]
    return [f.factorId, Object.fromEntries(['zh', 'en'].map(lang => [lang, base[lang] + (['LOW', 'UNASSESSED'].includes(f.evidenceQuality) ? (lang === 'en' ? ' ' : '') + caution[lang] : '')]))]
  }))
  function group(ids, limit) {
    const unavailable = ids.some(id => factors.find(f => f.factorId === id).state === 'INSUFFICIENT_DATA')
    return Object.fromEntries(['zh', 'en'].map(lang => {
      const transitions = factors.filter(f => ids.includes(f.factorId) && f.state === 'TRANSITION')
      let transitionWritten = false
      const clauses = ids.flatMap(id => {
        const f = factors.find(f => f.factorId === id)
        if (f.state !== 'TRANSITION') return [factorInterpretations[id][lang]]
        if (transitionWritten) return []
        transitionWritten = true
        const titles = transitions.map(t => FACTOR_TEMPLATES[t.factorId].title[lang]).join(lang === 'zh' ? '、' : ', ')
        return [lang === 'zh' ? `${titles}尚未确认持续方向。` : `No persistent direction is confirmed for ${titles}.`]
      })
      if (transitions.length) {
        clauses.push(lang === 'zh' ? '这些未确认方向的因素，其各自完整确认窗口既未满足方向区间，也未完全处于稳定区间。' : 'For the unconfirmed factors, each complete confirmation window satisfies neither a directional band nor the quiet band.')
        if (transitions.some(f => ['LOW', 'UNASSESSED'].includes(f.evidenceQuality))) clauses.push(caution[lang])
      }
      if (unavailable) clauses.push(lang === 'zh' ? '一个或多个必需因素不可用，因此本组结论不完整。' : 'One or more required factors are unavailable, so this group interpretation is incomplete.')
      clauses.push(limit[lang])
      return [lang, clauses.join(lang === 'en' ? ' ' : '')]
    }))
  }
  const domesticSummary = group(FACTOR_IDS.slice(0, 4), domesticLimit)
  const internationalSummary = group(FACTOR_IDS.slice(4), internationalLimit)
  // A descriptive coexistence clause, never a shared directional verdict.
  const reserve = factors[4], credit = factors[6]
  if (reserve.state === 'USD_RESERVE_SHARE_FALLING' && credit.state === 'OFFSHORE_USD_CREDIT_EXPANDING') {
    internationalSummary.zh += '储备多元化压力与美元全球融资使用韧性可并存；这并不证实美元国际角色正在快速、系统性弱化。'
    internationalSummary.en += ' Reserve-diversification pressure can coexist with resilient use of dollar financing; this does not establish rapid, systemic weakening of the dollar’s international role.'
  }
  const counts = Object.fromEntries(QUALITY.map(q => [q, factors.filter(f => f.evidenceQuality === q).length]))
  const sensitive = factors.filter(f => f.sensitivity === 'THRESHOLD_SENSITIVE')
  const notEvaluated = factors.filter(f => f.sensitivity === 'NOT_EVALUATED')
  const evidenceQualifier = Object.fromEntries(['zh', 'en'].map(lang => {
    const present = QUALITY.filter(q => counts[q])
    const all = present.length === 1
    const qualityText = all ? lang === 'zh' ? `证据质量：7 项均为${qualityNames[present[0]].zh}。` : `Evidence quality: all seven factors are ${qualityNames[present[0]].en}.` :
      lang === 'zh' ? `证据质量：${present.map(q => `${qualityNames[q].zh} ${counts[q]} 项`).join(' / ')}。` : `Evidence quality: ${present.map(q => `${qualityNames[q].en} ${counts[q]}`).join(' / ')}.`
    const parts = [qualityText, lang === 'zh' ? '该评级反映数据完整性、时间、修订和来源质量，不代表解释正确的概率。' : 'This reflects data completeness, timing, revision and source quality; it is not a probability that the interpretation is correct.']
    if (counts.LOW || counts.UNASSESSED) parts.push(caution[lang])
    if (sensitive.length) parts.push(lang === 'zh' ? `阈值敏感：${sensitive.map(f => FACTOR_TEMPLATES[f.factorId].title.zh).join('、')}。合理调整分析阈值时，其当前分类可能变化，应谨慎解读。` : `Threshold-sensitive: ${sensitive.map(f => FACTOR_TEMPLATES[f.factorId].title.en).join(', ')}. Their current classifications can change under reasonable alternative thresholds and should be interpreted with additional caution.`)
    if (notEvaluated.length) parts.push(lang === 'zh' ? `尚未评估阈值敏感性：${notEvaluated.map(f => FACTOR_TEMPLATES[f.factorId].title.zh).join('、')}。` : `Threshold sensitivity has not been evaluated for: ${notEvaluated.map(f => FACTOR_TEMPLATES[f.factorId].title.en).join(', ')}.`)
    parts.push(limitations[lang])
    return [lang, parts.join(lang === 'en' ? ' ' : '')]
  }))
  return { presentationVersion: CONCLUSION_VERSION, factorInterpretations, domesticSummary, internationalSummary, evidenceQualifier }
}

// Explicit short presentation rules; never truncate the long interpretation.
export const HOME_BRIEF_VERSION = 'deterministic-signal-home-brief/1'
const homeDirectional = {
  CORE_INFLATION_ACCELERATING: pair('核心 PCE 通胀动能持续加速。', 'Core PCE inflation momentum is persistently accelerating.'),
  CORE_INFLATION_DECELERATING: pair('核心 PCE 通胀动能持续减速。', 'Core PCE inflation momentum is persistently decelerating.'),
  OUTPUT_PER_HOUR_GROWING: pair('生产率增长提供一定供给侧缓冲。', 'Productivity growth provides some supply-side support.'),
  OUTPUT_PER_HOUR_CONTRACTING: pair('已观测生产率收缩。', 'Observed productivity is contracting.'),
  SUPPLY_CHAIN_PRESSURE_RISING: pair('全球供应链压力趋势上升。', 'Global supply-chain pressure is trending upward.'),
  SUPPLY_CHAIN_PRESSURE_FALLING: pair('全球供应链压力趋势下降。', 'Global supply-chain pressure is trending downward.'),
  POLICY_RATE_RISING: pair('有效政策利率方向上升。', 'The effective policy rate is moving upward.'),
  POLICY_RATE_FALLING: pair('有效政策利率方向下降。', 'The effective policy rate is moving downward.'),
  USD_RESERVE_SHARE_RISING: pair('美元官方外汇储备份额持续上升。', 'The dollar share of official foreign-exchange reserves is persistently rising.'),
  USD_RESERVE_SHARE_FALLING: pair('美元官方外汇储备份额持续下降。', 'The dollar share of official foreign-exchange reserves is persistently falling.'),
  FOREIGN_TREASURY_HOLDINGS_EXPANDING: pair('外国持有美国国债的名义余额扩张。', 'Nominal foreign Treasury holdings are expanding.'),
  FOREIGN_TREASURY_HOLDINGS_CONTRACTING: pair('外国持有美国国债的名义余额收缩。', 'Nominal foreign Treasury holdings are contracting.'),
  OFFSHORE_USD_CREDIT_EXPANDING: pair('美国境外美元融资余额仍在扩张。', 'Offshore dollar financing outstanding continues to expand.'),
  OFFSHORE_USD_CREDIT_CONTRACTING: pair('美国境外美元融资余额收缩。', 'Offshore dollar financing outstanding is contracting.'),
}
export function generateHomeBrief(input) {
  const factors = normalizeAssessments(input)
  function group(items, international) {
    return Object.fromEntries(['zh', 'en'].map(lang => {
      const parts = []
      const transitions = items.filter(f => f.state === 'TRANSITION')
      if (transitions.length) {
        parts.push(lang === 'zh' ? `${transitions.map(f => FACTOR_TEMPLATES[f.factorId].title.zh).join('、')}尚未确认持续方向。` : `A persistent direction is not confirmed for ${transitions.map(f => FACTOR_TEMPLATES[f.factorId].title.en).join(', ')}.`)
      }
      for (const f of items) {
        if (homeDirectional[f.state]) parts.push(homeDirectional[f.state][lang])
        else if (f.state === 'LITTLE_CHANGE') parts.push(lang === 'zh' ? `${FACTOR_TEMPLATES[f.factorId].title.zh}处于规则定义的稳定区间。` : `${FACTOR_TEMPLATES[f.factorId].title.en} is within the rule-defined quiet band.`)
        else if (f.state === 'INSUFFICIENT_DATA') parts.push(lang === 'zh' ? `${FACTOR_TEMPLATES[f.factorId].title.zh}数据不足，本组解释不完整。` : `${FACTOR_TEMPLATES[f.factorId].title.en} has insufficient data; this group interpretation is incomplete.`)
      }
      if (items.some(f => ['LOW', 'UNASSESSED'].includes(f.evidenceQuality))) parts.push(caution[lang])
      if (international) {
        if (items[0].state === 'USD_RESERVE_SHARE_FALLING' && items[2].state === 'OFFSHORE_USD_CREDIT_EXPANDING') parts.push(lang === 'zh' ? '储备多元化与全球美元融资使用可并存，并不证实美元国际角色快速、系统性弱化。' : 'Reserve diversification can coexist with continued global dollar financing; this does not establish rapid, systemic weakening of the dollar’s international role.')
        else parts.push(lang === 'zh' ? '这些不同功能不能合并为美元国际角色的净方向。' : 'These distinct functions do not establish a net direction for the dollar’s international role.')
      } else parts.push(lang === 'zh' ? '这些因素不能合并为购买力的净方向，也不能单独确认明显再通胀或快速通胀降温。' : 'These factors do not establish a net purchasing-power direction or alone confirm reflation or rapid disinflation.')
      if (international && items[0].state === 'USD_RESERVE_SHARE_FALLING' && items[1].state === 'TRANSITION' && items[2].state === 'OFFSHORE_USD_CREDIT_EXPANDING' && items.every(f => ['HIGH', 'MEDIUM'].includes(f.evidenceQuality))) {
        return [lang, lang === 'zh' ? '美元官方外汇储备份额下降，但境外美元融资仍在扩张，国债持有量方向尚未确认。储备多元化与全球美元融资使用可并存，并不证实美元国际角色快速、系统性弱化。' : 'The dollar’s reserve share is falling while offshore dollar credit expands. Treasury holdings have no confirmed direction. Reserve diversification and dollar financing coexist; this does not establish rapid, systemic weakening.']
      }
      if (!international && items[0].state === 'TRANSITION' && items[1].state === 'OUTPUT_PER_HOUR_GROWING' && items[2].state === 'TRANSITION' && items[3].state === 'TRANSITION' && items.every(f => ['HIGH', 'MEDIUM'].includes(f.evidenceQuality))) {
        return [lang, lang === 'zh' ? '国内通胀动能、供应链压力与政策利率尚未确认持续方向，生产率增长提供一定供给侧缓冲；现有证据尚未确认明显再通胀或快速通胀降温。' : 'Persistent directions in inflation momentum, supply-chain pressure and policy rates remain unconfirmed. Productivity growth offers some supply-side support; these factors alone do not confirm reflation or rapid disinflation.']
      }
      return [lang, parts.join(lang === 'en' ? ' ' : '')]
    }))
  }
  return { domestic: group(factors.slice(0, 4), false), international: group(factors.slice(4), true) }
}
