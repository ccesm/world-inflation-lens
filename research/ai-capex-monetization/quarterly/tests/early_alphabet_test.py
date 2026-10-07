"""Small controlled layout fixtures, never accepted economic observations."""
import sys
from pathlib import Path
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from extract import early_alphabet

def rows(lines):
    return [(label, values, label, i+1) for i,(label,values) in enumerate(lines)]

class EarlyAlphabet(unittest.TestCase):
    def setUp(self):
        self.source = {'company':'GOOG','sourceId':'synthetic-legacy','periodEnd':'2020-12-31'}
        self.header = 'Q4 2019 Q1 2020 Q2 2020 Q3 2020 Q4 2020 2018 2019 2020'
    def segment(self):
        return rows([('Segment results',[]),('The following table presents our revenues and operating income (loss) (in millions; unaudited):',[]), (self.header,[]),('Revenues:',[]),('Google Cloud',[10,20,30,40,50,111,222,333]),(self.header,[]),('Operating income (loss):',[]),('Google Cloud',[-1,-2,-3,-4,-5,-111,-222,-333])])
    def test_exact_quarter_columns_no_fiscal_year_alias(self):
        result=early_alphabet(self.source,[('fixture',self.segment())])
        self.assertEqual(len(result),10)
        self.assertEqual([o['value'] for o in result[:5]],[10,20,30,40,50])
        self.assertTrue(all(o['periodType']=='Q' for o in result))
        self.assertEqual(result[0]['revisionStatus'],'COMPARATIVE_VINTAGE')
        self.assertEqual(result[4]['revisionStatus'],'ORIGINAL_RELEASE_VINTAGE')
    def test_changed_header_rejected(self):
        r=self.segment();r[2]=(self.header.replace('Q1 2020','Q2 2020'),[],self.header.replace('Q1 2020','Q2 2020'),3)
        with self.assertRaisesRegex(ValueError,'COLUMN'):early_alphabet(self.source,[('fixture',r)])
    def test_missing_cloud_column_rejected(self):
        r=self.segment();r[4]=('Google Cloud',[10,20,30,40,50,111,222],'Google Cloud',5)
        with self.assertRaisesRegex(ValueError,'COLUMN'):early_alphabet(self.source,[('fixture',r)])
    def test_missing_metric_identity_rejected(self):
        r=self.segment();r[6]=('Different metric',[],'Different metric',7)
        with self.assertRaisesRegex(ValueError,'METRIC'):early_alphabet(self.source,[('fixture',r)])
    def fcf(self):
        return rows([('Reconciliation from net cash provided by operating activities to free cash flow (in millions; unaudited):',[]),('Quarter Ended December 31, 2020',[]),('Free cash flow',[25])])
    def test_single_quarter_fcf(self):
        result=early_alphabet(self.source,[('fixture',self.fcf())]);self.assertEqual(result[0]['value'],25);self.assertEqual(result[0]['metric'],'fcfReported')
    def test_annual_header_cannot_be_quarter_fcf(self):
        r=self.fcf();r[1]=('Year Ended December 31, 2020',[],'Year Ended December 31, 2020',2)
        self.assertEqual(early_alphabet(self.source,[('fixture',r)]),[])
    def test_wrong_year_cannot_be_quarter_fcf(self):
        r=self.fcf();r[1]=('Quarter Ended December 31, 2019',[],'Quarter Ended December 31, 2019',2)
        self.assertEqual(early_alphabet(self.source,[('fixture',r)]),[])
    def test_ambiguous_fcf_is_not_accepted(self):
        r=self.fcf()+rows([('Free cash flow',[999])]);self.assertEqual(early_alphabet(self.source,[('fixture',r)]),[])
    def test_no_extension_to_other_publisher_or_modern_layout(self):
        for change in [{'company':'MSFT'},{'periodEnd':'2023-12-31'}]:self.assertEqual(early_alphabet({**self.source,**change},[('fixture',self.fcf())]),[])
if __name__=='__main__':unittest.main()
