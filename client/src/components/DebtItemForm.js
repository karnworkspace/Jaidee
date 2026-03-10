import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS } from '../config/api';
import FormModal, { modalStyles } from './FormModal';

const DEBT_TYPES = [
  { value: 'revolving_personal', label: 'สินเชื่อส่วนบุคคล (5%)' },
  { value: 'revolving_credit_card', label: 'บัตรเครดิต (8%)' },
  { value: 'revolving_other', label: 'หมุนเวียนอื่น (5%)' },
  { value: 'installment', label: 'ผ่อนชำระ (ผ่อนจริง)' },
  { value: 'joint_loan', label: 'กู้ร่วม (ผ่อน/2)' },
];

const initialForm = {
  debt_type: '',
  creditor_name: '',
  outstanding_balance: '',
  monthly_payment: '',
};

export default function DebtItemForm({ customerId, debtItems, dsrData, onDataChange }) {
  const { authenticatedFetch } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setEditingItem(null);
    setForm(initialForm);
    setError('');
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      debt_type: item.debt_type,
      creditor_name: item.creditor_name || '',
      outstanding_balance: item.outstanding_balance || '',
      monthly_payment: item.monthly_payment || '',
    });
    setError('');
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.debt_type) {
      setError('กรุณาเลือกประเภทหนี้');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        customer_id: parseInt(customerId),
        debt_type: form.debt_type,
        creditor_name: form.creditor_name || null,
        outstanding_balance: parseFloat(form.outstanding_balance) || 0,
        monthly_payment: parseFloat(form.monthly_payment) || 0,
      };

      let res;
      if (editingItem) {
        res = await authenticatedFetch(API_ENDPOINTS.DEBT_ITEM_BY_ID(editingItem.id), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await authenticatedFetch(API_ENDPOINTS.DEBT_ITEMS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'เกิดข้อผิดพลาด');
      }

      setShowModal(false);
      onDataChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('ต้องการลบรายการหนี้นี้?')) return;
    try {
      const res = await authenticatedFetch(API_ENDPOINTS.DEBT_ITEM_BY_ID(id), { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.message || 'ไม่สามารถลบได้');
        return;
      }
      onDataChange();
    } catch {
      alert('เกิดข้อผิดพลาดในการลบ');
    }
  };

  const typeLabels = {
    revolving_personal: 'สินเชื่อส่วนบุคคล (5%)',
    revolving_credit_card: 'บัตรเครดิต (8%)',
    revolving_other: 'หมุนเวียนอื่น (5%)',
    installment: 'ผ่อนชำระ',
    joint_loan: 'กู้ร่วม (/2)',
    legacy: 'ข้อมูลเดิม',
  };

  return (
    <div>
      {/* Header with add button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {dsrData && (
            <>
              <div style={{ padding: '0.5rem 1rem', background: dsrData.dsr > 40 ? '#fef2f2' : '#f0fdf4', borderRadius: '8px', border: `1px solid ${dsrData.dsr > 40 ? '#fecaca' : '#bbf7d0'}` }}>
                <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>DSR</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: dsrData.dsr > 40 ? '#dc2626' : '#16a34a' }}>{dsrData.dsr}%</div>
              </div>
              <div style={{ padding: '0.5rem 1rem', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>ภาระหนี้รวม</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0284c7' }}>{dsrData.totalDebt?.toLocaleString()} บาท</div>
              </div>
            </>
          )}
        </div>
        <button type="button" onClick={openAdd} style={{
          padding: '0.5rem 1rem', background: '#2A9D8F', color: '#fff',
          border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap'
        }}>
          + เพิ่มรายการหนี้
        </button>
      </div>

      {/* Debt items table */}
      {debtItems.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>ประเภท</th>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>เจ้าหนี้</th>
                <th style={{ padding: '8px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>ยอดคงเหลือ</th>
                <th style={{ padding: '8px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>ผ่อน/เดือน</th>
                <th style={{ padding: '8px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>คำนวณได้</th>
                <th style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid #e5e7eb', width: '80px' }}></th>
              </tr>
            </thead>
            <tbody>
              {debtItems.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '8px' }}>{typeLabels[item.debt_type] || item.debt_type}</td>
                  <td style={{ padding: '8px' }}>{item.creditor_name || '-'}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>{item.outstanding_balance?.toLocaleString()}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>{item.monthly_payment?.toLocaleString()}</td>
                  <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{item.calculated_payment?.toLocaleString()}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <button type="button" onClick={() => openEdit(item)} style={{
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: '#2A9D8F', marginRight: '4px'
                    }}>แก้ไข</button>
                    <button type="button" onClick={() => handleDelete(item.id)} style={{
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: '#dc2626'
                    }}>ลบ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
          <p>ยังไม่มีรายการหนี้ — กดปุ่ม "+ เพิ่มรายการหนี้" เพื่อเริ่มต้น</p>
        </div>
      )}

      {/* Modal */}
      <FormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? 'แก้ไขรายการหนี้' : 'เพิ่มรายการหนี้'}
      >
        <form onSubmit={handleSubmit}>
          {error && <div className={modalStyles.error}>{error}</div>}

          <div className={modalStyles.formGroup}>
            <label className={modalStyles.label}>ประเภทหนี้ *</label>
            <select name="debt_type" value={form.debt_type} onChange={handleChange} className={modalStyles.select} required>
              <option value="">-- เลือกประเภท --</option>
              {DEBT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className={modalStyles.formGroup}>
            <label className={modalStyles.label}>ชื่อเจ้าหนี้</label>
            <input name="creditor_name" value={form.creditor_name} onChange={handleChange}
              className={modalStyles.input} placeholder="เช่น ธ.กสิกรไทย, บ.อิออน" />
          </div>

          <div className={modalStyles.row}>
            <div className={modalStyles.formGroup}>
              <label className={modalStyles.label}>ยอดคงเหลือ (บาท)</label>
              <input name="outstanding_balance" type="number" min="0" step="0.01"
                value={form.outstanding_balance} onChange={handleChange} className={modalStyles.input} />
            </div>
            <div className={modalStyles.formGroup}>
              <label className={modalStyles.label}>ผ่อน/เดือน (บาท)</label>
              <input name="monthly_payment" type="number" min="0" step="0.01"
                value={form.monthly_payment} onChange={handleChange} className={modalStyles.input} />
            </div>
          </div>

          {form.debt_type && (
            <div style={{ padding: '0.75rem', background: '#f0fdf4', borderRadius: '6px', fontSize: '0.8rem', color: '#166534', marginBottom: '1rem' }}>
              {form.debt_type === 'revolving_personal' && 'ระบบจะคำนวณ = ยอดคงเหลือ x 5%'}
              {form.debt_type === 'revolving_credit_card' && 'ระบบจะคำนวณ = ยอดคงเหลือ x 8%'}
              {form.debt_type === 'revolving_other' && 'ระบบจะคำนวณ = ยอดคงเหลือ x 5%'}
              {form.debt_type === 'installment' && 'ระบบจะใช้ยอดผ่อน/เดือนจริงตามที่กรอก'}
              {form.debt_type === 'joint_loan' && 'ระบบจะคำนวณ = ผ่อน/เดือน / 2'}
            </div>
          )}

          <div className={modalStyles.footer} style={{ padding: 0, borderTop: 'none', marginTop: '0.5rem' }}>
            <button type="button" onClick={() => setShowModal(false)} className={modalStyles.btnSecondary}>ยกเลิก</button>
            <button type="submit" disabled={saving} className={modalStyles.btnPrimary}>
              {saving ? 'กำลังบันทึก...' : editingItem ? 'บันทึกการแก้ไข' : 'เพิ่มรายการ'}
            </button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
