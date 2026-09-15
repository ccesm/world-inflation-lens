// Educational context is separate from observed series and numerical transforms.
const sources = {
  housing: { name: 'BLS · Rent & rental equivalence', url: 'https://www.bls.gov/cpi/factsheets/owners-equivalent-rent-and-rent.htm' },
  wages: { name: 'BLS · Earnings & employment composition', url: 'https://www.bls.gov/opub/btn/volume-13/did-the-pandemic-affect-real-earnings.htm' },
  money: { name: 'Federal Reserve / FRED · M2 definition', url: 'https://fred.stlouisfed.org/series/M2SL' },
  basics: { name: 'IMF · Inflation: Prices on the Rise', url: 'https://www.imf.org/en/publications/fandd/issues/series/back-to-basics/inflation' },
  exchange: { name: 'Bank of England · Exchange rates', url: 'https://www.bankofengland.co.uk/explainers/who-sets-exchange-rates' },
  expectations: { name: 'IMF · Managing expectations', url: 'https://www.imf.org/-/media/Files/Publications/WEO/2023/October/English/ch2.ashx' },
}

export const driverContext = {
  en: {
    topics: { housing: 'Housing', wages: 'Wages', money: 'Money supply' },
    series: { housing: 'Shelter CPI · year-on-year', wages: 'Average hourly earnings · year-on-year', money: 'M2 · year-on-year · seasonally adjusted' },
    questions: { housing: 'Why can housing inflation move slowly?', wages: 'Are pay rises keeping up with prices?', money: 'Does more money always mean higher prices?' },
    explanations: {
      housing: 'Shelter CPI measures housing services, including rent and owners’ equivalent rent: an estimate of what an owner-occupied home would rent for. It does not measure house purchase prices. Rent observations and lease renewals can move differently from new asking rents.',
      wages: 'Compare growth in average hourly earnings across private-sector employees with consumer prices. Pay affects household spending and business costs, but productivity and margins also matter. This is an average across jobs, not the pay rise of a fixed group of workers.',
      money: 'M2 measures broad money, including currency and several types of deposits. Its growth can support spending, but money demand, circulation and real production also shape prices. M2 is neither total credit nor a direct measure of money printing. The chart compares seasonally adjusted M2 growth with unadjusted CPI growth.',
    },
    lessons: {
      housing: 'Shelter is already part of headline CPI. Its growth rate is not its percentage-point contribution. Historical measurement methods also changed, including the adoption of rental equivalence in 1983.',
      wages: 'An average can rise when lower-paid jobs disappear. This comparison cannot by itself identify a wage–price spiral or an individual’s purchasing power.',
      money: 'Money and inflation need not move together month by month. M2 can be revised and has a different release schedule; an unpublished month stays empty.',
    },
    topicSources: { housing: [sources.housing], wages: [sources.wages], money: [sources.money, sources.basics] },
    growthAxis: 'Year-on-year growth (%)', adjustment: 'Seasonal adjustment', sa: 'Seasonally adjusted', nsa: 'Not seasonally adjusted',
    otherTitle: 'Four more channels to understand', otherNote: 'Explanatory context · these channels do not yet have integrated charts. Their effects depend on the economy and the policy response.',
    channels: [
      { id: 'fiscal', title: 'Fiscal policy & demand', body: 'Government spending and tax changes affect demand. When spending pushes beyond productive capacity, price pressure can rise; the effect depends on spare capacity and how policy is financed.', source: sources.basics },
      { id: 'exchange', title: 'Exchange rates & imports', body: 'A weaker currency can make imports more expensive in local money. Contracts, invoicing currencies and business margins affect how much and how quickly this reaches retail prices.', source: sources.exchange },
      { id: 'supply', title: 'Supply chains & production', body: 'Disasters, transport disruptions and shortages can limit supply or raise costs. Recovery can ease pressure, though a fall in inflation does not necessarily reverse earlier price increases.', source: sources.basics },
      { id: 'expectations', title: 'Inflation expectations', body: 'Expected future prices influence wage negotiations and price setting. Expectations can reinforce inflation, but they are not a guarantee of what inflation will be.', source: sources.expectations },
    ],
  },
  zh: {
    topics: { housing: '住房', wages: '工资', money: '货币供应量' },
    series: { housing: '居住 CPI · 同比', wages: '平均时薪 · 同比', money: 'M2 · 同比 · 已季调' },
    questions: { housing: '为什么居住通胀的变化可能比较慢？', wages: '工资涨幅，跟得上物价吗？', money: '货币增多，一定会让物价上涨吗？' },
    explanations: {
      housing: '居住 CPI 衡量住房服务，包括租金和业主等价租金：估计自住房如果出租，可以收取多少租金。它不衡量房屋购买价格。租金采样和租约续签的节奏，也可能与新挂牌租金不同。',
      wages: '把私营部门雇员平均时薪的增速与物价比较。工资影响家庭消费和企业成本，但生产率和利润率也会影响结果。这是不同岗位的平均值，不是追踪同一批人的加薪幅度。',
      money: 'M2 是包含现金及多类存款的广义货币指标。货币增长可能支持支出，但货币需求、流通速度和实际产出也会影响物价。M2 不等于全部信贷，也不是“印钞量”。图中对比的是已季调 M2 同比与未季调 CPI 同比。',
    },
    lessons: {
      housing: '居住费用已包含在总体 CPI 中，其同比不等于对总体通胀的百分点贡献。历史统计方法也有变化，例如 1983 年引入业主租金等价法。',
      wages: '低薪岗位减少，也可能让平均工资上升。仅凭这组比较，不能确认工资—物价螺旋，也不能判断某个人的购买力变化。',
      money: '货币与通胀不必逐月同步变化。M2 可能修订，发布日期也与 CPI 不同；尚未发布的月份保持为空。',
    },
    topicSources: { housing: [sources.housing], wages: [sources.wages], money: [sources.money, sources.basics] },
    growthAxis: '同比增速（%）', adjustment: '季节调整', sa: '已季调', nsa: '未季调',
    otherTitle: '还要理解的四条传导渠道', otherNote: '机制说明 · 这四类因素暂未接入图表。具体影响取决于经济状况和政策应对。',
    channels: [
      { id: 'fiscal', title: '财政政策与需求', body: '政府支出和税收变化会影响需求。如果支出增长超出生产能力，物价压力可能上升；结果取决于闲置产能及政策融资方式。', source: sources.basics },
      { id: 'exchange', title: '汇率与进口价格', body: '本币贬值可能使进口商品的本币价格上涨。合同、计价货币和企业利润空间，会影响涨价传递到零售端的幅度和速度。', source: sources.exchange },
      { id: 'supply', title: '供应链与生产能力', body: '灾害、运输中断和短缺可能限制供给或推高成本。供应恢复有助于缓解压力，但通胀回落不一定使此前上涨的价格恢复原位。', source: sources.basics },
      { id: 'expectations', title: '通胀预期', body: '对未来物价的预期会影响工资谈判和企业定价，可能进一步强化通胀。但预期不是对未来实际通胀的保证。', source: sources.expectations },
    ],
  },
}
