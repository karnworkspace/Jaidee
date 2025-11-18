// ฟังก์ชัน handlePrint ใหม่ที่ใช้ Backend API
// แทนที่ฟังก์ชันเดิมในไฟล์ ConsumerAdviseReport.js (บรรทัดประมาณ 140-489)

const handlePrint = async () => {
  try {
    if (!reportData) {
      alert('กรุณารอข้อมูลโหลดเสร็จก่อนพิมพ์');
      return;
    }

    // แสดงสถานะกำลังพิมพ์
    const printButton = document.querySelector('.printButton');
    if (printButton) {
      printButton.textContent = '🖨️ กำลังสร้าง PDF...';
      printButton.disabled = true;
    }

    // เตรียมข้อมูลสำหรับส่งไป Backend
    const pdfData = {
      ...reportData,
      selectedInstallment,
      additionalNotes,
      debtLimit: parseInt(debtLimit),
      loanTermAfter: parseInt(loanTermAfter)
    };

    // เรียก Backend API (ใช้ชื่อ service จาก docker-compose)
    const apiUrl = process.env.NODE_ENV === 'production'
      ? 'http://backend:3001/api/reports/generate-pdf'  // ใน Docker network
      : 'http://localhost:3001/api/reports/generate-pdf'; // Local development

    const response = await authenticatedFetch(apiUrl, {
      method: 'POST',
      body: JSON.stringify(pdfData)
    });

    if (!response.ok) {
      throw new Error('Failed to generate PDF');
    }

    // รับ PDF blob จาก response
    const blob = await response.blob();

    // สร้าง download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = `รายงาน_Consumer_Advise_${customerData?.name || customerData?.customer_name || 'Report'}_${new Date().toLocaleDateString('th-TH')}.pdf`;
    link.download = fileName;

    // คลิกเพื่อดาวน์โหลด
    document.body.appendChild(link);
    link.click();

    // ลบ link
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    alert('✅ สร้าง PDF เรียบร้อยแล้ว!\n\nไฟล์: ' + fileName);

  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('❌ เกิดข้อผิดพลาดในการสร้าง PDF\n\nกรุณาลองใหม่อีกครั้ง\n\nError: ' + error.message);
  } finally {
    // รีเซ็ตปุ่ม
    const printButton = document.querySelector('.printButton');
    if (printButton) {
      printButton.textContent = '🖨️ พิมพ์ Report';
      printButton.disabled = false;
    }
  }
};
