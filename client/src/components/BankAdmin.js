import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS } from '../config/api';
import styles from './BankAdmin.module.css';

function BankAdmin() {
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const navigate = useNavigate();
  const { authenticatedFetch } = useAuth();

  // Fetch all banks
  const fetchBanks = useCallback(async () => {
    try {
      const response = await authenticatedFetch(API_ENDPOINTS.BANK_RULES);
      const data = await response.json();
      setBanks(data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    fetchBanks();
  }, [fetchBanks]);

  const handleSelectBank = async (bankCode) => {
    try {
      const response = await authenticatedFetch(API_ENDPOINTS.BANK_RULE_BY_CODE(bankCode));
      const bankData = await response.json();
      setSelectedBank(bankData);
      setFormData({
        bank_name: bankData.bank_name,
        dsr_high: bankData.dsr_high,
        dsr_low: bankData.dsr_low,
        min_income_for_dsr_high: bankData.min_income_for_dsr_high || '',
        age_min: bankData.age_min,
        age_max: bankData.age_max,
        max_term: bankData.max_term,
        ltv_type1: bankData.ltv_type1,
        ltv_type2_over_2years: bankData.ltv_type2_over_2years,
        ltv_type2_under_2years: bankData.ltv_type2_under_2years,
        ltv_type3: bankData.ltv_type3,
        partnership_type: bankData.partnership_type,
        min_credit_score: bankData.min_credit_score,
        max_ltv_rent_to_own: bankData.max_ltv_rent_to_own,
        preferred_interest_rate: bankData.preferred_interest_rate,
        max_term_rent_to_own: bankData.max_term_rent_to_own,
        livnex_bonus: bankData.livnex_bonus,
        loan_weight: bankData.loan_weight,
        rent_to_own_weight: bankData.rent_to_own_weight,
        credit_weight: bankData.credit_weight,
        special_programs: bankData.special_programs || []
      });
      setIsEditing(false);
    } catch (error) {
      // Handle error silently or show user-friendly message
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    const processedValue = type === 'number' ? parseFloat(value) || 0 : value;
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleAddSpecialProgram = () => {
    const newProgram = window.prompt('เพิ่มโปรแกรมพิเศษใหม่:');
    if (newProgram && newProgram.trim()) {
      setFormData(prev => ({
        ...prev,
        special_programs: [...(prev.special_programs || []), newProgram.trim()]
      }));
    }
  };

  const handleRemoveSpecialProgram = (index) => {
    if (window.confirm('ต้องการลบโปรแกรมนี้หรือไม่?')) {
      setFormData(prev => ({
        ...prev,
        special_programs: prev.special_programs.filter((_, i) => i !== index)
      }));
    }
  };

  const handleEditSpecialProgram = (index, currentValue) => {
    const newValue = window.prompt('แก้ไขโปรแกรมพิเศษ:', currentValue);
    if (newValue && newValue.trim()) {
      setFormData(prev => ({
        ...prev,
        special_programs: prev.special_programs.map((program, i) => 
          i === index ? newValue.trim() : program
        )
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await authenticatedFetch(API_ENDPOINTS.BANK_RULE_BY_CODE(selectedBank.bank_code), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('บันทึกข้อมูลธนาคารสำเร็จ!');
        setIsEditing(false);
        fetchBanks(); // Refresh the list
        handleSelectBank(selectedBank.bank_code); // Refresh selected bank
      } else {
        throw new Error('Failed to update bank');
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const getPartnershipColor = (type) => {
    switch (type) {
      case 'Government_Backing': return '#10b981';
      case 'Premium_Commercial': return '#f59e0b';
      case 'Standard_Commercial': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getPartnershipLabel = (type) => {
    switch (type) {
      case 'Government_Backing': return 'รัฐบาล';
      case 'Premium_Commercial': return 'พรีเมียม';
      case 'Standard_Commercial': return 'มาตรฐาน';
      default: return type;
    }
  };

  if (loading) {
    return <div className={styles.loading}>กำลังโหลดข้อมูล...</div>;
  }

  return (
    <div className={styles.adminContainer}>
      <div className={styles.header}>
        <h1>🏦 จัดการข้อมูลธนาคาร</h1>
        <button onClick={() => navigate('/')} className={styles.backButton}>
          🏠 กลับหน้าแรก
        </button>
      </div>

      <div className={styles.mainContent}>
        {/* Bank List */}
        <div className={styles.bankList}>
          <h2>รายการธนาคาร ({banks.length})</h2>
          <div className={styles.bankGrid}>
            {banks.map(bank => (
              <div
                key={bank.bank_code}
                className={`${styles.bankCard} ${selectedBank?.bank_code === bank.bank_code ? styles.selected : ''}`}
                onClick={() => handleSelectBank(bank.bank_code)}
              >
                <div className={styles.bankHeader}>
                  <h3>{bank.bank_name}</h3>
                  <span className={styles.bankCode}>{bank.bank_code}</span>
                </div>
                <div className={styles.bankInfo}>
                  <div className={styles.partnershipBadge} style={{ backgroundColor: getPartnershipColor(bank.partnership_type) }}>
                    {getPartnershipLabel(bank.partnership_type)}
                  </div>
                  <div className={styles.bankStats}>
                    <span>DSR: {(bank.dsr_high * 100).toFixed(0)}%</span>
                    <span>อายุ: {bank.age_min}-{bank.age_max}</span>
                    <span>เครดิต: {bank.min_credit_score}+</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bank Details & Edit Form */}
        {selectedBank && (
          <div className={styles.bankDetails}>
            <div className={styles.detailsHeader}>
              <h2>🏛️ {selectedBank.bank_name} ({selectedBank.bank_code})</h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`${styles.editButton} ${isEditing ? styles.editing : ''}`}
              >
                {isEditing ? '❌ ยกเลิก' : '✏️ แก้ไข'}
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.bankForm}>
              {/* Basic Info */}
              <div className={styles.formSection}>
                <h3>📋 ข้อมูลพื้นฐาน</h3>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>ชื่อธนาคาร</label>
                    <input
                      type="text"
                      name="bank_name"
                      value={formData.bank_name || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>ประเภทความร่วมมือ</label>
                    <select
                      name="partnership_type"
                      value={formData.partnership_type || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    >
                      <option value="Government_Backing">รัฐบาล (Government Backing)</option>
                      <option value="Premium_Commercial">พรีเมียม (Premium Commercial)</option>
                      <option value="Standard_Commercial">มาตรฐาน (Standard Commercial)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* DSR Settings */}
              <div className={styles.formSection}>
                <h3>💰 เกณฑ์ DSR</h3>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>DSR สูง (%)</label>
                    <input
                      type="number"
                      name="dsr_high"
                      value={formData.dsr_high || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      step="0.01"
                      min="0"
                      max="1"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>DSR ต่ำ (%)</label>
                    <input
                      type="number"
                      name="dsr_low"
                      value={formData.dsr_low || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      step="0.01"
                      min="0"
                      max="1"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>รายได้ขั้นต่ำสำหรับ DSR สูง</label>
                    <input
                      type="number"
                      name="min_income_for_dsr_high"
                      value={formData.min_income_for_dsr_high || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="ไม่จำกัด"
                    />
                  </div>
                </div>
              </div>

              {/* Age Settings */}
              <div className={styles.formSection}>
                <h3>👤 เกณฑ์อายุ</h3>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>อายุขั้นต่ำ</label>
                    <input
                      type="number"
                      name="age_min"
                      value={formData.age_min || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      min="18"
                      max="80"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>อายุสูงสุด</label>
                    <input
                      type="number"
                      name="age_max"
                      value={formData.age_max || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      min="18"
                      max="80"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>ระยะเวลากู้สูงสุด (ปี)</label>
                    <input
                      type="number"
                      name="max_term"
                      value={formData.max_term || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      min="1"
                      max="50"
                    />
                  </div>
                </div>
              </div>

              {/* LTV Settings */}
              <div className={styles.formSection}>
                <h3>🏠 เกณฑ์ LTV</h3>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>บ้านหลังที่ 1</label>
                    <input
                      type="number"
                      name="ltv_type1"
                      value={formData.ltv_type1 || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      step="0.01"
                      min="0"
                      max="1"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>บ้านหลังที่ 2 ({'>'}2ปี)</label>
                    <input
                      type="number"
                      name="ltv_type2_over_2years"
                      value={formData.ltv_type2_over_2years || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      step="0.01"
                      min="0"
                      max="1"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>บ้านหลังที่ 2 ({'<'}2ปี)</label>
                    <input
                      type="number"
                      name="ltv_type2_under_2years"
                      value={formData.ltv_type2_under_2years || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      step="0.01"
                      min="0"
                      max="1"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>บ้านหลังที่ 3+</label>
                    <input
                      type="number"
                      name="ltv_type3"
                      value={formData.ltv_type3 || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      step="0.01"
                      min="0"
                      max="1"
                    />
                  </div>
                </div>
              </div>

              {/* Enhanced Bank Matching */}
              <div className={styles.formSection}>
                <h3>🎯 Enhanced Bank Matching</h3>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>เครดิตสกอร์ขั้นต่ำ</label>
                    <input
                      type="number"
                      name="min_credit_score"
                      value={formData.min_credit_score || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      min="300"
                      max="900"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>LTV สูงสุดเช่าออม (%)</label>
                    <input
                      type="number"
                      name="max_ltv_rent_to_own"
                      value={formData.max_ltv_rent_to_own || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      min="50"
                      max="100"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>อัตราดอกเบี้ยเช่าออม (%)</label>
                    <input
                      type="number"
                      name="preferred_interest_rate"
                      value={formData.preferred_interest_rate || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      step="0.1"
                      min="0"
                      max="20"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>ระยะเวลาเช่าออมสูงสุด (ปี)</label>
                    <input
                      type="number"
                      name="max_term_rent_to_own"
                      value={formData.max_term_rent_to_own || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      min="5"
                      max="40"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>โบนัส LivNex</label>
                    <input
                      type="number"
                      name="livnex_bonus"
                      value={formData.livnex_bonus || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>

              {/* Scoring Weights */}
              <div className={styles.formSection}>
                <h3>⚖️ น้ำหนักการให้คะแนน</h3>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>น้ำหนัก Loan Band</label>
                    <input
                      type="number"
                      name="loan_weight"
                      value={formData.loan_weight || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      step="0.01"
                      min="0"
                      max="1"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>น้ำหนัก Rent-to-Own</label>
                    <input
                      type="number"
                      name="rent_to_own_weight"
                      value={formData.rent_to_own_weight || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      step="0.01"
                      min="0"
                      max="1"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>น้ำหนัก Credit Bureau</label>
                    <input
                      type="number"
                      name="credit_weight"
                      value={formData.credit_weight || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      step="0.01"
                      min="0"
                      max="1"
                    />
                  </div>
                </div>
                {isEditing && (
                  <div className={styles.weightNote}>
                    หมายเหตุ: ผลรวมของน้ำหนักทั้ง 3 ควรเท่ากับ 1.0
                  </div>
                )}
              </div>

              {/* Special Programs Section */}
              <div className={styles.formSection}>
                <h3>⭐ โปรแกรมพิเศษ</h3>
                <div className={styles.specialProgramsContainer}>
                  {(formData.special_programs || []).length === 0 ? (
                    <div className={styles.noPrograms}>
                      ไม่มีโปรแกรมพิเศษ
                    </div>
                  ) : (
                    <div className={styles.programsList}>
                      {(formData.special_programs || []).map((program, index) => (
                        <div key={index} className={styles.programItem}>
                          <span className={styles.programText}>⭐ {program}</span>
                          {isEditing && (
                            <div className={styles.programActions}>
                              <button
                                type="button"
                                onClick={() => handleEditSpecialProgram(index, program)}
                                className={styles.editProgramBtn}
                                title="แก้ไข"
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveSpecialProgram(index)}
                                className={styles.removeProgramBtn}
                                title="ลบ"
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {isEditing && (
                    <button
                      type="button"
                      onClick={handleAddSpecialProgram}
                      className={styles.addProgramBtn}
                    >
                      ➕ เพิ่มโปรแกรมพิเศษ
                    </button>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className={styles.formActions}>
                  <button type="submit" className={styles.saveButton}>
                    💾 บันทึกการเปลี่ยนแปลง
                  </button>
                  <button type="button" onClick={() => setIsEditing(false)} className={styles.cancelButton}>
                    ❌ ยกเลิก
                  </button>
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default BankAdmin;