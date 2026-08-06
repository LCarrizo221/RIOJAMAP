import ExcelJS from 'exceljs';
import { fileURLToPath } from 'url';
import path from 'path';

async function readExcel(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  console.log(`📊 Total sheets: ${workbook.worksheets.length}\n`);

  workbook.worksheets.forEach((worksheet, sheetIndex) => {
    console.log(`\n=== Sheet: "${worksheet.name}" ===`);
    
    const rowCount = worksheet.rowCount;
    if (rowCount === 0) {
      console.log('(Empty sheet)');
      return;
    }

    // Header row
    const headerRow = worksheet.getRow(1);
    const headers = [];
    headerRow.eachCell((cell, colNumber) => {
      headers.push(cell.value);
    });

    console.log(`Columns: ${headers.length}`);
    console.log(`Rows: ${rowCount - 1}\n`);

    // Column analysis
    console.log('📋 Column Analysis:');
    console.log('---');

    for (let colIndex = 0; colIndex < headers.length; colIndex++) {
      const colName = headers[colIndex];
      const samples = [];
      let nullCount = 0;
      let dataTypes = new Set();

      // Sample 5 data rows
      for (let rowIndex = 2; rowIndex <= Math.min(6, rowCount); rowIndex++) {
        const row = worksheet.getRow(rowIndex);
        const cell = row.getCell(colIndex + 1);
        const value = cell.value;

        if (value === null || value === undefined) {
          nullCount++;
        } else {
          samples.push(value);
          dataTypes.add(typeof value);
        }
      }

      const dataType = dataTypes.size === 0 ? 'unknown' : Array.from(dataTypes).join('/');
      
      console.log(`\n${colIndex + 1}. "${colName}"`);
      console.log(`   Type: ${dataType}`);
      console.log(`   Nulls: ${nullCount}/${Math.min(5, rowCount - 1)}`);
      console.log(`   Samples: ${samples.slice(0, 3).map(s => JSON.stringify(s)).join(', ')}`);
    }

    // Data sample table
    console.log('\n📄 Data Sample (first 3 rows):');
    console.log('---');
    console.log(headers.map(h => (h || '').toString().padEnd(20)).join('| '));
    console.log('-'.repeat(headers.length * 22));
    
    for (let rowIndex = 2; rowIndex <= Math.min(4, rowCount); rowIndex++) {
      const row = worksheet.getRow(rowIndex);
      let rowData = [];
      row.eachCell((cell, colNumber) => {
        const value = cell.value === null ? '(null)' : cell.value.toString();
        rowData.push(value.padEnd(20));
      });
      console.log(rowData.join('| '));
    }
  });
}

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node read-excel.js <file-path>');
  process.exit(1);
}

readExcel(filePath).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
