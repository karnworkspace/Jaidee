import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS } from '../config/api';
import styles from './LoanProblemSelector.module.css';

function LoanProblemSelector({ 
  selectedProblems = [], 
  onProblemsChange,
  selectedSolutions = [],
  onSolutionsChange 
}) {
  const { authenticatedFetch } = useAuth();
  const [categories, setCategories] = useState([]);
  const [problemDetails, setProblemDetails] = useState({});
  const [otherProblems, setOtherProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  // States for current selection
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDetail, setSelectedDetail] = useState('');
  const [selectedSolution, setSelectedSolution] = useState('');
  const [solutionLoaded, setSolutionLoaded] = useState(false);
  const [solutionError, setSolutionError] = useState('');

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load categories
        const categoriesResponse = await authenticatedFetch(API_ENDPOINTS.PROBLEMS_CATEGORIES);
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);

        // Load other problems
        const otherResponse = await authenticatedFetch(API_ENDPOINTS.PROBLEMS_OTHER);
        const otherData = await otherResponse.json();
        setOtherProblems(otherData);

      } catch (error) {
        // Handle error silently
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [authenticatedFetch]);

  // Load problem details when category is selected
  useEffect(() => {
    const loadProblemDetails = async () => {
      if (!selectedCategory) {
        setSelectedDetail('');
        setSelectedSolution('');
        return;
      }

      try {
        const response = await authenticatedFetch(
          API_ENDPOINTS.PROBLEMS_DETAILS(selectedCategory)
        );
        const details = await response.json();
        setProblemDetails(prev => ({
          ...prev,
          [selectedCategory]: details
        }));
      } catch (error) {
        // Handle error silently
      }
    };

    loadProblemDetails();
  }, [selectedCategory, authenticatedFetch]);

  // Load solution when detail is selected
  useEffect(() => {
    const loadSolution = async () => {
      if (!selectedCategory || !selectedDetail) {
        setSelectedSolution('');
        setSolutionLoaded(false);
        setSolutionError('');
        return;
      }

      try {
        setSolutionError('');
        setSolutionLoaded(false);
        const response = await authenticatedFetch(
          API_ENDPOINTS.PROBLEMS_SOLUTION(selectedCategory, selectedDetail)
        );
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        setSelectedSolution(data.solution || '');
        setSolutionLoaded(true);
      } catch (error) {
        setSolutionError('ไม่สามารถโหลดวิธีแก้ไขได้ แต่สามารถเพิ่มปัญหาได้');
        setSelectedSolution('');
        setSolutionLoaded(true);
      }
    };

    loadSolution();
  }, [selectedCategory, selectedDetail, authenticatedFetch]);

  // Handle adding categorized problem
  const handleAddCategorizedProblem = () => {
    if (!selectedCategory || !selectedDetail || !solutionLoaded) {
      return;
    }

    const newProblem = `${selectedCategory} > ${selectedDetail}`;
    const newSolution = selectedSolution || '-';

    // Check if already exists
    if (selectedProblems.includes(newProblem)) {
      alert('ปัญหานี้ถูกเพิ่มไว้แล้ว');
      return;
    }

    // Add to lists
    const updatedProblems = [...selectedProblems, newProblem];
    const updatedSolutions = [...selectedSolutions, newSolution];

    onProblemsChange(updatedProblems);
    onSolutionsChange(updatedSolutions);

    // Reset selections
    setSelectedCategory('');
    setSelectedDetail('');
    setSelectedSolution('');
    setSolutionLoaded(false);
    setSolutionError('');
  };

  // Handle adding other problem
  const handleAddOtherProblem = async (problem) => {
    if (selectedProblems.includes(problem)) {
      return;
    }

    try {
      const response = await authenticatedFetch(
        API_ENDPOINTS.PROBLEMS_OTHER_SOLUTION(problem)
      );
      const data = await response.json();

      const updatedProblems = [...selectedProblems, problem];
      const updatedSolutions = [...selectedSolutions, data.solution];

      onProblemsChange(updatedProblems);
      onSolutionsChange(updatedSolutions);
    } catch (error) {
      // Handle error silently
    }
  };

  // Handle removing problem
  const handleRemoveProblem = (index) => {
    const updatedProblems = selectedProblems.filter((_, i) => i !== index);
    const updatedSolutions = selectedSolutions.filter((_, i) => i !== index);
    
    onProblemsChange(updatedProblems);
    onSolutionsChange(updatedSolutions);
  };

  if (loading) {
    return <div className={styles.loading}>กำลังโหลดข้อมูลปัญหา...</div>;
  }

  return (
    <div className={styles.problemSelector}>
      <h3 className={styles.title}>ปัญหาทางด้านสินเชื่อ</h3>

      {/* Categorized Problems Section */}
      <div className={styles.categorizedSection}>
        <h4 className={styles.sectionTitle}>ปัญหาหลัก</h4>
        
        <div className={styles.dropdownRow}>
          {/* ระดับ 1: ประเภทปัญหา */}
          <div className={styles.dropdownGroup}>
            <label className={styles.label}>ประเภทปัญหา:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={styles.dropdown}
            >
              <option value="">-- เลือกประเภทปัญหา --</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* ระดับ 2: รายละเอียดปัญหา */}
          <div className={styles.dropdownGroup}>
            <label className={styles.label}>รายละเอียดปัญหา:</label>
            <select
              value={selectedDetail}
              onChange={(e) => setSelectedDetail(e.target.value)}
              className={styles.dropdown}
              disabled={!selectedCategory}
            >
              <option value="">-- เลือกรายละเอียดปัญหา --</option>
              {problemDetails[selectedCategory]?.map(detail => (
                <option key={detail} value={detail}>
                  {detail}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ระดับ 3: วิธีการแก้ไข */}
        {solutionLoaded && (
          <div className={styles.solutionPreview}>
            <label className={styles.label}>วิธีการแก้ไข:</label>
            <div className={styles.solutionText}>
              {selectedSolution || 'ไม่มีวิธีแก้ไขที่กำหนดไว้'}
            </div>
          </div>
        )}

        {solutionError && (
          <div className={styles.solutionError}>
            {solutionError}
          </div>
        )}

        <button
          type="button"
          onClick={handleAddCategorizedProblem}
          disabled={!selectedCategory || !selectedDetail || !solutionLoaded}
          className={styles.addButton}
        >
          + เพิ่มปัญหาหลัก
        </button>
      </div>

      {/* Other Problems Section */}
      <div className={styles.otherSection}>
        <h4 className={styles.sectionTitle}>ปัญหาอื่น ๆ</h4>
        <div className={styles.otherProblemsGrid}>
          {otherProblems.map(problem => (
            <button
              type="button"
              key={problem}
              onClick={() => handleAddOtherProblem(problem)}
              disabled={selectedProblems.includes(problem)}
              className={`${styles.otherProblemButton} ${
                selectedProblems.includes(problem) ? styles.disabled : ''
              }`}
            >
              {problem}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Problems Display */}
      {selectedProblems.length > 0 && (
        <div className={styles.selectedSection}>
          <h4 className={styles.sectionTitle}>ปัญหาที่เลือก</h4>
          <div className={styles.selectedList}>
            {selectedProblems.map((problem, index) => (
              <div key={index} className={styles.selectedItem}>
                <div className={styles.selectedProblem}>
                  <strong>ปัญหา:</strong> {problem}
                </div>
                <div className={styles.selectedSolution}>
                  <strong>วิธีแก้:</strong> {selectedSolutions[index]}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveProblem(index)}
                  className={styles.removeButton}
                >
                  ลบ
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default LoanProblemSelector;