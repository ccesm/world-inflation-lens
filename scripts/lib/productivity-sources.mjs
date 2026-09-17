const BLS='U.S. Bureau of Labor Statistics', BEA='U.S. Bureau of Economic Analysis', FED='Board of Governors of the Federal Reserve System (US)'
const index='Index 2017=100', real='Billions of Chained 2017 Dollars', SA='Seasonally Adjusted', SAAR='Seasonally Adjusted Annual Rate'
const spec=(id,frequency,units,adjustment,publisher,start,group,definition,proxy=false)=>({id,frequency,units,adjustment,publisher,start,group,definition,proxy,positive:true})
export const productivitySources=[
 spec('OPHNFB','Quarterly',index,SA,BLS,'1947-01','productivity','Nonfarm business real output per hour of all workers; observed labor productivity, not an AI contribution.'),
 spec('ULCNFB','Quarterly',index,SA,BLS,'1947-01','labor','Nonfarm business nominal labor compensation per unit of real output.'),
 spec('COMPNFB','Quarterly',index,SA,BLS,'1947-01','labor','Nonfarm business nominal hourly compensation, including wages and benefits; same sector as OPHNFB and ULCNFB.'),
 spec('PNFIC1','Quarterly',real,SAAR,BEA,'2007-01','investment','Real private nonresidential fixed investment; broad business investment, not AI-only spending.',true),
 spec('A679RC1Q027SBEA','Quarterly','Billions of Dollars',SAAR,BEA,'1947-01','investment','Nominal private fixed investment in information processing equipment and software; AI investment proxy, includes non-AI technology.',true),
 spec('B985RC1Q027SBEA','Quarterly','Billions of Dollars',SAAR,BEA,'1959-01','investment','Nominal private nonresidential software investment; AI investment proxy, not a direct AI-spending measure.',true),
 spec('B935RC1Q027SBEA','Quarterly','Billions of Dollars',SAAR,BEA,'1959-01','investment','Nominal private investment in computers and peripheral equipment; includes non-AI uses.',true),
 spec('IPN22112CS','Monthly',index,SA,FED,'1972-01','electricity','Commercial and other electricity sales volume index. Demand proxy, not national kWh consumption or AI-specific load.',true),
 spec('CUUR0000SEHF01','Monthly','Index 1982-1984=100','Not Seasonally Adjusted',BLS,'1913-12','electricity','U.S. city average consumer electricity price index; not industrial tariffs or data-center electricity costs.'),
 spec('GDPC1','Quarterly',real,SAAR,BEA,'1947-01','growth','Observed real U.S. GDP at seasonally adjusted annual rate; not potential GDP.'),
 spec('CE16OV','Monthly','Thousands of Persons',SA,BLS,'1948-01','growth','Civilian employed persons age 16 and older, household survey. Population-control breaks are not adjusted by this site.'),
 spec('IPG3344S','Monthly',index,SA,FED,'1972-01','investment','Real production of semiconductors and other electronic components, NAICS 3344; broader than AI chips, not installed compute capacity.',true),
 spec('MHHNGSP','Monthly','Dollars per Million BTU','Not Seasonally Adjusted','U.S. Energy Information Administration','1997-01','electricity','Henry Hub natural gas spot price; a generation-input benchmark, not an electricity tariff or a measure of AI demand.'),
]
export const censusUrl='https://www.census.gov/construction/c30/xlsx/privsatime.xlsx'
export const censusSource='https://www.census.gov/construction/c30/historical_data.html'
export const censusSpecs=[
 {id:'CENSUS_DATACENTER',column:'Data center',start:'2014-01',proxy:true,definition:'Private data-center construction spending, including non-AI data centers. Buildings put in place, not total AI capex, equipment purchases or installed computing capacity.'},
 {id:'CENSUS_NONRES',column:'Nonresidential',start:'1993-01',proxy:true,definition:'Broad private nonresidential construction spending; not AI-specific infrastructure.'},
 {id:'CENSUS_ELECTRONIC',column:'Computer/ electronic/ electrical',start:'1993-01',proxy:true,definition:'Private computer, electronic and electrical manufacturing construction; broader than semiconductor fabs and not an AI-only measure.'},
]
