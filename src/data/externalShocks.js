// Registry only: existing series are referenced, never copied or synthesized.
// Planned indicators deliberately have no observations, values or implied probability.
export const shockTopics = ['geopolitical', 'energy', 'food', 'supply-chain', 'shipping', 'history']
export const shockIndicators = [
  { id: 'oil', topic: 'energy', status: 'available', driverKey: 'oil', href: '#/drivers?topic=energy' },
  { id: 'energy-cpi', topic: 'energy', status: 'available', driverKey: 'energy', href: '#/drivers?topic=energy' },
  { id: 'food-cpi', topic: 'food', status: 'available', driverKey: 'food', href: '#/drivers?topic=food' },
  { id: 'gpr', topic: 'geopolitical', status: 'available', seriesId: 'GPR', href: '#/external-shocks?topic=geopolitical' },
  { id: 'defense', topic: 'geopolitical', status: 'available', seriesId: 'SIPRI_US_GDP', href: '#/external-shocks?topic=geopolitical' },
  { id: 'natural-gas', topic: 'energy', status: 'planned' },
  { id: 'fao-food', topic: 'food', status: 'available', seriesId: 'FAO_FOOD', href: '#/external-shocks?topic=food' },
  { id: 'gscpi', topic: 'supply-chain', status: 'available', seriesId: 'GSCPI', href: '#/external-shocks?topic=supply-chain' },
  { id: 'freight', topic: 'shipping', status: 'planned' },
]

export const shockFields = ['shock', 'energy', 'food', 'supply', 'inflation', 'fiscal', 'monetary']
export const shockSources = {
  bls: { name: 'BLS · A century of consumer prices', url: 'https://www.bls.gov/opub/mlr/2014/article/one-hundred-years-of-price-change-the-consumer-price-index-and-the-american-inflation-experience.htm' },
  wwi: { name: 'Federal Reserve History · WWI', url: 'https://www.federalreservehistory.org/essays/feds-role-during-wwi' },
  wwii: { name: 'Federal Reserve History · WWII', url: 'https://www.federalreservehistory.org/essays/feds-role-during-wwii' },
  accord: { name: 'Federal Reserve History · Treasury–Fed Accord', url: 'https://www.federalreservehistory.org/essays/treasury-fed-accord' },
  oil73: { name: 'Federal Reserve History · 1973–74', url: 'https://www.federalreservehistory.org/essays/oil-shock-of-1973-74' },
  oil79: { name: 'Federal Reserve History · 1978–79', url: 'https://www.federalreservehistory.org/essays/oil-shock-of-1978-79' },
  gulf: { name: 'GAO · Gulf War allied contributions', url: 'https://www.gao.gov/products/t-nsiad-91-52' },
  rates: { name: 'Federal Reserve / FRED · FEDFUNDS', url: 'https://fred.stlouisfed.org/series/FEDFUNDS' },
  commodities: { name: 'IMF · Food and fuel policy responses, 2008', url: 'https://www.imf.org/external/np/pp/eng/2008/091908.pdf' },
  pandemic: { name: 'BLS · Pandemic food prices, 2020', url: 'https://www.bls.gov/opub/mlr/2020/article/the-impact-of-the-covid-19-pandemic-on-food-price-indexes-and-data-collection.htm' },
  fed2020: { name: 'Federal Reserve · 2020 policy report', url: 'https://www.federalreserve.gov/publications/2020-monetary-policy.htm' },
  ukraine: { name: 'IMF · Ukraine war economic impact, March 2022', url: 'https://www.imf.org/en/news/articles/2022/03/05/pr2261-imf-staff-statement-on-the-economic-impact-of-war-in-ukraine' },
  fed2022: { name: 'FOMC · March 2022 minutes', url: 'https://www.federalreserve.gov/monetarypolicy/fomcminutes20220316.htm' },
}
const field = (en, zh, ...sources) => ({ en, zh, sources })
// Each field has its own attribution. Unsized channels and unavailable evidence are explicit.
export const shockEpisodes = [
  { id: 'wwi', years: '1914–1918', name: { en: 'World War I', zh: '第一次世界大战' }, fields: {
    shock: field('War mobilization redirected production toward military demand.', '战争动员使生产转向军事需求。', 'wwi'),
    energy: field('Fuel pressures are context; no comparable modern energy CPI is available here for this period.', '燃料压力属于背景；本站没有这一时期可比的现代能源 CPI 数据。'),
    food: field('Food-price increases were prominent in wartime inflation.', '食品涨价是战时通胀的突出表现。', 'bls'),
    supply: field('Exports to Europe increased demand for U.S. supplies; no freight contribution is estimated.', '对欧出口增加了对美国物资的需求；此处未估算运价的独立贡献。', 'wwi'),
    inflation: field('Inflation reflected both wartime demand and expanding money and credit.', '通胀同时受到战时需求以及货币和信贷扩张的影响。', 'wwi'),
    fiscal: field('Spending outpaced revenue; Liberty Loans helped finance the gap.', '支出超过收入，自由公债帮助弥补融资缺口。', 'wwi'),
    monetary: field('The Fed supported war borrowing with preferential bank lending rates.', '美联储通过优惠银行贷款利率支持战争融资。', 'wwi'),
  } },
  { id: 'wwii', years: '1939–1945', name: { en: 'World War II', zh: '第二次世界大战' }, fields: {
    shock: field('U.S. mobilization after 1941 expanded military production.', '1941年后，美国动员扩大了军事生产。', 'wwii'),
    energy: field('Scarce civilian goods faced controls; no separate fuel-shock estimate is made here.', '稀缺民用品受到管制；此处未单独估算燃料冲击。', 'wwii'),
    food: field('Rationing and price controls constrained food markets.', '配给和价格管制约束了食品市场。', 'bls'),
    supply: field('Military production limited supplies available to consumers.', '军事生产限制了面向消费者的商品供应。', 'wwii'),
    inflation: field('Controls restrained measured prices; inflation surged after the war.', '管制抑制了记录中的物价涨幅；战后通胀上升。', 'accord'),
    fiscal: field('Taxes and domestic borrowing financed much larger war spending.', '税收和国内借款为大幅增加的战争支出融资。', 'wwii'),
    monetary: field('The Fed supported low Treasury yields; the 1951 Accord later restored policy separation.', '美联储支持低国债收益率；1951年协议随后恢复货币政策与债务管理的分离。', 'accord'),
  } },
  { id: 'oil-1973', years: '1973–1974', name: { en: '1973 Oil Embargo', zh: '1973年石油禁运' }, fields: {
    shock: field('The Arab oil embargo added to an already difficult inflation environment.', '阿拉伯产油国的石油禁运加剧了原有通胀困境。', 'oil73'),
    energy: field('Oil supply restrictions drove a sharp oil-price increase.', '石油供应限制推动油价急升。', 'oil73'),
    food: field('Food inflation also mattered; it cannot all be attributed to oil.', '食品通胀也很重要，不能全部归因于石油。', 'bls'),
    supply: field('Channel: dearer fuel can raise transport costs; its separate effect is not estimated.', '传导渠道：燃料变贵可能提高运输成本；未估算独立效应。'),
    inflation: field('Energy amplified broader inflation; policy and other forces also mattered.', '能源放大了广泛的通胀压力，政策和其他因素也发挥作用。', 'oil73'),
    fiscal: field('The U.S. requested emergency aid for Israel; no deficit effect is isolated here.', '美国提出对以色列紧急援助请求；此处未分离其赤字影响。', 'oil73'),
    monetary: field('Policymakers underestimated monetary policy’s role in persistent inflation.', '政策制定者低估了货币政策在持续通胀中的作用。', 'oil73'),
  } },
  { id: 'oil-1979', years: '1978–1980', name: { en: '1979 Oil Shock', zh: '1979年石油冲击' }, fields: {
    shock: field('Iran’s revolution interrupted production amid strong global demand.', '伊朗革命扰乱生产，同时全球需求强劲。', 'oil79'),
    energy: field('Oil prices rose; precautionary stockpiling compounded supply concerns.', '油价上涨，预防性囤积加重了供应担忧。', 'oil79'),
    food: field('Channel: fuel can affect farm costs; no isolated food effect is measured here.', '传导渠道：燃料可能影响农业成本；此处未单独测量食品影响。'),
    supply: field('Inventory demand amplified pressure; no shipping index is integrated.', '库存需求放大压力；航运指数尚未接入。', 'oil79'),
    inflation: field('Inflation was accelerating before the oil spike.', '在油价急升之前，通胀已经加速。', 'oil79'),
    fiscal: field('An episode-specific fiscal response is not quantified in this collection.', '当前资料未量化专门针对这次冲击的财政应对。'),
    monetary: field('Earlier accommodation gave way to Volcker’s anti-inflation turn.', '此前的宽松转向沃尔克时期的反通胀政策。', 'oil79'),
  } },
  { id: 'gulf', years: '1990–1991', name: { en: '1990 Gulf War', zh: '1990年海湾战争' }, fields: {
    shock: field('The Gulf crisis produced an energy shock alongside recession.', '海湾危机带来能源冲击，并与经济衰退重叠。', 'bls'),
    energy: field('Energy prices spiked, then reversed after the war.', '能源价格急升，战后回落。', 'bls'),
    food: field('No war-specific food contribution is isolated here.', '此处未分离战争对食品价格的独立贡献。'),
    supply: field('Channel: disrupted trade can affect transport; no freight series is available here.', '传导渠道：贸易受扰可能影响运输；此处没有运价序列。'),
    inflation: field('Inflation later slowed with falling energy prices and recession.', '能源价格下降和衰退伴随着随后的通胀放缓。', 'bls'),
    fiscal: field('Allied contributions offset U.S. military costs; gross spending is not net fiscal cost.', '盟国出资抵消了美国部分军费；总支出不等于净财政成本。', 'gulf'),
    monetary: field('Effective federal funds rates declined during 1990–91; this alone does not identify the cause.', '1990–1991年有效联邦基金利率下降；仅凭这一变化不能识别原因。', 'rates'),
  } },
  { id: 'commodities', years: '2008', name: { en: '2008 Commodity Spike', zh: '2008年大宗商品涨价' }, fields: {
    shock: field('Food and fuel price pressure preceded a severe global downturn.', '食品与燃料价格压力出现在全球严重衰退之前。', 'commodities', 'bls'),
    energy: field('Energy prices rose sharply and then collapsed.', '能源价格大幅上涨，随后急跌。', 'bls'),
    food: field('Costlier food strained importing economies and household budgets.', '食品变贵挤压了进口经济体和家庭预算。', 'commodities'),
    supply: field('Channel: input and transport costs can transmit commodity pressure; no separate estimate is made.', '传导渠道：投入品和运输成本可以传递商品价格压力；此处未单独估算。'),
    inflation: field('Headline inflation rose, then weakened as the crisis deepened.', '整体通胀上升，随后随危机加深而减弱。', 'bls'),
    fiscal: field('Across countries, tax cuts, subsidies and transfers cushioned food and fuel costs.', '多国通过减税、补贴和转移支付缓解食品与燃料成本。', 'commodities'),
    monetary: field('U.S. policy rates fell during the financial crisis, despite earlier commodity inflation.', '尽管此前商品价格上涨，美国政策利率仍在金融危机中下降。', 'rates'),
  } },
  { id: 'pandemic', years: '2020–2021', name: { en: 'Pandemic Supply Disruption', zh: '疫情供应中断' }, fields: {
    shock: field('Closures disrupted production and shifted consumer demand.', '停业扰乱生产，并改变消费需求结构。', 'pandemic'),
    energy: field('Oil initially fell as demand contracted; shocks need not raise every price.', '需求收缩初期油价下跌；冲击不一定推高所有价格。', 'pandemic'),
    food: field('Grocery demand and processing disruptions pushed some food prices higher.', '杂货需求及加工中断推高了部分食品价格。', 'pandemic'),
    supply: field('Suppliers had to redirect food from restaurants to retail channels.', '供应商需要将餐饮渠道的食品转向零售。', 'pandemic'),
    inflation: field('The initial demand slump dampened inflation; supply and demand effects differed.', '初期需求下滑抑制了通胀；供需两侧影响并不相同。', 'fed2020'),
    fiscal: field('Emergency fiscal support cushioned households and businesses.', '紧急财政支持缓冲了家庭与企业受到的冲击。', 'fed2020'),
    monetary: field('The Fed cut rates toward zero and expanded asset purchases and lending support.', '美联储降息至接近零，并扩大资产购买和贷款支持。', 'fed2020'),
  } },
  { id: 'ukraine', years: '2022', name: { en: 'Energy and Food Shock', zh: '能源与粮食冲击' }, fields: {
    shock: field('Russia’s invasion of Ukraine added to existing pandemic-era pressures.', '俄罗斯入侵乌克兰加剧了疫情时期已有的压力。', 'ukraine'),
    energy: field('Energy prices rose as trade and supply risks intensified.', '贸易与供应风险加剧时，能源价格上涨。', 'ukraine'),
    food: field('Wheat and grain prices increased, hurting importing economies.', '小麦及谷物涨价，冲击了进口经济体。', 'ukraine'),
    supply: field('Damaged or closed ports disrupted trade and food supply.', '港口受损或关闭扰乱了贸易和食品供应。', 'ukraine'),
    inflation: field('The shock added inflation pressure while weakening activity.', '冲击增加了通胀压力，同时削弱经济活动。', 'ukraine'),
    fiscal: field('The IMF recommended targeted support for vulnerable households; this is guidance, not a measured spending series.', 'IMF 建议定向支持脆弱家庭；这是政策建议，不是已测量的支出序列。', 'ukraine'),
    monetary: field('The Fed began raising rates in March against inflation already above target.', '美联储于3月开始加息，应对早已高于目标的通胀。', 'fed2022'),
  } },
]
