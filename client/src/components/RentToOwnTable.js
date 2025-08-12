import { useState } from "react";
import styles from "./RentToOwnTable.module.css"; // Import CSS Module

export default function RentToOwnTable({ data }) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => setExpanded(!expanded);

  const displayRows = expanded
    ? data
    : data.filter((row) => {
        // Filter for specific installment numbers or "สิ้นงวด" rows
        const installmentNum = typeof row.installment === 'number' ? row.installment : parseInt(row.installment.replace('สิ้นงวดที่ ', ''));
        return [6, 12, 18, 24, 30, 36].includes(installmentNum) || typeof row.installment === 'string';
      });

  const formatNumber = (value) => {
    if (value === null || value === undefined) return "0";
    return Math.round(value).toLocaleString();
  };

  const formatPrincipal = (value, isEndPeriod) => {
    if (isEndPeriod) return "–"; // แทนค่าติดลบด้วยขีดกลาง
    return formatNumber(value);
  };

  const formatRemaining = (value, isEndPeriod) => {
    if (isEndPeriod) return formatNumber(value);
    return value > 0 ? formatNumber(value) : "0";
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.header}>ตารางการผ่อนชำระเช่าออม</h2>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className={styles.tableHeader}>
            <tr>
              <th className={styles.th}>งวดที่</th>
              <th className={styles.th}>ชำระ</th>
              <th className={styles.th}>ดอกเบี้ย</th>
              <th className={styles.th}>ชำระเงินต้น</th>
              <th className={styles.th}>คงเหลือเงินต้น</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, idx) => {
              const isEndPeriod = typeof row.installment === "string" && row.installment.includes("สิ้นงวด");

              return (
                <tr
                  key={idx}
                  className={isEndPeriod ? styles.endOfMonthRow : styles.normalRow}
                >
                  <td className={styles.td}>{row.installment}</td>
                  <td className={styles.tdRight}>{formatNumber(row.payment)}</td>
                  <td className={styles.tdRight}>{formatNumber(row.interest)}</td>
                  <td className={styles.tdRight}>{formatPrincipal(row.principalPaid, isEndPeriod)}</td>
                  <td className={styles.tdRight}>{formatRemaining(row.remainingPrincipal, isEndPeriod)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={styles.buttonContainer}>
        <button
          onClick={toggleExpanded}
          className={styles.toggleButton}
        >
          {expanded ? "ย่อกลับ" : "ดูรายละเอียดทั้งหมด"}
        </button>
      </div>
    </div>
  );
}