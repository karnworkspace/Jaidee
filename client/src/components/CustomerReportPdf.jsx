import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.4,
    color: '#333333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1.5,
    borderBottomColor: '#0d47a1',
    paddingBottom: 12,
    marginBottom: 20,
  },
  logo: {
    fontSize: 16,
    color: '#0d47a1',
    fontWeight: 'bold',
  },
  headerCenter: {
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#555555',
  },
  headerDate: {
    fontSize: 10,
    color: '#555555',
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0d47a1',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  infoGrid: {
    flexDirection: 'column',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  infoLabel: {
    fontWeight: 'bold',
    width: 140,
  },
  infoValue: {
    flex: 1,
  },
  list: {
    flexDirection: 'column',
  },
  listItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#0d47a1',
    paddingLeft: 8,
    paddingVertical: 4,
    backgroundColor: '#f3f8ff',
    marginBottom: 4,
  },
  listIndex: {
    fontWeight: 'bold',
    marginRight: 4,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
  },
  tableRowHeader: {
    backgroundColor: '#0d47a1',
  },
  tableRowAlt: {
    backgroundColor: '#f3f8ff',
  },
  tableCell: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 6,
    fontSize: 9,
  },
  tableHeaderCell: {
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  tableBodyCell: {
    textAlign: 'center',
  },
  highlightBox: {
    backgroundColor: '#fff3cd',
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ffe8a1',
  },
  disclaimerBox: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#dc3545',
    marginTop: 6,
  },
  disclaimerText: {
    marginBottom: 8,
    textAlign: 'justify',
  },
  acknowledgementBox: {
    backgroundColor: '#e7f3ff',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
    textAlign: 'center',
  },
  footer: {
    marginTop: 18,
    alignItems: 'center',
  },
  footerText: {
    fontWeight: 'bold',
  },
  contactBox: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 6,
    textAlign: 'center',
  },
  contactLine: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
});

const formatNumberValue = (value, fallback = '-') => {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }
  const sign = number < 0 ? '-' : '';
  const absolute = Math.abs(number);
  const [integerPart, fractionPart] = absolute.toString().split('.');
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (fractionPart) {
    return `${sign}${formattedInteger}.${fractionPart}`;
  }
  return `${sign}${formattedInteger}`;
};

const formatCurrencyOrZero = (value, unit = 'บาท') => {
  const formatted = formatNumberValue(value, '0');
  return `${formatted} ${unit}`;
};

const safeText = (value, fallback = 'ไม่ระบุ') => {
  if (value === null || value === undefined) {
    return fallback;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return fallback;
  }
  return String(value);
};

const TableRow = ({ cells, isHeader, index }) => (
  <View
    style={[
      styles.tableRow,
      isHeader && styles.tableRowHeader,
      !isHeader && index % 2 === 1 && styles.tableRowAlt,
    ]}
  >
    {cells.map((cell, cellIndex) => (
      <Text
        key={cellIndex}
        style={[
          styles.tableCell,
          isHeader ? styles.tableHeaderCell : styles.tableBodyCell,
          cell.flex ? { flex: cell.flex } : null,
          cell.align ? { textAlign: cell.align } : null,
        ]}
      >
        {cell.text}
      </Text>
    ))}
  </View>
);

const CustomerReportPdf = ({ data }) => {
  if (!data) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text>ไม่พบข้อมูลรายงาน</Text>
        </Page>
      </Document>
    );
  }

  const {
    reportDate,
    analyst,
    name,
    age,
    phone,
    job,
    position,
    projectName,
    unit,
    roomNumber,
    propertyPrice,
    propertyValue,
    discount,
    problems,
    actionPlan,
    income,
    debt,
    loanTerm,
    ltv,
    ltvNote,
    loanEstimationTable,
    amortizationTable,
    monthlyRent,
    expectedCompletion,
    additionalNotes = [],
    debtLimit,
    loanTermAfter,
    selectedInstallment,
  } = data;

  const normalizedInstallment = Number(selectedInstallment || 36);

  const noteEntries = Array.isArray(additionalNotes)
    ? additionalNotes
        .map((note, index) => ({ note: typeof note === 'string' ? note.trim() : '', index }))
        .filter((item) => item.note)
        .map((item) => `หมายเหตุ${item.index + 1}: ${item.note}`)
    : [];

  const basePlans = Array.isArray(actionPlan) && actionPlan.length > 0
    ? actionPlan
    : ['ไม่มีแผนการดำเนินการที่ระบุ'];

  const mergedPlans = [...basePlans, ...noteEntries];

  const computedPropertyValue = (() => {
    const basePrice = Number(propertyPrice) || Number(propertyValue) || 0;
    const discountValue = Number(discount) || 0;
    const result = basePrice - discountValue;
    if (!Number.isFinite(result) || result <= 0) {
      return 'ไม่ระบุ';
    }
    return `${formatNumberValue(result)} บาท`;
  })();

  const ltvText = (() => {
    const formatted = formatNumberValue(ltv);
    if (formatted === '-') {
      return 'ไม่ระบุ';
    }
    const note = ltvNote ? ` (${ltvNote})` : '';
    return `${formatted}%${note}`;
  })();

  const loanTableRows = Array.isArray(loanEstimationTable) ? loanEstimationTable : [];
  const amortizationRows = Array.isArray(amortizationTable) ? amortizationTable : [];

  const getLoanAmount = (amounts, key) => {
    if (!amounts) {
      return '0';
    }
    const value = amounts[key] ?? amounts[String(key)];
    return formatNumberValue(value, '0');
  };

  const selectedAmortizationRow = amortizationRows.find((row) => {
    const installmentValue = row?.installment ?? row?.period;
    if (typeof installmentValue === 'string') {
      return installmentValue.includes(String(normalizedInstallment));
    }
    return Number(installmentValue) === normalizedInstallment;
  });

  const filteredAmortizationRows = amortizationRows.filter((row) => {
    const installmentValue = row?.installment ?? row?.period;
    if (typeof installmentValue === 'string' && installmentValue.includes('สิ้นงวด')) {
      return true;
    }
    if (typeof installmentValue === 'number') {
      return [12, 24, 36].includes(installmentValue);
    }
    return false;
  });

  const debtLimitDisplay = (() => {
    const formatted = formatNumberValue(debtLimit);
    if (formatted === '-') {
      return 'ไม่ระบุ';
    }
    return `${formatted} บาท/เดือน`;
  })();

  const loanTermAfterDisplay = (() => {
    if (loanTermAfter === null || loanTermAfter === undefined || loanTermAfter === '') {
      return 'ไม่ระบุ';
    }
    return `${loanTermAfter} ปี`;
  })();

  const comparisonRows = [
    {
      label: 'ภาระหนี้',
      before: `${formatNumberValue(debt, '0')} บาท/เดือน`,
      after: debtLimitDisplay,
    },
    {
      label: 'ระยะเวลาขอสินเชื่อ',
      before: `${loanTerm || '40'} ปี`,
      after: loanTermAfterDisplay,
    },
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logo}>LIVNEX ใจดี</Text>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Consumer Advise Article</Text>
            <Text style={styles.headerSubtitle}>
              เอกสารให้คำแนะนำแก่ลูกค้าของ LIVNEX เพื่อเตรียมความพร้อมในการยื่นขอสินเชื่อกับธนาคาร
            </Text>
          </View>
          <Text style={styles.headerDate}>วันที่: {safeText(reportDate, '-')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ข้อมูลทั่วไป</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ชื่อ:</Text>
              <Text style={styles.infoValue}>{safeText(name || data.customer_name)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>อายุ:</Text>
              <Text style={styles.infoValue}>
                {age ? `${formatNumberValue(age)} ปี` : 'ไม่ระบุ'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>เบอร์โทร:</Text>
              <Text style={styles.infoValue}>{safeText(phone)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>อาชีพ:</Text>
              <Text style={styles.infoValue}>{safeText(job)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ตำแหน่ง:</Text>
              <Text style={styles.infoValue}>{safeText(position)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>โครงการ:</Text>
              <Text style={styles.infoValue}>{safeText(projectName)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>เลขห้อง:</Text>
              <Text style={styles.infoValue}>{safeText(unit || roomNumber)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>มูลค่าเช่าออม:</Text>
              <Text style={styles.infoValue}>{computedPropertyValue}</Text>
            </View>
            {expectedCompletion ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>แผนเสร็จสิ้นโดยประมาณ:</Text>
                <Text style={styles.infoValue}>{safeText(expectedCompletion)}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ปัญหาด้านสินเชื่อ</Text>
          <View style={styles.list}>
            {(Array.isArray(problems) && problems.length > 0 ? problems : ['ไม่มีข้อมูลปัญหาด้านสินเชื่อ']).map((item, index) => (
              <View key={index} style={styles.listItem}>
                <Text>
                  <Text style={styles.listIndex}>{index + 1}.</Text>
                  {safeText(item)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ทำอย่างไรถึงสามารถดำเนินการแผนการเตรียมยื่นขอสินเชื่อ</Text>
          <View style={styles.list}>
            {mergedPlans.map((plan, index) => (
              <View key={index} style={styles.listItem}>
                <Text>
                  <Text style={styles.listIndex}>{index + 1}.</Text>
                  {safeText(plan)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ข้อมูลรายได้และภาระหนี้</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>รายได้ต่อเดือน:</Text>
              <Text style={styles.infoValue}>{formatCurrencyOrZero(income)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ภาระหนี้ต่อเดือน:</Text>
              <Text style={styles.infoValue}>{formatCurrencyOrZero(debt)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ระยะเวลาขอสินเชื่อ:</Text>
              <Text style={styles.infoValue}>{safeText(loanTerm || '40')} ปี</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>LTV:</Text>
              <Text style={styles.infoValue}>{ltvText}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ตารางประมาณการวงเงินสินเชื่อ (หน่วย : บาท)</Text>
          {loanTableRows.length > 0 ? (
            <View style={styles.table}>
              <TableRow
                isHeader
                cells={[
                  { text: 'ภาระหนี้ (บาท/เดือน)', flex: 2 },
                  { text: '40 ปี' },
                  { text: '30 ปี' },
                  { text: '20 ปี' },
                  { text: '10 ปี' },
                ]}
              />
              {loanTableRows.map((scenario, index) => {
                const loanAmounts = scenario?.loanAmounts || {};
                const label = scenario?.label ? `${scenario.label}` : '';
                const debtAmount = formatNumberValue(scenario?.debt, '0');
                return (
                  <TableRow
                    key={index}
                    index={index}
                    cells={[
                      { text: `${label ? `${label} ` : ''}(${debtAmount})`, flex: 2 },
                      { text: getLoanAmount(loanAmounts, 40) },
                      { text: getLoanAmount(loanAmounts, 30) },
                      { text: getLoanAmount(loanAmounts, 20) },
                      { text: getLoanAmount(loanAmounts, 10) },
                    ]}
                  />
                );
              })}
            </View>
          ) : (
            <Text>ไม่มีข้อมูลตารางประมาณการวงเงินสินเชื่อ</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ข้อมูลเช่าออม</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>มูลค่าเช่าออม:</Text>
              <Text style={styles.infoValue}>{formatCurrencyOrZero(propertyValue)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>อัตราค่าเช่าออม:</Text>
              <Text style={styles.infoValue}>{formatCurrencyOrZero(monthlyRent, 'บาท/เดือน')}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>คาดว่าลูกค้าจะชำระค่าเช่าออมงวดที่:</Text>
              <Text style={styles.infoValue}>{normalizedInstallment} งวด</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>เงินต้นค่าทรัพย์คงเหลือ ณ สิ้นงวด:</Text>
              <Text style={styles.infoValue}>
                {formatCurrencyOrZero(
                  selectedAmortizationRow?.remainingPrincipal ?? selectedAmortizationRow?.remaining,
                )}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>จำนวนเงินจำกัดภาระหนี้</Text>
          <View style={styles.highlightBox}>
            <Text>
              * ลูกค้าต้องชำระหนี้ทุกประเภท ตามกำหนดเวลา (ไม่ค้างชำระเกินกำหนด) และควบคุมภาระหนี้ให้ไม่เกิน {debtLimitDisplay}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ระยะเวลาขอสินเชื่อหลังแผน</Text>
          <View style={styles.highlightBox}>
            <Text>ระยะเวลาขอสินเชื่อหลังแผน: {loanTermAfterDisplay}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ตารางเปรียบเทียบ</Text>
          <View style={styles.table}>
            <TableRow
              isHeader
              cells={[
                { text: 'รายการ', flex: 2 },
                { text: 'ก่อนแผน' },
                { text: 'หลังแผน' },
              ]}
            />
            {comparisonRows.map((row, index) => (
              <TableRow
                key={index}
                index={index}
                cells={[
                  { text: row.label, flex: 2, align: 'left' },
                  { text: row.before },
                  { text: row.after },
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ผ่อนแล้ว เงินต้นเหลือเท่าไหร่ ประมาณการตารางเช่าออม</Text>
          <View style={styles.infoGrid}>
            <Text>มูลค่าเช่าออม: {formatCurrencyOrZero(propertyValue)}</Text>
            <Text>อัตราค่าเช่าออม: {formatCurrencyOrZero(monthlyRent, 'บาท/เดือน')}</Text>
          </View>
          {filteredAmortizationRows.length > 0 ? (
            <View style={[styles.table, { marginTop: 6 }]}>
              <TableRow
                isHeader
                cells={[
                  { text: 'งวดที่' },
                  { text: 'เงินออมสะสม (หน่วย : บาท)', flex: 2 },
                  { text: 'เงินต้นค่าทรัพย์คงเหลือ ณ สิ้นงวด (หน่วย : บาท)', flex: 2 },
                ]}
              />
              {filteredAmortizationRows.map((row, index) => {
                const installmentValue = row?.installment ?? row?.period ?? '-';
                const savingsValue = row?.payment ?? row?.savings;
                const remainingValue = row?.remainingPrincipal ?? row?.remaining;
                return (
                  <TableRow
                    key={index}
                    index={index}
                    cells={[
                      { text: safeText(installmentValue), align: 'center' },
                      { text: formatNumberValue(savingsValue, '0'), flex: 2 },
                      { text: formatNumberValue(remainingValue, '0'), flex: 2 },
                    ]}
                  />
                );
              })}
            </View>
          ) : (
            <Text>ไม่มีข้อมูลตารางเช่าออม</Text>
          )}
          <Text style={{ fontSize: 8, marginTop: 6, textAlign: 'center', color: '#555555' }}>
            ***ตัวเลขประมาณการ ทั้งนี้ให้ใช้ ตามเอกสารแนบท้ายสัญญา 4: ตารางแสดงอัตราค่าเช่าออมบ้าน
          </Text>
          <View style={{ marginTop: 8, alignItems: 'flex-end' }}>
            <Text style={styles.footerText}>วิเคราะห์โดย: {safeText(analyst, '-')}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ข้อสงวนสิทธิ์ในความรับผิด</Text>
          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerText}>
              ข้อมูลและคำแนะนำในเอกสารนี้จัดทำขึ้นเพื่อวัตถุประสงค์ในการวิเคราะห์เท่านั้น และอาจมีข้อผิดพลาด ความคลาดเคลื่อน หรือไม่เหมาะสมกับสถานการณ์ในอนาคต หรือการเปลี่ยนแปลงของนโยบายต่างๆ บริษัท เงินสดใจดี จำกัด ("บริษัท") ขอสงวนสิทธิ์ในการปรับปรุง เปลี่ยนแปลง หรือยกเลิกข้อมูลและบริการต่างๆ โดยไม่ต้องแจ้งให้ทราบล่วงหน้า
            </Text>
            <Text style={styles.disclaimerText}>
              ผู้ใช้บริการควรปรึกษาผู้เชี่ยวชาญเพื่อขอคำแนะนำที่เหมาะสม และบริษัทจะไม่รับผิดชอบต่อความเสียหายใดๆ ทั้งทางตรงและทางอ้อมที่อาจเกิดขึ้นจากการใช้บริการหรือคำแนะนำของบริษัท
            </Text>
            <View style={styles.acknowledgementBox}>
              <Text style={styles.footerText}>ข้าพเจ้ารับทราบ และจะปฏิบัติตามข้อแนะนำดังกล่าว</Text>
              <Text>ลงชื่อ: ______________________ (ผู้เช่าออม)</Text>
            </View>
            <Text style={{ marginTop: 8 }}>
              <Text style={styles.footerText}>หมายเหตุ:</Text> คำแนะนำสำหรับลูกค้า Livnex เพื่อเตรียมความพร้อมในการยื่นขอสินเชื่อกับธนาคารนี้ เป็นเพียงคำแนะนำจากบริษัท เงินสดใจดี จำกัด เท่านั้น เงื่อนไขอื่นๆ ขึ้นอยู่กับเกณฑ์การพิจารณาของแต่ละธนาคาร
            </Text>
            <View style={{ marginTop: 8, alignItems: 'flex-end' }}>
              <Text style={styles.footerText}>วิเคราะห์โดย: {safeText(analyst, '-')}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.section, styles.footer]}>
          <View style={styles.contactBox}>
            <Text style={styles.contactLine}>LINE: @livnex</Text>
            <Text style={styles.contactLine}>Website: www.livnex.co</Text>
            <Text style={styles.contactLine}>Call: 1776</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default CustomerReportPdf;
