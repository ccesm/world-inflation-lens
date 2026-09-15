import { driverContext } from './driverContext.js'

const baseCopy = {
  en: {
    eyebrow: '05 / INFLATION DRIVERS · UNITED STATES', title: 'Follow the pressure behind prices.',
    description: 'Explore food, energy, interest rates, housing, wages and money alongside U.S. inflation. Connect the data to history and understand the limits of each comparison.',
    scope: 'U.S. monthly observations · static snapshots · no forecasts',
    topics: { food: 'Food', energy: 'Energy & oil', rates: 'Interest rates' },
    series: { headline: 'Headline CPI · year-on-year', food: 'Food CPI · year-on-year', energy: 'Energy CPI · year-on-year', oil: 'WTI spot oil · monthly average', rates: 'Effective federal funds rate · monthly average' },
    units: { percent: '%', oil: 'USD / barrel' },
    questions: { food: 'Why can food prices feel different from headline inflation?', energy: 'How do energy shocks show up in consumer prices?', rates: 'How do interest rates interact with inflation?' },
    explanations: {
      food: 'Food CPI covers food purchased for home consumption and meals away from home. Compare its rate of change with the broader consumer basket. A faster rise in food prices does not tell us how many percentage points food contributed to headline inflation.',
      energy: 'Consumer energy prices include motor fuel and household energy. WTI is a U.S. crude-oil benchmark, with different units and coverage. The panels share dates so you can inspect the same month; their vertical scales are independent.',
      rates: 'Interest rates influence financing conditions and demand, while inflation and the wider economy also influence policy decisions. FEDFUNDS is the effective overnight rate averaged across the month, not the target-range ceiling and not a change in rates.',
    },
    lessons: {
      food: 'Slower food inflation can still mean a more expensive shopping basket: prices are rising, just less quickly.',
      energy: 'An oil-price movement is not a one-for-one change in household bills. Retail prices also reflect refining, distribution, taxes and other costs.',
      rates: 'Policy works through several channels and with delays. Two curves alone cannot identify the effect of a rate change.',
    },
    topicSources: {
      food: [{ name: 'BLS · CPI expenditure categories', url: 'https://www.bls.gov/news.release/cpi.t07.htm' }],
      energy: [{ name: 'BLS · Household energy', url: 'https://www.bls.gov/cpi/factsheets/household-energy.htm' }, { name: 'EIA · Gasoline price factors', url: 'https://www.eia.gov/energyexplained/gasoline/factors-affecting-gasoline-prices.php' }],
      rates: [{ name: 'Federal Reserve · Monetary policy transmission', url: 'https://www.federalreserve.gov/monetarypolicy/monetary-policy-what-are-its-goals-how-does-it-work.htm' }],
    },
    read: 'How to read this comparison', dates: 'Explore a period', from: 'From month', to: 'To month', dateError: 'Choose a valid month within the available range, with the start before the end.',
    all: 'All available', inspect: 'Inspect month', previous: 'Previous month', next: 'Next month', noData: 'No data', noWindow: 'This source has no observations in the selected period.',
    covered: 'Source observations', source: 'Source', updated: 'Source updated', retrieved: 'Retrieved (UTC)', chartData: 'View monthly data', download: 'Download chart data CSV',
    monthly: 'Monthly observations', yoy: 'CPI year-on-year change (%)', rateAxis: 'CPI year-on-year / interest-rate level (%)', oilTitle: 'Crude oil prices, on their own scale',
    oilNote: 'WTI monthly data begins in January 1986. Earlier windows remain empty. Monthly averages do not show daily futures-price extremes.',
    chartHelp: 'Move across the chart, use the month slider, or open the data table. Missing months break the lines; dates are never shifted to close gaps.',
    formula: 'Year-on-year growth = (value this month ÷ value in the same month a year earlier − 1) × 100. CPI and earnings are unadjusted; M2 is seasonally adjusted. The first 12 months and missing-value comparisons have no calculated growth. Interest rates and oil prices remain levels.',
    caution: 'These comparisons show timing and differences, not measured causal contributions. Food, energy and shelter are already included in headline CPI; their growth rates cannot be added together.',
    history: 'Look through a historical window', historyNote: 'Select a window to change the chart dates. Shading marks the selected episode; the surrounding months provide context.',
    noEpisode: 'Choose an episode below to connect these curves to a historical explanation.',
    shaded: 'Shaded episode', outside: 'The selected episode falls outside the current chart dates.',
    backHistory: 'Read the historical chapter', clearEpisode: 'Clear episode', custom: 'Custom period',
    episodes: { oil: '1973–74 · Oil shock', volcker: '1979–82 · Volcker tightening', crisis: '2008–09 · Financial crisis', pandemic: '2020–24 · Pandemic & disinflation' },
    latest: 'Latest in this snapshot', bridge: 'New in V0.4 · Explore housing, wages and money behind inflation', open: 'Explore inflation drivers',
  },
  zh: {
    eyebrow: '05 / 通胀因素 · 美国', title: '沿着价格，追问背后的压力。',
    description: '把食品、能源、利率、住房、工资与货币放到美国通胀曲线旁边，联系历史背景，理解每一种对照能说明什么、又有哪些局限。',
    scope: '美国月度观测 · 静态数据快照 · 不含预测',
    topics: { food: '食品', energy: '能源与油价', rates: '利率' },
    series: { headline: '总体 CPI · 同比', food: '食品 CPI · 同比', energy: '能源 CPI · 同比', oil: 'WTI 现货油价 · 月平均', rates: '有效联邦基金利率 · 月平均' },
    units: { percent: '%', oil: '美元 / 桶' },
    questions: { food: '为什么食品价格的体感，和总体通胀不同？', energy: '能源冲击怎样体现在消费者物价中？', rates: '利率和通胀如何相互影响？' },
    explanations: {
      food: '食品 CPI 包括在家消费的食品和外出就餐。将它的涨幅与整个消费篮子比较，可以看出变化差异，但不能据此算出食品对总体通胀贡献了几个百分点。',
      energy: '消费者能源价格包括车用燃料和家庭能源。WTI 是美国原油价格基准，单位与覆盖范围都不同。上下两张图共用日期，方便查看同一个月；纵轴各自独立。',
      rates: '利率通过融资条件和需求影响经济；通胀和经济状况也会影响政策决定。FEDFUNDS 是实际隔夜联邦基金利率的月平均值，不是目标区间上限，也不是利率的变化幅度。',
    },
    lessons: {
      food: '食品通胀放缓，购物篮仍可能变贵：价格还在上涨，只是涨得更慢。',
      energy: '原油价格的变化不会一比一变成家庭账单的变化。零售价格还受到炼制、运输、税费等成本影响。',
      rates: '政策通过多种渠道传导，并存在时滞。仅凭两条曲线，不能识别一次加息带来的净效果。',
    },
    topicSources: {
      food: [{ name: 'BLS · CPI 支出类别', url: 'https://www.bls.gov/news.release/cpi.t07.htm' }],
      energy: [{ name: 'BLS · 家庭能源', url: 'https://www.bls.gov/cpi/factsheets/household-energy.htm' }, { name: 'EIA · 汽油价格影响因素', url: 'https://www.eia.gov/energyexplained/gasoline/factors-affecting-gasoline-prices.php' }],
      rates: [{ name: '美联储 · 货币政策传导', url: 'https://www.federalreserve.gov/monetarypolicy/monetary-policy-what-are-its-goals-how-does-it-work.htm' }],
    },
    read: '如何阅读这组对照', dates: '选择观察区间', from: '起始月份', to: '结束月份', dateError: '请选择可用范围内的有效月份，起始月份应早于结束月份。',
    all: '全部可用', inspect: '查看月份', previous: '上一个月', next: '下一个月', noData: '无数据', noWindow: '这个来源在所选区间内没有观测值。',
    covered: '来源观测范围', source: '来源', updated: '来源更新日期', retrieved: '获取日期（UTC）', chartData: '查看月度数据', download: '下载图表数据 CSV',
    monthly: '月度观测', yoy: 'CPI 同比变化（%）', rateAxis: 'CPI 同比 / 利率水平（%）', oilTitle: '原油价格，使用独立刻度',
    oilNote: 'WTI 月度数据从 1986 年 1 月开始，更早的区间保持为空。月平均值不能反映每日的期货价格极端波动。',
    chartHelp: '移动指针、拖动月份滑块，或打开数据表查看数值。缺失月份使曲线中断，不会移动日期来连接缺口。',
    formula: '同比增速 =（本月值 ÷ 上年同月值 − 1）× 100。CPI 和工资使用未季调数据，M2 使用已季调数据。最初 12 个月及涉及缺失值的比较不计算同比。利率与油价仍显示水平值。',
    caution: '这些图展示时间关系和变化差异，不代表已经测算的因果贡献。食品、能源和居住费用已包含在总体 CPI 中，不能把这些涨幅直接相加。',
    history: '从一个历史窗口看起', historyNote: '选择窗口会调整图表日期。阴影标记所选事件，前后的月份用来提供背景。',
    noEpisode: '选择下面的事件，将曲线变化与历史解释联系起来。',
    shaded: '阴影对应事件', outside: '所选事件不在当前图表日期范围内。',
    backHistory: '阅读历史章节', clearEpisode: '清除事件', custom: '自定义区间',
    episodes: { oil: '1973–74 · 石油冲击', volcker: '1979–82 · 沃尔克紧缩', crisis: '2008–09 · 金融危机', pandemic: '2020–24 · 疫情与通胀回落' },
    latest: '当前快照的最新月份', bridge: 'V0.4 新增 · 从住房、工资与货币理解通胀', open: '探索通胀因素',
  },
}

export const driversCopy = Object.fromEntries(Object.entries(baseCopy).map(([language, base]) => {
  const context = driverContext[language]
  const copy = { ...base, ...context }
  for (const key of ['topics', 'series', 'questions', 'explanations', 'lessons', 'topicSources']) copy[key] = { ...base[key], ...context[key] }
  return [language, copy]
}))
