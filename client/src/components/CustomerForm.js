import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { calculateRentToOwn } from '../utils/rentToOwnCalculator';
import RentToOwnTable from './RentToOwnTable';
import LoanProblemSelector from './LoanProblemSelector';
import styles from './CustomerForm.module.css';

function CustomerForm() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const { authenticatedFetch } = useAuth();
  const isEditing = Boolean(customerId);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    name: '',
    age: '',
    phone: '',
    job: '',
    position: '',
    businessOwnerType: 'ไม่ใช่เจ้าของธุรกิจ',
    privateBusinessType: '',
    projectName: '',
    unit: '', // Changed from roomNumber
    readyToTransfer: '', // Added this field
    propertyValue: '',
    rentToOwnValue: '', // New field
    monthlyRentToOwnRate: '', // New field
    // New fields for detailed rent-to-own
    propertyPrice: '',
    discount: 0,
    installmentMonths: 36, // Locked to 36 months
    overpaidRent: 0,
    propertyType: 'แนวสูง', // Default to แนวสูง (4100)
    rentRatePerMillion: 4100, // Dynamic based on propertyType
    guaranteeMultiplier: 2, // Locked constant
    prepaidRentMultiplier: 1, // Locked constant
    transferYear: 1,
    annualInterestRate: 1.8, // Locked to 1.8% per year
    loanProblem: [], // Now dynamic textarea
    income: '',
    debt: '',
    maxDebtAllowed: '',
    loanTerm: '',
    ltv: '',
    ltvNote: '',
    maxLoanAmount: '',
    actionPlan: [], // Now dynamic textarea
    targetDate: '',
    officer: 'นายพิชญ์ สุดทัน',
    selectedBank: '',
    targetBank: '', // Added for loan band calculation
    recommendedLoanTerm: '',
    recommendedInstallment: '',
  });

  const [calculatedRentToOwnResults, setCalculatedRentToOwnResults] = useState(null);
  
  // States for new dropdown system
  const [selectedProblems, setSelectedProblems] = useState([]);
  const [selectedSolutions, setSelectedSolutions] = useState([]);
  
  // Job options from CR
  const jobOptions = [
    'พนักงานบริษัทเอกชน',
    'เจ้าของกิจการ / ธุรกิจส่วนตัว',
    'รับราชการ / รัฐวิสาหกิจ',
    'อาชีพอิสระ / ฟรีแลนซ์',
    'ผู้มีใบประกอบวิชาชีพ (แพทย์, พยาบาล, วิศวกร)'
  ];

  // CAA Analyst options
  const analystOptions = [
    'นายพิชญ์ สุดทัน',
    'นายสมศักดิ์ หัตถ์สุวรรณ',
    'นางสาวศุภวรรณ อุ่นอกแดง',
    'นางสาวสุพิชญา ภักดีคง'
  ];

  useEffect(() => {
    const loadCustomerData = async () => {
      if (isEditing) {
        try {
          const response = await authenticatedFetch(`http://localhost:3001/api/customers/${customerId}`);
          const data = await response.json();
          
          setFormData({
            ...data,
            loanProblem: data.loanProblem || [],
            actionPlan: data.actionPlan || [],
            date: data.date ? new Date(data.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            targetDate: data.targetDate ? new Date(data.targetDate).toISOString().split('T')[0] : '',
          });
          
          // Load existing problems and solutions
          setSelectedProblems(data.loanProblem || []);
          setSelectedSolutions(data.actionPlan || []);
        } catch (error) {
          console.error('Error fetching customer:', error);
        }
      }
    };

    loadCustomerData();
  }, [customerId, isEditing, authenticatedFetch]);

  useEffect(() => {
    try {
      const results = calculateRentToOwn({
        propertyPrice: parseFloat(formData.propertyPrice) || 0,
        discount: parseFloat(formData.discount) || 0,
        overpaidRent: parseFloat(formData.overpaidRent) || 0,
        installmentMonths: parseInt(formData.installmentMonths) || 0,
        rentRatePerMillion: parseFloat(formData.rentRatePerMillion) || 0,
        guaranteeMultiplier: parseFloat(formData.guaranteeMultiplier) || 0,
        prepaidRentMultiplier: parseFloat(formData.prepaidRentMultiplier) || 0,
        transferYear: parseInt(formData.transferYear) || 0,
        annualInterestRate: parseFloat(formData.annualInterestRate) || 0, // Pass new field
      });
      setCalculatedRentToOwnResults(results);
    } catch (error) {
      console.error("Error calculating rent to own:", error);
      setCalculatedRentToOwnResults(null);
    }
  }, [
    formData.propertyPrice,
    formData.discount,
    formData.overpaidRent,
    formData.installmentMonths,
    formData.rentRatePerMillion,
    formData.guaranteeMultiplier,
    formData.prepaidRentMultiplier,
    formData.transferYear,
    formData.propertyType,
  ]);

  // อัปเดต propertyValue เมื่อ propertyPrice หรือ discount เปลี่ยน
  useEffect(() => {
    const propertyPrice = parseFloat(formData.propertyPrice) || 0;
    const discount = parseFloat(formData.discount) || 0;
    const calculatedValue = propertyPrice - discount;
    
    if (calculatedValue !== parseFloat(formData.propertyValue)) {
      setFormData(prev => ({ ...prev, propertyValue: calculatedValue.toString() }));
    }
  }, [formData.propertyPrice, formData.discount]);

  // อัปเดต rentRatePerMillion เมื่อ propertyType เปลี่ยน
  useEffect(() => {
    const newRentRate = formData.propertyType === 'แนวราบ' ? 5500 : 4100;
    if (newRentRate !== formData.rentRatePerMillion) {
      setFormData(prev => ({ ...prev, rentRatePerMillion: newRentRate }));
    }
  }, [formData.propertyType]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let processedValue = value;
    
    // Handle boolean values for select elements
    if (type === 'select-one' && (value === 'true' || value === 'false')) {
      processedValue = value === 'true';
    }
    
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    const sanitizedValue = value.replace(/,/g, '');
    if (!isNaN(sanitizedValue)) {
        setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
    }
  };

  const formatNumber = (num) => {
    if (!num) return '';
    return parseFloat(num).toLocaleString('en-US');
  };

  const handleDynamicInputChange = (e, index, field) => {
    const { value } = e.target;
    setFormData(prev => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const addDynamicInput = (field) => {
    setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
  };

  const removeDynamicInput = (index, field) => {
    setFormData(prev => {
      const newArray = prev[field].filter((_, i) => i !== index);
      return { ...prev, [field]: newArray };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = isEditing ? `http://localhost:3001/api/customers/${customerId}` : 'http://localhost:3001/api/customers';
      const method = isEditing ? 'PUT' : 'POST';

      // Prepare data with updated problems and solutions
      const submitData = {
        ...formData,
        loanProblem: selectedProblems,
        actionPlan: selectedSolutions
      };

      const response = await authenticatedFetch(url, {
        method,
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (isEditing) {
        alert('อัปเดตข้อมูลลูกค้าเรียบร้อยแล้ว');
        navigate(`/customer/${customerId}`);
      } else {
        alert('เพิ่มลูกค้าใหม่เรียบร้อยแล้ว');
        navigate(`/customer/${data.id}`);
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.message);
    }
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.formWrapper}>
        <div className={styles.formHeader}>
          <h2>{isEditing ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มข้อมูลลูกค้าใหม่'}</h2>
        </div>
        <div className={styles.formContent}>
          <form onSubmit={handleSubmit}>
        
            <div className={styles.formSection}>
              <h3>📋 ข้อมูลเบื้องต้น</h3>
              <div className={styles.formRow}>
                <div className={styles.formGroup}><label>วันที่<span className={styles.required}>*</span></label><input type="date" name="date" value={formData.date} onChange={handleChange} required /></div>
                <div className={styles.formGroup}>
                  <label>ผู้วิเคราะห์ CAA</label>
                  <select name="officer" value={formData.officer} onChange={handleChange} className={styles.select}>
                    <option value="">-- เลือกผู้วิเคราะห์ --</option>
                    {analystOptions.map(analyst => (
                      <option key={analyst} value={analyst}>{analyst}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className={styles.formSection}>
              <h3>👤 ข้อมูลส่วนบุคคล</h3>
              <div className={styles.formRow}>
                <div className={styles.formGroup}><label>ชื่อ-นามสกุล<span className={styles.required}>*</span></label><input type="text" name="name" value={formData.name} onChange={handleChange} required /></div>
                <div className={styles.formGroup}><label>อายุ<span className={styles.required}>*</span></label><input type="number" name="age" value={formData.age} onChange={handleChange} required /></div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}><label>เบอร์โทร<span className={styles.required}>*</span></label><input type="text" name="phone" value={formData.phone} onChange={handleChange} required /></div>
                <div className={styles.formGroup}>
                  <label>อาชีพ<span className={styles.required}>*</span></label>
                  <select name="job" value={formData.job} onChange={handleChange} required className={styles.select}>
                    <option value="">-- เลือกอาชีพ --</option>
                    {jobOptions.map(job => (
                      <option key={job} value={job}>{job}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}><label>ตำแหน่ง<span className={styles.required}>*</span></label><input type="text" name="position" value={formData.position} onChange={handleChange} required /></div>
              </div>
            </div>

            <div className={styles.formSection}>
              <h3>💳 ข้อมูลการเงินและสินเชื่อ</h3>
              
              {/* รายได้และภาระหนี้เป็นรายละเอียดแรก ตาม CR */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}><label>รายได้ (บาท/เดือน)<span className={styles.required}>*</span></label><input type="text" name="income" value={formatNumber(formData.income)} onChange={handleNumberChange} required /></div>
                <div className={styles.formGroup}><label>ภาระหนี้ (บาท/เดือน)<span className={styles.required}>*</span></label><input type="text" name="debt" value={formatNumber(formData.debt)} onChange={handleNumberChange} required /></div>
              </div>

              {/* ระบบ Dropdown ปัญหาสินเชื่อใหม่ */}
              <LoanProblemSelector
                selectedProblems={selectedProblems}
                onProblemsChange={setSelectedProblems}
                selectedSolutions={selectedSolutions}
                onSolutionsChange={setSelectedSolutions}
              />

              <div className={styles.formRow + ' ' + styles.fullWidth}>
                <div className={styles.formGroup}>
                  <label>เป้าหมายยื่นกู้ (เดือน/ปี)<span className={styles.required}>*</span></label>
                  <input type="month" name="targetDate" value={formData.targetDate ? formData.targetDate.substring(0, 7) : ''} onChange={handleChange} required />
                </div>
              </div>
            </div>

            <div className={styles.formSection}>
              <h3>💰 ข้อมูลการเช่าออม (Rent-to-Own Evaluation)</h3>
              <h4>1. ข้อมูลทรัพย์และส่วนลด</h4>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>ประเภทของที่อยู่อาศัย</label>
                  <select name="propertyType" value={formData.propertyType} onChange={handleChange}>
                    <option value="แนวสูง">แนวสูง (4,100 บาท/ล้าน)</option>
                    <option value="แนวราบ">แนวราบ (5,500 บาท/ล้าน)</option>
                  </select>
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}><label>มูลค่าทรัพย์เต็มจำนวน</label><input type="text" name="propertyPrice" value={formatNumber(formData.propertyPrice)} onChange={handleNumberChange} /></div>
                <div className={styles.formGroup}><label>ส่วนลด (บาท)</label><input type="text" name="discount" value={formatNumber(formData.discount)} onChange={handleNumberChange} /></div>
              </div>

              <h4>2. เงื่อนไขการเช่าออม</h4>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>จำนวนงวด (เดือน)</label>
                  <input type="text" name="installmentMonths" value="36" disabled style={{backgroundColor: '#f3f4f6', color: '#6b7280'}} />
                  <small style={{color: '#6b7280', fontSize: '0.8rem'}}>ระยะเวลาคงที่ 36 เดือน</small>
                </div>
                <div className={styles.formGroup}><label>ค่าเช่าที่ได้ชำระไว้เกินค่าเช่ารายเดือนที่ผู้เช่าพึงชำระไว้แล้ว</label><input type="text" name="overpaidRent" value={formatNumber(formData.overpaidRent)} onChange={handleNumberChange} /></div>
              </div>

              <h4>3. อัตราและค่าคงที่</h4>
              <div className={styles.formRow + ' ' + styles.threeColumn}>
                <div className={styles.formGroup}>
                  <label>อัตราค่าเช่าซื้อ (บาท/ล้าน)</label>
                  <input 
                    type="text" 
                    value={formatNumber(formData.rentRatePerMillion)} 
                    disabled 
                    style={{backgroundColor: '#f3f4f6', color: '#374151', fontWeight: 'bold'}} 
                  />
                  <small style={{color: '#6b7280', fontSize: '0.8rem'}}>
                    อัตราตามประเภทที่อยู่อาศัย ({formData.propertyType})
                  </small>
                </div>
                <div className={styles.formGroup}>
                  <label>ค่าประกัน (เดือน)</label>
                  <input type="text" value="2" disabled style={{backgroundColor: '#f3f4f6', color: '#6b7280'}} />
                  <small style={{color: '#6b7280', fontSize: '0.8rem'}}>ค่าคงที่</small>
                </div>
                <div className={styles.formGroup}>
                  <label>ค่าเช่าที่พึงชำระไว้แล้ว</label>
                  <input type="text" value="1" disabled style={{backgroundColor: '#f3f4f6', color: '#6b7280'}} />
                  <small style={{color: '#6b7280', fontSize: '0.8rem'}}>ค่าคงที่</small>
                </div>
              </div>
              <div className={styles.formRow + ' ' + styles.fullWidth}>
                <div className={styles.formGroup}>
                  <label>อัตราดอกเบี้ยต่อปี (%)</label>
                  <input type="text" value="1.8" disabled style={{backgroundColor: '#f3f4f6', color: '#6b7280'}} />
                  <small style={{color: '#6b7280', fontSize: '0.8rem'}}>อัตราคงที่ 1.8% ต่อปี</small>
                </div>
              </div>

              <h4>4. ปีที่โอน</h4>
              <div className={styles.formRow + ' ' + styles.fullWidth}>
                <div className={styles.formGroup}>
                  <label>ปีที่โอน</label>
                  <select name="transferYear" value={formData.transferYear} onChange={handleChange}>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                  </select>
                </div>
              </div>

              {calculatedRentToOwnResults && (
                <div>
                  <h4>5. ผลลัพธ์การคำนวณเช่าออม</h4>
                  <div className={styles.resultsDisplay}>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}><label>มูลค่าทรัพย์หลังหักส่วนลด</label><p>{formatNumber(calculatedRentToOwnResults.propertyAfterDiscount)} บาท</p></div>
                      <div className={styles.formGroup}><label>ค่าเช่าผ่อนต่อเดือน</label><p>{formatNumber(calculatedRentToOwnResults.monthlyRent)} บาท</p></div>
                    </div>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}><label>ค่าประกัน</label><p>{formatNumber(calculatedRentToOwnResults.guarantee)} บาท</p></div>
                    </div>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}><label>ค่าเช่าที่พึงชำระไว้แล้ว</label><p>{formatNumber(calculatedRentToOwnResults.prepaidRent)} บาท</p></div>
                      <div className={styles.formGroup}><label>ชำระเพิ่มเติมวันทำสัญญา</label><p>{formatNumber(calculatedRentToOwnResults.additionalPayment)} บาท</p></div>
                    </div>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}><label>ค่าบริการวันโอน</label><p>{formatNumber(calculatedRentToOwnResults.transferFee)} บาท</p></div>
                      <div className={styles.formGroup}><label>เงินออมสะสม</label><p>{formatNumber(calculatedRentToOwnResults.accumulatedSavings)} บาท</p></div>
                    </div>
                    <div className={styles.formRow + ' ' + styles.fullWidth}>
                      <div className={styles.formGroup}><label>เงินต้นคงเหลือ</label><p>{formatNumber(calculatedRentToOwnResults.remainingPrincipal)} บาท</p></div>
                    </div>
                  </div>
                  {calculatedRentToOwnResults.amortizationTable && calculatedRentToOwnResults.amortizationTable.length > 0 && (
                    <RentToOwnTable data={calculatedRentToOwnResults.amortizationTable} />
                  )}
                </div>
              )}
            </div>

            <div className={styles.formSection}>
              <h3>🏠 ข้อมูลทรัพย์สิน</h3>
              <div className={styles.formRow}>
                <div className={styles.formGroup}><label>โครงการ<span className={styles.required}>*</span></label><input type="text" name="projectName" value={formData.projectName} onChange={handleChange} required /></div>
                <div className={styles.formGroup}><label>เลขห้อง<span className={styles.required}>*</span></label><input type="text" name="unit" value={formData.unit} onChange={handleChange} required /></div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>มูลค่าทรัพย์ (หลังหักส่วนลด) <span className={styles.required}>*</span></label>
                  <input 
                    type="text" 
                    value={formatNumber((() => {
                      const propertyPrice = parseFloat(formData.propertyPrice) || 0;
                      const discount = parseFloat(formData.discount) || 0;
                      return propertyPrice - discount;
                    })())} 
                    disabled 
                    style={{backgroundColor: '#f3f4f6', color: '#374151', fontWeight: 'bold'}}
                  />
                  <small style={{color: '#6b7280', fontSize: '0.8rem'}}>
                    คำนวณอัตโนมัติจาก: มูลค่าทรัพย์เต็มจำนวน - ส่วนลด
                  </small>
                </div>
                <div className={styles.formGroup}><label>LTV (%)<span className={styles.required}>*</span></label><input type="number" name="ltv" value={formData.ltv} onChange={handleChange} required /></div>
              </div>
              <div className={styles.formRow + ' ' + styles.fullWidth}>
                <div className={styles.formGroup}><label>ช่วงเวลาที่พร้อมโอน<span className={styles.required}>*</span></label><input type="month" name="readyToTransfer" value={formData.readyToTransfer} onChange={handleChange} required /></div>
              </div>
            </div>

            <div className={styles.formSection}>
              <h3>🏦 ข้อมูลธนาคารและคำแนะนำ</h3>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>ธนาคารเป้าหมาย (สำหรับคำนวณ Loan Band)<span className={styles.required}>*</span></label>
                  <select name="targetBank" value={formData.targetBank} onChange={handleChange} required>
                    <option value="">-- เลือกธนาคาร --</option>
                    <option value="KTB">KTB</option>
                    <option value="GHB">GHB</option>
                    <option value="GSB">GSB</option>
                    <option value="BBL">BBL</option>
                    <option value="SCB">SCB</option>
                    <option value="KBANK">KBANK</option>
                    <option value="BAY">BAY</option>
                    <option value="TTB">TTB</option>
                    <option value="CIMBT">CIMBT</option>
                    <option value="TISCO">TISCO</option>
                    <option value="KKP">KKP</option>
                    <option value="LH BANK">LH BANK</option>
                  </select>
                </div>
                <div className={styles.formGroup}><label>ธนาคารที่ลูกค้าควรเลือก</label><input type="text" name="selectedBank" value={formData.selectedBank} onChange={handleChange} /></div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}><label>ระยะเวลาผ่อนที่แนะนำ (ปี)</label><input type="number" name="recommendedLoanTerm" value={formData.recommendedLoanTerm} onChange={handleChange} /></div>
                <div className={styles.formGroup}><label>อัตราผ่อนที่แนะนำ (บาท/เดือน)</label><input type="text" name="recommendedInstallment" value={formatNumber(formData.recommendedInstallment)} onChange={handleNumberChange} /></div>
              </div>
            </div>

            <div className={styles.buttonGroup}>
              <button type="submit" className={styles.submitButton}>
                {isEditing ? '💾 บันทึกการเปลี่ยนแปลง' : '💾 บันทึกข้อมูลลูกค้า'}
              </button>
              <button type="button" onClick={() => navigate(-1)} className={styles.cancelButton}>
                ↩️ ยกเลิก
              </button>
              <button type="button" onClick={() => navigate('/')} className={styles.cancelButton}>
                🏠 กลับหน้าแรก
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CustomerForm;
