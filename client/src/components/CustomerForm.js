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
  
  // Project options for super search
  const projectOptions = [
    'เสนาคิทท์ เทพารักษ์ - บางบ่อ 2 เฟส 2',
    'นิช โมโน เมกะ สเปซ บางนา',
    'เสนา เวล่า สุขุมวิท-บางปู',
    'เสนา วิลเลจ รัตนาธิเบศร์ - บางบัวทอง',
    'เสนาวิลล์ บรมราชชนนี สาย 5',
    'เสนา วีว่า รัตนาธิเบศร์ - บางบัวทอง',
    'นิช โมโน รามคำแหง',
    'เสนา เวล่า สิริโสธร',
    'เสนาคิทท์ เพชรเกษม120 เฟส 1',
    'เสนา คิทท์ พหลโยธิน นวนคร เฟส 1',
    'เฟล็กซี่ สาทร - เจริญนคร เฟส 2',
    'เสนาวิลล์ ลำลูกกา คลอง 6',
    'เสนา วิลเลจ สุขุมวิท - แพรกษา 1',
    'นิช โมโน สุขุมวิท - ปู่เจ้า',
    'เฟล็กซี่ สาทร - เจริญนคร เฟส 1',
    'เสนาคิทท์ รังสิต - ติวานนท์',
    'เสนาคิทท์ เวสต์เกต - บางบัวทอง 2',
    'เฟล็กซี่ สุขสวัสดิ์',
    'เสนา คิทท์ รัตนาธิเบศร์ - บางบัวทอง',
    'เสนา อีโค่ ทาวน์ รังสิต สเตชั่น เฟส 1',
    'เสนาคิทท์ ศรีนครินทร์ ศรีด่าน',
    'เฟล็กซี่ เตาปูน อินเตอร์เชนจ์',
    'เฟล็กซี รัตนาธิเบศร์',
    'เสนาคิทท์ บางนา กม.29 เฟส 2',
    'เสนา วิลเลจ บางปะกง - บ้านโพธิ์',
    'เสนาคิทท์ สาทร-กัลปพฤกษ์ เฟส 1',
    'เสนา วีว่า ศรีราชา - อัสสัมชัญ',
    'เดอะ ไมอามี่ บางปู 8',
    'เดอะ ไมอามี่ บางปู 2',
    'เสนา เวล่า เทพารักษ์ - บางบ่อ',
    'เสนา วีว่า เพชรเกษม - พุทธมณฑล สาย 7',
    'เสนาคิทท์ บางนา กม.29 เฟส 1',
    'เสนาคิทท์ เอ็มอาร์ที - บางแค เฟส 2',
    'นิช โมโน พระราม 9 เฟส 1',
    'เสนา วิลเลจ บางนา กม.29',
    'เสนา เวล่า รัตนาธิเบศร์ บางบัวทอง',
    'เสนา เวล่า วงแหวน - บางบัวทอง',
    'เสนาวีว่า ฉลองกรุง ลาดกระบัง',
    'นิช โมโน แจ้งวัฒนะ เฟส 1',
    'J Town Execlusive บางปะกง',
    'เสนา วีว่า เทพารักษ์-บางบ่อ',
    'เจ คอนโด สาทร-กัลปพฤกษ์',
    'เสนา วีว่า วงแหวน-บางบัวทอง',
    'เสนา วิลเลจ ติวานนท์ - บางกะดี',
    'เสนา คิทท์ รังสิต คลอง 4',
    'เสนาคิทท์ สำโรง อินเตอร์เชนจ์',
    'เสนาคิทท์ ฉลองกรุง - ลาดกระบัง เฟส2',
    'เสนา อเวนิว รัตนาธิเบศร์ - บางบัวทอง',
    'ปีติ สุขุมวิท 101',
    'เสนาวิลเลจ รังสิต - ติวานนท์',
    'เสนาวิลเลจ รามอินทรา กม.9',
    'เสนาพาร์ควิลล์ 2 รามอินทรา-วงแหวน',
    'เสนาวิลล์ รามอินทรา เฟส 3',
    'เสนา เวล่า รังสิต-คลอง 1',
    'J EXCLUSIVE - วงแหวน-บางใหญ่',
    'เสนาคิทท์ เวสต์เกต - บางบัวทอง 1',
    'เสนาคิทท์ บีทีเอส สะพานใหม่'
  ];
  
  // States for project search
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [filteredProjects, setFilteredProjects] = useState(projectOptions);
  
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
          
          // Set project search term for editing
          setProjectSearchTerm(data.projectName || '');
        } catch (error) {
          // Handle error silently
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
    formData.annualInterestRate,
  ]);

  // อัปเดต propertyValue เมื่อ propertyPrice หรือ discount เปลี่ยน
  useEffect(() => {
    const propertyPrice = parseFloat(formData.propertyPrice) || 0;
    const discount = parseFloat(formData.discount) || 0;
    const calculatedValue = propertyPrice - discount;
    
    if (calculatedValue !== parseFloat(formData.propertyValue)) {
      setFormData(prev => ({ ...prev, propertyValue: calculatedValue.toString() }));
    }
  }, [formData.propertyPrice, formData.discount, formData.propertyValue]);

  // อัปเดต rentRatePerMillion เมื่อ propertyType เปลี่ยน
  useEffect(() => {
    const newRentRate = formData.propertyType === 'แนวราบ' ? 5500 : 4100;
    if (newRentRate !== formData.rentRatePerMillion) {
      setFormData(prev => ({ ...prev, rentRatePerMillion: newRentRate }));
    }
  }, [formData.propertyType, formData.rentRatePerMillion]);

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

  // Project search functions
  const handleProjectSearch = (e) => {
    const searchTerm = e.target.value;
    setProjectSearchTerm(searchTerm);
    setFormData(prev => ({ ...prev, projectName: searchTerm }));
    
    if (searchTerm.trim() === '') {
      setFilteredProjects(projectOptions);
    } else {
      const filtered = projectOptions.filter(project =>
        project.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProjects(filtered);
    }
    setShowProjectDropdown(true);
  };

  const handleProjectSelect = (project) => {
    setFormData(prev => ({ ...prev, projectName: project }));
    setProjectSearchTerm(project);
    setShowProjectDropdown(false);
  };

  const handleProjectInputFocus = () => {
    setShowProjectDropdown(true);
    setFilteredProjects(projectOptions);
  };

  const handleProjectInputBlur = () => {
    // Delay hiding dropdown to allow click events
    setTimeout(() => setShowProjectDropdown(false), 200);
  };

  const formatNumber = (num) => {
    if (!num) return '';
    return parseFloat(num).toLocaleString('en-US');
  };

  // eslint-disable-next-line no-unused-vars
  const handleDynamicInputChange = (e, index, field) => {
    const { value } = e.target;
    setFormData(prev => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  // eslint-disable-next-line no-unused-vars
  const addDynamicInput = (field) => {
    setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
  };

  // eslint-disable-next-line no-unused-vars
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
        navigate(`/customer/${data.customer.id}`);
      }
    } catch (error) {
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
              {isEditing && (
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>วันที่บันทึกข้อมูล</label>
                    <input 
                      type="text" 
                      value={formData.created_at ? new Date(formData.created_at).toLocaleString('th-TH') : 'ไม่ระบุ'} 
                      disabled 
                      style={{backgroundColor: '#f3f4f6', color: '#6b7280'}}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>วันที่อัปเดตล่าสุด</label>
                    <input 
                      type="text" 
                      value={formData.updated_at ? new Date(formData.updated_at).toLocaleString('th-TH') : 'ไม่ระบุ'} 
                      disabled 
                      style={{backgroundColor: '#f3f4f6', color: '#6b7280'}}
                    />
                  </div>
                </div>
              )}
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

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>เป้าหมายยื่นกู้ (เดือน/ปี)<span className={styles.required}>*</span></label>
                  <input type="month" name="targetDate" value={formData.targetDate ? formData.targetDate.substring(0, 7) : ''} onChange={handleChange} required />
                </div>
                <div className={styles.formGroup}>
                  <label>ธนาคารเป้าหมาย<span className={styles.required}>*</span></label>
                  <select name="targetBank" value={formData.targetBank} onChange={handleChange} required className={styles.select}>
                    <option value="">-- เลือกธนาคาร --</option>
                    <option value="KTB">ธนาคารกรุงไทย (KTB)</option>
                    <option value="GHB">ธนาคารอาคารสงเคราะห์ (GHB)</option>
                    <option value="GSB">ธนาคารออมสิน (GSB)</option>
                    <option value="BBL">ธนาคารกรุงเทพ (BBL)</option>
                    <option value="SCB">ธนาคารไทยพาณิชย์ (SCB)</option>
                    <option value="KBANK">ธนาคารกสิกรไทย (KBANK)</option>
                    <option value="BAY">ธนาคารกรุงศรีอยุธยา (BAY)</option>
                    <option value="TTB">ธนาคารทีเอ็มบีธนชาต (TTB)</option>
                    <option value="CIMBT">ธนาคารซีไอเอ็มบีไทย (CIMBT)</option>
                    <option value="TISCO">ธนาคารทิสโก้ (TISCO)</option>
                    <option value="KKP">ธนาคารเกียรตินาคิน (KKP)</option>
                    <option value="LH BANK">ธนาคารแอลเอช (LH BANK)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={styles.formSection}>
              <h3>🏠 ข้อมูลทรัพย์สิน</h3>
                             <div className={styles.formRow}>
                 <div className={styles.formGroup}>
                   <label>โครงการ<span className={styles.required}>*</span></label>
                   <div style={{ position: 'relative' }}>
                                          <input 
                        type="text" 
                        name="projectName" 
                        value={projectSearchTerm} 
                        onChange={handleProjectSearch}
                        onFocus={handleProjectInputFocus}
                        onBlur={handleProjectInputBlur}
                        placeholder="super search โปรดใส่คำค้นหาโครงการ"
                        required 
                        style={{ width: '100%' }}
                      />
                     {showProjectDropdown && filteredProjects.length > 0 && (
                       <div style={{
                         position: 'absolute',
                         top: '100%',
                         left: 0,
                         right: 0,
                         backgroundColor: 'white',
                         border: '1px solid #ccc',
                         borderRadius: '4px',
                         maxHeight: '200px',
                         overflowY: 'auto',
                         zIndex: 1000,
                         boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                       }}>
                         {filteredProjects.map((project, index) => (
                           <div
                             key={index}
                             onClick={() => handleProjectSelect(project)}
                             style={{
                               padding: '8px 12px',
                               cursor: 'pointer',
                               borderBottom: '1px solid #eee',
                               fontSize: '14px'
                             }}
                             onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                             onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                           >
                             {project}
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                 </div>
                 <div className={styles.formGroup}><label>เลขห้อง<span className={styles.required}>*</span></label><input type="text" name="unit" value={formData.unit} onChange={handleChange} required /></div>
               </div>
               <div className={styles.formRow}>
                 <div className={styles.formGroup}><label>มูลค่าทรัพย์เต็มจำนวน</label><input type="text" name="propertyPrice" value={formatNumber(formData.propertyPrice)} onChange={handleNumberChange} /></div>
                 <div className={styles.formGroup}><label>ส่วนลด (บาท)</label><input type="text" name="discount" value={formatNumber(formData.discount)} onChange={handleNumberChange} /></div>
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
                                 <div className={styles.formGroup}>
                   <label>LTV (%)<span className={styles.required}>*</span></label>
                   <select name="ltv" value={formData.ltv} onChange={handleChange} required className={styles.select}>
                     <option value="">-- เลือก LTV --</option>
                     <option value="100">100%</option>
                     <option value="90">90%</option>
                     <option value="80">80%</option>
                     <option value="70">70%</option>
                     <option value="60">60%</option>
                   </select>
                 </div>
              </div>
              <div className={styles.formRow + ' ' + styles.fullWidth}>
                <div className={styles.formGroup}><label>ช่วงเวลาที่พร้อมโอน<span className={styles.required}>*</span></label><input type="month" name="readyToTransfer" value={formData.readyToTransfer} onChange={handleChange} required /></div>
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

            {/* ส่วนข้อมูลธนาคารและคำแนะนำ - ซ่อนไว้ชั่วคราว
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
            */}

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
