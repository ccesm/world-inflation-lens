"""Read official workbooks without executing formulas/macros; emit only selected cells.
The SIPRI workbook stays temporary: do not redistribute the complete database.
"""
import json, sys

kind, path = sys.argv[1:3]
if kind == 'gpr':
    import xlrd
    book = xlrd.open_workbook(path)
    sheet = book.sheet_by_index(0)
    header = sheet.row_values(0)
    assert header[:4] == ['month', 'GPR', 'GPRT', 'GPRA']
    labels = {sheet.cell_value(r, header.index('var_name')): sheet.cell_value(r, header.index('var_label')) for r in range(1, sheet.nrows)}
    rows = []
    for r in range(1, sheet.nrows):
        date = xlrd.xldate_as_datetime(sheet.cell_value(r, 0), book.datemode).strftime('%Y-%m')
        if date >= '1985-01':
            rows.append([date] + [sheet.cell_value(r, c) for c in [1, 2, 3]])
    result = {'header': header[:4], 'labels': {k: labels[k] for k in header[1:4]}, 'rows': rows}
elif kind == 'sipri':
    import openpyxl
    book = openpyxl.load_workbook(path, data_only=True)
    sheets = {}
    for name in ['Share of GDP', 'Share of Govt. spending', 'Constant (2024) US$', 'Regional totals']:
        sheet = book[name]
        rows = list(sheet.values)
        header = next(r for r in rows if r[0] in ['Country', 'Region'])
        country = 'World' if name == 'Regional totals' else 'United States of America'
        selected = [(i, r) for i, r in enumerate(rows) if r[0] == country]
        assert len(selected) == 1
        row_index, row = selected[0]
        cells = []
        for col, year in enumerate(header):
            if isinstance(year, (int, float)) and 1900 <= year <= 2100:
                cell = sheet.cell(row_index + 1, col + 1)
                color = cell.font.color
                cells.append({'date': str(int(year)), 'value': row[col], 'sourceColor': str(color.rgb) if color and color.type == 'rgb' else None, 'sourceFormat': cell.number_format})
        sheets[name] = {'title': rows[0][0], 'notes': [r[0] for r in rows[1:5]], 'row': country, 'cells': cells}
    footnote = next(r[2] for r in book['Footnotes'].values if r[0] == 44)
    assert 'All figures for the USA are for financial year' in footnote
    result = {'sheets': sheets, 'usFootnote': footnote}
else:
    raise ValueError('Unknown workbook type')
print(json.dumps(result, ensure_ascii=False, allow_nan=False))
