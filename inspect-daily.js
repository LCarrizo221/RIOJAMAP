import ExcelJS from 'exceljs';

async function inspect() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('C:\\Users\\abrah\\Downloads\\INFORME DIARIO- RICARDO HERRERA 20-07-2026 (1).xlsx');
  
  wb.worksheets.forEach((ws, idx) => {
    console.log(`\n=== Sheet ${idx}: "${ws.name}" ===`);
    console.log(`Dimensions: rows=${ws.rowCount}, cols=${ws.columnCount}`);
    
    for (let r = 1; r <= Math.min(10, ws.rowCount); r++) {
      const row = ws.getRow(r);
      const vals = [];
      row.eachCell((cell, colNum) => {
        if (colNum <= 15) {
          vals.push(cell.value === null ? '(null)' : String(cell.value).substring(0, 25));
        }
      });
      console.log(`Row ${r}: ${vals.join(' | ')}`);
    }
  });
}

inspect().catch(err => console.error('Error:', err.message));
