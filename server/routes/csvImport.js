/**
 * CSV Import Routes
 */
const express = require('express');
const router = express.Router();
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { authenticateToken, requireRole } = require('../auth');
const { insertCustomerWithDetails } = require('../database');

// CSV parsing helpers
const parseCSVProblems = (problemsData) => {
  const problems = [];
  for (let i = 1; i <= 6; i++) {
    const problem = problemsData[`ปัญหาที่ทำให้ขอสินเชื่อไม่ได้ ปัญหาที่ ${i}`];
    if (problem && problem.trim() && problem.trim() !== '') {
      problems.push(problem.trim());
    }
  }
  return problems;
};

const parseCSVActionPlans = (actionPlansData) => {
  const plans = [];
  for (let i = 1; i <= 6; i++) {
    const planNote = actionPlansData[`แผนแกเคส รายการที่ ${i}`];
    if (planNote && planNote.trim() && planNote.trim() !== '') {
      plans.push(planNote.trim());
    }
  }
  return plans;
};

const convertCSVToCustomerData = (csvRow) => {
  const basicData = {
    date: csvRow['วันที่ CA'] || new Date().toISOString().split('T')[0],
    name: `${csvRow['คำนำหน้า'] || ''} ${csvRow['ชื่อ'] || ''} ${csvRow['สกุล'] || ''}`.trim(),
    age: parseInt(csvRow['อายุ']) || null,
    phone: csvRow['เบอร์โทร'] || '',
    job: csvRow['อาชีพ'] || '',
    position: csvRow['ตำแหน่ง'] || '',
    businessOwnerType: csvRow['เจ้าของธุรกิจ'] ? 'เจ้าของธุรกิจ' : 'ไม่ใช่เจ้าของธุรกิจ',
    privateBusinessType: csvRow['เจ้าของธุรกิจ'] || '',
    projectName: csvRow['โครงการ'] || '',
    unit: csvRow['เลขห้อง'] || '',
    propertyValue: parseFloat(csvRow['มูลค่าเช่าออม']) || 0,
    monthlyRentToOwnRate: parseFloat(csvRow['อัตราเช่าออม']) || 0,
    officer: csvRow['ผู้วิเคราะห์'] || 'นายพิชญ์ สุดทัน'
  };

  const financialData = {
    income: parseFloat(csvRow['รายได้ ติดตาม 0']) || 0,
    debt: parseFloat(csvRow['ภาระหนี้ ติดตาม 0']) || 0,
    maxDebtAllowed: parseFloat(csvRow['หนี้ไม่ควรเกิน']) || 0,
    loanTerm: parseFloat(csvRow['ระยะเวลาขอสินเชื่อ ติดตาม 0']) || 0,
    ltv: parseFloat(csvRow['LTV ติดตาม 0']) || 0,
    ltvNote: csvRow['LTV เหตผล ติดตาม 0'] || '',
    selectedBank: csvRow['ธนาคารที่ควรยื่นขอสินเชื่อ ติดตาม 0'] || '',
    targetBank: csvRow['ธนาคารที่ควรยื่นขอสินเชื่อ ติดตาม 0'] || '',
    targetDate: csvRow['ระยะเวลากู้ Target'] || new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]
  };

  const loanProblem = parseCSVProblems(csvRow);
  const actionPlan = parseCSVActionPlans(csvRow);

  const actionPlanProgress = Math.min(100, loanProblem.length > 0 ? (actionPlan.length / loanProblem.length) * 100 : 100);
  const dsr = financialData.income > 0 ? (financialData.debt / financialData.income) * 100 : 0;
  let dsrScore = 50;
  let financialStatus = 'ต้องปรับปรุง';
  if (dsr < 40) { financialStatus = 'ดีเยี่ยม'; dsrScore = 100; }
  else if (dsr < 60) { financialStatus = 'เฝ้าระวัง'; dsrScore = 75; }

  const potentialScore = Math.round((actionPlanProgress * 0.5) + (dsrScore * 0.5));

  return {
    ...basicData, ...financialData,
    potentialScore, financialStatus,
    actionPlanProgress: Math.round(actionPlanProgress),
    paymentHistory: 'นำเข้าจาก CSV',
    loanProblem, actionPlan
  };
};

// CSV Import
router.post('/import-csv', authenticateToken, requireRole(['admin', 'data_entry']), async (req, res) => {
  try {
    const csvPath = path.join(__dirname, '../../CV/database from ca cl fixed.csv');
    if (!fs.existsSync(csvPath)) {
      return res.status(404).json({ message: 'CSV file not found' });
    }

    const errors = [];
    let processedCount = 0;
    let successCount = 0;
    const results = [];
    const csvData = [];

    fs.createReadStream(csvPath)
      .pipe(csv({ skipEmptyLines: true, skipLinesWithError: true }))
      .on('data', (data) => csvData.push(data))
      .on('end', async () => {
        const dataRows = csvData.slice(3);
        for (const row of dataRows) {
          try {
            processedCount++;
            if (!row['ชื่อ'] || !row['สกุล']) continue;
            const customerData = convertCSVToCustomerData(row);
            const customerId = await insertCustomerWithDetails(customerData);
            results.push({ id: customerId, name: customerData.name, status: 'success' });
            successCount++;
          } catch (error) {
            errors.push({ row: processedCount, name: `${row['ชื่อ']} ${row['สกุล']}`, error: error.message });
          }
        }
        res.json({
          message: 'CSV import completed',
          summary: { totalRows: dataRows.length, processed: processedCount, successful: successCount, errors: errors.length },
          results, errors
        });
      })
      .on('error', (error) => res.status(500).json({ message: 'Error reading CSV file', error: error.message }));
  } catch (error) {
    res.status(500).json({ message: 'Error importing CSV', error: error.message });
  }
});

// Debug CSV
router.get('/debug-csv-parsing', (req, res) => {
  try {
    const csvPath = path.join(__dirname, '../../CV/database from ca cl fixed.csv');
    const results = [];
    let rowCount = 0;

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        if (rowCount < 5) {
          results.push({
            row: rowCount,
            name: `${row['คำนำหน้า'] || ''} ${row['ชื่อ'] || ''} ${row['สกุล'] || ''}`.trim(),
            problems: parseCSVProblems(row),
            plans: parseCSVActionPlans(row)
          });
        }
        rowCount++;
      })
      .on('end', () => res.json({ totalRows: rowCount, debugResults: results }))
      .on('error', (error) => res.status(500).json({ message: 'Error reading CSV file', error: error.message }));
  } catch (error) {
    res.status(500).json({ message: 'Error debugging CSV', error: error.message });
  }
});

// Clear all customers
router.post('/clear-customers', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { db } = require('../database');
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('DELETE FROM loan_problems', (err) => { if (err) reject(err); });
        db.run('DELETE FROM action_plans', (err) => { if (err) reject(err); });
        db.run('DELETE FROM customers', (err) => { if (err) reject(err); else resolve(); });
      });
    });
    res.json({ message: 'All customer data cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing customer data', error: error.message });
  }
});

// Test CSV structure
router.get('/test-csv', async (req, res) => {
  try {
    const csvPath = path.join(__dirname, '../../CV/database from ca cl fixed.csv');
    const csvData = [];
    fs.createReadStream(csvPath)
      .pipe(csv({ skipEmptyLines: true, skipLinesWithError: true }))
      .on('data', (data) => csvData.push(data))
      .on('end', () => {
        const firstRow = csvData[3];
        res.json({
          totalRows: csvData.length,
          columnCount: Object.keys(firstRow).length,
          sampleRow: firstRow
        });
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
