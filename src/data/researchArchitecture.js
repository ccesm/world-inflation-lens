import { internationalSources } from './internationalDefinitions.js'
import { seriesRegistry } from './seriesRegistry.js'

// Research relationships only. Series names, provenance, units, dates and maintenance
// policies belong to the V0.13 registry/contract and validated snapshots.
const label = (en, zh) => ({ en, zh })
const route = (href, en, zh) => ({ href, label: label(en, zh) })
const planned = (id, en, zh) => ({ id, label: label(en, zh) })
const unique = ids => [...new Set(ids)]

export const plannedResearchCategories = [
  {
    id: 'reserves', label: label('Reserve System', '储备体系'), evidenceState: 'PARTIAL',
    description: label('Quarterly IMF COFER currency shares include IMF imputations and exclude gold; reserve managers’ motives remain unmeasured.', 'IMF COFER 季度币种份额含 IMF 插补，不含黄金；储备管理动机仍未衡量。'),
    existingEvidence: internationalSources.cofer.ids, plannedEvidence: [planned('euro-role', 'International role of the euro', '欧元的国际作用'), planned('rmb-role', 'International role of the renminbi', '人民币的国际作用')],
  },
  {
    id: 'trade', label: label('Trade & Commodity Currency', '贸易与大宗商品计价'), evidenceState: 'PLANNED',
    description: label('Exchange rates alone do not measure the currency used in trade contracts.', '汇率本身不能衡量贸易合同实际使用的货币。'),
    existingEvidence: [], plannedEvidence: [planned('trade-invoicing', 'Trade invoicing currencies', '贸易计价货币'), planned('commodity-invoicing', 'Commodity invoicing currencies', '大宗商品计价货币')],
  },
  {
    id: 'finance', label: label('Global Dollar Financing', '全球美元融资'), evidenceState: 'PARTIAL',
    description: label('BIS quarterly USD credit to non-banks outside the US: bank loans and international debt securities. Not domestic M2 or all global financing.', 'BIS 美国境外非银行借款人季度美元信贷：银行贷款与国际债务证券。不是国内 M2 或全部全球融资。'),
    existingEvidence: internationalSources.bis.ids, plannedEvidence: [planned('funding-costs', 'Cross-currency funding costs', '跨币种融资成本')],
  },
  {
    id: 'treasury-demand', label: label('Treasury / Safe-Asset Holdings', '国债 / 安全资产持有量'), evidenceState: 'PARTIAL',
    description: label('Monthly Treasury TIC foreign holdings with custodial geography; holdings changes are not transaction flows or motives.', '财政部 TIC 月度外国持有量采用托管地理口径；持有量变化不等于交易流量或动机。'),
    existingEvidence: [...internationalSources.tic.ids, 'IMF_TBILL_SHARE'], plannedEvidence: [planned('ultimate-owners', 'Ultimate beneficial ownership', '最终受益所有权')],
  },
  {
    id: 'payments', label: label('Payment Networks & Digital Money', '支付网络与数字货币'), evidenceState: 'PARTIAL',
    description: label('Reviewed stablecoin publications are available. Market size is not a measure of payment use or universal adoption.', '已有经审核的稳定币研究资料；市场规模不等于支付使用量或普及程度。'),
    existingEvidence: ['FED_STABLECOIN_SIZE', 'IMF_STABLECOIN_SIZE', 'IMF_USD_SHARE'], plannedEvidence: [planned('payment-networks', 'Cross-border payment networks', '跨境支付网络'), planned('stablecoin-adoption', 'Stablecoin adoption and actual use', '稳定币应用与实际使用')],
  },
  {
    id: 'alternative-reserves', label: label('Alternative Reserve Assets', '其他储备资产'), evidenceState: 'PLANNED',
    description: label('Gold-reserve evidence is planned; no gold-price forecast is provided.', '黄金储备资料尚待接入，不提供黄金价格预测。'),
    existingEvidence: [], plannedEvidence: [planned('gold-reserves', 'Official gold reserves', '官方黄金储备')],
  },
  {
    id: 'global-funding', label: label('Global Funding / Carry', '全球融资与套息'), evidenceState: 'PLANNED',
    description: label('Dedicated funding and cross-currency evidence is not integrated.', '尚未接入专门的美元融资与跨币种市场数据。'),
    existingEvidence: [], plannedEvidence: [planned('global-dollar-funding', 'Global dollar funding conditions', '全球美元融资条件')],
  },
]

const dollarSystemEvidence = unique(plannedResearchCategories.flatMap(item => item.existingEvidence))
const internationalPlanned = plannedResearchCategories.flatMap(item => item.plannedEvidence)

export const dollarOutcomes = [
  {
    id: 'domestic', label: label('Domestic Purchasing Power', '国内购买力'), evidenceState: 'EXISTING',
    description: label('How much can one dollar buy inside the United States? Consumer prices and historical purchasing power provide direct evidence; future scenarios remain conditional.', '一美元在美国国内还能买到多少东西？消费物价与历史购买力提供直接证据，未来情景仍取决于假设。'),
    existingEvidence: ['CPIAUCNS', 'PCEPILFE', 'CUUR0000SAH1', 'CPIUFDNS', 'CPIENGNS', 'CEU0500000003', 'ULCNFB'], plannedEvidence: [],
    routes: [route('#/purchasing-power', 'Purchasing Power', '购买力'), route('#/since-1971', 'Since 1971', '1971 年以来'), route('#/scenarios', 'Conditional Scenarios', '条件情景'), route('#/history', 'Historical Regimes', '历史货币制度')],
  },
  {
    id: 'international', label: label('International Dollar Role', '美元的国际作用'), evidenceState: 'PARTIAL',
    description: label('How important is the dollar in global reserves, financing, trade and payments? Reserve shares, Treasury holdings, global credit and digital-money research cover distinct parts of this question; a strong exchange rate alone cannot answer it.', '美元在全球储备、融资、贸易和支付中有多重要？储备份额、国债持有、全球信贷与数字货币研究覆盖其中不同部分，强势汇率本身不能回答这个问题。'),
    existingEvidence: dollarSystemEvidence, plannedEvidence: internationalPlanned,
    routes: [route('#/research/international-dollar', 'International Dollar Lens', '国际美元透视'), route('#/research/digital-money', 'Digital Money Evidence', '数字货币证据'), route('#/research?focus=dollar-system', 'Dollar System Research', '美元体系研究'), route('#/monitor?group=market', 'Exchange Rate & Treasury Context', '汇率与国债背景')],
  },
]

export const structuralThemes = [
  {
    id: 'fiscal', stage: 'structural', label: label('Fiscal Conditions', '财政条件'), evidenceState: 'EXISTING',
    description: label('Debt, deficits and interest costs interact with growth, financing and policy choices. Debt does not automatically cause inflation.', '债务、赤字和利息成本与增长、融资及政策选择相互作用；债务不会自动导致通胀。'),
    existingEvidence: ['FYPUGDA188S', 'FYFSGDA188S', 'FYOINT', 'FYFR', 'CBO_DEBT', 'CBO_DEFICIT', 'CBO_INTEREST'], plannedEvidence: [],
    routes: [route('#/fiscal', 'Fiscal Outlook & CBO', '财政展望与 CBO'), route('#/fiscal?focus=model', 'Debt Scenario Model', '债务情景模型')],
  },
  {
    id: 'capacity', stage: 'structural', label: label('Productive Capacity', '生产能力'), evidenceState: 'EXISTING',
    description: label('Productivity, investment and infrastructure shape supply. Technology investment proxies are not direct AI spending, and observed gains are not proof of AI causation.', '生产率、投资与基础设施塑造供给能力。技术投资代理指标不等于 AI 直接支出，观测到的改善也不能证明由 AI 导致。'),
    existingEvidence: ['OPHNFB', 'ULCNFB', 'COMPNFB', 'PNFIC1', 'A679RC1Q027SBEA', 'B985RC1Q027SBEA', 'B935RC1Q027SBEA', 'GDPC1', 'REAL_GDP_WORKER', 'CE16OV', 'IPG3344S', 'CENSUS_DATACENTER', 'CENSUS_NONRES', 'CENSUS_ELECTRONIC', 'IPN22112CS'],
    plannedEvidence: [planned('firm-ai-adoption', 'Firm-level AI adoption', '企业层面的 AI 应用'), planned('tfp-decomposition', 'Total factor productivity decomposition', '全要素生产率分解')],
    routes: [route('#/research/ai-productivity', 'AI & Productivity', '人工智能与生产率')],
  },
  {
    id: 'external', stage: 'structural', label: label('External Supply Shocks', '外部供给冲击'), evidenceState: 'EXISTING',
    description: label('Risk perceptions, physical disruptions and consumer-price transmission are different observations. Their correlation does not establish causation.', '风险感知、实际中断与消费价格传导是不同的观测；相关性不能证明因果关系。'),
    existingEvidence: ['GPR', 'GPRT', 'GPRA', 'GSCPI', 'MCOILWTICO', 'MHHNGSP', 'FAO_FOOD', 'FAO_MEAT', 'FAO_DAIRY', 'FAO_CEREALS', 'FAO_OILS', 'FAO_SUGAR', 'CPIUFDNS', 'CPIENGNS', 'SIPRI_US_GDP', 'SIPRI_US_GOV', 'SIPRI_US_REAL', 'SIPRI_WORLD_REAL'],
    plannedEvidence: [planned('FREIGHT', 'Freight rates', '运价')],
    routes: [route('#/external-shocks', 'External Shocks', '外部冲击'), route('#/drivers?topic=energy', 'Energy Transmission', '能源传导'), route('#/drivers?topic=food', 'Food Transmission', '食品传导')],
  },
  {
    id: 'dollar-system', stage: 'structural', label: label('Dollar System', '美元体系'), evidenceState: 'PARTIAL',
    description: label('Digital money, payment networks and Treasury-demand mechanisms connect to international dollar use. Current evidence is incomplete and includes manually reviewed publications.', '数字货币、支付网络与国债需求机制关联美元的国际使用。现有证据并不完整，部分来自人工审核的研究资料。'),
    existingEvidence: dollarSystemEvidence, plannedEvidence: internationalPlanned,
    routes: [route('#/research/international-dollar', 'International Dollar Lens', '国际美元透视'), route('#/research/digital-money', 'Digital Money', '数字货币'), route('#/research?focus=international-evidence', 'International Evidence Gaps', '国际证据缺口')],
  },
]

export const researchStages = [
  {
    id: 'structural', label: label('Structural Forces', '结构性力量'),
    description: label('Which fiscal, supply-capacity, external and dollar-system conditions shape the outlook?', '哪些财政、供给能力、外部冲击与美元体系条件正在塑造前景？'),
    existingEvidence: unique(structuralThemes.flatMap(item => item.existingEvidence)),
    routes: [route('#/research?focus=structural', 'Four Structural Themes', '四个结构性主题')],
  },
  {
    id: 'transmission', label: label('Inflation Transmission', '通胀传导'),
    description: label('Are upstream shocks passing through costs and wages into persistent underlying inflation? Components have different weights and definitions.', '上游冲击是否经过成本与工资，转化为持续的基础通胀？各分项的权重和定义不同。'),
    existingEvidence: ['CPIAUCNS', 'PCEPILFE', 'CUUR0000SAH1', 'CPIUFDNS', 'CPIENGNS', 'CEU0500000003', 'COMPNFB', 'ULCNFB', 'CUUR0000SEHF01'],
    routes: [route('#/drivers', 'Inflation Drivers', '通胀因素'), route('#/monitor?group=inflation', 'CPI, PCE & Inflation Compensation', 'CPI、PCE 与通胀补偿'), route('#/research/ai-productivity', 'Productivity & Labor Costs', '生产率与劳动成本')],
  },
  {
    id: 'policy', label: label('Policy Response', '政策反应'),
    description: label('How do monetary policy and financial conditions respond? M2 is monetary context, not money printing, and cannot be added to Fed assets as a single monetary measure. Real yields are market prices, not pure Fed policy.', '货币政策与金融条件如何反应？M2 提供货币背景，不等于印钞量，也不能与美联储资产相加为单一货币指标。实际收益率是市场价格，不是纯粹的美联储政策指标。'),
    existingEvidence: ['FEDFUNDS', 'WALCL', 'M2SL', 'DFII10'],
    routes: [route('#/drivers?topic=rates', 'Policy Rates', '政策利率'), route('#/monitor?group=monetary', 'Monetary & Financing Conditions', '货币与融资条件')],
  },
  {
    id: 'market', label: label('Market Validation', '市场定价检验'),
    description: label('What are markets pricing? Nominal yields, real yields, inflation compensation and exchange rates answer different questions; market prices do not prove a single cause.', '市场正在如何定价？名义收益率、实际收益率、通胀补偿和汇率回答不同的问题；市场价格不能证明单一成因。'),
    existingEvidence: ['DGS10', 'DFII10', 'T5YIFR', 'DTWEXBGS'],
    routes: [route('#/monitor?group=market', 'Treasury Pricing & Broad Dollar', '国债定价与广义美元')],
  },
  {
    id: 'outcomes', label: label('Two Dollar Outcomes', '两个美元结果'),
    description: label('Domestic purchasing power and international dollar use interact, but neither is a substitute for measuring the other.', '国内购买力与美元的国际使用相互影响，但衡量其中一个不能代替衡量另一个。'),
    existingEvidence: unique(dollarOutcomes.flatMap(item => item.existingEvidence)),
    routes: [route('#/dollar', 'Explore Both Dollar Questions', '探索两个美元问题'), route('#/purchasing-power', 'Historical Purchasing Power', '历史购买力'), route('#/research?focus=international-evidence', 'International Evidence', '国际证据')],
  },
]

const secondaryRoles = {
  CPIAUCNS: ['INFLATION_TRANSMISSION'], ULCNFB: ['STRUCTURAL_CAPACITY'], COMPNFB: ['STRUCTURAL_CAPACITY'],
  CPIUFDNS: ['STRUCTURAL_EXTERNAL'], CPIENGNS: ['STRUCTURAL_EXTERNAL'], CUUR0000SEHF01: ['STRUCTURAL_CAPACITY'],
  DFII10: ['POLICY_RESPONSE'], DGS10: ['STRUCTURAL_FISCAL', 'GLOBAL_FINANCING'],
  M2SL: ['POLICY_RESPONSE'], DPSACBM027SBOG: ['DOLLAR_SYSTEM'], IPN22112CS: ['STRUCTURAL_CAPACITY'],
  FED_STABLECOIN_SIZE: ['PAYMENT_NETWORKS'], IMF_STABLECOIN_SIZE: ['PAYMENT_NETWORKS'],
  IMF_USD_SHARE: ['PAYMENT_NETWORKS'], IMF_TBILL_SHARE: ['TREASURY_DEMAND', 'STRUCTURAL_FISCAL'],
}
// Preserve the protected registry's canonical primary ownership. Cross-links may
// give evidence a secondary role without creating a competing primary owner.
export const seriesResearchRoles = Object.fromEntries(Object.entries(seriesRegistry).map(([id, entry]) => [id, {
  primaryRole: entry.primaryResearchRole,
  secondaryRoles: unique([...(entry.secondaryRoles || []), ...(secondaryRoles[id] || [])]).filter(role => role !== entry.primaryResearchRole),
}]))

const context = (stage, theme, en, zh) => ({ stage, ...(theme ? { theme } : {}), label: label(en, zh), href: `#/research?focus=${theme || stage}` })
export const pageResearchContext = {
  'research/international-dollar': context('structural', 'dollar-system', 'International Dollar Lens', '国际美元透视'),
  fiscal: context('structural', 'fiscal', 'Fiscal Outlook', '财政展望'),
  'research/ai-productivity': context('structural', 'capacity', 'AI & Productivity', '人工智能与生产率'),
  'external-shocks': context('structural', 'external', 'External Shocks', '外部冲击'),
  'research/digital-money': context('structural', 'dollar-system', 'Digital Money', '数字货币'),
  drivers: context('transmission', null, 'Inflation Drivers', '通胀因素'),
  monitor: context('market', null, 'Dollar Monitor', '美元监测'),
  'purchasing-power': context('outcomes', null, 'Domestic Purchasing Power', '国内购买力'),
  'us-cpi': context('transmission', null, 'U.S. CPI History', '美国 CPI 历史'),
  'since-1971': context('outcomes', null, 'Since 1971', '1971 年以来'),
  scenarios: context('outcomes', null, 'Conditional Purchasing-Power Scenarios', '条件购买力情景'),
  history: context('outcomes', null, 'Historical Dollar Regimes', '历史美元制度'),
  regimes: context('outcomes', null, 'Historical Dollar Regimes', '历史美元制度'),
  timeline: context('transmission', null, 'Historical Inflation Episodes', '历史通胀事件'),
  overview: context('structural', 'external', 'Global Inflation Context', '全球通胀背景'),
  map: context('structural', 'external', 'Global Inflation Context', '全球通胀背景'),
}

// A filtered evidence view belongs to its selected question even when the
// underlying page also contains evidence for other stages.
export const viewResearchContext = {
  monitor: {
    parameter: 'group',
    values: {
      inflation: context('transmission', null, 'Inflation Evidence', '通胀证据'),
      monetary: context('policy', null, 'Monetary & Financing Conditions', '货币与融资条件'),
      market: context('market', null, 'Treasury Pricing & Broad Dollar', '国债定价与广义美元'),
    },
  },
  drivers: {
    parameter: 'topic',
    values: {
      rates: context('policy', null, 'Policy Rate Transmission', '政策利率传导'),
      energy: context('transmission', 'external', 'Energy / Price Transmission', '能源／价格传导'),
      food: context('transmission', 'external', 'Food Price Transmission', '食品价格传导'),
      housing: context('transmission', null, 'Housing / Shelter Prices', '住房／居住价格'),
      wages: context('transmission', null, 'Wages / Labor Costs', '工资／劳动成本'),
      money: context('policy', null, 'Monetary & Financing Conditions', '货币与融资条件'),
    },
  },
}

export function researchContextForRoute(route) {
  const [key, query] = String(route).replace(/^#?\//, '').split('?')
  const view = Object.hasOwn(viewResearchContext, key) ? viewResearchContext[key] : null
  const selected = view && new URLSearchParams(query).get(view.parameter)
  if (view && Object.hasOwn(view.values, selected)) return view.values[selected]
  return Object.hasOwn(pageResearchContext, key) ? pageResearchContext[key] : null
}

export const researchCopy = {
  en: {
    question: 'What will the U.S. dollar look like over the next 20–30 years?',
    mapTitle: 'How the Research Fits Together', outcomesTitle: 'Two Related Dollar Questions',
    evidenceStates: { EXISTING: 'Existing evidence', PARTIAL: 'Partial evidence', PLANNED: 'Planned research' },
    existingEvidence: 'Available evidence', plannedEvidence: 'Not yet integrated', backToMap: 'Back to Research Map',
    methodology: 'This is an explanatory order, not a one-way mechanical causal chain. Evidence is not added into a score, and no probabilities are assigned.',
    distinction: 'High domestic inflation does not automatically end the dollar’s international role. A strong exchange rate does not prove stable domestic purchasing power; stablecoin growth does not prove either outcome.',
    outcomeCaveats: ['High domestic inflation does not automatically mean collapse of the dollar’s international role.', 'A strong exchange rate does not prove stable domestic purchasing power.', 'Low U.S. inflation does not by itself prove international dollar dominance.', 'Stablecoin growth does not automatically mean stronger domestic purchasing power.'],
    feedbacks: ['Policy can change fiscal and productive conditions.', 'Market financing conditions feed back into fiscal costs and investment.', 'Exchange rates can affect import prices and inflation transmission.', 'International Treasury demand can affect U.S. financing conditions.'],
    marketNote: 'Market validation means examining prices, not certifying a forecast. Higher or lower readings have different meanings across indicators.',
    breakevenTitle: '10-Year Inflation Compensation · Derived Proxy',
    breakevenMethod: 'Same-date 10-year nominal Treasury yield minus 10-year TIPS real yield, in percentage points. Missing dates remain missing; no adjacent-date subtraction.',
    breakevenCaution: 'This arithmetic difference includes inflation-risk and liquidity effects; it is not a pure inflation forecast. The 5y5y series measures a different forward maturity and is not a 30-year forecast.',
    internationalLimit: 'No comprehensive measurement of international dollar dominance is available here. Reserve shares, Treasury holdings and selected international credit are integrated; invoicing, payment-network use and ultimate ownership remain separate gaps.',
  },
  zh: {
    question: '未来 20–30 年，美元会是什么样？',
    mapTitle: '研究逻辑如何衔接', outcomesTitle: '两个相互关联的美元问题',
    evidenceStates: { EXISTING: '已有证据', PARTIAL: '部分证据', PLANNED: '计划研究' },
    existingEvidence: '已有资料', plannedEvidence: '尚未接入', backToMap: '返回研究地图',
    methodology: '这是解释问题的顺序，不是单向、机械的因果链。不同证据不会相加成综合分数，也不赋予概率。',
    distinction: '国内高通胀不会自动终结美元的国际作用。强势汇率不能证明国内购买力稳定；稳定币增长也不能证明任何一种结果。',
    outcomeCaveats: ['国内高通胀不会自动意味着美元国际作用的崩溃。', '强势汇率不能证明国内购买力稳定。', '美国低通胀本身不能证明美元在国际上占主导地位。', '稳定币增长不会自动意味着国内购买力增强。'],
    feedbacks: ['政策会反过来改变财政与生产条件。', '市场融资条件会影响财政成本与投资。', '汇率会影响进口价格与通胀传导。', '国际国债需求会影响美国融资条件。'],
    marketNote: '市场定价检验是观察价格，不是确认预测。不同指标的高低含义各不相同。',
    breakevenTitle: '10 年期通胀补偿 · 衍生代理指标',
    breakevenMethod: '同一天的 10 年期名义国债收益率减去 10 年期 TIPS 实际收益率，单位为百分点。缺失日期保持缺失，不使用相邻日期相减。',
    breakevenCaution: '这一算术差额含有通胀风险与流动性因素，不是纯粹的通胀预测。5y5y 指标对应另一种远期期限，也不是 30 年预测。',
    internationalLimit: '目前没有完整衡量美元国际主导地位的数据。已接入储备份额、国债持有量和部分国际信贷；计价、支付网络使用量及最终所有权仍是独立的缺口。',
  },
}
