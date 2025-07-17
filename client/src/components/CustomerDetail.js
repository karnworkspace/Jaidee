import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import RentToOwnTable from './RentToOwnTable';
import styles from './CustomerDetail.module.css';

function CustomerDetail() {
  const { customerId } = useParams();
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    if (customerId) {
      fetch(`http://localhost:3001/api/customers/${customerId}`)
        .then(res => res.json())
        .then(data => setCustomer(data))
        .catch(error => console.error('Error fetching customer details:', error));
    }
  }, [customerId]);

  if (!customer) {
    return <div>Loading...</div>;
  }

  const formatNumber = (num) => {
    if (num === null || num === undefined || num === '') return '-';
    return parseFloat(num).toLocaleString('en-US');
  };

  return (
    <div className={styles.detailContainer}>
      <div className={styles.contentWrapper}>
        <div className={styles.header}>
          <h1>
            {customer.name}
            <span>ดูแลโดย: {customer.officer}</span>
          </h1>
          <Link to={`/edit-customer/${customerId}`} className={styles.editButton}>แก้ไขข้อมูล</Link>
        </div>

        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={styles.value}>{customer.potentialScore || 0}%</div>
            <div className={styles.label}>Potential Score</div>
            <div className={styles.subtitle}>คะแนนศักยภาพ</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.value}>{customer.degreeOfOwnership || 0}%</div>
            <div className={styles.label}>Ownership</div>
            <div className={styles.subtitle}>ระดับความเป็นเจ้าของ</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.value}>{customer.actionPlanProgress || 0}%</div>
            <div className={styles.label}>Plan Progress</div>
            <div className={styles.subtitle}>ความคืบหน้าแผน</div>
          </div>
        </div>

        <div className={styles.mainContent}>
          <div className={styles.leftColumn}>
            <div className={styles.infoSection}>
              <h2>👤 ข้อมูลส่วนบุคคล</h2>
              <div className={styles.infoGroupGrid}>
                <div className={styles.infoGroup}><label>อาชีพ</label><p>{customer.job}</p></div>
                <div className={styles.infoGroup}><label>ตำแหน่ง</label><p>{customer.position}</p></div>
              </div>
              {customer.businessOwnerType === 'เจ้าของธุรกิจส่วนตัว' && (
                <div className={styles.infoGroup}><label>ประเภทธุรกิจส่วนตัว</label><p>{customer.privateBusinessType}</p></div>
              )}
            </div>

            <div className={styles.infoSection}>
              <h2>🏠 ข้อมูลทรัพย์สิน</h2>
              <div className={styles.infoGroupGrid}>
                <div className={styles.infoGroup}><label>โครงการ</label><p>{customer.projectName}</p></div>
                <div className={styles.infoGroup}><label>เลขห้อง</label><p>{customer.unit || customer.roomNumber}</p></div>
              </div>
              <div className={styles.infoGroupGrid}>
                <div className={styles.infoGroup}><label>มูลค่าทรัพย์</label><p>{formatNumber(customer.propertyValue)} บาท</p></div>
                <div className={styles.infoGroup}><label>ประวัติการชำระเงิน</label><p>{customer.paymentHistory}</p></div>
              </div>
            </div>
          </div>

          <div className={styles.rightColumn}>
            <div className={styles.infoSection}>
              <h2>💳 ข้อมูลการเงินและสินเชื่อ</h2>
              <div className={styles.infoGroupGrid}>
                <div className={styles.infoGroup}><label>รายได้ปัจจุบัน</label><p>{formatNumber(customer.income)} บาท</p></div>
                <div className={styles.infoGroup}><label>ภาระหนี้ปัจจุบัน</label><p>{formatNumber(customer.debt)} บาท</p></div>
              </div>
              <div className={styles.infoGroupGrid}>
                <div className={styles.infoGroup}><label>สถานะทางการเงิน</label><p>{customer.financialStatus}</p></div>
                <div className={styles.infoGroup}><label>เป้าหมายยื่นกู้</label><p>{customer.targetDate ? new Date(customer.targetDate).toLocaleDateString('th-TH') : '-'}</p></div>
              </div>
              <div className={styles.infoGroup}><label>ปัญหาด้านสินเชื่อ</label>
                {customer.loanProblem && customer.loanProblem.length > 0 ? (
                  <ul>
                    {customer.loanProblem.map((problem, index) => (
                      <li key={index}>{problem}</li>
                    ))}
                  </ul>
                ) : (
                  <p>ไม่มี</p>
                )}
              </div>
              <div className={styles.infoGroup}><label>แผนการดำเนินการ</label>
                {customer.actionPlan && customer.actionPlan.length > 0 ? (
                  <ul>
                    {customer.actionPlan.map((plan, index) => (
                      <li key={index}>{plan}</li>
                    ))}
                  </ul>
                ) : (
                  <p>ไม่มี</p>
                )}
              </div>
            </div>
          </div>
        </div>

      {customer.loanEstimation && customer.targetBank && (
        <div className={styles.loanTable}>
          <h2>ประมาณการวงเงินที่จะสามารถกู้ได้ (ธนาคาร: {customer.targetBank})</h2>
          <table>
            <thead>
              <tr>
                <th>สถานการณ์ภาระหนี้ (บาท/เดือน)</th>
                {[40, 30, 20, 10].map(term => (
                  <th key={term}>วงเงินกู้สูงสุด ({term} ปี)</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customer.loanEstimation.map((scenario, index) => (
                <tr key={index}>
                  <td>{scenario.label} ({formatNumber(scenario.debt)})</td>
                  {[40, 30, 20, 10].map(term => {
                    const amount = scenario.loanAmounts[term];
                    return (
                      <td key={term}>
                        {amount === 'N/A' || amount === null || amount === undefined ? '-' : formatNumber(amount)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      

      {customer.detailedRentToOwnEstimation && (
        <div className={styles.loanTable}>
          <h2>ผลลัพธ์การประเมินเช่าออม</h2>
          <table>
            <thead>
              <tr>
                <th>รายการ</th>
                <th>มูลค่า (THB)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>มูลค่าทรัพย์หลังหักส่วนลด</td>
                <td>{formatNumber(customer.detailedRentToOwnEstimation.propertyAfterDiscount)}</td>
              </tr>
              <tr>
                <td>ค่าเช่าผ่อนต่อเดือน</td>
                <td>{formatNumber(customer.detailedRentToOwnEstimation.monthlyRent)}</td>
              </tr>
              <tr>
                <td>ยอดชำระรวม</td>
                <td>{formatNumber(customer.detailedRentToOwnEstimation.totalPaid)}</td>
              </tr>
              <tr>
                <td>ค่าประกัน</td>
                <td>{formatNumber(customer.detailedRentToOwnEstimation.guarantee)}</td>
              </tr>
              <tr>
                <td>ค่าเช่าล่วงหน้า</td>
                <td>{formatNumber(customer.detailedRentToOwnEstimation.prepaidRent)}</td>
              </tr>
              <tr>
                <td>ชำระเพิ่มเติมวันทำสัญญา</td>
                <td>{formatNumber(customer.detailedRentToOwnEstimation.additionalPayment)}</td>
              </tr>
              <tr>
                <td>ค่าบริการวันโอน</td>
                <td>{formatNumber(customer.detailedRentToOwnEstimation.transferFee)}</td>
              </tr>
              <tr>
                <td>เงินออมสะสม</td>
                <td>{formatNumber(customer.detailedRentToOwnEstimation.accumulatedSavings)}</td>
              </tr>
              <tr>
                <td>เงินต้นคงเหลือ</td>
                <td>{formatNumber(customer.detailedRentToOwnEstimation.remainingPrincipal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {customer.detailedRentToOwnEstimation && customer.detailedRentToOwnEstimation.amortizationTable && customer.detailedRentToOwnEstimation.amortizationTable.length > 0 && (
        <RentToOwnTable data={customer.detailedRentToOwnEstimation.amortizationTable} />
      )}

      {customer.selectedBank && (
        <div className={styles.infoSection}>
          <h2>อัตราผ่อนของธนาคารที่ลูกค้าควรเลือกสินเชื่อ</h2>
          <div className={styles.infoGroup}><label>ธนาคาร</label><p>{customer.selectedBank}</p></div>
          <div className={styles.infoGroup}><label>ระยะเวลาผ่อนที่แนะนำ</label><p>{customer.recommendedLoanTerm} ปี</p></div>
          <div className={styles.infoGroup}><label>อัตราผ่อนที่แนะนำ</label><p>{customer.recommendedInstallment} บาท/เดือน</p></div>
        </div>
      )}

        <div className={styles.footerButtons}>
          <Link to="/" className={styles.editButton}>กลับหน้าแรก</Link>
        </div>
      </div>
    </div>
  );
}

export default CustomerDetail;
