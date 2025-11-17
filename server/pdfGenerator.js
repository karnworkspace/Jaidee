const puppeteer = require('puppeteer');

/**
 * สร้าง HTML Template สำหรับรายงาน Consumer Advise
 */
function generateReportHTML(reportData) {
  const {
    // ข้อมูลทั่วไป
    name = 'ไม่ระบุ',
    age = 'ไม่ระบุ',
    phone = 'ไม่ระบุ',
    job = 'ไม่ระบุ',
    position = 'ไม่ระบุ',
    projectName = 'ไม่ระบุ',
    unit = 'ไม่ระบุ',
    roomNumber = 'ไม่ระบุ',
    propertyPrice = 0,
    propertyValue = 0,
    discount = 0,

    // ข้อมูลรายงาน
    reportDate = new Date().toLocaleDateString('th-TH'),
    analyst = 'นายพิชญ์ สุดทัน',

    // ปัญหาและแผน
    problems = ['ไม่มีข้อมูลปัญหาด้านสินเชื่อ'],
    actionPlan = ['ไม่มีแผนการดำเนินการ'],
    additionalNotes = [],

    // ข้อมูลรายได้
    income = 0,
    debt = 0,
    loanTerm = 40,
    ltv = 100,
    ltvNote = 'House 1 (บ้านหลังที่ 1)',

    // ตาราง
    loanEstimationTable = [],
    amortizationTable = [],

    // ข้อมูลเช่าออม
    monthlyRent = 0,
    selectedInstallment = 36,

    // ข้อมูลหลังแผน
    debtLimit = 8000,
    loanTermAfter = 40
  } = reportData;

  // คำนวณมูลค่าเช่าออม
  const finalPropertyValue = (parseFloat(propertyPrice) || parseFloat(propertyValue) || 0) - (parseFloat(discount) || 0);

  // หาเงินต้นคงเหลือ
  const selectedRow = amortizationTable.find(row => {
    const installment = row.installment || row.period || 0;
    return installment === selectedInstallment;
  });
  const remainingPrincipal = selectedRow ? (selectedRow.remainingPrincipal || selectedRow.remaining || 0) : 0;

  // รวมแผนการดำเนินการกับหมายเหตุ
  const allPlans = [
    ...actionPlan,
    ...additionalNotes
      .filter(note => note && note.trim())
      .map((note, index) => `หมายเหตุ${index + 1}: ${note}`)
  ];

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Consumer Advise Report</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Sarabun', 'Arial', sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #333;
      background: white;
    }

    .container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 10mm;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      border-bottom: 2px solid #333;
      padding-bottom: 15px;
    }

    .logo h2 {
      color: #007bff;
      font-size: 20px;
      margin: 0;
    }

    .title {
      text-align: center;
      flex: 1;
      padding: 0 20px;
    }

    .title h1 {
      font-size: 22px;
      color: #333;
      margin-bottom: 5px;
    }

    .title p {
      font-size: 12px;
      color: #666;
    }

    .date p {
      font-size: 12px;
      color: #666;
    }

    /* Section */
    .section {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }

    .section h3 {
      color: #007bff;
      font-size: 16px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }

    /* Info Rows */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 10px;
    }

    .info-row {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }

    .info-row .label {
      font-weight: bold;
      min-width: 150px;
      color: #333;
    }

    .info-row .value {
      color: #666;
      margin-left: 10px;
    }

    /* Problems */
    .problem-item {
      margin-bottom: 8px;
      padding: 8px;
      background: #f8f9fa;
      border-left: 4px solid #dc3545;
      border-radius: 4px;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 12px;
    }

    table th {
      background: #007bff;
      color: white;
      padding: 10px;
      text-align: center;
      font-weight: bold;
      border: 1px solid #ddd;
    }

    table td {
      padding: 8px;
      text-align: center;
      border: 1px solid #ddd;
    }

    table tbody tr:nth-child(even) {
      background: #f8f9fa;
    }

    /* Disclaimer */
    .disclaimer-box {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #dc3545;
      margin: 15px 0;
    }

    .disclaimer-box p {
      margin: 10px 0;
      text-align: justify;
      line-height: 1.8;
    }

    .acknowledgement {
      margin: 20px 0;
      padding: 15px;
      background: #e7f3ff;
      border-radius: 5px;
      text-align: center;
    }

    .signature-section {
      margin: 15px 0;
      text-align: center;
    }

    .advice-note {
      margin: 15px 0;
      padding: 12px;
      background: #fff3cd;
      border-radius: 5px;
      border-left: 4px solid #ffc107;
    }

    /* Contact */
    .contact-section {
      margin-top: 30px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
      text-align: center;
    }

    .contact-info p {
      margin: 5px 0;
      font-weight: bold;
    }

    .analyst {
      text-align: right;
      margin-top: 20px;
      font-weight: bold;
    }

    /* Print styles */
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      .section {
        page-break-inside: avoid;
      }

      table {
        page-break-inside: avoid;
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
        <p>วันที่: ${reportDate}</p>
      </div>
    </div>

    <!-- ข้อมูลทั่วไป -->
    <div class="section">
      <h3>ข้อมูลทั่วไป</h3>
      <div class="info-grid">
        <div class="info-row">
          <span class="label">ชื่อ:</span>
          <span class="value">${name}</span>
        </div>
        <div class="info-row">
          <span class="label">อายุ:</span>
          <span class="value">${age} ปี</span>
        </div>
        <div class="info-row">
          <span class="label">เบอร์โทร:</span>
          <span class="value">${phone}</span>
        </div>
        <div class="info-row">
          <span class="label">อาชีพ:</span>
          <span class="value">${job}</span>
        </div>
        <div class="info-row">
          <span class="label">ตำแหน่ง:</span>
          <span class="value">${position}</span>
        </div>
        <div class="info-row">
          <span class="label">โครงการ:</span>
          <span class="value">${projectName}</span>
        </div>
        <div class="info-row">
          <span class="label">เลขห้อง:</span>
          <span class="value">${unit || roomNumber}</span>
        </div>
        <div class="info-row">
          <span class="label">มูลค่าเช่าออม:</span>
          <span class="value">${finalPropertyValue.toLocaleString()} บาท</span>
        </div>
      </div>
    </div>

    <!-- ปัญหาด้านสินเชื่อ -->
    <div class="section">
      <h3>ปัญหาด้านสินเชื่อ</h3>
      ${problems.map((problem, index) => `
        <div class="problem-item">${index + 1}. ${problem}</div>
      `).join('')}
    </div>

    <!-- แผนการเตรียมยื่นขอสินเชื่อ -->
    <div class="section">
      <h3>ทำอย่างไรถึงสามารถดำเนินการแผนการเตรียมยื่นข้อสินเชื่อ</h3>
      <h4 style="color: #007bff; margin: 15px 0 10px 0;">สิ่งที่ต้องปฏิบัติ:</h4>
      ${allPlans.map((plan, index) => `
        <p style="margin-bottom: 8px;">${index + 1}. ${plan}</p>
      `).join('')}
    </div>

    <!-- ข้อมูลรายได้และภาระหนี้ -->
    <div class="section">
      <h3>ข้อมูลรายได้และภาระหนี้</h3>
      <div class="info-row">
        <span class="label">รายได้ต่อเดือน:</span>
        <span class="value">${parseFloat(income).toLocaleString()} บาท</span>
      </div>
      <div class="info-row">
        <span class="label">ภาระหนี้ต่อเดือน:</span>
        <span class="value">${parseFloat(debt).toLocaleString()} บาท</span>
      </div>
      <div class="info-row">
        <span class="label">ระยะเวลาขอสินเชื่อ:</span>
        <span class="value">${loanTerm} ปี</span>
      </div>
      <div class="info-row">
        <span class="label">LTV:</span>
        <span class="value">${ltv}% (${ltvNote})</span>
      </div>
    </div>

    <!-- ตารางประมาณการวงเงินสินเชื่อ -->
    <div class="section">
      <h3>ตารางประมาณการวงเงินสินเชื่อ (หน่วย : บาท)</h3>
      ${loanEstimationTable && loanEstimationTable.length > 0 ? `
        <table>
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
            ${loanEstimationTable.map(scenario => {
              const label = scenario.label || '';
              const debt = scenario.debt || 0;
              const loanAmounts = scenario.loanAmounts || {};
              return `
                <tr>
                  <td>${label} (${debt.toLocaleString()})</td>
                  <td>${(loanAmounts[40] || 0).toLocaleString()}</td>
                  <td>${(loanAmounts[30] || 0).toLocaleString()}</td>
                  <td>${(loanAmounts[20] || 0).toLocaleString()}</td>
                  <td>${(loanAmounts[10] || 0).toLocaleString()}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      ` : '<p>ไม่มีข้อมูลตารางประมาณการวงเงินสินเชื่อ</p>'}
    </div>

    <!-- ข้อมูลเช่าออม -->
    <div class="section">
      <h3>ข้อมูลเช่าออม</h3>
      <div class="info-row">
        <span class="label">มูลค่าเช่าออม:</span>
        <span class="value">${finalPropertyValue.toLocaleString()} บาท</span>
      </div>
      <div class="info-row">
        <span class="label">อัตราค่าเช่าออม:</span>
        <span class="value">${parseFloat(monthlyRent).toLocaleString()} บาท/เดือน</span>
      </div>
      <div class="info-row">
        <span class="label">คาดว่าลูกค้าจะชำระค่าเช่าออมงวดที่:</span>
        <span class="value">${selectedInstallment} งวด</span>
      </div>
      <div class="info-row">
        <span class="label">เงินต้นค่าทรัพย์คงเหลือ ณ สิ้นงวด:</span>
        <span class="value">${remainingPrincipal.toLocaleString()} บาท</span>
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
            <td>${parseFloat(debt).toLocaleString()} บาท/เดือน</td>
            <td>${debtLimit} บาท/เดือน</td>
          </tr>
          <tr>
            <td>ระยะเวลาขอสินเชื่อ</td>
            <td>${loanTerm} ปี</td>
            <td>${loanTermAfter} ปี</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ตารางเช่าออม -->
    <div class="section">
      <h3>ผ่อนแล้ว เงินต้นเหลือเท่าไหร่ ประมาณการตารางเช่าออม</h3>
      <p style="margin: 5px 0;"><strong>มูลค่าเช่าออม:</strong> ${finalPropertyValue.toLocaleString()} บาท</p>
      <p style="margin: 5px 0;"><strong>อัตราค่าเช่าออม:</strong> ${parseFloat(monthlyRent).toLocaleString()} บาท</p>

      ${amortizationTable && amortizationTable.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>งวดที่</th>
              <th>เงินออมสะสม (หน่วย : บาท)</th>
              <th>เงินต้นค่าทรัพย์คงเหลือ ณ สิ้นงวด (หน่วย : บาท)</th>
            </tr>
          </thead>
          <tbody>
            ${amortizationTable
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
              .map(row => {
                const installment = row.installment || row.period || 0;
                const savings = row.payment || row.savings || 0;
                const remaining = row.remainingPrincipal || row.remaining || 0;
                return `
                  <tr>
                    <td>${installment}</td>
                    <td>${savings.toLocaleString()}</td>
                    <td>${remaining.toLocaleString()}</td>
                  </tr>
                `;
              }).join('')}
          </tbody>
        </table>
      ` : '<p>ไม่มีข้อมูลตารางเช่าออม</p>'}

      <p style="font-size: 11px; color: #666; font-style: italic; margin: 15px 0; text-align: center;">
        ***ตัวเลขประมาณการ ทั้งนี้ให้ใช้ ตามเอกสารแนบท้ายสัญญา 4: ตารางแสดงอัตราค่าเช่าออมบ้าน
      </p>

      <p class="analyst">
        <strong>วิเคราะห์โดย:</strong> ${analyst}
      </p>
    </div>

    <!-- ข้อสงวนสิทธิ์ในความรับผิด -->
    <div class="section">
      <h3>ข้อสงวนสิทธิ์ในความรับผิด</h3>
      <div class="disclaimer-box">
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

        <p class="advice-note">
          <strong>หมายเหตุ:</strong> คำแนะนำสำหรับลูกค้า Livnex เพื่อเตรียมความพร้อมในการยื่นขอสินเชื่อกับธนาคารนี้ เป็นเพียงคำแนะนำจากบริษัท เงินสดใจดี จำกัด เท่านั้น เงื่อนไขอื่นๆ ขึ้นอยู่กับเกณฑ์การพิจารณาของแต่ละธนาคาร
        </p>

        <p class="analyst">
          <strong>วิเคราะห์โดย:</strong> ${analyst}
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
}

/**
 * สร้าง PDF จาก HTML
 */
async function generatePDF(reportData) {
  let browser = null;

  try {
    // สร้าง HTML
    const html = generateReportHTML(reportData);

    // เปิด browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // ตั้งค่า content
    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });

    // สร้าง PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      preferCSSPageSize: true
    });

    return pdfBuffer;

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = {
  generatePDF,
  generateReportHTML
};
