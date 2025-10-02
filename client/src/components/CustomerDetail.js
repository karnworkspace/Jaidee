import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import RentToOwnTable from './RentToOwnTable';
import styles from './CustomerDetail.module.css';
import { API_ENDPOINTS } from '../config/api';

function CustomerDetail() {
  const { customerId } = useParams();
  const { authenticatedFetch } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      if (customerId) {
        try {
          const response = await authenticatedFetch(API_ENDPOINTS.CUSTOMER_BY_ID(customerId));
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          setCustomer(data);
        } catch (error) {
          setCustomer(null);
        }
      }
    };

    fetchCustomerDetails();
  }, [customerId, authenticatedFetch]);

  // Safe array helper for rendering defensive against bad shapes
  const toArray = (v) => {
    if (Array.isArray(v)) return v;
    if (v === null || v === undefined || v === '') return [];
    if (typeof v === 'string') {
      try {
        const parsed = JSON.parse(v);
        if (Array.isArray(parsed)) return parsed;
      } catch (_) {
        const parts = v.split(',').map(s => s.trim()).filter(Boolean);
        if (parts.length) return parts;
      }
    }
    return [];
  };

  if (!customer) {
    return <div>Loading...</div>;
  }

  const navigationSections = [
    {
      id: 'overview',
      title: 'OVERVIEW',
      items: [
        { id: 'kpi', label: '📊 KPI Dashboard', icon: '📊' },
        { id: 'personal', label: '👤 ข้อมูลส่วนบุคคล', icon: '👤' }
      ]
    },
    {
      id: 'property',
      title: 'PROPERTY',
      items: [
        { id: 'property', label: '🏠 ข้อมูลทรัพย์สิน', icon: '🏠' }
      ]
    },
    {
      id: 'financial',
      title: 'FINANCIAL',
      items: [
        { id: 'financialInfo', label: '💳 ข้อมูลการเงิน', icon: '💳' }
      ]
    },
    {
      id: 'bankAnalysis',
      title: 'BANK ANALYSIS',
      items: [
        { id: 'bankMatching', label: '🏦 Bank Matching', icon: '🏦' }
      ]
    },
    {
      id: 'loanEstimation',
      title: 'LOAN ESTIMATION',
      items: [
        { id: 'loanTable', label: '📈 Loan Table', icon: '📈' }
      ]
    },
    {
      id: 'rentToOwn',
      title: 'RENT-TO-OWN',
      items: [
        { id: 'rentResults', label: '💰 ข้อมูลการเช่าออม', icon: '💰' },
        { id: 'amortization', label: '📋 Amortization', icon: '📋' }
      ]
    }
  ];

  const handleNavClick = (sectionId) => {
    setActiveSection(sectionId);
    setIsMobileMenuOpen(false);
    
    // Smooth scroll to section
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined || num === '') return '-';
    return parseFloat(num).toLocaleString('en-US');
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined || value === '' || isNaN(parseFloat(value))) {
      return '-';
    }
    const numValue = parseFloat(value);
    if (numValue === 0) {
      return '0';
    }
    if (numValue <= 1) {
      // If value is decimal (0.5 = 50%), multiply by 100
      return (numValue * 100).toFixed(0);
    } else {
      // If value is already percentage (50), use as is
      return numValue.toFixed(0);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const translateIndicator = (indicator) => {
    const translations = {
      // Bad Credit indicators
      'creditScore < 680': 'เครดิตสกอร์ต่ำกว่า 680',
      'hasProblematicAccountStatus': 'มีบัญชีที่มีปัญหา',
      'hasOverduePayments': 'มีประวัติการชำระเงินล่าช้า',
      
      // Enhanced Bad Income indicators
      'criticallyLowIncome': 'รายได้ต่ำมาก (น้อยกว่า 15,000 บาท)',
      'lowIncome': 'รายได้ต่ำ (15,000-24,999 บาท)',
      'belowAverageIncome': 'รายได้ต่ำกว่าเกณฑ์ (25,000-39,999 บาท)',
      'excessiveDebtBurden': 'ภาระหนี้สูงเกินไป (DSR > 80%)',
      'highDebtBurden': 'ภาระหนี้สูง (DSR 60-80%)',
      'moderateDebtBurden': 'ภาระหนี้ปานกลาง (DSR 40-60%)',
      'unstableIncomeSource': 'แหล่งรายได้ไม่มั่นคง (ธุรกิจส่วนตัว/อิสระ)',
      'privateBusinessOwner': 'เจ้าของธุรกิจส่วนตัว',
      'temporaryEmployment': 'งานชั่วคราวหรือไม่มั่นคง',
      'insufficientIncomeForProperty': 'รายได้ไม่เพียงพอสำหรับทรัพย์สินที่ต้องการ',
      
      // Legacy Bad Income indicators (for backward compatibility)
      'unstableIncome': 'รายได้ไม่มั่นคง (ธุรกิจส่วนตัว/อิสระ)',
      
      // Bad Confidence indicators
      'pastCreditIssues': 'มีปัญหาเครดิตในอดีต',
      'currentFinancialStress': 'มีความเครียดทางการเงินในปัจจุบัน'
    };
    
    return translations[indicator] || indicator;
  };

  // eslint-disable-next-line no-unused-vars
  const translateSeverity = (severity) => {
    const translations = {
      'high': 'สูง',
      'medium': 'ปานกลาง', 
      'low': 'ต่ำ',
      'none': 'ไม่มี'
    };
    
    return translations[severity] || severity;
  };

  return (
    <div className={styles.detailContainer}>
      {/* Mobile Menu Toggle */}
      <button className={styles.mobileMenuToggle} onClick={toggleMobileMenu}>
        ☰
      </button>
      
      {/* Sidebar Overlay for Mobile */}
      <div 
        className={`${styles.sidebarOverlay} ${isMobileMenuOpen ? styles.open : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />
      
      {/* Sidebar */}
      <div className={`${styles.sidebar} ${isMobileMenuOpen ? styles.open : ''}`}>
        <div className={styles.sidebarContent}>
          <div className={styles.sidebarTitle}>
            {customer.name}
          </div>
          
          {navigationSections.map((section) => (
            <div key={section.id} className={styles.navSection}>
              <div className={styles.navSectionTitle}>{section.title}</div>
              {section.items.map((item) => (
                <div
                  key={item.id}
                  className={`${styles.navItem} ${activeSection === item.id ? styles.active : ''}`}
                  onClick={() => handleNavClick(item.id)}
                >
                  {item.label}
                </div>
              ))}
            </div>
          ))}
          
          <div className={styles.navSection}>
            <div className={styles.navSectionTitle}>ACTIONS</div>
            <Link 
              to={`/edit-customer/${customerId}`} 
              className={styles.navItem}
            >
              ✏️ แก้ไขข้อมูล
            </Link>
            <Link 
              to="/" 
              className={styles.navItem}
            >
              🏠 กลับหน้าแรก
            </Link>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className={styles.contentWrapper}>
        <div className={styles.header}>
          <h1>
            {customer.name}
            <span>ผู้วิเคราะห์ CAA: {customer.officer}</span>
          </h1>
        </div>

        {/* KPI Dashboard Section */}
        <div id="kpi" className={styles.section}>
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
          </div>
        </div>

                {/* Personal Information Section */}
        <div id="personal" className={styles.section}>
          <div className={styles.infoSection}>
            <h2>👤 ข้อมูลส่วนบุคคล</h2>
            <div className={styles.infoGroupGrid}>
              <div className={styles.infoGroup}><label>อายุ</label><p>{customer.age ? `${customer.age} ปี` : 'ไม่ระบุ'}</p></div>
              <div className={styles.infoGroup}><label>เบอร์โทร</label><p>{customer.phone || 'ไม่ระบุ'}</p></div>
            </div>
            <div className={styles.infoGroupGrid}>
              <div className={styles.infoGroup}><label>อาชีพ</label><p>{customer.job}</p></div>
              <div className={styles.infoGroup}><label>ตำแหน่ง</label><p>{customer.position}</p></div>
            </div>
            <div className={styles.infoGroupGrid}>
              <div className={styles.infoGroup}><label>วันที่บันทึกข้อมูล</label><p>{customer.created_at ? new Date(customer.created_at).toLocaleString('th-TH') : 'ไม่ระบุ'}</p></div>
              <div className={styles.infoGroup}><label>วันที่อัปเดตล่าสุด</label><p>{customer.updated_at ? new Date(customer.updated_at).toLocaleString('th-TH') : 'ไม่ระบุ'}</p></div>
            </div>
          </div>
        </div>

        

        {/* Financial Information Section */}
        <div id="financialInfo" className={styles.section}>
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



        {/* Property Information Section - Moved to show before Rent-to-Own */}
        <div id="property" className={styles.section}>
          <div className={styles.infoSection}>
            <h2>🏠 ข้อมูลทรัพย์สิน</h2>
            <div className={styles.infoGroupGrid}>
              <div className={styles.infoGroup}><label>โครงการ</label><p>{customer.projectName}</p></div>
              <div className={styles.infoGroup}><label>เลขห้อง</label><p>{customer.unit || customer.roomNumber}</p></div>
            </div>
            <div className={styles.infoGroupGrid}>
              <div className={styles.infoGroup}>
                <label>มูลค่าทรัพย์ (หลังหักส่วนลด)</label>
                <p>{formatNumber((() => {
                  const propertyPrice = parseFloat(customer.propertyPrice) || parseFloat(customer.propertyValue) || 0;
                  const discount = parseFloat(customer.discount) || 0;
                  return propertyPrice - discount;
                })())} บาท</p>
                {(() => {
                  const propertyPrice = parseFloat(customer.propertyPrice) || parseFloat(customer.propertyValue) || 0;
                  const discount = parseFloat(customer.discount) || 0;
                  if (discount > 0) {
                    return <small style={{color: '#6b7280', fontSize: '0.8rem'}}>
                      เดิม: {formatNumber(propertyPrice)} บาท, ส่วนลด: {formatNumber(discount)} บาท
                    </small>;
                  }
                  return null;
                })()}
              </div>
              <div className={styles.infoGroup}><label>ประวัติการชำระเงิน</label><p>{customer.paymentHistory}</p></div>
            </div>
          </div>
        </div>

        {/* Loan Table Section */}
        <div id="loanTable" className={styles.section}>
        {customer.loanEstimation && customer.targetBank ? (
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
              {customer.loanEstimation.map((scenario, index) => {
                // LTV limit: ตีความค่า LTV ตามหลักการที่ถูกต้อง
                let ltvValue = parseFloat(customer.ltv) || 1.0;
                let ltvLimit;
                
                // ตีความค่า LTV:
                // 1 = 100% (บ้านหลังที่ 1)
                // 0.9 = 90% (บ้านหลังที่ 2 มากกว่า 2 ปี)
                // 0.8 = 80% (บ้านหลังที่ 2 น้อยกว่า 2 ปี)
                // 0.7 = 70% (บ้านหลังที่ 3+)
                if (ltvValue >= 0.5 && ltvValue <= 1.0) {
                  // ค่าระหว่าง 0.5-1.0 ถือว่าเป็นเปอร์เซ็นต์ในรูป decimal
                  ltvLimit = ltvValue;
                } else if (ltvValue > 1 && ltvValue <= 100) {
                  // ค่ามากกว่า 1 แต่ไม่เกิน 100 ถือว่าเป็นเปอร์เซ็นต์
                  ltvLimit = ltvValue / 100;
                } else {
                  // ค่าผิดปกติ ใช้ค่าเริ่มต้น 100%
                  ltvLimit = 1.0;
                }
                
                // คำนวณมูลค่าทรัพย์หลังหักส่วนลด
                const propertyPrice = parseFloat(customer.propertyPrice) || parseFloat(customer.propertyValue) || 0;
                const discount = parseFloat(customer.discount) || 0;
                const propertyAfterDiscount = propertyPrice - discount;
                
                return (
                  <tr key={index}>
                    <td>{scenario.label} ({formatNumber(scenario.debt)})</td>
                    {[40, 30, 20, 10].map(term => {
                      const amount = scenario.loanAmounts[term];
                      // วงเงินกู้สูงสุดจริง = min(วงเงินกู้ที่คำนวณได้, propertyAfterDiscount * LTV)
                      let maxLoan = amount;
                      if (amount !== 'N/A' && amount !== null && amount !== undefined && !isNaN(amount)) {
                        const ltvMax = propertyAfterDiscount * ltvLimit;
                        maxLoan = Math.min(parseFloat(amount), ltvMax);
                      }
                      return (
                        <td key={term}>
                          {amount === 'N/A' || amount === null || amount === undefined ? '-' : formatNumber(maxLoan)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        ) : (
          <div className={styles.noData}>
            <p>ไม่มีข้อมูลประมาณการวงเงิน</p>
          </div>
        )}
        </div>

        {/* Rent Results Section */}
        <div id="rentResults" className={styles.section}>
        {customer.detailedRentToOwnEstimation ? (
        <div className={styles.loanTable}>
          <h2>💰 ข้อมูลการเช่าออม (Rent-to-Own Evaluation)</h2>
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
                <td>ค่าประกัน</td>
                <td>{formatNumber(customer.detailedRentToOwnEstimation.guarantee)}</td>
              </tr>
              <tr>
                <td>ค่าเช่าที่พึงชำระไว้แล้ว</td>
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
        ) : (
          <div className={styles.noData}>
            <p>ไม่มีข้อมูลการประเมินเช่าออม</p>
          </div>
        )}
        </div>

        {/* Amortization Section */}
        <div id="amortization" className={styles.section}>
        {customer.detailedRentToOwnEstimation && customer.detailedRentToOwnEstimation.amortizationTable && customer.detailedRentToOwnEstimation.amortizationTable.length > 0 ? (
        <div className={styles.amortizationSection}>
          <h2>📋 ตารางรายละเอียดการผ่อนชำระ</h2>
          <RentToOwnTable data={customer.detailedRentToOwnEstimation.amortizationTable} />
        </div>
        ) : (
          <div className={styles.noData}>
            <p>ไม่มีข้อมูลตารางการผ่อนชำระ</p>
          </div>
        )}
        </div>

        {/* Enhanced Bank Matching Section */}
        <div id="bankMatching" className={styles.section}>
        {customer.enhancedBankMatching && Object.keys(customer.enhancedBankMatching).length > 0 ? (
        <div className={styles.bankMatchingSection}>
          <h2>🏦 Enhanced Bank Matching Analysis</h2>
          <div className={styles.bankMatchingGrid}>
            {Object.entries(customer.enhancedBankMatching)
              .sort(([bankA], [bankB]) => {
                // GHB (ธอส.) เป็นอันดับแรกเสมอ
                if (bankA === 'GHB') return -1;
                if (bankB === 'GHB') return 1;
                return 0;
              })
              .map(([bankName, data]) => (
              <div key={bankName} className={`${styles.bankCard} ${styles[data.eligibility]}`}>
                <div className={styles.bankHeader}>
                  <h3>{data.bankName || bankName}</h3>
                  <div className={styles.partnershipBadge}>
                    {data.partnership === 'Government_Backing' ? 'รัฐบาล' : 
                     data.partnership === 'Premium_Commercial' ? 'พรีเมียม' : 
                     data.partnership === 'Standard_Commercial' ? 'มาตรฐาน' : 
                     data.partnership === 'LivNex_Primary' ? 'LivNex' : data.partnership}
                  </div>
                </div>
                
                <div className={styles.bankScore}>
                  <div className={styles.totalScore}>
                    <span className={styles.scoreNumber}>{data.totalScore}</span>
                    <span className={styles.scoreLabel}>คะแนนรวม</span>
                  </div>
                  <div className={styles.scoreBar}>
                    <div 
                      className={styles.scoreProgress}
                      style={{width: `${data.totalScore}%`}}
                    ></div>
                  </div>
                </div>

                {/* Temporarily hidden - Component scores
                <div className={styles.componentScores}>
                  <div className={styles.componentScore}>
                    <span className={styles.componentLabel}>Loan Band</span>
                    <span className={styles.componentValue}>{data.componentScores.loanBand}</span>
                  </div>
                  <div className={styles.componentScore}>
                    <span className={styles.componentLabel}>Rent-to-Own</span>
                    <span className={styles.componentValue}>{data.componentScores.rentToOwn}</span>
                  </div>
                </div>
                */}

                <div className={styles.bankDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>สถานะ:</span>
                    <span className={`${styles.eligibilityStatus} ${styles[data.eligibility]}`}>
                      {data.eligibility === 'eligible' ? 'ผ่านเกณฑ์' : 'ไม่ผ่านเกณฑ์'}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>โอกาสอนุมัติ:</span>
                    <span className={styles.detailValue}>{data.approvalProbability}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>เวลาประมาณ:</span>
                    <span className={styles.detailValue}>{data.estimatedApprovalTime}</span>
                  </div>
                </div>


                {data.customerAnalysis && (
                  <div className={styles.customerAnalysis}>
                    <h4>วิเคราะห์ข้อมูลลูกค้า</h4>
                    <div className={styles.analysisGrid}>
                      <div className={styles.analysisCard}>
                        <div className={styles.analysisLabel}>DSR ปัจจุบัน</div>
                        <div className={styles.analysisValue}>
                          {data.customerAnalysis.currentDSR !== 'N/A' ? 
                            `${data.customerAnalysis.currentDSR}%` : 'N/A'}
                        </div>
                        <div className={`${styles.analysisStatus} ${
                          data.customerAnalysis.dsrStatus.includes('ผ่านเกณฑ์') ? styles.pass : 
                          data.customerAnalysis.dsrStatus === 'ไม่สามารถคำนวณได้' ? styles.nodata : styles.fail
                        }`}>
                          {data.customerAnalysis.dsrStatus}
                        </div>
                      </div>
                      <div className={styles.analysisCard}>
                        <div className={styles.analysisLabel}>LTV ที่ต้องการ</div>
                        <div className={styles.analysisValue}>
                          {data.customerAnalysis.requestedLTV > 0 ? 
                            `${data.customerAnalysis.requestedLTV}%` : 'N/A'}
                        </div>
                        <div className={`${styles.analysisStatus} ${
                          data.customerAnalysis.ltvStatus === 'ผ่านเกณฑ์' ? styles.pass : 
                          data.customerAnalysis.ltvStatus === 'ไม่มีข้อมูล' ? styles.nodata : styles.fail
                        }`}>
                          {data.customerAnalysis.ltvStatus}
                        </div>
                      </div>
                      <div className={styles.analysisCard}>
                        <div className={styles.analysisLabel}>อายุ</div>
                        <div className={styles.analysisValue}>
                          {data.customerAnalysis.customerAge || customer.age || 'N/A'} {data.customerAnalysis.customerAge || customer.age ? 'ปี' : ''}
                        </div>
                        <div className={`${styles.analysisStatus} ${
                          data.customerAnalysis.ageStatus === 'ผ่านเกณฑ์' ? styles.pass : 
                          data.customerAnalysis.ageStatus === 'ไม่มีข้อมูล' ? styles.nodata : styles.fail
                        }`}>
                          {data.customerAnalysis.ageStatus}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className={styles.recommendedTerms}>
                  <h4>เงื่อนไขจริงของธนาคาร</h4>
                  <div className={styles.termRow}>
                    <span className={styles.termLabel}>ดอกเบี้ยเช่าออม:</span>
                    <span className={styles.termValue}>{data.recommendedTerms.interestRate}%</span>
                  </div>
                  <div className={styles.termRow}>
                    <span className={styles.termLabel}>LTV เช่าออม:</span>
                    <span className={styles.termValue}>{data.recommendedTerms.maxLTV}%</span>
                  </div>
                  <div className={styles.termRow}>
                    <span className={styles.termLabel}>ระยะเวลาเช่าออม:</span>
                    <span className={styles.termValue}>{data.recommendedTerms.maxTerm} ปี</span>
                  </div>
                  <div className={styles.termRow}>
                    <span className={styles.termLabel}>DSR สูง:</span>
                    <span className={styles.termValue}>{formatPercentage(data.recommendedTerms.dsrHigh)}%</span>
                  </div>
                  <div className={styles.termRow}>
                    <span className={styles.termLabel}>DSR ต่ำ:</span>
                    <span className={styles.termValue}>{formatPercentage(data.recommendedTerms.dsrLow)}%</span>
                  </div>
                  <div className={styles.termRow}>
                    <span className={styles.termLabel}>ช่วงอายุ:</span>
                    <span className={styles.termValue}>{data.recommendedTerms.ageRange} ปี</span>
                  </div>
                  <div className={styles.termSection}>
                    <h5>เกณฑ์ LTV ตามประเภทบ้าน</h5>
                    <div className={styles.termRow}>
                      <span className={styles.termLabel}>บ้านหลังที่ 1:</span>
                      <span className={styles.termValue}>{formatPercentage(data.recommendedTerms.ltvType1)}%</span>
                    </div>
                    <div className={styles.termRow}>
                      <span className={styles.termLabel}>บ้านหลังที่ 2 (&gt;2ปี):</span>
                      <span className={styles.termValue}>{formatPercentage(data.recommendedTerms.ltvType2Over2Years)}%</span>
                    </div>
                    <div className={styles.termRow}>
                      <span className={styles.termLabel}>บ้านหลังที่ 2 (&lt;2ปี):</span>
                      <span className={styles.termValue}>{formatPercentage(data.recommendedTerms.ltvType2Under2Years)}%</span>
                    </div>
                    <div className={styles.termRow}>
                      <span className={styles.termLabel}>บ้านหลังที่ 3+:</span>
                      <span className={styles.termValue}>{formatPercentage(data.recommendedTerms.ltvType3)}%</span>
                    </div>
                  </div>
                </div>

                {toArray(data.specialPrograms).length > 0 && (
                  <div className={styles.specialPrograms}>
                    <h4>โปรแกรมพิเศษ</h4>
                    <ul>
                      {toArray(data.specialPrograms).map((program, index) => (
                        <li key={index}>{program}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        ) : (
          <div className={styles.noData}>
            <p>ไม่มีข้อมูล Bank Matching</p>
          </div>
        )}
        </div>



        <div className={styles.footerButtons}>
          <Link to="/" className={styles.editButton}>กลับหน้าแรก</Link>
        </div>
      </div>
    </div>
  );
}

export default CustomerDetail;
