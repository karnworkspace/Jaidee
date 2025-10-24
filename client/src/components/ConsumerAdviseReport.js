import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS } from '../config/api';
import styles from './ConsumerAdviseReport.module.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ConsumerAdviseReport = ({ customerData, onClose }) => {
  const { authenticatedFetch } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [selectedInstallment, setSelectedInstallment] = useState(36);
  const [additionalNotes, setAdditionalNotes] = useState(['', '', '', '']);
  
  const [debtLimit, setDebtLimit] = useState('8000');
  const [loanTermAfter, setLoanTermAfter] = useState('40');
  const componentRef = useRef();

  const loadSavedReportData = useCallback(async () => {
    try {
      const response = await authenticatedFetch(API_ENDPOINTS.REPORT_BY_CUSTOMER(customerData.id));

      if (response.ok) {
        const savedData = await response.json();
        
        if (savedData && savedData.length > 0) {
          // เรียงลำดับตาม ID จากมากไปน้อย แล้วใช้ข้อมูลล่าสุด
          const sortedData = savedData.sort((a, b) => b.id - a.id);
          
          const latestReport = sortedData[0]; // ข้อมูลแรกหลังเรียงลำดับ
          
          // อัปเดต state ด้วยข้อมูลที่บันทึกไว้
          setSelectedInstallment(latestReport.selected_installment || 36);
          setDebtLimit(latestReport.debt_limit?.toString() || '8000');
          setLoanTermAfter(latestReport.loan_term_after?.toString() || '40');
          
          // อัปเดตหมายเหตุ
          if (latestReport.additional_notes) {
            try {
              let notes;
              if (typeof latestReport.additional_notes === 'string') {
                notes = JSON.parse(latestReport.additional_notes);
              } else {
                notes = latestReport.additional_notes;
              }
              // ให้แน่ใจว่ามี 4 ตัวเสมอ
              const fullNotes = ['', '', '', ''];
              if (Array.isArray(notes)) {
                notes.forEach((note, index) => {
                  if (index < 4) {
                    fullNotes[index] = note || '';
                  }
                });
              }
              setAdditionalNotes(fullNotes);
            } catch (e) {
              // ถ้า parse ไม่ได้ ให้ใช้ค่าเริ่มต้น 4 ตัว
              setAdditionalNotes(['', '', '', '']);
            }
          } else {
            // ถ้าไม่มีข้อมูล ให้ใช้ค่าเริ่มต้น 4 ตัว
            setAdditionalNotes(['', '', '', '']);
          }
        } else {
          // ถ้าไม่มีข้อมูลที่บันทึกไว้เลย ให้ใช้ค่าเริ่มต้น
          setAdditionalNotes(['', '', '', '']);
        }
      }
    } catch (error) {
      // Handle error silently or show user-friendly message if needed
    }
    }, [customerData.id, authenticatedFetch]);

  const initializeReport = useCallback(async () => {
    if (customerData) {
      // สร้าง reportData พื้นฐานก่อน
      const report = {
        ...customerData,
        reportDate: new Date().toLocaleDateString('th-TH'),
        analyst: customerData.officer || 'นายพิชญ์ สุดทัน',
        
        // ข้อมูลรายได้และภาระหนี้ - ใช้ข้อมูลจริง
        income: parseFloat(customerData.income) || 0,
        debt: parseFloat(customerData.debt) || 0,
        loanTerm: parseInt(customerData.loanTerm) || 40,
        ltv: parseFloat(customerData.ltv) || 100,
        ltvNote: customerData.ltvNote || 'House 1 (บ้านหลังที่ 1)',
        installmentRate: 10300, // บาทต่อเดือนต่อเงินกู้ 1 ล้านบาท
        
        // ข้อมูลปัญหา - ใช้ข้อมูลจริง
        problems: customerData.loanProblem || [
          'ไม่มีข้อมูลปัญหาด้านสินเชื่อ'
        ],
        
        // แผนการแก้ไข - ใช้ข้อมูลจริง
        actionPlan: customerData.actionPlan && customerData.actionPlan.length > 0 
          ? customerData.actionPlan 
          : ['ไม่มีแผนการดำเนินการ'],
        expectedCompletion: customerData.targetDate 
          ? new Date(customerData.targetDate).toLocaleDateString('th-TH', { 
              year: 'numeric', 
              month: 'long' 
            })
          : 'มิถุนายน 2569',
        
        // ข้อมูลเช่าออม - ใช้ข้อมูลจริง
        propertyValue: parseFloat(customerData.propertyPrice) || parseFloat(customerData.propertyValue) || 0,
        monthlyRent: customerData.detailedRentToOwnEstimation?.monthlyRent || 0,
        currentInstallment: 36, // ค่าเริ่มต้น - เปลี่ยนจาก 12 เป็น 36
        remainingPrincipal: customerData.detailedRentToOwnEstimation?.remainingPrincipal || 0,
        
        // ตารางประมาณการวงเงินสินเชื่อ - ใช้ข้อมูลจริงจาก loanEstimation
        loanEstimationTable: customerData.loanEstimation || [
          { debt: 0, year40: 0, year30: 0, year20: 0, year10: 0 }
        ],
        
        // ตารางเช่าออม - ใช้ข้อมูลจริงจาก detailedRentToOwnEstimation
        amortizationTable: customerData.detailedRentToOwnEstimation?.amortizationTable || [
          { period: 6, savings: 0, remaining: 0 },
          { period: 12, savings: 0, remaining: 0 },
          { period: 18, savings: 0, remaining: 0 },
          { period: 24, savings: 0, remaining: 0 },
          { period: 30, savings: 0, remaining: 0 },
          { period: 36, savings: 0, remaining: 0 }
        ]
      };
      setReportData(report);
      
      // โหลดข้อมูลรายงานที่บันทึกไว้หลังจากสร้าง reportData แล้ว
      try {
        await loadSavedReportData();
      } catch (error) {
        // Handle error silently
      }
    }
  }, [customerData, loadSavedReportData]);

  useEffect(() => {
    initializeReport();
  }, [initializeReport]);

  const handleExportHTML = async () => {
    try {
      if (!reportData) {
        alert('กรุณารอข้อมูลโหลดเสร็จก่อน Export');
        return;
      }

      // แสดงสถานะกำลัง Export
      const exportButton = document.querySelector('.exportButton');
      if (exportButton) {
        exportButton.textContent = '📄 กำลัง Export...';
        exportButton.disabled = true;
      }

      // สร้าง HTML content ที่สมบูรณ์
      const htmlContent = `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>รายงาน Consumer Advise - ${reportData.name || 'Report'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Sarabun', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: white;
      font-size: 14px;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: white;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
    }

    .logo h2 {
      color: #007bff;
      margin: 0;
      font-size: 24px;
    }

    .title {
      text-align: center;
      flex: 1;
      margin: 0 20px;
    }

    .title h1 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 28px;
    }

    .title p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .date p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    /* Sections */
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }

    .section h3 {
      color: #007bff;
      border-bottom: 1px solid #ddd;
      padding-bottom: 10px;
      margin-bottom: 20px;
      font-size: 20px;
    }

    /* Customer Info */
    .customer-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 20px;
    }

    .info-row {
      display: flex;
      align-items: center;
    }

    .label {
      font-weight: bold;
      min-width: 120px;
      color: #333;
    }

    .value {
      color: #666;
      margin-left: 10px;
    }

    /* Problems */
    .problems {
      margin-left: 20px;
    }

    .problem-item {
      margin-bottom: 10px;
      padding: 10px;
      background: #f8f9fa;
      border-left: 4px solid #dc3545;
      border-radius: 4px;
    }

    /* Action Plan */
    .action-plan h4 {
      color: #007bff;
      margin: 20px 0 10px 0;
      font-size: 16px;
    }

    .action-plan p {
      margin-bottom: 8px;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      page-break-inside: avoid;
    }

    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: center;
      font-size: 12px;
    }

    th {
      background: #007bff;
      color: white;
      font-weight: bold;
    }

    tr:nth-child(even) {
      background: #f8f9fa;
    }

    /* Disclaimer */
    .disclaimer-section {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #dc3545;
      page-break-inside: avoid;
    }

    .disclaimer-section p {
      margin: 15px 0;
      line-height: 1.6;
      text-align: justify;
    }

    .acknowledgement {
      margin: 25px 0;
      padding: 20px;
      background: #e7f3ff;
      border-radius: 5px;
      text-align: center;
    }

    .acknowledgement p {
      margin: 10px 0;
      font-weight: bold;
    }

    .signature-section {
      margin: 20px 0;
      text-align: center;
    }

    .advice-note {
      margin: 20px 0;
      padding: 15px;
      background: #fff3cd;
      border-radius: 5px;
      border-left: 4px solid #ffc107;
    }

    .analyst {
      text-align: right;
      margin-top: 30px;
      font-weight: bold;
      color: #333;
    }

    /* Contact Section */
    .contact-section {
      margin-top: 40px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      text-align: center;
    }

    .contact-info p {
      margin: 8px 0;
      font-weight: bold;
      color: #333;
    }

    .disclaimer {
      font-size: 12px;
      color: #666;
      font-style: italic;
      margin: 20px 0;
      text-align: center;
    }

    /* Print Styles */
    @media print {
      @page {
        size: A4;
        margin: 1.5cm;
      }

      body {
        font-size: 12px;
      }

      .section {
        page-break-inside: avoid;
        margin-bottom: 20px;
      }

      .section:nth-child(5) { /* ข้อมูลรายได้และภาระหนี้ */
        page-break-before: page;
      }

      .section:nth-child(8) { /* ตารางเช่าออม */
        page-break-before: page;
      }

      .section:nth-child(11) { /* ข้อสงวนสิทธิ์ */
        page-break-before: page;
      }

      table {
        page-break-inside: avoid;
      }

      th, td {
        padding: 4px;
        font-size: 10px;
      }

      .section h3 {
        page-break-after: avoid;
        font-size: 16px;
      }

      .title h1 {
        font-size: 20px;
      }

      .logo h2 {
        font-size: 18px;
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .container {
        padding: 10px;
      }

      .header {
        flex-direction: column;
        text-align: center;
      }

      .customer-info {
        grid-template-columns: 1fr;
      }

      table {
        font-size: 10px;
      }

      th, td {
        padding: 4px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo">
        <h2>LIVNEX ใจดี</h2>
      </div>
      <div class="title">
        <h1>Consumer Advise Article</h1>
        <p>เอกสารให้คำแนะนำแก่ลูกค้าของ LIVNEX เพื่อเตรียมความพร้อมในการยื่นขอสินเชื่อกับธนาคาร</p>
      </div>
      <div class="date">
        <p>วันที่: ${reportData.reportDate}</p>
      </div>
    </div>

    <!-- ข้อมูลทั่วไป -->
    <div class="section">
      <h3>ข้อมูลทั่วไป</h3>
      <div class="customer-info">
        <div class="info-row">
          <span class="label">ชื่อ:</span>
          <span class="value">${reportData.name || 'ไม่ระบุ'}</span>
        </div>
        <div class="info-row">
          <span class="label">อายุ:</span>
          <span class="value">${reportData.age || 'ไม่ระบุ'} ปี</span>
        </div>
        <div class="info-row">
          <span class="label">เบอร์โทร:</span>
          <span class="value">${reportData.phone || 'ไม่ระบุ'}</span>
        </div>
        <div class="info-row">
          <span class="label">อาชีพ:</span>
          <span class="value">${reportData.job || 'ไม่ระบุ'}</span>
        </div>
        <div class="info-row">
          <span class="label">ตำแหน่ง:</span>
          <span class="value">${reportData.position || 'ไม่ระบุ'}</span>
        </div>
        <div class="info-row">
          <span class="label">โครงการ:</span>
          <span class="value">${reportData.projectName || 'ไม่ระบุ'}</span>
        </div>
        <div class="info-row">
          <span class="label">เลขห้อง:</span>
          <span class="value">${reportData.unit || reportData.roomNumber || 'ไม่ระบุ'}</span>
        </div>
        <div class="info-row">
          <span class="label">มูลค่าเช่าออม:</span>
          <span class="value">${(() => {
            const propertyPrice = parseFloat(reportData.propertyPrice) || parseFloat(reportData.propertyValue) || 0;
            const discount = parseFloat(reportData.discount) || 0;
            return (propertyPrice - discount).toLocaleString();
          })()} บาท</span>
        </div>
      </div>
    </div>

    <!-- ปัญหาด้านสินเชื่อ -->
    <div class="section">
      <h3>ปัญหาด้านสินเชื่อ</h3>
      <div class="problems">
        ${Array.isArray(reportData.problems) && reportData.problems.length > 0
          ? reportData.problems.map((problem, index) =>
              `<div class="problem-item">${index + 1}. ${problem}</div>`
            ).join('')
          : '<div class="problem-item">ไม่มีข้อมูลปัญหาด้านสินเชื่อ</div>'
        }
      </div>
    </div>

    <!-- แผนการเตรียมยื่นขอสินเชื่อ -->
    <div class="section">
      <h3>ทำอย่างไรถึงสามารถดำเนินการแผนการเตรียมยื่นข้อสินเชื่อ</h3>
      <div class="action-plan">
        <h4>สิ่งที่ต้องปฏิบัติ:</h4>
        ${(() => {
          const originalPlans = reportData.actionPlan && Array.isArray(reportData.actionPlan) && reportData.actionPlan.length > 0
            ? reportData.actionPlan
            : ['ไม่มีแผนการดำเนินการที่ระบุ'];

          const additionalPlans = additionalNotes
            .map((note, index) => ({ note: note.trim(), index }))
            .filter(item => item.note)
            .map(item => `หมายเหตุ${item.index + 1}: ${item.note}`);

          const allPlans = [...originalPlans, ...additionalPlans];

          return allPlans.map((plan, index) => `<p>${index + 1}. ${plan}</p>`).join('');
        })()}
      </div>
    </div>

    <!-- ข้อมูลรายได้และภาระหนี้ -->
    <div class="section">
      <h3>ข้อมูลรายได้และภาระหนี้</h3>
      <div class="customer-info">
        <div class="info-row">
          <span class="label">รายได้ต่อเดือน:</span>
          <span class="value">${reportData.income?.toLocaleString() || '0'} บาท</span>
        </div>
        <div class="info-row">
          <span class="label">ภาระหนี้ต่อเดือน:</span>
          <span class="value">${reportData.debt?.toLocaleString() || '0'} บาท</span>
        </div>
        <div class="info-row">
          <span class="label">ระยะเวลาขอสินเชื่อ:</span>
          <span class="value">${reportData.loanTerm || '40'} ปี</span>
        </div>
        <div class="info-row">
          <span class="label">LTV:</span>
          <span class="value">${reportData.ltv || '100'}% (${reportData.ltvNote || 'House 1 (บ้านหลังที่ 1)'})</span>
        </div>
      </div>
    </div>

    <!-- ตารางประมาณการวงเงินสินเชื่อ -->
    <div class="section">
      <h3>ตารางประมาณการวงเงินสินเชื่อ (หน่วย : บาท)</h3>
      ${reportData.loanEstimationTable && reportData.loanEstimationTable.length > 0
        ? `<table>
            <thead>
              <tr>
                <th>ภาระหนี้ (บาท/เดือน)</th>
                <th>40 ปี</th>
                <th>30 ปี</th>
                <th>20 ปี</th>
                <th>10 ปี</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.loanEstimationTable.map((scenario) => {
                const label = scenario.label || '';
                const debt = scenario.debt || 0;
                const loanAmounts = scenario.loanAmounts || {};
                return `<tr>
                  <td>${label} (${debt.toLocaleString()})</td>
                  <td>${loanAmounts[40] ? loanAmounts[40].toLocaleString() : '0'}</td>
                  <td>${loanAmounts[30] ? loanAmounts[30].toLocaleString() : '0'}</td>
                  <td>${loanAmounts[20] ? loanAmounts[20].toLocaleString() : '0'}</td>
                  <td>${loanAmounts[10] ? loanAmounts[10].toLocaleString() : '0'}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>`
        : '<p>ไม่มีข้อมูลตารางประมาณการวงเงินสินเชื่อ</p>'
      }
    </div>

    <!-- ข้อมูลเช่าออม -->
    <div class="section">
      <h3>ข้อมูลเช่าออม</h3>
      <div class="customer-info">
        <div class="info-row">
          <span class="label">มูลค่าเช่าออม:</span>
          <span class="value">${reportData.propertyValue?.toLocaleString() || '0'} บาท</span>
        </div>
        <div class="info-row">
          <span class="label">อัตราค่าเช่าออม:</span>
          <span class="value">${reportData.monthlyRent?.toLocaleString() || '0'} บาท/เดือน</span>
        </div>
        <div class="info-row">
          <span class="label">คาดว่าลูกค้าจะชำระค่าเช่าออมงวดที่:</span>
          <span class="value">${selectedInstallment} งวด</span>
        </div>
        <div class="info-row">
          <span class="label">เงินต้นค่าทรัพย์คงเหลือ ณ สิ้นงวด:</span>
          <span class="value">${(() => {
            if (reportData.amortizationTable && reportData.amortizationTable.length > 0) {
              const selectedRow = reportData.amortizationTable.find(row => {
                const installment = row.installment || row.period || 0;
                return installment === selectedInstallment;
              });
              return selectedRow ? (selectedRow.remainingPrincipal || selectedRow.remaining || 0).toLocaleString() : '0';
            }
            return '0';
          })()} บาท</span>
        </div>
      </div>
    </div>

    <!-- จำนวนเงินจำกัดภาระหนี้ -->
    <div class="section">
      <h3>จำนวนเงินจำกัดภาระหนี้</h3>
      <p><strong>* ลูกค้าต้องชำระหนี้ทุกประเภท ตามกำหนดเวลา (ไม่ค้างชำระเกินกำหนด) และควบคุมภาระหนี้ให้ไม่เกิน ${debtLimit} บาท/เดือน</strong></p>
    </div>

    <!-- ระยะเวลาขอสินเชื่อหลังแผน -->
    <div class="section">
      <h3>ระยะเวลาขอสินเชื่อหลังแผน</h3>
      <p><strong>ระยะเวลาขอสินเชื่อหลังแผน: ${loanTermAfter} ปี</strong></p>
    </div>

    <!-- ตารางเปรียบเทียบ -->
    <div class="section">
      <h3>ตารางเปรียบเทียบ</h3>
      <table>
        <thead>
          <tr>
            <th>รายการ</th>
            <th>ก่อนแผน</th>
            <th>หลังแผน</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>ภาระหนี้</td>
            <td>${reportData.debt?.toLocaleString() || '0'} บาท/เดือน</td>
            <td>${debtLimit} บาท/เดือน</td>
          </tr>
          <tr>
            <td>ระยะเวลาขอสินเชื่อ</td>
            <td>${reportData.loanTerm || '40'} ปี</td>
            <td>${loanTermAfter} ปี</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ตารางเช่าออม -->
    <div class="section">
      <h3>ผ่อนแล้ว เงินต้นเหลือเท่าไหร่ ประมาณการตารางเช่าออม</h3>
      <p><strong>มูลค่าเช่าออม:</strong> ${reportData.propertyValue?.toLocaleString() || '0'} บาท</p>
      <p><strong>อัตราค่าเช่าออม:</strong> ${reportData.monthlyRent?.toLocaleString() || '0'}</p>

      ${reportData.amortizationTable && reportData.amortizationTable.length > 0
        ? `<table>
            <thead>
              <tr>
                <th>งวดที่</th>
                <th>เงินออมสะสม (หน่วย : บาท)</th>
                <th>เงินต้นค่าทรัพย์คงเหลือ ณ สิ้นงวด (หน่วย : บาท)</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.amortizationTable
                .filter(row => {
                  const installment = row.installment || row.period || 0;
                  if (typeof installment === 'string' && installment.includes('สิ้นงวด')) {
                    return true;
                  }
                  if (typeof installment === 'number') {
                    return [12, 24, 36].includes(installment);
                  }
                  return false;
                })
                .map((row) => {
                  const installment = row.installment || row.period || 0;
                  const savings = row.payment || row.savings || 0;
                  const remaining = row.remainingPrincipal || row.remaining || 0;

                  return `<tr>
                    <td>${installment}</td>
                    <td>${savings ? savings.toLocaleString() : '0'}</td>
                    <td>${remaining ? remaining.toLocaleString() : '0'}</td>
                  </tr>`;
                }).join('')}
            </tbody>
          </table>`
        : '<p>ไม่มีข้อมูลตารางเช่าออม</p>'
      }

      <p class="disclaimer">
        ***ตัวเลขประมาณการ ทั้งนี้ให้ใช้ ตามเอกสารแนบท้ายสัญญา 4: ตารางแสดงอัตราค่าเช่าออมบ้าน
      </p>

      <p class="analyst">
        <strong>วิเคราะห์โดย:</strong> ${reportData.analyst}
      </p>
    </div>

    <!-- ข้อสงวนสิทธิ์ในความรับผิด -->
    <div class="section">
      <h3>ข้อสงวนสิทธิ์ในความรับผิด</h3>
      <div class="disclaimer-section">
        <p>
          ข้อมูลและคำแนะนำในเอกสารนี้จัดทำขึ้นเพื่อวัตถุประสงค์ในการวิเคราะห์เท่านั้น และอาจมีข้อผิดพลาด ความคลาดเคลื่อน หรือไม่เหมาะสมกับสถานการณ์ในอนาคต หรือการเปลี่ยนแปลงของนโยบายต่างๆ บริษัท เงินสดใจดี จำกัด ("บริษัท") ขอสงวนสิทธิ์ในการปรับปรุง เปลี่ยนแปลง หรือยกเลิกข้อมูลและบริการต่างๆ โดยไม่ต้องแจ้งให้ทราบล่วงหน้า
        </p>
        <p>
          ผู้ใช้บริการควรปรึกษาผู้เชี่ยวชาญเพื่อขอคำแนะนำที่เหมาะสม และบริษัทจะไม่รับผิดชอบต่อความเสียหายใดๆ ทั้งทางตรงและทางอ้อมที่อาจเกิดขึ้นจากการใช้บริการหรือคำแนะนำของบริษัท
        </p>

        <div class="acknowledgement">
          <p><strong>ข้าพเจ้ารับทราบ และจะปฏิบัติตามข้อแนะนำดังกล่าว</strong></p>
          <div class="signature-section">
            <p>ลงชื่อ: _________________ (ผู้เช่าออม)</p>
          </div>
        </div>

        <div class="advice-note">
          <p><strong>หมายเหตุ:</strong> คำแนะนำสำหรับลูกค้า Livnex เพื่อเตรียมความพร้อมในการยื่นขอสินเชื่อกับธนาคารนี้ เป็นเพียงคำแนะนำจากบริษัท เงินสดใจดี จำกัด เท่านั้น เงื่อนไขอื่นๆ ขึ้นอยู่กับเกณฑ์การพิจารณาของแต่ละธนาคาร</p>
        </div>

        <p class="analyst">
          <strong>วิเคราะห์โดย:</strong> ${reportData.analyst}
        </p>
      </div>
    </div>

    <!-- ข้อมูลติดต่อ -->
    <div class="contact-section">
      <div class="contact-info">
        <p><strong>LINE:</strong> @livnex</p>
        <p><strong>Website:</strong> www.livnex.co</p>
        <p><strong>Call:</strong> 1776</p>
      </div>
    </div>
  </div>
</body>
</html>
      `;

      // สร้างไฟล์ HTML และดาวน์โหลด
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `รายงาน_Consumer_Advise_${customerData?.name || customerData?.customer_name || 'Report'}_${new Date().toLocaleDateString('th-TH')}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert('✅ Export HTML เรียบร้อยแล้ว!\n\nไฟล์: ' + link.download + '\n\n💡 Tips: เปิดไฟล์ HTML ใน browser แล้วกด Ctrl+P เพื่อพิมพ์เป็น PDF');

    } catch (error) {
      console.error('HTML Export Error:', error);
      alert('❌ เกิดข้อผิดพลาดใน Export HTML\n\nกรุณาลองใหม่อีกครั้ง\n\nรายละเอียด: ' + error.message);
    } finally {
      // รีเซ็ตปุ่ม
      const exportButton = document.querySelector('.exportButton');
      if (exportButton) {
        exportButton.textContent = '📄 Export HTML';
        exportButton.disabled = false;
      }
    }
  };

  const handleQuickPDF = async () => {
    try {
      if (!reportData) {
        alert('กรุณารอข้อมูลโหลดเสร็จก่อน Export');
        return;
      }

      // แสดงสถานะกำลัง Export
      const quickPdfButton = document.querySelector('.quickPdfButton');
      if (quickPdfButton) {
        quickPdfButton.textContent = '🖨️ กำลังเตรียม PDF...';
        quickPdfButton.disabled = true;
      }

      // สร้าง HTML content เหมือน Export HTML
      const htmlContent = `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>รายงาน Consumer Advise - ${reportData.name || 'Report'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Sarabun', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: white;
      font-size: 14px;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: white;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
    }

    .logo h2 {
      color: #007bff;
      margin: 0;
      font-size: 24px;
    }

    .title {
      text-align: center;
      flex: 1;
      margin: 0 20px;
    }

    .title h1 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 28px;
    }

    .title p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .date p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    /* Sections */
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }

    .section h3 {
      color: #007bff;
      border-bottom: 1px solid #ddd;
      padding-bottom: 10px;
      margin-bottom: 20px;
      font-size: 20px;
    }

    /* Customer Info */
    .customer-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 20px;
    }

    .info-row {
      display: flex;
      align-items: center;
    }

    .label {
      font-weight: bold;
      min-width: 120px;
      color: #333;
    }

    .value {
      color: #666;
      margin-left: 10px;
    }

    /* Problems */
    .problems {
      margin-left: 20px;
    }

    .problem-item {
      margin-bottom: 10px;
      padding: 10px;
      background: #f8f9fa;
      border-left: 4px solid #dc3545;
      border-radius: 4px;
    }

    /* Action Plan */
    .action-plan h4 {
      color: #007bff;
      margin: 20px 0 10px 0;
      font-size: 16px;
    }

    .action-plan p {
      margin-bottom: 8px;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      page-break-inside: avoid;
    }

    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: center;
      font-size: 12px;
    }

    th {
      background: #007bff;
      color: white;
      font-weight: bold;
    }

    tr:nth-child(even) {
      background: #f8f9fa;
    }

    /* Disclaimer */
    .disclaimer-section {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #dc3545;
      page-break-inside: avoid;
    }

    .disclaimer-section p {
      margin: 15px 0;
      line-height: 1.6;
      text-align: justify;
    }

    .acknowledgement {
      margin: 25px 0;
      padding: 20px;
      background: #e7f3ff;
      border-radius: 5px;
      text-align: center;
    }

    .acknowledgement p {
      margin: 10px 0;
      font-weight: bold;
    }

    .signature-section {
      margin: 20px 0;
      text-align: center;
    }

    .advice-note {
      margin: 20px 0;
      padding: 15px;
      background: #fff3cd;
      border-radius: 5px;
      border-left: 4px solid #ffc107;
    }

    .analyst {
      text-align: right;
      margin-top: 30px;
      font-weight: bold;
      color: #333;
    }

    /* Contact Section */
    .contact-section {
      margin-top: 40px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      text-align: center;
    }

    .contact-info p {
      margin: 8px 0;
      font-weight: bold;
      color: #333;
    }

    .disclaimer {
      font-size: 12px;
      color: #666;
      font-style: italic;
      margin: 20px 0;
      text-align: center;
    }

    /* Print Styles - Optimized for Quick PDF */
    @media print {
      @page {
        size: A4;
        margin: 1.5cm;
        -webkit-print-color-adjust: exact;
      }

      body {
        font-size: 11px;
        -webkit-print-color-adjust: exact;
      }

      .container {
        max-width: none;
        margin: 0;
        padding: 0;
      }

      .section {
        page-break-inside: avoid;
        margin-bottom: 20px;
      }

      /* Strategic page breaks for better layout */
      .section:nth-child(5) { /* ข้อมูลรายได้และภาระหนี้ */
        page-break-before: page;
      }

      .section:nth-child(8) { /* ตารางเช่าออม */
        page-break-before: page;
      }

      .section:nth-child(11) { /* ข้อสงวนสิทธิ์ */
        page-break-before: page;
      }

      table {
        page-break-inside: avoid;
      }

      th, td {
        padding: 4px;
        font-size: 9px;
      }

      .section h3 {
        page-break-after: avoid;
        font-size: 14px;
      }

      .title h1 {
        font-size: 18px;
      }

      .logo h2 {
        font-size: 16px;
      }

      /* Ensure colors print */
      * {
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }

    /* Auto-open print dialog */
    @media screen {
      body {
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
      }

      body.loaded {
        opacity: 1;
      }
    }
  </style>
  <script>
    // Auto-trigger print dialog when page loads
    window.addEventListener('load', function() {
      document.body.classList.add('loaded');
      setTimeout(function() {
        window.print();
      }, 500);
    });

    // Auto-close window after print dialog
    window.addEventListener('afterprint', function() {
      setTimeout(function() {
        window.close();
      }, 1000);
    });
  </script>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo">
        <h2>LIVNEX ใจดี</h2>
      </div>
      <div class="title">
        <h1>Consumer Advise Article</h1>
        <p>เอกสารให้คำแนะนำแก่ลูกค้าของ LIVNEX เพื่อเตรียมความพร้อมในการยื่นขอสินเชื่อกับธนาคาร</p>
      </div>
      <div class="date">
        <p>วันที่: ${reportData.reportDate}</p>
      </div>
    </div>

    <!-- ข้อมูลทั่วไป -->
    <div class="section">
      <h3>ข้อมูลทั่วไป</h3>
      <div class="customer-info">
        <div class="info-row">
          <span class="label">ชื่อ:</span>
          <span class="value">${reportData.name || 'ไม่ระบุ'}</span>
        </div>
        <div class="info-row">
          <span class="label">อายุ:</span>
          <span class="value">${reportData.age || 'ไม่ระบุ'} ปี</span>
        </div>
        <div class="info-row">
          <span class="label">เบอร์โทร:</span>
          <span class="value">${reportData.phone || 'ไม่ระบุ'}</span>
        </div>
        <div class="info-row">
          <span class="label">อาชีพ:</span>
          <span class="value">${reportData.job || 'ไม่ระบุ'}</span>
        </div>
        <div class="info-row">
          <span class="label">ตำแหน่ง:</span>
          <span class="value">${reportData.position || 'ไม่ระบุ'}</span>
        </div>
        <div class="info-row">
          <span class="label">โครงการ:</span>
          <span class="value">${reportData.projectName || 'ไม่ระบุ'}</span>
        </div>
        <div class="info-row">
          <span class="label">เลขห้อง:</span>
          <span class="value">${reportData.unit || reportData.roomNumber || 'ไม่ระบุ'}</span>
        </div>
        <div class="info-row">
          <span class="label">มูลค่าเช่าออม:</span>
          <span class="value">${(() => {
            const propertyPrice = parseFloat(reportData.propertyPrice) || parseFloat(reportData.propertyValue) || 0;
            const discount = parseFloat(reportData.discount) || 0;
            return (propertyPrice - discount).toLocaleString();
          })()} บาท</span>
        </div>
      </div>
    </div>

    <!-- ปัญหาด้านสินเชื่อ -->
    <div class="section">
      <h3>ปัญหาด้านสินเชื่อ</h3>
      <div class="problems">
        ${Array.isArray(reportData.problems) && reportData.problems.length > 0
          ? reportData.problems.map((problem, index) =>
              `<div class="problem-item">${index + 1}. ${problem}</div>`
            ).join('')
          : '<div class="problem-item">ไม่มีข้อมูลปัญหาด้านสินเชื่อ</div>'
        }
      </div>
    </div>

    <!-- แผนการเตรียมยื่นขอสินเชื่อ -->
    <div class="section">
      <h3>ทำอย่างไรถึงสามารถดำเนินการแผนการเตรียมยื่นข้อสินเชื่อ</h3>
      <div class="action-plan">
        <h4>สิ่งที่ต้องปฏิบัติ:</h4>
        ${(() => {
          const originalPlans = reportData.actionPlan && Array.isArray(reportData.actionPlan) && reportData.actionPlan.length > 0
            ? reportData.actionPlan
            : ['ไม่มีแผนการดำเนินการที่ระบุ'];

          const additionalPlans = additionalNotes
            .map((note, index) => ({ note: note.trim(), index }))
            .filter(item => item.note)
            .map(item => `หมายเหตุ${item.index + 1}: ${item.note}`);

          const allPlans = [...originalPlans, ...additionalPlans];

          return allPlans.map((plan, index) => `<p>${index + 1}. ${plan}</p>`).join('');
        })()}
      </div>
    </div>

    <!-- ข้อมูลรายได้และภาระหนี้ -->
    <div class="section">
      <h3>ข้อมูลรายได้และภาระหนี้</h3>
      <div class="customer-info">
        <div class="info-row">
          <span class="label">รายได้ต่อเดือน:</span>
          <span class="value">${reportData.income?.toLocaleString() || '0'} บาท</span>
        </div>
        <div class="info-row">
          <span class="label">ภาระหนี้ต่อเดือน:</span>
          <span class="value">${reportData.debt?.toLocaleString() || '0'} บาท</span>
        </div>
        <div class="info-row">
          <span class="label">ระยะเวลาขอสินเชื่อ:</span>
          <span class="value">${reportData.loanTerm || '40'} ปี</span>
        </div>
        <div class="info-row">
          <span class="label">LTV:</span>
          <span class="value">${reportData.ltv || '100'}% (${reportData.ltvNote || 'House 1 (บ้านหลังที่ 1)'})</span>
        </div>
      </div>
    </div>

    <!-- ตารางประมาณการวงเงินสินเชื่อ -->
    <div class="section">
      <h3>ตารางประมาณการวงเงินสินเชื่อ (หน่วย : บาท)</h3>
      ${reportData.loanEstimationTable && reportData.loanEstimationTable.length > 0
        ? `<table>
            <thead>
              <tr>
                <th>ภาระหนี้ (บาท/เดือน)</th>
                <th>40 ปี</th>
                <th>30 ปี</th>
                <th>20 ปี</th>
                <th>10 ปี</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.loanEstimationTable.map((scenario) => {
                const label = scenario.label || '';
                const debt = scenario.debt || 0;
                const loanAmounts = scenario.loanAmounts || {};
                return `<tr>
                  <td>${label} (${debt.toLocaleString()})</td>
                  <td>${loanAmounts[40] ? loanAmounts[40].toLocaleString() : '0'}</td>
                  <td>${loanAmounts[30] ? loanAmounts[30].toLocaleString() : '0'}</td>
                  <td>${loanAmounts[20] ? loanAmounts[20].toLocaleString() : '0'}</td>
                  <td>${loanAmounts[10] ? loanAmounts[10].toLocaleString() : '0'}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>`
        : '<p>ไม่มีข้อมูลตารางประมาณการวงเงินสินเชื่อ</p>'
      }
    </div>

    <!-- ข้อมูลเช่าออม -->
    <div class="section">
      <h3>ข้อมูลเช่าออม</h3>
      <div class="customer-info">
        <div class="info-row">
          <span class="label">มูลค่าเช่าออม:</span>
          <span class="value">${reportData.propertyValue?.toLocaleString() || '0'} บาท</span>
        </div>
        <div class="info-row">
          <span class="label">อัตราค่าเช่าออม:</span>
          <span class="value">${reportData.monthlyRent?.toLocaleString() || '0'} บาท/เดือน</span>
        </div>
        <div class="info-row">
          <span class="label">คาดว่าลูกค้าจะชำระค่าเช่าออมงวดที่:</span>
          <span class="value">${selectedInstallment} งวด</span>
        </div>
        <div class="info-row">
          <span class="label">เงินต้นค่าทรัพย์คงเหลือ ณ สิ้นงวด:</span>
          <span class="value">${(() => {
            if (reportData.amortizationTable && reportData.amortizationTable.length > 0) {
              const selectedRow = reportData.amortizationTable.find(row => {
                const installment = row.installment || row.period || 0;
                return installment === selectedInstallment;
              });
              return selectedRow ? (selectedRow.remainingPrincipal || selectedRow.remaining || 0).toLocaleString() : '0';
            }
            return '0';
          })()} บาท</span>
        </div>
      </div>
    </div>

    <!-- จำนวนเงินจำกัดภาระหนี้ -->
    <div class="section">
      <h3>จำนวนเงินจำกัดภาระหนี้</h3>
      <p><strong>* ลูกค้าต้องชำระหนี้ทุกประเภท ตามกำหนดเวลา (ไม่ค้างชำระเกินกำหนด) และควบคุมภาระหนี้ให้ไม่เกิน ${debtLimit} บาท/เดือน</strong></p>
    </div>

    <!-- ระยะเวลาขอสินเชื่อหลังแผน -->
    <div class="section">
      <h3>ระยะเวลาขอสินเชื่อหลังแผน</h3>
      <p><strong>ระยะเวลาขอสินเชื่อหลังแผน: ${loanTermAfter} ปี</strong></p>
    </div>

    <!-- ตารางเปรียบเทียบ -->
    <div class="section">
      <h3>ตารางเปรียบเทียบ</h3>
      <table>
        <thead>
          <tr>
            <th>รายการ</th>
            <th>ก่อนแผน</th>
            <th>หลังแผน</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>ภาระหนี้</td>
            <td>${reportData.debt?.toLocaleString() || '0'} บาท/เดือน</td>
            <td>${debtLimit} บาท/เดือน</td>
          </tr>
          <tr>
            <td>ระยะเวลาขอสินเชื่อ</td>
            <td>${reportData.loanTerm || '40'} ปี</td>
            <td>${loanTermAfter} ปี</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ตารางเช่าออม -->
    <div class="section">
      <h3>ผ่อนแล้ว เงินต้นเหลือเท่าไหร่ ประมาณการตารางเช่าออม</h3>
      <p><strong>มูลค่าเช่าออม:</strong> ${reportData.propertyValue?.toLocaleString() || '0'} บาท</p>
      <p><strong>อัตราค่าเช่าออม:</strong> ${reportData.monthlyRent?.toLocaleString() || '0'}</p>

      ${reportData.amortizationTable && reportData.amortizationTable.length > 0
        ? `<table>
            <thead>
              <tr>
                <th>งวดที่</th>
                <th>เงินออมสะสม (หน่วย : บาท)</th>
                <th>เงินต้นค่าทรัพย์คงเหลือ ณ สิ้นงวด (หน่วย : บาท)</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.amortizationTable
                .filter(row => {
                  const installment = row.installment || row.period || 0;
                  if (typeof installment === 'string' && installment.includes('สิ้นงวด')) {
                    return true;
                  }
                  if (typeof installment === 'number') {
                    return [12, 24, 36].includes(installment);
                  }
                  return false;
                })
                .map((row) => {
                  const installment = row.installment || row.period || 0;
                  const savings = row.payment || row.savings || 0;
                  const remaining = row.remainingPrincipal || row.remaining || 0;

                  return `<tr>
                    <td>${installment}</td>
                    <td>${savings ? savings.toLocaleString() : '0'}</td>
                    <td>${remaining ? remaining.toLocaleString() : '0'}</td>
                  </tr>`;
                }).join('')}
            </tbody>
          </table>`
        : '<p>ไม่มีข้อมูลตารางเช่าออม</p>'
      }

      <p class="disclaimer">
        ***ตัวเลขประมาณการ ทั้งนี้ให้ใช้ ตามเอกสารแนบท้ายสัญญา 4: ตารางแสดงอัตราค่าเช่าออมบ้าน
      </p>

      <p class="analyst">
        <strong>วิเคราะห์โดย:</strong> ${reportData.analyst}
      </p>
    </div>

    <!-- ข้อสงวนสิทธิ์ในความรับผิด -->
    <div class="section">
      <h3>ข้อสงวนสิทธิ์ในความรับผิด</h3>
      <div class="disclaimer-section">
        <p>
          ข้อมูลและคำแนะนำในเอกสารนี้จัดทำขึ้นเพื่อวัตถุประสงค์ในการวิเคราะห์เท่านั้น และอาจมีข้อผิดพลาด ความคลาดเคลื่อน หรือไม่เหมาะสมกับสถานการณ์ในอนาคต หรือการเปลี่ยนแปลงของนโยบายต่างๆ บริษัท เงินสดใจดี จำกัด ("บริษัท") ขอสงวนสิทธิ์ในการปรับปรุง เปลี่ยนแปลง หรือยกเลิกข้อมูลและบริการต่างๆ โดยไม่ต้องแจ้งให้ทราบล่วงหน้า
        </p>
        <p>
          ผู้ใช้บริการควรปรึกษาผู้เชี่ยวชาญเพื่อขอคำแนะนำที่เหมาะสม และบริษัทจะไม่รับผิดชอบต่อความเสียหายใดๆ ทั้งทางตรงและทางอ้อมที่อาจเกิดขึ้นจากการใช้บริการหรือคำแนะนำของบริษัท
        </p>

        <div class="acknowledgement">
          <p><strong>ข้าพเจ้ารับทราบ และจะปฏิบัติตามข้อแนะนำดังกล่าว</strong></p>
          <div class="signature-section">
            <p>ลงชื่อ: _________________ (ผู้เช่าออม)</p>
          </div>
        </div>

        <div class="advice-note">
          <p><strong>หมายเหตุ:</strong> คำแนะนำสำหรับลูกค้า Livnex เพื่อเตรียมความพร้อมในการยื่นขอสินเชื่อกับธนาคารนี้ เป็นเพียงคำแนะนำจากบริษัท เงินสดใจดี จำกัด เท่านั้น เงื่อนไขอื่นๆ ขึ้นอยู่กับเกณฑ์การพิจารณาของแต่ละธนาคาร</p>
        </div>

        <p class="analyst">
          <strong>วิเคราะห์โดย:</strong> ${reportData.analyst}
        </p>
      </div>
    </div>

    <!-- ข้อมูลติดต่อ -->
    <div class="contact-section">
      <div class="contact-info">
        <p><strong>LINE:</strong> @livnex</p>
        <p><strong>Website:</strong> www.livnex.co</p>
        <p><strong>Call:</strong> 1776</p>
      </div>
    </div>
  </div>
</body>
</html>
      `;

      // สร้าง popup window ใหม่
      const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');

      if (!printWindow) {
        alert('❌ เบราว์เซอร์บล็อก popup window\n\nกรุณาอนุญาต popup สำหรับเว็บไซต์นี้');
        return;
      }

      // เขียน HTML ลงใน popup window
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // รอให้โหลดเสร็จแล้วเปิด print dialog
      printWindow.focus();

      alert('✅ เปิด Print Window เรียบร้อยแล้ว!\n\n💡 Tips: เลือก "Save as PDF" ในหน้าต่างที่เปิดขึ้น');

    } catch (error) {
      console.error('Quick PDF Error:', error);
      alert('❌ เกิดข้อผิดพลาดใน Quick PDF\n\nกรุณาลองใหม่อีกครั้ง\n\nรายละเอียด: ' + error.message);
    } finally {
      // รีเซ็ตปุ่ม
      const quickPdfButton = document.querySelector('.quickPdfButton');
      if (quickPdfButton) {
        quickPdfButton.textContent = '🖨️ Quick PDF';
        quickPdfButton.disabled = false;
      }
    }
  };

  const handlePrint = async () => {
    try {
      if (!reportData) {
        alert('กรุณารอข้อมูลโหลดเสร็จก่อนพิมพ์');
        return;
      }
      if (!componentRef.current) {
        alert('กรุณารอหน้าเว็บโหลดเสร็จก่อนพิมพ์');
        return;
      }

      // เตรียม DOM สำหรับการพิมพ์
      const reportContainer = document.querySelector('.reportContainer');
      const originalBodyOverflow = document.body.style.overflow;
      const originalBodyBackground = document.body.style.background;

      // ปรับแต่งหน้าเว็บสำหรับการพิมพ์
      document.body.style.overflow = 'visible';
      document.body.style.background = 'white';
      reportContainer.classList.add('print-ready');

      // เพิ่ม CSS เพื่อซ่อนส่วนที่ไม่ต้องการในการพิมพ์
      const printStyle = document.createElement('style');
      printStyle.id = 'print-temp-style';
      printStyle.textContent = `
        @media print {
          body * {
            visibility: hidden;
          }

          .reportContainer,
          .reportContainer * {
            visibility: visible;
          }

          .reportContainer {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
          }

          .reportContent {
            max-height: none !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 15px !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            max-width: none !important;
          }

          /* ซ่อนปุ่มและส่วนควบคุม */
          .printControls,
          .noteInputSection,
          .debtLimitInput,
          .loanTermInput {
            display: none !important;
          }

          /* ปรับการแบ่งหน้า */
          .section {
            page-break-inside: avoid !important;
            margin-bottom: 15px !important;
          }

          /* แบ่งหน้าก่อนส่วนสำคัญ */
          .section:nth-of-type(5) { /* ข้อมูลรายได้และภาระหนี้ */
            page-break-before: page !important;
          }

          .section:nth-of-type(8) { /* ตารางเช่าออม */
            page-break-before: page !important;
          }

          .section:nth-of-type(11) { /* ข้อสงวนสิทธิ์ */
            page-break-before: page !important;
          }

          /* ตาราง */
          .amortizationTable,
          .loanEstimationTable,
          .comparisonTable {
            page-break-inside: avoid !important;
            font-size: 10px !important;
          }

          .amortizationTable th,
          .loanEstimationTable th,
          .comparisonTable th,
          .amortizationTable td,
          .loanEstimationTable td,
          .comparisonTable td {
            padding: 4px !important;
            font-size: 9px !important;
          }

          /* หัวข้อ */
          .section h3 {
            page-break-after: avoid !important;
            font-size: 14px !important;
            margin-bottom: 8px !important;
          }

          .header {
            margin-bottom: 20px !important;
            padding-bottom: 10px !important;
          }

          .title h1 {
            font-size: 18px !important;
          }

          .logo h2 {
            font-size: 16px !important;
          }

          /* ข้อมูลทั่วไป */
          .customerInfo {
            font-size: 11px !important;
          }

          .infoRow {
            margin-bottom: 3px !important;
          }

          .label {
            min-width: 80px !important;
            font-size: 10px !important;
          }

          .value {
            font-size: 10px !important;
          }

          /* ปัญหาด้านสินเชื่อ */
          .problemItem {
            font-size: 10px !important;
            padding: 5px !important;
            margin-bottom: 5px !important;
          }

          /* แผนการดำเนินงาน */
          .actionPlan p {
            font-size: 10px !important;
            margin-bottom: 3px !important;
          }

          .actionPlan h4 {
            font-size: 12px !important;
            margin: 8px 0 5px 0 !important;
          }

          /* Disclaimer */
          .disclaimerSection {
            font-size: 9px !important;
          }

          .disclaimerSection p {
            line-height: 1.3 !important;
            margin: 8px 0 !important;
          }

          .acknowledgement {
            font-size: 10px !important;
            padding: 10px !important;
          }

          .adviceNote {
            font-size: 9px !important;
            padding: 8px !important;
          }

          /* ข้อมูลติดต่อ */
          .contactSection {
            font-size: 10px !important;
            padding: 10px !important;
          }
        }
      `;
      document.head.appendChild(printStyle);

      // แสดงกล่องข้อความแนะนำ
      // eslint-disable-next-line no-restricted-globals
      const printConfirm = confirm(
        '🖨️ เตรียมพิมพ์ PDF Report\n\n' +
        'คำแนะนำ:\n' +
        '1. เลือก "Save as PDF" หรือ "Microsoft Print to PDF"\n' +
        '2. กำหนดขนาดกระดาษเป็น A4\n' +
        '3. เลือก "More settings" → ติ๊ก "Background graphics"\n' +
        '4. กด "Save" เพื่อบันทึกเป็น PDF\n\n' +
        'คลิก "OK" เพื่อเปิดหน้าต่างพิมพ์'
      );

      if (printConfirm) {
        // เปิดหน้าต่างพิมพ์
        window.print();
      }

      // รอให้ผู้ใช้พิมพ์เสร็จ แล้วทำความสะอาด
      setTimeout(() => {
        // คืนค่าเดิม
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.background = originalBodyBackground;
        reportContainer.classList.remove('print-ready');

        // ลบ CSS ชั่วคราว
        const tempStyle = document.getElementById('print-temp-style');
        if (tempStyle) {
          tempStyle.remove();
        }
      }, 1000);

    } catch (error) {
      console.error('Print Error:', error);
      alert('❌ เกิดข้อผิดพลาดในการพิมพ์\n\nกรุณาลองใหม่อีกครั้ง\n\nรายละเอียด: ' + error.message);
    }
  };

  const handleSave = async () => {
    try {
      // แสดงสถานะกำลังบันทึก
      const saveButton = document.querySelector('.saveButton');
      if (saveButton) {
        saveButton.textContent = '💾 กำลังบันทึก...';
        saveButton.disabled = true;
      }
      
      // บันทึกข้อมูลรายงาน
      await saveReportData();
      alert('✅ บันทึกรายงานเรียบร้อยแล้ว\n\nข้อมูลที่บันทึก:\n- หมายเหตุเพิ่มเติม 4 ข้อ\n- ข้อมูลจำกัดภาระหนี้\n- ระยะเวลาขอสินเชื่อหลังแผน');
      
      // รีเซ็ตปุ่ม
      if (saveButton) {
        saveButton.textContent = '💾 บันทึก';
        saveButton.disabled = false;
      }
    } catch (error) {
      alert('❌ เกิดข้อผิดพลาดในการบันทึกรายงาน\n\nกรุณาลองใหม่อีกครั้ง');
      
      // รีเซ็ตปุ่ม
      const saveButton = document.querySelector('.saveButton');
      if (saveButton) {
        saveButton.textContent = '💾 บันทึก';
        saveButton.disabled = false;
      }
    }
  };

  const saveReportData = async () => {
    try {
      // สร้างข้อมูลรายงาน
      const reportDataToSave = {
        customerId: customerData.id,
        customerName: customerData.name,
        reportDate: new Date().toISOString(),
        selectedInstallment: selectedInstallment,
        additionalNotes: additionalNotes,
        debtLimit: parseInt(debtLimit),
        loanTermAfter: parseInt(loanTermAfter),
        analyst: customerData.officer || 'นายพิชญ์ สุดทัน',
      };

      // บันทึกลงฐานข้อมูล
      const response = await authenticatedFetch(API_ENDPOINTS.REPORTS, {
        method: 'POST',
        body: JSON.stringify(reportDataToSave)
      });

      if (response.ok) {
        const result = await response.json();
        return result;
      } else {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      throw error;
    }
  };

  const handleNoteChange = (index, value) => {
    const newNotes = [...additionalNotes];
    newNotes[index] = value;
    setAdditionalNotes(newNotes);
  };

  const handleDebtLimitChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setDebtLimit(value);
  };

  const handleLoanTermChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
    setLoanTermAfter(value);
  };

  // ตรวจสอบว่า reportData พร้อมใช้งานหรือไม่
  if (!reportData) {
    return (
      <div className={styles.reportContainer}>
        <div className={styles.loading}>
          <p>กำลังโหลดข้อมูลรายงาน...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.reportContainer}>
      {/* Print Controls */}
      <div className={styles.printControls}>
        <div className={styles.buttonControls}>
          <button onClick={handleSave} className={styles.saveButton}>
            💾 บันทึก
          </button>
{/* Export HTML ปุ่มถูกซ่อนไว้เพราะมี Quick PDF แล้ว
          <button onClick={handleExportHTML} className={styles.exportButton}>
            📄 Export HTML
          </button>
          */}
          <button onClick={handleQuickPDF} className={styles.quickPdfButton}>
            🖨️ Quick PDF (Hot Reload Test)
          </button>
          <button onClick={onClose} className={styles.closeButton}>
            ❌ ปิด
          </button>
        </div>
      </div>



      <div className={styles.reportContent}>
        <div ref={componentRef}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.logo}>
              <h2>LIVNEX ใจดี</h2>
            </div>
            <div className={styles.title}>
              <h1>Consumer Advise Article</h1>
              <p>เอกสารให้คำแนะนำแก่ลูกค้าของ LIVNEX เพื่อเตรียมความพร้อมในการยื่นขอสินเชื่อกับธนาคาร</p>
            </div>
            <div className={styles.date}>
              <p>วันที่: {reportData.reportDate}</p>
            </div>
          </div>

          {/* ข้อมูลทั่วไป */}
          <div className={styles.section}>
            <h3>ข้อมูลทั่วไป</h3>
            <div className={styles.customerInfo}>
              <div className={styles.infoRow}>
                <span className={styles.label}>ชื่อ:</span>
                <span className={styles.value}>{reportData.name || 'ไม่ระบุ'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>อายุ:</span>
                <span className={styles.value}>{reportData.age || 'ไม่ระบุ'} ปี</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>เบอร์โทร:</span>
                <span className={styles.value}>{reportData.phone || 'ไม่ระบุ'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>อาชีพ:</span>
                <span className={styles.value}>{reportData.job || 'ไม่ระบุ'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>ตำแหน่ง:</span>
                <span className={styles.value}>{reportData.position || 'ไม่ระบุ'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>โครงการ:</span>
                <span className={styles.value}>{reportData.projectName || 'ไม่ระบุ'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>เลขห้อง:</span>
                <span className={styles.value}>{reportData.unit || reportData.roomNumber || 'ไม่ระบุ'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>มูลค่าเช่าออม:</span>
                <span className={styles.value}>
                  {(() => {
                    const propertyPrice = parseFloat(reportData.propertyPrice) || parseFloat(reportData.propertyValue) || 0;
                    const discount = parseFloat(reportData.discount) || 0;
                    return (propertyPrice - discount).toLocaleString();
                  })()} บาท
                </span>
              </div>
            </div>
          </div>

          {/* ปัญหาด้านสินเชื่อ */}
          <div className={styles.section}>
            <h3>ปัญหาด้านสินเชื่อ</h3>
            <div className={styles.problems}>
              {Array.isArray(reportData.problems) && reportData.problems.length > 0 ? (
                reportData.problems.map((problem, index) => (
                  <div key={index} className={styles.problemItem}>
                    {index + 1}. {problem}
                  </div>
                ))
              ) : (
                <div className={styles.problemItem}>
                  ไม่มีข้อมูลปัญหาด้านสินเชื่อ
                </div>
              )}
            </div>
          </div>

          {/* แผนการเตรียมยื่นขอสินเชื่อ */}
          <div className={styles.section}>
            <h3>ทำอย่างไรถึงสามารถดำเนินการแผนการเตรียมยื่นข้อสินเชื่อ</h3>
            <div className={styles.actionPlan}>
              <h4>สิ่งที่ต้องปฏิบัติ:</h4>
              {(() => {
                // รวมแผนการดำเนินการเดิมกับหมายเหตุเพิ่มเติม
                const originalPlans = reportData.actionPlan && Array.isArray(reportData.actionPlan) && reportData.actionPlan.length > 0 
                  ? reportData.actionPlan 
                  : ['ไม่มีแผนการดำเนินการที่ระบุ'];
                

                const additionalPlans = additionalNotes
                  .map((note, index) => ({ note: note.trim(), index }))
                  .filter(item => item.note) // กรองเฉพาะหมายเหตุที่มีข้อมูล
                  .map(item => `หมายเหตุ${item.index + 1}: ${item.note}`);
                
                const allPlans = [...originalPlans, ...additionalPlans];
                
                return (
                  <div>
                    {allPlans.map((plan, index) => (
                      <p key={index}>{index + 1}. {plan}</p>
                    ))}
                  </div>
                );
              })()}

              {/* Input Controls - ซ่อนเมื่อพิมพ์ */}
              <div className={styles.noteInputSection}>
                <h4>หมายเหตุเพิ่มเติม:</h4>
                {additionalNotes.map((note, index) => (
                  <div key={index} className={styles.noteInput}>
                    <label>หมายเหตุ {index + 1}:</label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => handleNoteChange(index, e.target.value)}
                      className={styles.noteTextBox}
                      placeholder={`กรอกหมายเหตุ ${index + 1}`}
                    />
                  </div>
                ))}
              </div>

              {/* Debt Limit Input - ซ่อนเมื่อพิมพ์ */}
              <div className={styles.debtLimitInput}>
                <label>จำนวนเงินจำกัดภาระหนี้:</label>
                <div className={styles.debtLimitWrapper}>
                  <span className={styles.debtLimitText}>* ลูกค้าต้องชำระหนี้ทุกประเภท ตามกำหนดเวลา (ไม่ค้างชำระเกินกำหนด) และควบคุมภาระหนี้ให้ไม่เกิน</span>
                  <input
                    type="text"
                    value={debtLimit}
                    onChange={handleDebtLimitChange}
                    className={styles.debtLimitNumber}
                    placeholder="8000"
                  />
                  <span className={styles.debtLimitUnit}>บาท/เดือน</span>
                </div>
              </div>

              {/* Loan Term Input - ซ่อนเมื่อพิมพ์ */}
              <div className={styles.loanTermInput}>
                <label>ระยะเวลาขอสินเชื่อหลังแผน:</label>
                <div className={styles.loanTermWrapper}>
                  <span className={styles.loanTermText}>ระยะเวลาขอสินเชื่อหลังแผน:</span>
                  <input
                    type="text"
                    value={loanTermAfter}
                    onChange={handleLoanTermChange}
                    className={styles.loanTermNumber}
                    placeholder="40"
                    maxLength="2"
                  />
                  <span className={styles.loanTermUnit}>ปี</span>
                </div>
              </div>
            </div>
          </div>

          {/* ข้อมูลรายได้และภาระหนี้ */}
          <div className={styles.section}>
            <h3>ข้อมูลรายได้และภาระหนี้</h3>
            <div className={styles.incomeDebtInfo}>
              <div className={styles.infoRow}>
                <span className={styles.label}>รายได้ต่อเดือน:</span>
                <span className={styles.value}>{reportData.income?.toLocaleString() || '0'} บาท</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>ภาระหนี้ต่อเดือน:</span>
                <span className={styles.value}>{reportData.debt?.toLocaleString() || '0'} บาท</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>ระยะเวลาขอสินเชื่อ:</span>
                <span className={styles.value}>{reportData.loanTerm || '40'} ปี</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>LTV:</span>
                <span className={styles.value}>{reportData.ltv || '100'}% ({reportData.ltvNote || 'House 1 (บ้านหลังที่ 1)'})</span>
              </div>
            </div>
          </div>

          {/* ตารางประมาณการวงเงินสินเชื่อ */}
          <div className={styles.section}>
            <h3>ตารางประมาณการวงเงินสินเชื่อ (หน่วย : บาท)</h3>
            {reportData.loanEstimationTable && reportData.loanEstimationTable.length > 0 ? (
              <table className={styles.loanEstimationTable}>
                <thead>
                  <tr>
                    <th>ภาระหนี้ (บาท/เดือน)</th>
                    <th>40 ปี</th>
                    <th>30 ปี</th>
                    <th>20 ปี</th>
                    <th>10 ปี</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.loanEstimationTable.map((scenario, index) => {
                    const label = scenario.label || '';
                    const debt = scenario.debt || 0;
                    const loanAmounts = scenario.loanAmounts || {};
                    return (
                      <tr key={index}>
                        <td>{label} ({debt.toLocaleString()})</td>
                        <td>{loanAmounts[40] ? loanAmounts[40].toLocaleString() : '0'}</td>
                        <td>{loanAmounts[30] ? loanAmounts[30].toLocaleString() : '0'}</td>
                        <td>{loanAmounts[20] ? loanAmounts[20].toLocaleString() : '0'}</td>
                        <td>{loanAmounts[10] ? loanAmounts[10].toLocaleString() : '0'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p>ไม่มีข้อมูลตารางประมาณการวงเงินสินเชื่อ</p>
            )}
          </div>

          {/* ข้อมูลเช่าออม */}
          <div className={styles.section}>
            <h3>ข้อมูลเช่าออม</h3>
            <div className={styles.rentToOwnInfo}>
              <div className={styles.infoRow}>
                <span className={styles.label}>มูลค่าเช่าออม:</span>
                <span className={styles.value}>{reportData.propertyValue?.toLocaleString() || '0'} บาท</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>อัตราค่าเช่าออม:</span>
                <span className={styles.value}>{reportData.monthlyRent?.toLocaleString() || '0'} บาท/เดือน</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>คาดว่าลูกค้าจะชำระค่าเช่าออมงวดที่:</span>
                <span className={styles.value}>{selectedInstallment} งวด</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>เงินต้นค่าทรัพย์คงเหลือ ณ สิ้นงวด:</span>
                <span className={styles.value}>
                  {(() => {
                    if (reportData.amortizationTable && reportData.amortizationTable.length > 0) {
                      const selectedRow = reportData.amortizationTable.find(row => {
                        const installment = row.installment || row.period || 0;
                        return installment === selectedInstallment;
                      });
                      return selectedRow ? (selectedRow.remainingPrincipal || selectedRow.remaining || 0).toLocaleString() : '0';
                    }
                    return '0';
                  })()} บาท
                </span>
              </div>
            </div>
          </div>

          {/* จำนวนเงินจำกัดภาระหนี้ */}
          <div className={styles.section}>
            <h3>จำนวนเงินจำกัดภาระหนี้</h3>
            <div className={styles.debtLimitInfo}>
              <p><strong>* ลูกค้าต้องชำระหนี้ทุกประเภท ตามกำหนดเวลา (ไม่ค้างชำระเกินกำหนด) และควบคุมภาระหนี้ให้ไม่เกิน {debtLimit} บาท/เดือน</strong></p>
            </div>
          </div>

          {/* ระยะเวลาขอสินเชื่อหลังแผน */}
          <div className={styles.section}>
            <h3>ระยะเวลาขอสินเชื่อหลังแผน</h3>
            <div className={styles.loanTermInfo}>
              <p><strong>ระยะเวลาขอสินเชื่อหลังแผน: {loanTermAfter} ปี</strong></p>
            </div>
          </div>

          {/* ตารางเปรียบเทียบ */}
          <div className={styles.section}>
            <h3>ตารางเปรียบเทียบ</h3>
            <table className={styles.comparisonTable}>
              <thead>
                <tr>
                  <th>รายการ</th>
                  <th>ก่อนแผน</th>
                  <th>หลังแผน</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>ภาระหนี้</td>
                  <td>{reportData.debt?.toLocaleString() || '0'} บาท/เดือน</td>
                  <td>{debtLimit} บาท/เดือน</td>
                </tr>
                <tr>
                  <td>ระยะเวลาขอสินเชื่อ</td>
                  <td>{reportData.loanTerm || '40'} ปี</td>
                  <td>{loanTermAfter} ปี</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ตารางเช่าออม */}
          <div className={styles.section}>
            <h3>ผ่อนแล้ว เงินต้นเหลือเท่าไหร่ ประมาณการตารางเช่าออม</h3>
            <div className={styles.amortizationInfo}>
              <p><strong>มูลค่าเช่าออม:</strong> {reportData.propertyValue?.toLocaleString() || '0'} บาท</p>
              <p><strong>อัตราค่าเช่าออม:</strong> {reportData.monthlyRent?.toLocaleString() || '0'}</p>
            </div>
            
            {reportData.amortizationTable && reportData.amortizationTable.length > 0 ? (
              <table className={styles.amortizationTable}>
                <thead>
                  <tr>
                    <th>งวดที่</th>
                    <th>เงินออมสะสม (หน่วย : บาท)</th>
                    <th>เงินต้นค่าทรัพย์คงเหลือ ณ สิ้นงวด (หน่วย : บาท)</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.amortizationTable
                    .filter(row => {
                      const installment = row.installment || row.period || 0;
                      if (typeof installment === 'string' && installment.includes('สิ้นงวด')) {
                        return true;
                      }
                      if (typeof installment === 'number') {
                        return [12, 24, 36].includes(installment);
                      }
                      return false;
                    })
                    .map((row, index) => {
                      const installment = row.installment || row.period || 0;
                      const savings = row.payment || row.savings || 0;
                      const remaining = row.remainingPrincipal || row.remaining || 0;
                      
                      return (
                        <tr key={index}>
                          <td>{installment}</td>
                          <td>{savings ? savings.toLocaleString() : '0'}</td>
                          <td>{remaining ? remaining.toLocaleString() : '0'}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            ) : (
              <p>ไม่มีข้อมูลตารางเช่าออม</p>
            )}
            
            <p className={styles.disclaimer}>
              ***ตัวเลขประมาณการ ทั้งนี้ให้ใช้ ตามเอกสารแนบท้ายสัญญา 4: ตารางแสดงอัตราค่าเช่าออมบ้าน
            </p>
            
            <p className={styles.analyst}>
              <strong>วิเคราะห์โดย:</strong> {reportData.analyst}
            </p>
          </div>

          {/* ข้อสงวนสิทธิ์ในความรับผิด */}
          <div className={styles.section}>
            <h3>ข้อสงวนสิทธิ์ในความรับผิด</h3>
            <div className={styles.disclaimerSection}>
              <p>
                ข้อมูลและคำแนะนำในเอกสารนี้จัดทำขึ้นเพื่อวัตถุประสงค์ในการวิเคราะห์เท่านั้น และอาจมีข้อผิดพลาด ความคลาดเคลื่อน หรือไม่เหมาะสมกับสถานการณ์ในอนาคต หรือการเปลี่ยนแปลงของนโยบายต่างๆ บริษัท เงินสดใจดี จำกัด ("บริษัท") ขอสงวนสิทธิ์ในการปรับปรุง เปลี่ยนแปลง หรือยกเลิกข้อมูลและบริการต่างๆ โดยไม่ต้องแจ้งให้ทราบล่วงหน้า
              </p>
              <p>
                ผู้ใช้บริการควรปรึกษาผู้เชี่ยวชาญเพื่อขอคำแนะนำที่เหมาะสม และบริษัทจะไม่รับผิดชอบต่อความเสียหายใดๆ ทั้งทางตรงและทางอ้อมที่อาจเกิดขึ้นจากการใช้บริการหรือคำแนะนำของบริษัท
              </p>
              
              <div className={styles.acknowledgement}>
                <p><strong>ข้าพเจ้ารับทราบ และจะปฏิบัติตามข้อแนะนำดังกล่าว</strong></p>
                <div className={styles.signatureSection}>
                  <p>ลงชื่อ: _________________ (ผู้เช่าออม)</p>
                </div>
              </div>
              
              <p className={styles.adviceNote}>
                <strong>หมายเหตุ:</strong> คำแนะนำสำหรับลูกค้า Livnex เพื่อเตรียมความพร้อมในการยื่นขอสินเชื่อกับธนาคารนี้ เป็นเพียงคำแนะนำจากบริษัท เงินสดใจดี จำกัด เท่านั้น เงื่อนไขอื่นๆ ขึ้นอยู่กับเกณฑ์การพิจารณาของแต่ละธนาคาร
              </p>
              
              <p className={styles.analyst}>
                <strong>วิเคราะห์โดย:</strong> {reportData.analyst}
              </p>
            </div>
          </div>

          {/* ข้อมูลติดต่อ */}
          <div className={styles.contactSection}>
            <div className={styles.contactInfo}>
              <p><strong>LINE:</strong> @livnex</p>
              <p><strong>Website:</strong> www.livnex.co</p>
              <p><strong>Call:</strong> 1776</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsumerAdviseReport; 
