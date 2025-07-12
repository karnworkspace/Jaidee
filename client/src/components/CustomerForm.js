import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { calculateRentToOwn } from '../utils/rentToOwnCalculator';
import RentToOwnTable from './RentToOwnTable';
import styles from './CustomerForm.module.css';

function CustomerForm() {
  const { customerId } = useParams();
  const navigate = useNavigate();
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
    installmentMonths: 12,
    overpaidRent: 0,
    rentRatePerMillion: 4100,
    guaranteeMultiplier: 2,
    prepaidRentMultiplier: 1,
    transferYear: 1,
    annualInterestRate: 1.8, // New field for annual interest rate
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
    officer: 'ณัฐพงศ์ ไหมพรม',
    selectedBank: '',
    targetBank: '', // Added for loan band calculation
    recommendedLoanTerm: '',
    recommendedInstallment: '',
  });

  const [calculatedRentToOwnResults, setCalculatedRentToOwnResults] = useState(null);

  useEffect(() => {
    if (isEditing) {
      fetch(`http://localhost:3001/api/customers/${customerId}`)
        .then(res => res.json())
        .then(data => {
          setFormData({
            ...data,
            loanProblem: data.loanProblem || [],
            actionPlan: data.actionPlan || [],
            date: data.date ? new Date(data.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            targetDate: data.targetDate ? new Date(data.targetDate).toISOString().split('T')[0] : '',
          });
        })
        .catch(error => console.error('Error fetching customer:', error));
    }
  }, [customerId, isEditing]);

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
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const url = isEditing ? `http://localhost:3001/api/customers/${customerId}` : 'http://localhost:3001/api/customers';
    const method = isEditing ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
      .then(res => res.json())
      .then(data => {
        console.log('Save success:', data);
        navigate(isEditing ? `/customer/${customerId}` : '/');
      })
      .catch(error => console.error('Error saving customer:', error));
  };

  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2>{isEditing ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มข้อมูลลูกค้าใหม่'}</h2>
        
        <div className={styles.formRow}>
            <div className={styles.formGroup}><label>วันที่<span className={styles.required}>*</span></label><input type="date" name="date" value={formData.date} onChange={handleChange} required /></div>
            <div className={styles.formGroup}><label>เจ้าหน้าที่</label><input type="text" name="officer" value={formData.officer} onChange={handleChange} /></div>
        </div>

        <div className={styles.formRow}>
            <div className={styles.formGroup}><label>ชื่อ-นามสกุล<span className={styles.required}>*</span></label><input type="text" name="name" value={formData.name} onChange={handleChange} required /></div>
            <div className={styles.formGroup}><label>อายุ<span className={styles.required}>*</span></label><input type="number" name="age" value={formData.age} onChange={handleChange} required /></div>
        </div>

        <div className={styles.formRow}>
            <div className={styles.formGroup}><label>เบอร์โทร<span className={styles.required}>*</span></label><input type="text" name="phone" value={formData.phone} onChange={handleChange} required /></div>
            <div className={styles.formGroup}><label>อาชีพ<span className={styles.required}>*</span></label><input type="text" name="job" value={formData.job} onChange={handleChange} required /></div>
        </div>

        <div className={styles.formRow}>
            <div className={styles.formGroup}><label>ตำแหน่ง<span className={styles.required}>*</span></label><input type="text" name="position" value={formData.position} onChange={handleChange} required /></div>
            <div className={styles.formGroup}>
                <label>เจ้าของธุรกิจประเภท</label>
                <select name="businessOwnerType" value={formData.businessOwnerType} onChange={handleChange}>
                    <option value="ไม่ใช่เจ้าของธุรกิจ">ไม่ใช่เจ้าของธุรกิจ</option>
                    <option value="เจ้าของธุรกิจส่วนตัว">เจ้าของธุรกิจส่วนตัว</option>
                </select>
            </div>
        </div>

        {formData.businessOwnerType === 'เจ้าของธุรกิจส่วนตัว' && (
            <div className={styles.formGroup}>
                <label>ประเภทธุรกิจส่วนตัว</label>
                <input type="text" name="privateBusinessType" value={formData.privateBusinessType} onChange={handleChange} />
            </div>
        )}

        <div className={styles.formRow}>
            <div className={styles.formGroup}><label>โครงการ<span className={styles.required}>*</span></label><input type="text" name="projectName" value={formData.projectName} onChange={handleChange} required /></div>
            <div className={styles.formGroup}><label>เลขห้อง<span className={styles.required}>*</span></label><input type="text" name="unit" value={formData.unit} onChange={handleChange} required /></div>
        </div>

        <div className={styles.formRow}>
            <div className={styles.formGroup}><label>มูลค่าทรัพย์ (บาท)<span className={styles.required}>*</span></label><input type="text" name="propertyValue" value={formatNumber(formData.propertyValue)} onChange={handleNumberChange} required /></div>
            <div className={styles.formGroup}><label>LTV (%)<span className={styles.required}>*</span></label><input type="number" name="ltv" value={formData.ltv} onChange={handleChange} required /></div>
        </div>

        <div className={styles.formRow}>
        <div className={styles.formGroup}><label>ช่วงเวลาที่พร้อมโอน<span className={styles.required}>*</span></label><input type="month" name="readyToTransfer" value={formData.readyToTransfer} onChange={handleChange} required /></div>
        </div>

    {/* New fields for detailed rent-to-own evaluation */}
    <h3>ข้อมูลการเช่าออม (Rent-to-Own Evaluation)</h3>
    <div className={styles.formSection}>
        <h4>1. ข้อมูลทรัพย์และส่วนลด</h4>
        <div className={styles.formRow}>
            <div className={styles.formGroup}><label>มูลค่าทรัพย์เต็มจำนวน</label><input type="text" name="propertyPrice" value={formatNumber(formData.propertyPrice)} onChange={handleNumberChange} /></div>
            <div className={styles.formGroup}><label>ส่วนลด (บาท)</label><input type="text" name="discount" value={formatNumber(formData.discount)} onChange={handleNumberChange} /></div>
        </div>
    </div>

    <div className={styles.formSection}>
        <h4>2. เงื่อนไขการเช่าออม</h4>
        <div className={styles.formRow}>
            <div className={styles.formGroup}>
                <label>จำนวนงวด (เดือน)</label>
                <select name="installmentMonths" value={formData.installmentMonths} onChange={handleChange}>
                    <option value={6}>6</option>
                    <option value={12}>12</option>
                    <option value={18}>18</option>
                    <option value={24}>24</option>
                    <option value={30}>30</option>
                    <option value={36}>36</option>
                </select>
            </div>
            <div className={styles.formGroup}><label>ค่าเช่าที่ชำระเกิน</label><input type="text" name="overpaidRent" value={formatNumber(formData.overpaidRent)} onChange={handleNumberChange} /></div>
        </div>
    </div>

    <div className={styles.formSection}>
        <h4>3. อัตราและค่าคงที่</h4>
        <div className={styles.formRow}>
            <div className={styles.formGroup}><label>อัตราค่าเช่าซื้อ (บาท/ล้าน)</label><input type="text" name="rentRatePerMillion" value={formatNumber(formData.rentRatePerMillion)} onChange={handleNumberChange} /></div>
            <div className={styles.formGroup}><label>ตัวคูณค่าประกัน</label><input type="text" name="guaranteeMultiplier" value={formatNumber(formData.guaranteeMultiplier)} onChange={handleNumberChange} /></div>
            <div className={styles.formGroup}><label>ตัวคูณค่าเช่าล่วงหน้า</label><input type="text" name="prepaidRentMultiplier" value={formatNumber(formData.prepaidRentMultiplier)} onChange={handleNumberChange} /></div>
        </div>
        <div className={styles.formRow}>
            <div className={styles.formGroup}><label>อัตราดอกเบี้ยต่อปี (%)</label><input type="text" name="annualInterestRate" value={formatNumber(formData.annualInterestRate)} onChange={handleNumberChange} /></div>
        </div>
    </div>

    <div className={styles.formSection}>
        <h4>4. ปีที่โอน</h4>
        <div className={styles.formRow}>
            <div className={styles.formGroup}>
                <label>ปีที่โอน</label>
                <select name="transferYear" value={formData.transferYear} onChange={handleChange}>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                </select>
            </div>
        </div>
    </div>

    {/* 5. ผลลัพธ์ (Read-only Display) */}
    {calculatedRentToOwnResults && (
        <div className={styles.formSection}>
            <h4>5. ผลลัพธ์การคำนวณเช่าออม</h4>
            <div className={styles.formRow}>
                <div className={styles.formGroup}><label>มูลค่าทรัพย์หลังหักส่วนลด</label><p>{formatNumber(calculatedRentToOwnResults.propertyAfterDiscount)}</p></div>
                <div className={styles.formGroup}><label>ค่าเช่าผ่อนต่อเดือน</label><p>{formatNumber(calculatedRentToOwnResults.monthlyRent)}</p></div>
            </div>
            <div className={styles.formRow}>
                <div className={styles.formGroup}><label>ยอดชำระรวม</label><p>{formatNumber(calculatedRentToOwnResults.totalPaid)}</p></div>
                <div className={styles.formGroup}><label>ค่าประกัน</label><p>{formatNumber(calculatedRentToOwnResults.guarantee)}</p></div>
            </div>
            <div className={styles.formRow}>
                <div className={styles.formGroup}><label>ค่าเช่าล่วงหน้า</label><p>{formatNumber(calculatedRentToOwnResults.prepaidRent)}</p></div>
                <div className={styles.formGroup}><label>ชำระเพิ่มเติมวันทำสัญญา</label><p>{formatNumber(calculatedRentToOwnResults.additionalPayment)}</p></div>
            </div>
            <div className={styles.formRow}>
                <div className={styles.formGroup}><label>ค่าบริการวันโอน</label><p>{formatNumber(calculatedRentToOwnResults.transferFee)}</p></div>
                <div className={styles.formGroup}><label>เงินออมสะสม</label><p>{formatNumber(calculatedRentToOwnResults.accumulatedSavings)}</p></div>
            </div>
            <div className={styles.formRow}>
                <div className={styles.formGroup}><label>เงินต้นคงเหลือ</label><p>{formatNumber(calculatedRentToOwnResults.remainingPrincipal)}</p></div>
            </div>

            {calculatedRentToOwnResults.amortizationTable && calculatedRentToOwnResults.amortizationTable.length > 0 && (
                <RentToOwnTable data={calculatedRentToOwnResults.amortizationTable} />
            )}
        </div>
    )}

    

    <div className={styles.formGroup}>
      <label>ปัญหาด้านสินเชื่อ</label>
          {formData.loanProblem.map((problem, index) => (
            <div key={index} className={styles.dynamicInputGroup}>
              <textarea
                value={problem}
                onChange={(e) => handleDynamicInputChange(e, index, 'loanProblem')}
                rows="2"
              ></textarea>
              <button type="button" onClick={() => removeDynamicInput(index, 'loanProblem')}>ลบ</button>
            </div>
          ))}
          <button type="button" onClick={() => addDynamicInput('loanProblem')}>+ เพิ่มปัญหา</button>
        </div>

        <div className={styles.formRow}>
            <div className={styles.formGroup}><label>รายได้ (บาท/เดือน)<span className={styles.required}>*</span></label><input type="text" name="income" value={formatNumber(formData.income)} onChange={handleNumberChange} required /></div>
            <div className={styles.formGroup}><label>ภาระหนี้ (บาท/เดือน)<span className={styles.required}>*</span></label><input type="text" name="debt" value={formatNumber(formData.debt)} onChange={handleNumberChange} required /></div>
        </div>

        <div className={styles.formGroup}>
            <label>แผนการดำเนินการ (Action Plan)</label>
            {formData.actionPlan.map((plan, index) => (
            <div key={index} className={styles.dynamicInputGroup}>
              <textarea
                value={plan}
                onChange={(e) => handleDynamicInputChange(e, index, 'actionPlan')}
                rows="2"
              ></textarea>
              <button type="button" onClick={() => removeDynamicInput(index, 'actionPlan')}>ลบ</button>
            </div>
          ))}
          <button type="button" onClick={() => addDynamicInput('actionPlan')}>+ เพิ่มแผน</button>
        </div>

        <div className={styles.formGroup}>
            <label>เป้าหมายยื่นกู้ (เดือน/ปี)<span className={styles.required}>*</span></label>
            <input type="date" name="targetDate" value={formData.targetDate} onChange={handleChange} required />
        </div>

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
            <div className={styles.formGroup}><label>ระยะเวลาผ่อนที่แนะนำ (ปี)</label><input type="number" name="recommendedLoanTerm" value={formData.recommendedLoanTerm} onChange={handleChange} /></div>
        </div>
        <div className={styles.formGroup}><label>อัตราผ่อนที่แนะนำ (บาท/เดือน)</label><input type="text" name="recommendedInstallment" value={formatNumber(formData.recommendedInstallment)} onChange={handleNumberChange} /></div>

        <button type="submit" className={styles.submitButton}>{isEditing ? 'บันทึกการเปลี่ยนแปลง' : 'บันทึกข้อมูลลูกค้า'}</button>
        <button type="button" onClick={() => navigate(-1)} className={styles.cancelButton}>ยกเลิก</button>
        <button type="button" onClick={() => navigate('/')} className={styles.cancelButton}>กลับหน้าแรก</button>
      </form>
    </div>
  );
}

export default CustomerForm;
