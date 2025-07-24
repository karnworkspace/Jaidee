const fs = require('fs');
const csv = require('csv-parser');

let firstDataRow = true;
fs.createReadStream('../CV/database from ca.csv')
  .pipe(csv())
  .on('data', (row) => {
    if (firstDataRow) {
      firstDataRow = false;
      return; // Skip first data row as it contains sub-headers
    }
    
    const allKeys = Object.keys(row);
    console.log('All columns in actual data row:');
    allKeys.forEach((key, index) => {
      if ((key.includes('รายได้') || key.includes('ภาระหนี้') || key.includes('หนี้ไม่ควรเกิน')) && row[key] && !isNaN(parseFloat(row[key]))) {
        console.log('Index', index, ':', key, '=', row[key]);
      }
    });
    
    console.log('\nAll columns with numeric values:');
    allKeys.forEach((key, index) => {
      if (row[key] && !isNaN(parseFloat(row[key])) && parseFloat(row[key]) > 1000) {
        console.log('Index', index, ':', key, '=', row[key]);
      }
    });
    process.exit(0);
  });