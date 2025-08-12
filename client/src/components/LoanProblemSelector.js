import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
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

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load categories
        const categoriesResponse = await authenticatedFetch('http://localhost:3001/api/problems/categories');
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);

        // Load other problems
        const otherResponse = await authenticatedFetch('http://localhost:3001/api/problems/other');
        const otherData = await otherResponse.json();
        setOtherProblems(otherData);

      } catch (error) {
        console.error('Error loading problems data:', error);
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
          `http://localhost:3001/api/problems/details/${encodeURIComponent(selectedCategory)}`
        );
        const details = await response.json();
        setProblemDetails(prev => ({
          ...prev,
          [selectedCategory]: details
        }));
      } catch (error) {
        console.error('Error loading problem details:', error);
      }
    };

    loadProblemDetails();
  }, [selectedCategory, authenticatedFetch]);

  // Load solution when detail is selected
  useEffect(() => {
    const loadSolution = async () => {
      if (!selectedCategory || !selectedDetail) {
        setSelectedSolution('');
        return;
      }

      try {
        const response = await authenticatedFetch(
          `http://localhost:3001/api/problems/solution/${encodeURIComponent(selectedCategory)}/${encodeURIComponent(selectedDetail)}`
        );
        const data = await response.json();
        setSelectedSolution(data.solution);
      } catch (error) {
        console.error('Error loading solution:', error);
      }
    };

    loadSolution();
  }, [selectedCategory, selectedDetail, authenticatedFetch]);

  // Handle adding categorized problem
  const handleAddCategorizedProblem = () => {
    if (!selectedCategory || !selectedDetail || !selectedSolution) {
      return;
    }

    const newProblem = `${selectedCategory} > ${selectedDetail}`;
    const newSolution = selectedSolution;

    // Check if already exists
    if (selectedProblems.includes(newProblem)) {
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
  };

  // Handle adding other problem
  const handleAddOtherProblem = async (problem) => {
    if (selectedProblems.includes(problem)) {
      return;
    }

    try {
      const response = await authenticatedFetch(
        `http://localhost:3001/api/problems/other-solution/${encodeURIComponent(problem)}`
      );
      const data = await response.json();
      
      const updatedProblems = [...selectedProblems, problem];
      const updatedSolutions = [...selectedSolutions, data.solution];

      onProblemsChange(updatedProblems);
      onSolutionsChange(updatedSolutions);
    } catch (error) {
      console.error('Error loading other problem solution:', error);
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
    return <div className={styles.loading}>🔄 กำลังโหลดข้อมูลปัญหา...</div>;
  }

  return (
    <div className={styles.problemSelector}>
      <h3 className={styles.title}>📋 ปัญหาทางด้านสินเชื่อ</h3>

      {/* Categorized Problems Section */}
      <div className={styles.categorizedSection}>
        <h4 className={styles.sectionTitle}>🎯 ปัญหาหลัก</h4>
        
        <div className={styles.dropdownRow}>
          {/* ระดับ 1: ประเภทปัญหา */}
          <div className={styles.dropdownGroup}>
            <label className={styles.label}>1️⃣ ประเภทปัญหา:</label>
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
            <label className={styles.label}>2️⃣ รายละเอียดปัญหา:</label>
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
        {selectedSolution && (
          <div className={styles.solutionPreview}>
            <label className={styles.label}>3️⃣ วิธีการแก้ไข:</label>
            <div className={styles.solutionText}>
              {selectedSolution}
            </div>
          </div>
        )}

        <button
          onClick={handleAddCategorizedProblem}
          disabled={!selectedCategory || !selectedDetail || !selectedSolution}
          className={styles.addButton}
        >
          ➕ เพิ่มปัญหาหลัก
        </button>
      </div>

      {/* Other Problems Section */}
      <div className={styles.otherSection}>
        <h4 className={styles.sectionTitle}>🔧 ปัญหาอื่น ๆ</h4>
        <div className={styles.otherProblemsGrid}>
          {otherProblems.map(problem => (
            <button
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
          <h4 className={styles.sectionTitle}>✅ ปัญหาที่เลือก</h4>
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
                  onClick={() => handleRemoveProblem(index)}
                  className={styles.removeButton}
                >
                  🗑️
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