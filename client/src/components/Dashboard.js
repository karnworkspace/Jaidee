import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { API_ENDPOINTS } from "../config/api";
import ConsumerAdviseReport from "./ConsumerAdviseReport";
import styles from "./Dashboard.module.css";

// Financial status mapping (Thai → English CSS class)
const FINANCIAL_CLASS_MAP = {
  'ดีเยี่ยม': 'excellent',
  'ดี': 'good',
  'ปานกลาง': 'fair',
  'ต้องปรับปรุง': 'poor',
};

// Loan status display labels
const LOAN_STATUS_LABELS = {
  new: 'ใหม่',
  document_check: 'ตรวจเอกสาร',
  document_incomplete: 'เอกสารไม่ครบ',
  bureau_check: 'Bureau',
  analyzing: 'วิเคราะห์',
  approved: 'อนุมัติ',
  rejected: 'ปฏิเสธ',
  transferred: 'โอนแล้ว',
  cancelled: 'ยกเลิก',
};

function Dashboard() {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");
  const [filters, setFilters] = useState({
    status: "all",
    potentialScore: "all",
    financialStatus: "all",
    officer: "all",
    loanStatus: "all",
  });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showReport, setShowReport] = useState(false);

  const navigate = useNavigate();
  const { authenticatedFetch, canEditData, isAdmin } = useAuth();

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await authenticatedFetch(API_ENDPOINTS.CUSTOMERS);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCustomers(data);
        setFilteredCustomers(data);
      } catch (error) {
        setCustomers([]);
        setFilteredCustomers([]);
      }
    };

    fetchCustomers();
  }, [authenticatedFetch]);

  useEffect(() => {
    let filtered = customers.filter((customer) => {
      // Super Search filter - enhanced search across multiple fields
      const searchTermLower = searchTerm.toLowerCase().trim();
      let matchesSearch = true;

      if (searchTermLower !== "") {
        matchesSearch =
          // Basic text fields
          customer.name?.toLowerCase().includes(searchTermLower) ||
          customer.projectName?.toLowerCase().includes(searchTermLower) ||
          customer.unit?.toLowerCase().includes(searchTermLower) ||
          customer.officer?.toLowerCase().includes(searchTermLower) ||
          customer.phone?.toLowerCase().includes(searchTermLower) ||
          customer.job?.toLowerCase().includes(searchTermLower) ||
          customer.position?.toLowerCase().includes(searchTermLower) ||
          // Exact matches for codes and numbers
          customer.id?.toString() === searchTermLower ||
          customer.targetBank?.toLowerCase() === searchTermLower ||
          customer.selectedBank?.toLowerCase().includes(searchTermLower) ||
          // Financial data searches
          customer.income
            ?.toString()
            .includes(searchTermLower.replace(/,/g, "")) ||
          customer.debt
            ?.toString()
            .includes(searchTermLower.replace(/,/g, "")) ||
          customer.propertyValue
            ?.toString()
            .includes(searchTermLower.replace(/,/g, "")) ||
          // Problem and solution searches
          (customer.loanProblem &&
            Array.isArray(customer.loanProblem) &&
            customer.loanProblem.some((problem) =>
              problem?.toLowerCase().includes(searchTermLower),
            )) ||
          (customer.actionPlan &&
            Array.isArray(customer.actionPlan) &&
            customer.actionPlan.some((action) =>
              action?.toLowerCase().includes(searchTermLower),
            )) ||
          // Date searches (partial matches)
          customer.date?.includes(searchTermLower) ||
          customer.readyToTransfer?.includes(searchTermLower) ||
          customer.created_at?.includes(searchTermLower) ||
          customer.updated_at?.includes(searchTermLower);
      }

      if (!matchesSearch) return false;

      // Status filter
      if (filters.status !== "all") {
        const statusBadge = getStatusBadge(customer);
        if (filters.status === "urgent" && statusBadge.class !== "pending")
          return false;
        if (filters.status === "normal" && statusBadge.class !== "active")
          return false;
      }

      // Potential Score filter
      if (filters.potentialScore !== "all") {
        const score = customer.potentialScore || 0;
        if (filters.potentialScore === "high" && score < 80) return false;
        if (filters.potentialScore === "medium" && (score < 50 || score >= 80))
          return false;
        if (filters.potentialScore === "low" && score >= 50) return false;
      }

      // Financial Status filter
      if (filters.financialStatus !== "all") {
        if (customer.financialStatus !== filters.financialStatus) return false;
      }

      // Officer filter
      if (filters.officer !== "all") {
        if (customer.officer !== filters.officer) return false;
      }

      // DOC2026: Loan status filter
      if (filters.loanStatus !== "all") {
        if ((customer.loan_status || "") !== filters.loanStatus) return false;
      }

      return true;
    });

    // Sort filtered results
    filtered.sort((a, b) => {
      let aVal = a[sortField] || "";
      let bVal = b[sortField] || "";

      // Handle numeric fields
      if (sortField === "potentialScore" || sortField === "income") {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      }

      // Handle date fields
      if (
        sortField === "targetDate" ||
        sortField === "date" ||
        sortField === "created_at"
      ) {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredCustomers(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, customers, filters, sortField, sortDirection]);

  const handleRowClick = (id) => {
    navigate(`/customer/${id}`);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: "all",
      potentialScore: "all",
      financialStatus: "all",
      officer: "all",
      loanStatus: "all",
    });
    setSearchTerm("");
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredCustomers.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  // Get unique values for filter options
  const getUniqueOfficers = () => {
    return [...new Set(customers.map((c) => c.officer).filter(Boolean))];
  };

  const getUniqueFinancialStatuses = () => {
    return [
      ...new Set(customers.map((c) => c.financialStatus).filter(Boolean)),
    ];
  };

  const formatNumber = (num) => {
    if (!num) return "-";
    return parseFloat(num).toLocaleString("en-US");
  };

  const getStatusBadge = (customer) => {
    const today = new Date();
    const targetDate = new Date(customer.targetDate);
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { class: "pending", text: "เกินกำหนด" };
    } else if (diffDays <= 30) {
      return { class: "pending", text: "เร่งด่วน" };
    } else {
      return { class: "active", text: "ปกติ" };
    }
  };

  const getStats = () => {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter((c) => {
      const today = new Date();
      const targetDate = new Date(c.targetDate);
      return targetDate > today;
    }).length;

    const avgPotentialScore =
      customers.length > 0
        ? Math.round(
            customers.reduce((sum, c) => sum + (c.potentialScore || 0), 0) /
              customers.length,
          )
        : 0;

    const urgentCustomers = customers.filter((c) => {
      const today = new Date();
      const targetDate = new Date(c.targetDate);
      const diffTime = targetDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30 && diffDays >= 0;
    }).length;

    return {
      totalCustomers,
      activeCustomers,
      avgPotentialScore,
      urgentCustomers,
    };
  };

  const stats = getStats();

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.contentWrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>Customer Dashboard</h1>
          <div className={styles.headerActions}>
            {isAdmin() && (
              <Link to="/admin/banks" className={styles.adminButton}>
                จัดการธนาคาร
              </Link>
            )}

            {canEditData() && (
              <Link to="/add-customer" className={styles.addButton}>
                เพิ่มลูกค้าใหม่
              </Link>
            )}
          </div>
        </div>

        {/* Stats Section */}
        <div className={styles.statsSection}>
          <div className={styles.statCard}>
            <h3>ลูกค้าทั้งหมด</h3>
            <div className={styles.statValue}>{stats.totalCustomers}</div>
            <div className={styles.statLabel}>รายการ</div>
          </div>
          <div className={styles.statCard}>
            <h3>ลูกค้าที่ใช้งาน</h3>
            <div className={styles.statValue}>{stats.activeCustomers}</div>
            <div className={styles.statLabel}>รายการ</div>
          </div>
          <div className={styles.statCard}>
            <h3>คะแนนเฉลี่ย</h3>
            <div className={styles.statValue}>{stats.avgPotentialScore}%</div>
            <div className={styles.statLabel}>Potential Score</div>
          </div>
          <div className={styles.statCard}>
            <h3>เร่งด่วน</h3>
            <div className={styles.statValue}>{stats.urgentCustomers}</div>
            <div className={styles.statLabel}>รายการ</div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className={styles.searchSection}>
          <div className={styles.searchRow}>
            <input
              type="text"
              placeholder="ค้นหา: ชื่อ, โครงการ, ห้อง, เจ้าหน้าที่, เบอร์โทร, อาชีพ, ธนาคาร, รายได้, ปัญหา, แผนแก้ไข..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            <button onClick={clearFilters} className={styles.clearButton}>
              ล้างตัวกรอง
            </button>
          </div>

          <div className={styles.filtersRow}>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">สถานะทั้งหมด</option>
              <option value="urgent">เร่งด่วน</option>
              <option value="normal">ปกติ</option>
            </select>

            <select
              value={filters.potentialScore}
              onChange={(e) =>
                handleFilterChange("potentialScore", e.target.value)
              }
              className={styles.filterSelect}
            >
              <option value="all">คะแนนทั้งหมด</option>
              <option value="high">สูง (80%+)</option>
              <option value="medium">ปานกลาง (50-79%)</option>
              <option value="low">ต่ำ (น้อยกว่า 50%)</option>
            </select>

            <select
              value={filters.financialStatus}
              onChange={(e) =>
                handleFilterChange("financialStatus", e.target.value)
              }
              className={styles.filterSelect}
            >
              <option value="all">สถานะการเงินทั้งหมด</option>
              {getUniqueFinancialStatuses().map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={filters.officer}
              onChange={(e) => handleFilterChange("officer", e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">ผู้วิเคราะห์ทั้งหมด</option>
              {getUniqueOfficers().map((officer) => (
                <option key={officer} value={officer}>
                  {officer}
                </option>
              ))}
            </select>

            <select
              value={filters.loanStatus}
              onChange={(e) => handleFilterChange("loanStatus", e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">สถานะสินเชื่อทั้งหมด</option>
              <option value="new">ใหม่</option>
              <option value="document_check">ตรวจเอกสาร</option>
              <option value="document_incomplete">เอกสารไม่ครบ</option>
              <option value="bureau_check">ตรวจ Bureau</option>
              <option value="analyzing">วิเคราะห์</option>
              <option value="approved">อนุมัติ</option>
              <option value="rejected">ปฏิเสธ</option>
              <option value="transferred">โอนแล้ว</option>
              <option value="cancelled">ยกเลิก</option>
            </select>
          </div>
        </div>

        {/* Results Summary */}
        <div className={styles.resultsInfo}>
          <span className={styles.resultText}>
            แสดง {startIndex + 1}-{Math.min(endIndex, filteredCustomers.length)}{" "}
            จาก {filteredCustomers.length} รายการ
            {customers.length !== filteredCustomers.length &&
              ` (กรองจากทั้งหมด ${customers.length} รายการ)`}
          </span>
        </div>

        {/* Customer Table */}
        <div className={styles.tableContainer}>
          {currentItems.length > 0 ? (
            <table className={styles.customerTable}>
              <thead>
                <tr>
                  <th
                    onClick={() => handleSort("name")}
                    className={styles.sortableHeader}
                  >
                    ชื่อลูกค้า
                    {sortField === "name" && (
                      <span className={styles.sortIcon}>
                        {sortDirection === "asc" ? " ↑" : " ↓"}
                      </span>
                    )}
                  </th>
                  <th
                    onClick={() => handleSort("projectName")}
                    className={styles.sortableHeader}
                  >
                    โครงการ
                    {sortField === "projectName" && (
                      <span className={styles.sortIcon}>
                        {sortDirection === "asc" ? " ↑" : " ↓"}
                      </span>
                    )}
                  </th>
                  <th>ห้อง</th>
                  <th
                    onClick={() => handleSort("income")}
                    className={styles.sortableHeader}
                  >
                    รายได้
                    {sortField === "income" && (
                      <span className={styles.sortIcon}>
                        {sortDirection === "asc" ? " ↑" : " ↓"}
                      </span>
                    )}
                  </th>
                  <th
                    onClick={() => handleSort("potentialScore")}
                    className={styles.sortableHeader}
                  >
                    คะแนน
                    {sortField === "potentialScore" && (
                      <span className={styles.sortIcon}>
                        {sortDirection === "asc" ? " ↑" : " ↓"}
                      </span>
                    )}
                  </th>
                  <th>สถานะการเงิน</th>
                  <th
                    onClick={() => handleSort("officer")}
                    className={styles.sortableHeader}
                  >
                    ผู้วิเคราะห์
                    {sortField === "officer" && (
                      <span className={styles.sortIcon}>
                        {sortDirection === "asc" ? " ↑" : " ↓"}
                      </span>
                    )}
                  </th>
                  <th
                    onClick={() => handleSort("created_at")}
                    className={styles.sortableHeader}
                  >
                    วันที่บันทึก
                    {sortField === "created_at" && (
                      <span className={styles.sortIcon}>
                        {sortDirection === "asc" ? " ↑" : " ↓"}
                      </span>
                    )}
                  </th>
                  <th
                    onClick={() => handleSort("loan_status")}
                    className={styles.sortableHeader}
                  >
                    สินเชื่อ
                    {sortField === "loan_status" && (
                      <span className={styles.sortIcon}>
                        {sortDirection === "asc" ? " ↑" : " ↓"}
                      </span>
                    )}
                  </th>
                  <th>สถานะ</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((customer) => {
                  const statusBadge = getStatusBadge(customer);
                  return (
                    <tr
                      key={customer.id}
                      className={styles.customerRow}
                      onClick={() => handleRowClick(customer.id)}
                    >
                      <td className={styles.nameCell}>
                        <div className={styles.customerName}>
                          {customer.name}
                        </div>
                      </td>
                      <td className={styles.projectCell}>
                        {customer.projectName || "-"}
                      </td>
                      <td>{customer.unit || "-"}</td>
                      <td className={styles.incomeCell}>
                        {formatNumber(customer.income)} ฿
                      </td>
                      <td className={styles.scoreCell}>
                        <div className={styles.scoreContainer}>
                          <div className={styles.scoreBar}>
                            <div
                              className={styles.scoreProgress}
                              style={{
                                width: `${customer.potentialScore || 0}%`,
                              }}
                            ></div>
                          </div>
                          <span className={styles.scoreText}>
                            {customer.potentialScore || 0}%
                          </span>
                        </div>
                      </td>
                      <td className={styles.financialCell}>
                        <span
                          className={`${styles.financialBadge} ${styles[FINANCIAL_CLASS_MAP[customer.financialStatus] || 'default']}`}
                        >
                          {customer.financialStatus || "-"}
                        </span>
                      </td>
                      <td>{customer.officer || "-"}</td>
                      <td className={styles.dateCell}>
                        {customer.created_at
                          ? new Date(customer.created_at).toLocaleDateString(
                              "th-TH",
                            )
                          : "-"}
                      </td>
                      <td>
                        {customer.loan_status ? (
                          <span className={`${styles.loanStatusBadge} ${styles[`loan_${customer.loan_status}`] || ''}`}>
                            {LOAN_STATUS_LABELS[customer.loan_status] || customer.loan_status}
                          </span>
                        ) : '-'}
                      </td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${styles[statusBadge.class]}`}
                        >
                          {statusBadge.text}
                        </span>
                      </td>
                      <td className={styles.actionCell}>
                        <Link
                          to={`/customer/${customer.id}`}
                          className={styles.viewButton}
                          onClick={(e) => e.stopPropagation()}
                          title="ดูรายละเอียด"
                        >
                          ดู
                        </Link>
                        <button
                          className={styles.printButton}
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const response = await authenticatedFetch(
                                API_ENDPOINTS.CUSTOMER_BY_ID(customer.id),
                              );
                              if (response.ok) {
                                const customerWithDetails =
                                  await response.json();
                                setSelectedCustomer(customerWithDetails);
                                setShowReport(true);
                              } else {
                                setSelectedCustomer(customer);
                                setShowReport(true);
                              }
                            } catch (error) {
                              setSelectedCustomer(customer);
                              setShowReport(true);
                            }
                          }}
                          title="พิมพ์รายงาน"
                        >
                          พิมพ์
                        </button>
                        {canEditData() && (
                          <Link
                            to={`/edit-customer/${customer.id}`}
                            className={styles.editButton}
                            onClick={(e) => e.stopPropagation()}
                            title="แก้ไขข้อมูล"
                          >
                            แก้ไข
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className={styles.noCustomers}>
              <div className={styles.icon}>📋</div>
              <div>ไม่พบข้อมูลลูกค้าที่ตรงกับเงื่อนไข</div>
              <button
                onClick={clearFilters}
                className={styles.clearFiltersButton}
              >
                ล้างตัวกรองทั้งหมด
              </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.paginationContainer}>
            <div className={styles.paginationInfo}>
              หน้า {currentPage} จาก {totalPages} • รวม{" "}
              {filteredCustomers.length} รายการ
            </div>
            <div className={styles.paginationControls}>
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                className={`${styles.paginationButton} ${styles.prevButton}`}
              >
                ← ก่อนหน้า
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`${styles.paginationButton} ${currentPage === pageNum ? styles.active : ""}`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className={`${styles.paginationButton} ${styles.nextButton}`}
              >
                ถัดไป →
              </button>
            </div>
          </div>
        )}

        {/* Consumer Advise Report Modal */}
        {showReport && selectedCustomer && (
          <ConsumerAdviseReport
            customerData={selectedCustomer}
            onClose={() => {
              setShowReport(false);
              setSelectedCustomer(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

export default Dashboard;
