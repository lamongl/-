import importlib.util
from pathlib import Path
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'experiments/csv-route/csv_sales_digest.py'
spec=importlib.util.spec_from_file_location('digest',SOURCE)
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class DigestTests(unittest.TestCase):
    def digest(self,text,months=('2026-08','2026-09'),**options):
        temporary_root=ROOT/'.test-tmp'
        temporary_root.mkdir(exist_ok=True)
        assert temporary_root.resolve().is_relative_to(ROOT.resolve())
        with tempfile.TemporaryDirectory(dir=temporary_root) as directory:
            file=Path(directory)/'sales.csv';file.write_text(text,encoding='utf-8-sig')
            return module.summarize(file,months=months,id_column='id',**options)

    def test_comparison_is_exact_and_compact_preserves_required_facts(self):
        result=self.digest('id,month,gross,refund,unit\na,2026-08,100,10,元\nb,2026-09,120,15,元\n',compare=('2026-08','2026-09'),compact=True)
        self.assertEqual(result['comparison']['net_change_yuan'],'15.00')
        self.assertEqual(result['comparison']['net_change_pct'],'16.67')
        self.assertEqual(result['months']['2026-08']['net_yuan'],'90.00')
        self.assertEqual(result['months']['2026-09']['rows'],1)
        self.assertEqual(result['total_rows'],2)
        self.assertEqual(len(result['source_sha256']),64)
        self.assertNotIn('scope',result)

    def test_zero_negative_or_missing_baseline_has_no_ordinary_growth_rate(self):
        for gross,refund in [('0','0'),('0','10')]:
            result=self.digest('id,month,gross,refund,unit\na,2026-08,'+gross+','+refund+',元\nb,2026-09,100,0,元\n',compare=('2026-08','2026-09'))
            self.assertIsNone(result['comparison']['net_change_pct'])
        result=self.digest('id,month,gross,refund,unit\na,2026-09,100,0,元\n',compare=('2026-08','2026-09'))
        self.assertIsNone(result['comparison']['net_change_yuan'])
        self.assertIsNone(result['comparison']['net_change_pct'])

    def test_mixed_units_and_decimal_precision(self):
        result=self.digest('id,month,gross,refund,unit\na,2026-08,0.01,0,元\nb,2026-08,1.23,0.03,万元\nc,2026-09,0,10,元\n')
        self.assertEqual(result['months']['2026-08']['net_yuan'],'12000.01')
        self.assertEqual(result['months']['2026-09']['net_yuan'],'-10.00')
        self.assertEqual(result['included_rows'],3)

    def test_explicit_filter_reports_excluded_rows(self):
        result=self.digest('id,month,gross,refund,unit\na,2026-07,100,0,元\nb,2026-08,50,5,元\n')
        self.assertEqual(result['excluded_rows'],1)
        self.assertEqual(result['months']['2026-09']['rows'],0)
        self.assertIsNone(result['months']['2026-09']['net_yuan'])

    def test_zero_is_not_missing(self):
        result=self.digest('id,month,gross,refund,unit\na,2026-08,0,0,元\n')
        self.assertEqual(result['months']['2026-08']['net_yuan'],'0.00')

    def test_invalid_or_ambiguous_values_fail_closed(self):
        for value in ['', 'NaN', 'Infinity', '1,200', 'abc']:
            with self.subTest(value=value),self.assertRaises(ValueError):
                self.digest('id,month,gross,refund,unit\na,2026-08,"'+value+'",0,元\n')
        with self.assertRaises(ValueError):
            self.digest('id,month,gross,refund,unit\na,2026-08,1,0,美元\n')

    def test_duplicate_ids_and_missing_columns_fail(self):
        with self.assertRaises(ValueError):
            self.digest('id,month,gross,refund,unit\na,2026-08,1,0,元\na,2026-09,2,0,元\n')
        with self.assertRaises(ValueError):
            self.digest('id,month,gross,unit\na,2026-08,1,元\n')

    def test_no_silent_extra_columns_or_subcent_rounding(self):
        with self.assertRaises(ValueError):
            self.digest('id,month,gross,refund,unit\na,2026-08,1,0,元,unmapped\n')
        with self.assertRaises(ValueError):
            self.digest('id,month,gross,refund,unit\na,2026-08,0.001,0,元\n')

if __name__=='__main__': unittest.main()
