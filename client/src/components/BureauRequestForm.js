import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS } from '../config/api';
import FormModal, { modalStyles } from './FormModal';

const initialForm = {
  request_date: new Date().toISOString().split('T')[0],
  form1_status: 'pending',
  form2_status: 'pending',
  consent_status: 'pending',
  bureau_score: '',
  bureau_result: '',
};

export default function BureauRequestForm({ customerId, bureauRequests, onDataChange }) {
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
      request_date: item.request_date || '',
      form1_status: item.form1_status || 'pending',
      form2_status: item.form2_status || 'pending',
      consent_status: item.consent_status || 'pending',
      bureau_score: item.bureau_score || '',
      bureau_result: item.bureau_result || '',
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
    setSaving(true);
    setError('');

    try {
      let res;
      if (editingItem) {
        // Update existing
        const payload = { ...form };
        if (payload.bureau_score) payload.bureau_score = parseInt(payload.bureau_score);
        res = await authenticatedFetch(API_ENDPOINTS.BUREAU_REQUEST_BY_ID(editingItem.id), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new
        res = await authenticatedFetch(API_ENDPOINTS.BUREAU_REQUESTS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_id: parseInt(customerId),
            request_date: form.request_date,
          }),
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

  const consentLabels = { pending: 'รอ', received: 'ได้รับแล้ว', expired: 'หมดอายุ' };
  const formStatusLabels = { pending: 'รอ', received: 'ส่งแล้ว', verified: 'ยืนยันแล้ว' };

  const StatusBadge = ({ status, type }) => {
    const labels = type === 'consent' ? consentLabels : formStatusLabels;
    const isGreen = status === 'received' || status === 'verified';
    const isYellow = status === 'pending' || status === 'submitted';
    return (
      <span style={{
        padding: '2px 10px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 500,
        background: isGreen ? '#dcfce7' : isYellow ? '#fef3c7' : '#fee2e2',
        color: isGreen ? '#166534' : isYellow ? '#92400e' : '#991b1b',
      }}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button type="button" onClick={openAdd} style={{
          padding: '0.5rem 1rem', background: '#2A9D8F', color: '#fff',
          border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem'
        }}>
          + ขอ Bureau Check
        </button>
      </div>

      {bureauRequests.length > 0 ? (
        <div>
          {bureauRequests.map(req => (
            <div key={req.id} style={{
              padding: '1rem', background: '#f9fafb', borderRadius: '8px',
              border: '1px solid #e5e7eb', marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Bureau #{req.id}</span>
                <button type="button" onClick={() => openEdit(req)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: '#2A9D8F', fontSize: '0.85rem'
                }}>แก้ไข</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>วันที่ขอ</span><br />
                  <strong>{req.request_date}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>หมดอายุ</span><br />
                  <strong>{req.expiry_date || '-'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>Form 1</span><br />
                  <StatusBadge status={req.form1_status} type="form" />
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>Form 2</span><br />
                  <StatusBadge status={req.form2_status} type="form" />
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>Consent</span><br />
                  <StatusBadge status={req.consent_status} type="consent" />
                </div>
                {req.bureau_score && (
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>Bureau Score</span><br />
                    <strong style={{ fontSize: '1.2rem' }}>{req.bureau_score}</strong>
                  </div>
                )}
              </div>
              {req.bureau_result && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#374151' }}>
                  <strong>ผล:</strong> {req.bureau_result}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
          <p>ยังไม่มีข้อมูล Bureau — กดปุ่ม "+ ขอ Bureau Check" เพื่อเริ่มต้น</p>
        </div>
      )}

      {/* Modal */}
      <FormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? 'แก้ไข Bureau Check' : 'ขอ Bureau Check ใหม่'}
      >
        <form onSubmit={handleSubmit}>
          {error && <div className={modalStyles.error}>{error}</div>}

          <div className={modalStyles.formGroup}>
            <label className={modalStyles.label}>วันที่ขอ *</label>
            <input name="request_date" type="date" value={form.request_date} onChange={handleChange}
              className={modalStyles.input} required disabled={!!editingItem} />
          </div>

          {editingItem && (
            <>
              {/* Workflow: Form1 → Form2 → Consent → Score */}
              <div style={{
                padding: '0.75rem', background: '#f0f9ff', borderRadius: '6px',
                fontSize: '0.8rem', color: '#0369a1', marginBottom: '1rem'
              }}>
                ลำดับ: Form 1 ยืนยัน → Form 2 ยืนยัน → Consent ได้รับ → กรอก Score
              </div>

              <div className={modalStyles.row}>
                <div className={modalStyles.formGroup}>
                  <label className={modalStyles.label}>Form 1</label>
                  <select name="form1_status" value={form.form1_status} onChange={handleChange} className={modalStyles.select}>
                    <option value="pending">รอ</option>
                    <option value="received">ส่งแล้ว</option>
                    <option value="verified">ยืนยันแล้ว</option>
                  </select>
                </div>
                <div className={modalStyles.formGroup}>
                  <label className={modalStyles.label}>Form 2</label>
                  <select name="form2_status" value={form.form2_status} onChange={handleChange} className={modalStyles.select}
                    disabled={form.form1_status !== 'verified'}>
                    <option value="pending">รอ</option>
                    <option value="received">ส่งแล้ว</option>
                    <option value="verified">ยืนยันแล้ว</option>
                  </select>
                </div>
              </div>

              <div className={modalStyles.formGroup}>
                <label className={modalStyles.label}>Consent</label>
                <select name="consent_status" value={form.consent_status} onChange={handleChange} className={modalStyles.select}>
                  <option value="pending">รอ</option>
                  <option value="received">ได้รับแล้ว</option>
                  <option value="expired">หมดอายุ</option>
                </select>
              </div>

              <div className={modalStyles.row}>
                <div className={modalStyles.formGroup}>
                  <label className={modalStyles.label}>Bureau Score</label>
                  <input name="bureau_score" type="number" min="0" max="999"
                    value={form.bureau_score} onChange={handleChange} className={modalStyles.input}
                    disabled={form.consent_status !== 'received'} placeholder="เช่น 680" />
                </div>
                <div className={modalStyles.formGroup}>
                  <label className={modalStyles.label}>ผล Bureau</label>
                  <input name="bureau_result" value={form.bureau_result} onChange={handleChange}
                    className={modalStyles.input} disabled={form.consent_status !== 'received'}
                    placeholder="เช่น ผ่าน, ไม่ผ่าน" />
                </div>
              </div>
            </>
          )}

          <div className={modalStyles.footer} style={{ padding: 0, borderTop: 'none', marginTop: '0.5rem' }}>
            <button type="button" onClick={() => setShowModal(false)} className={modalStyles.btnSecondary}>ยกเลิก</button>
            <button type="submit" disabled={saving} className={modalStyles.btnPrimary}>
              {saving ? 'กำลังบันทึก...' : editingItem ? 'บันทึกการแก้ไข' : 'สร้าง Bureau Check'}
            </button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
