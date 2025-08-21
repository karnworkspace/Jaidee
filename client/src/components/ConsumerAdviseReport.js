import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
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
      const response = await authenticatedFetch(`https://jaidee-backend.onrender.com/api/reports/${customerData.id}`);

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
      
      // แสดงสถานะกำลังพิมพ์
      const printButton = document.querySelector('.printButton');
      if (printButton) {
        printButton.textContent = '🖨️ กำลังสร้าง PDF...';
        printButton.disabled = true;
      }
      
      // สร้าง DOM ใหม่สำหรับ PDF
      const pdfContainer = document.createElement('div');
      pdfContainer.style.cssText = `
        position: fixed;
        top: -9999px;
        left: -9999px;
        width: 794px;
        background: white;
        padding: 40px;
        font-family: Arial, sans-serif;
        z-index: -1;
      `;
      
      // สร้างเนื้อหา PDF ตามลำดับที่ต้องการ
      pdfContainer.innerHTML = `
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
          <div><h2 style="color: #007bff; margin: 0; font-size: 24px;">LIVNEX ใจดี</h2></div>
          <div style="text-align: center; flex: 1;">
            <h1 style="margin: 0 0 10px 0; color: #333; font-size: 28px;">Consumer Advise Article</h1>
            <p style="margin: 0; color: #666; font-size: 14px;">เอกสารให้คำแนะนำแก่ลูกค้าของ LIVNEX เพื่อเตรียมความพร้อมในการยื่นขอสินเชื่อกับธนาคาร</p>
          </div>
          <div><p style="margin: 0; color: #666; font-size: 14px;">วันที่: ${reportData.reportDate}</p></div>
        </div>

        <!-- ข้อมูลทั่วไป -->
        <div style="margin-bottom: 30px;">
          <h3 style="color: #007bff; border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 20px; font-size: 20px;">ข้อมูลทั่วไป</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div style="display: flex; align-items: center;"><span style="font-weight: bold; min-width: 120px; color: #333;">ชื่อ:</span><span style="color: #666; margin-left: 10px;">${reportData.name || 'ไม่ระบุ'}</span></div>
            <div style="display: flex; align-items: center;"><span style="font-weight: bold; min-width: 120px; color: #333;">อายุ:</span><span style="color: #666; margin-left: 10px;">${reportData.age || 'ไม่ระบุ'} ปี</span></div>
            <div style="display: flex; align-items: center;"><span style="font-weight: bold; min-width: 120px; color: #333;">เบอร์โทร:</span><span style="color: #666; margin-left: 10px;">${reportData.phone || 'ไม่ระบุ'}</span></div>
            <div style="display: flex; align-items: center;"><span style="font-weight: bold; min-width: 120px; color: #333;">อาชีพ:</span><span style="color: #666; margin-left: 10px;">${reportData.job || 'ไม่ระบุ'}</span></div>
            <div style="display: flex; align-items: center;"><span style="font-weight: bold; min-width: 120px; color: #333;">ตำแหน่ง:</span><span style="color: #666; margin-left: 10px;">${reportData.position || 'ไม่ระบุ'}</span></div>
            <div style="display: flex; align-items: center;"><span style="font-weight: bold; min-width: 120px; color: #333;">โครงการ:</span><span style="color: #666; margin-left: 10px;">${reportData.projectName || 'ไม่ระบุ'}</span></div>
            <div style="display: flex; align-items: center;"><span style="font-weight: bold; min-width: 120px; color: #333;">เลขห้อง:</span><span style="color: #666; margin-left: 10px;">${reportData.unit || reportData.roomNumber || 'ไม่ระบุ'}</span></div>
            <div style="display: flex; align-items: center;"><span style="font-weight: bold; min-width: 120px; color: #333;">มูลค่าเช่าออม:</span><span style="color: #666; margin-left: 10px;">${(() => {
              const propertyPrice = parseFloat(reportData.propertyPrice) || parseFloat(reportData.propertyValue) || 0;
              const discount = parseFloat(reportData.discount) || 0;
              return (propertyPrice - discount).toLocaleString();
            })()} บาท</span></div>
          </div>
        </div>

        <!-- ปัญหาด้านสินเชื่อ -->
        <div style="margin-bottom: 30px;">
          <h3 style="color: #007bff; border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 20px; font-size: 20px;">ปัญหาด้านสินเชื่อ</h3>
          <div style="margin-left: 20px;">
            ${Array.isArray(reportData.problems) && reportData.problems.length > 0 
              ? reportData.problems.map((problem, index) => 
                  `<div style="margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-left: 4px solid #dc3545; border-radius: 4px;">${index + 1}. ${problem}</div>`
                ).join('')
              : '<div style="margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-left: 4px solid #dc3545; border-radius: 4px;">ไม่มีข้อมูลปัญหาด้านสินเชื่อ</div>'
            }
          </div>
        </div>

        <!-- แผนการเตรียมยื่นขอสินเชื่อ -->
        <div style="margin-bottom: 30px;">
          <h3 style="color: #007bff; border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 20px; font-size: 20px;">ทำอย่างไรถึงสามารถดำเนินการแผนการเตรียมยื่นข้อสินเชื่อ</h3>
          <div>
            <h4 style="color: #007bff; margin: 20px 0 10px 0;">สิ่งที่ต้องปฏิบัติ:</h4>
            ${(() => {
              const originalPlans = reportData.actionPlan && Array.isArray(reportData.actionPlan) && reportData.actionPlan.length > 0 
                ? reportData.actionPlan 
                : ['ไม่มีแผนการดำเนินการที่ระบุ'];
              
              const additionalPlans = additionalNotes
                .map((note, index) => ({ note: note.trim(), index }))
                .filter(item => item.note)
                .map(item => `หมายเหตุ${item.index + 1}: ${item.note}`);
              
              const allPlans = [...originalPlans, ...additionalPlans];
              
              return allPlans.map((plan, index) => `<p style="margin-bottom: 8px;">${index + 1}. ${plan}</p>`).join('');
            })()}
          </div>
        </div>

        <!-- ข้อมูลรายได้และภาระหนี้ -->
        <div style="margin-bottom: 30px;">
          <h3 style="color: #007bff; border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 20px; font-size: 20px;">ข้อมูลรายได้และภาระหนี้</h3>
          <div>
            <div style="display: flex; align-items: center; margin-bottom: 10px;"><span style="font-weight: bold; min-width: 120px; color: #333;">รายได้ต่อเดือน:</span><span style="color: #666; margin-left: 10px;">${reportData.income?.toLocaleString() || '0'} บาท</span></div>
            <div style="display: flex; align-items: center; margin-bottom: 10px;"><span style="font-weight: bold; min-width: 120px; color: #333;">ภาระหนี้ต่อเดือน:</span><span style="color: #666; margin-left: 10px;">${reportData.debt?.toLocaleString() || '0'} บาท</span></div>
            <div style="display: flex; align-items: center; margin-bottom: 10px;"><span style="font-weight: bold; min-width: 120px; color: #333;">ระยะเวลาขอสินเชื่อ:</span><span style="color: #666; margin-left: 10px;">${reportData.loanTerm || '40'} ปี</span></div>
            <div style="display: flex; align-items: center; margin-bottom: 10px;"><span style="font-weight: bold; min-width: 120px; color: #333;">LTV:</span><span style="color: #666; margin-left: 10px;">${reportData.ltv || '100'}% (${reportData.ltvNote || 'House 1 (บ้านหลังที่ 1)'})</span></div>
          </div>
        </div>

        <!-- ตารางประมาณการวงเงินสินเชื่อ -->
        <div style="margin-bottom: 30px;">
          <h3 style="color: #007bff; border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 20px; font-size: 20px;">ตารางประมาณการวงเงินสินเชื่อ (หน่วย : บาท)</h3>
          ${reportData.loanEstimationTable && reportData.loanEstimationTable.length > 0 
            ? `<table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px;">
                <thead>
                  <tr>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: center; background: #007bff; color: white; font-weight: bold;">ภาระหนี้ (บาท/เดือน)</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: center; background: #007bff; color: white; font-weight: bold;">40 ปี</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: center; background: #007bff; color: white; font-weight: bold;">30 ปี</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: center; background: #007bff; color: white; font-weight: bold;">20 ปี</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: center; background: #007bff; color: white; font-weight: bold;">10 ปี</th>
                  </tr>
                </thead>
                <tbody>
                  ${reportData.loanEstimationTable.map((scenario, index) => {
                    const label = scenario.label || '';
                    const debt = scenario.debt || 0;
                    const loanAmounts = scenario.loanAmounts || {};
                    return `<tr style="background: ${index % 2 === 0 ? '#f8f9fa' : 'white'};">
                      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${label} (${debt.toLocaleString()})</td>
                      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${loanAmounts[40] ? loanAmounts[40].toLocaleString() : '0'}</td>
                      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${loanAmounts[30] ? loanAmounts[30].toLocaleString() : '0'}</td>
                      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${loanAmounts[20] ? loanAmounts[20].toLocaleString() : '0'}</td>
                      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${loanAmounts[10] ? loanAmounts[10].toLocaleString() : '0'}</td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>`
            : '<p>ไม่มีข้อมูลตารางประมาณการวงเงินสินเชื่อ</p>'
          }
        </div>

        <!-- ข้อมูลเช่าออม -->
        <div style="margin-bottom: 30px;">
          <h3 style="color: #007bff; border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 20px; font-size: 20px;">ข้อมูลเช่าออม</h3>
          <div>
            <div style="display: flex; align-items: center; margin-bottom: 10px;"><span style="font-weight: bold; min-width: 120px; color: #333;">มูลค่าเช่าออม:</span><span style="color: #666; margin-left: 10px;">${reportData.propertyValue?.toLocaleString() || '0'} บาท</span></div>
            <div style="display: flex; align-items: center; margin-bottom: 10px;"><span style="font-weight: bold; min-width: 120px; color: #333;">อัตราค่าเช่าออม:</span><span style="color: #666; margin-left: 10px;">${reportData.monthlyRent?.toLocaleString() || '0'} บาท/เดือน</span></div>
            <div style="display: flex; align-items: center; margin-bottom: 10px;"><span style="font-weight: bold; min-width: 120px; color: #333;">คาดว่าลูกค้าจะชำระค่าเช่าออมงวดที่:</span><span style="color: #666; margin-left: 10px;">${selectedInstallment} งวด</span></div>
            <div style="display: flex; align-items: center; margin-bottom: 10px;"><span style="font-weight: bold; min-width: 120px; color: #333;">เงินต้นค่าทรัพย์คงเหลือ ณ สิ้นงวด:</span><span style="color: #666; margin-left: 10px;">${(() => {
              if (reportData.amortizationTable && reportData.amortizationTable.length > 0) {
                const selectedRow = reportData.amortizationTable.find(row => {
                  const installment = row.installment || row.period || 0;
                  return installment === selectedInstallment;
                });
                return selectedRow ? (selectedRow.remainingPrincipal || selectedRow.remaining || 0).toLocaleString() : '0';
              }
              return '0';
            })()} บาท</span></div>
          </div>
        </div>

        <!-- จำนวนเงินจำกัดภาระหนี้ -->
        <div style="margin-bottom: 30px;">
          <h3 style="color: #007bff; border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 20px; font-size: 20px;">จำนวนเงินจำกัดภาระหนี้</h3>
          <div>
            <p><strong>* ลูกค้าต้องชำระหนี้ทุกประเภท ตามกำหนดเวลา (ไม่ค้างชำระเกินกำหนด) และควบคุมภาระหนี้ให้ไม่เกิน ${debtLimit} บาท/เดือน</strong></p>
          </div>
        </div>

        <!-- ระยะเวลาขอสินเชื่อหลังแผน -->
        <div style="margin-bottom: 30px;">
          <h3 style="color: #007bff; border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 20px; font-size: 20px;">ระยะเวลาขอสินเชื่อหลังแผน</h3>
          <div>
            <p><strong>ระยะเวลาขอสินเชื่อหลังแผน: ${loanTermAfter} ปี</strong></p>
          </div>
        </div>

        <!-- ตารางเปรียบเทียบ -->
        <div style="margin-bottom: 30px;">
          <h3 style="color: #007bff; border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 20px; font-size: 20px;">ตารางเปรียบเทียบ</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr>
                <th style="border: 1px solid #ddd; padding: 10px; text-align: center; background: #007bff; color: white; font-weight: bold;">รายการ</th>
                <th style="border: 1px solid #ddd; padding: 10px; text-align: center; background: #007bff; color: white; font-weight: bold;">ก่อนแผน</th>
                <th style="border: 1px solid #ddd; padding: 10px; text-align: center; background: #007bff; color: white; font-weight: bold;">หลังแผน</th>
              </tr>
            </thead>
            <tbody>
              <tr style="background: #f8f9fa;">
                <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">ภาระหนี้</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${reportData.debt?.toLocaleString() || '0'} บาท/เดือน</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${debtLimit} บาท/เดือน</td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">ระยะเวลาขอสินเชื่อ</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${reportData.loanTerm || '40'} ปี</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${loanTermAfter} ปี</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ตารางเช่าออม -->
        <div style="margin-bottom: 30px;">
          <h3 style="color: #007bff; border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 20px; font-size: 20px;">ผ่อนแล้ว เงินต้นเหลือเท่าไหร่ ประมาณการตารางเช่าออม</h3>
          <div style="margin-bottom: 20px;">
            <p style="margin: 5px 0; font-weight: bold;"><strong>มูลค่าเช่าออม:</strong> ${reportData.propertyValue?.toLocaleString() || '0'} บาท</p>
            <p style="margin: 5px 0; font-weight: bold;"><strong>อัตราค่าเช่าออม:</strong> ${reportData.monthlyRent?.toLocaleString() || '0'}</p>
          </div>
          
          ${reportData.amortizationTable && reportData.amortizationTable.length > 0 
            ? `<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                  <tr>
                    <th style="border: 1px solid #ddd; padding: 12px; text-align: center; background: #007bff; color: white; font-weight: bold;">งวดที่</th>
                    <th style="border: 1px solid #ddd; padding: 12px; text-align: center; background: #007bff; color: white; font-weight: bold;">เงินออมสะสม (หน่วย : บาท)</th>
                    <th style="border: 1px solid #ddd; padding: 12px; text-align: center; background: #007bff; color: white; font-weight: bold;">เงินต้นค่าทรัพย์คงเหลือ ณ สิ้นงวด (หน่วย : บาท)</th>
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
                    .map((row, index) => {
                      const installment = row.installment || row.period || 0;
                      const savings = row.payment || row.savings || 0;
                      const remaining = row.remainingPrincipal || row.remaining || 0;
                      
                      return `<tr style="background: ${index % 2 === 0 ? '#f8f9fa' : 'white'};">
                        <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${installment}</td>
                        <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${savings ? savings.toLocaleString() : '0'}</td>
                        <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${remaining ? remaining.toLocaleString() : '0'}</td>
                      </tr>`;
                    }).join('')}
                </tbody>
              </table>`
            : '<p>ไม่มีข้อมูลตารางเช่าออม</p>'
          }
          
          <p style="font-size: 12px; color: #666; font-style: italic; margin: 20px 0; text-align: center;">
            ***ตัวเลขประมาณการ ทั้งนี้ให้ใช้ ตามเอกสารแนบท้ายสัญญา 4: ตารางแสดงอัตราค่าเช่าออมบ้าน
          </p>
          
          <p style="text-align: right; margin-top: 30px; font-weight: bold; color: #333;">
            <strong>วิเคราะห์โดย:</strong> ${reportData.analyst}
          </p>
        </div>

        <!-- ข้อสงวนสิทธิ์ในความรับผิด -->
        <div style="margin-bottom: 30px;">
          <h3 style="color: #007bff; border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 20px; font-size: 20px;">ข้อสงวนสิทธิ์ในความรับผิด</h3>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #dc3545;">
            <p style="margin: 15px 0; line-height: 1.6; text-align: justify;">
              ข้อมูลและคำแนะนำในเอกสารนี้จัดทำขึ้นเพื่อวัตถุประสงค์ในการวิเคราะห์เท่านั้น และอาจมีข้อผิดพลาด ความคลาดเคลื่อน หรือไม่เหมาะสมกับสถานการณ์ในอนาคต หรือการเปลี่ยนแปลงของนโยบายต่างๆ บริษัท เงินสดใจดี จำกัด ("บริษัท") ขอสงวนสิทธิ์ในการปรับปรุง เปลี่ยนแปลง หรือยกเลิกข้อมูลและบริการต่างๆ โดยไม่ต้องแจ้งให้ทราบล่วงหน้า
            </p>
            <p style="margin: 15px 0; line-height: 1.6; text-align: justify;">
              ผู้ใช้บริการควรปรึกษาผู้เชี่ยวชาญเพื่อขอคำแนะนำที่เหมาะสม และบริษัทจะไม่รับผิดชอบต่อความเสียหายใดๆ ทั้งทางตรงและทางอ้อมที่อาจเกิดขึ้นจากการใช้บริการหรือคำแนะนำของบริษัท
            </p>
            
            <div style="margin: 25px 0; padding: 20px; background: #e7f3ff; border-radius: 5px; text-align: center;">
              <p style="margin: 10px 0; font-weight: bold;"><strong>ข้าพเจ้ารับทราบ และจะปฏิบัติตามข้อแนะนำดังกล่าว</strong></p>
              <div style="margin: 20px 0; text-align: center;">
                <p style="margin: 10px 0;">ลงชื่อ: _________________ (ผู้เช่าออม)</p>
              </div>
            </div>
            
            <p style="margin: 20px 0; padding: 15px; background: #fff3cd; border-radius: 5px; border-left: 4px solid #ffc107;">
              <strong>หมายเหตุ:</strong> คำแนะนำสำหรับลูกค้า Livnex เพื่อเตรียมความพร้อมในการยื่นขอสินเชื่อกับธนาคารนี้ เป็นเพียงคำแนะนำจากบริษัท เงินสดใจดี จำกัด เท่านั้น เงื่อนไขอื่นๆ ขึ้นอยู่กับเกณฑ์การพิจารณาของแต่ละธนาคาร
            </p>
            
            <p style="text-align: right; margin-top: 30px; font-weight: bold; color: #333;">
              <strong>วิเคราะห์โดย:</strong> ${reportData.analyst}
            </p>
          </div>
        </div>

        <!-- ข้อมูลติดต่อ -->
        <div style="margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px; text-align: center;">
          <div>
            <p style="margin: 8px 0; font-weight: bold; color: #333;"><strong>LINE:</strong> @livnex</p>
            <p style="margin: 8px 0; font-weight: bold; color: #333;"><strong>Website:</strong> www.livnex.co</p>
            <p style="margin: 8px 0; font-weight: bold; color: #333;"><strong>Call:</strong> 1776</p>
          </div>
        </div>
      `;
      
      // เพิ่ม DOM ใหม่ลงในหน้า
      document.body.appendChild(pdfContainer);
      
      // Capture หน้าเว็บเป็นรูปภาพ
      const canvas = await html2canvas(pdfContainer, {
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794
      });
      
      // ลบ DOM ชั่วคราว
      document.body.removeChild(pdfContainer);
      
      // สร้าง PDF
      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // คำนวณขนาดรูปภาพให้พอดีกับหน้า A4
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // เพิ่มรูปภาพลงใน PDF
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      
      // ถ้ารูปภาพสูงเกินหน้าเดียว ให้เพิ่มหน้าใหม่
      let heightLeft = imgHeight;
      let position = 0;
      
      while (heightLeft >= pageHeight) {
        position = heightLeft - pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, -position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // บันทึกไฟล์ PDF
      const fileName = `รายงาน_Consumer_Advise_${customerData?.name || customerData?.customer_name || 'Report'}_${new Date().toLocaleDateString('th-TH')}.pdf`;
      pdf.save(fileName);
      
      alert('✅ สร้าง PDF เรียบร้อยแล้ว!\n\nไฟล์: ' + fileName);
      
    } catch (error) {
      alert('❌ เกิดข้อผิดพลาดในการสร้าง PDF\n\nกรุณาลองใหม่อีกครั้ง');
    } finally {
      // รีเซ็ตปุ่ม
      const printButton = document.querySelector('.printButton');
      if (printButton) {
        printButton.textContent = '🖨️ พิมพ์ Report';
        printButton.disabled = false;
      }
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
      const response = await authenticatedFetch('https://jaidee-backend.onrender.com/api/reports', {
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
          <button onClick={handlePrint} className={styles.printButton}>
            🖨️ พิมพ์ Report
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
