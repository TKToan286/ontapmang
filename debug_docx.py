import sys
from docx import Document

sys.stdout.reconfigure(encoding='utf-8')

def debug_docx(filepath):
    doc = Document(filepath)
    count = 0
    for block in doc.element.body:
        if block.tag.endswith('p'):
            from docx.text.paragraph import Paragraph
            p = Paragraph(block, doc)
            text = p.text.strip()
            if text:
                print(f"P: {text}")
        elif block.tag.endswith('tbl'):
            from docx.table import Table
            table = Table(block, doc)
            print(f"Table ({len(table.rows)} rows)")
            for i, row in enumerate(table.rows):
                row_data = [cell.text.strip() for cell in row.cells]
                print(f"  R{i}: {row_data}")
            count += 1
        if count >= 3:
            break

if __name__ == "__main__":
    debug_docx("d:/test/Bo-Trac-nghiem-Mang-may-tinh-2-1.docx")
