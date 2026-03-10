import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS } from '../config/api';
import FormModal, { modalStyles } from './FormModal';

const OFFICER_OPTIONS = [
  'นายพิชญ์ สุดทัน',
  'นายสมศักดิ์ หัตถ์สุวรรณ',
  'นางสาวศุภวรรณ อุ่นอกแดง',
  'นางสาวสุพิชญา ภักดีคง',
];

const CO_TRACKING_OPTIONS = [
  { value: 'pending', label: 'รอดำเนินการ' },
  { value: 'in_progress', label: 'กำลังดำเนินการ' },
  { value: 'completed', label: 'เสร็จสิ้น' },
];

export default function CaRecommendationForm({ customerId, caRecommendations, onDataChange }) {
  const { authenticatedFetch } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setEditingItem(null);
    setForm({
      problem_description: '',
      solution: '',
      ca_officer: '',
      co_officer: '',
      co_tracking_status: 'pending',
    });
    setError('');
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      problem_description: item.problem_description || '',
      solution: item.solution || '',
      ca_officer: item.ca_officer || '',
      co_officer: item.co_officer || '',
      co_tracking_status: item.co_tracking_status || 'pending',
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
      const payload = { ...form };
      payload.customer_id = parseInt(customerId);

      let res;
      if (editingItem) {
        res = await authenticatedFetch(API_ENDPOINTS.CA_RECOMMENDATION_BY_ID(editingItem.id), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await authenticatedFetch(API_ENDPOINTS.CA_RECOMMENDATIONS, {
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

  const trackingLabels = { pending: 'รอ', in_progress: 'กำลังดำเนินการ', completed: 'เสร็จ' };
  const trackingColors = { pending: '#fef3c7', in_progress: '#dbeafe', completed: '#dcfce7' };
  const trackingTextColors = { pending: '#92400e', in_progress: '#1e40af', completed: '#166534' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button type="button" onClick={openAdd} style={{
          padding: '0.5rem 1rem', background: '#2A9D8F', color: '#fff',
          border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem'
        }}>
          + เพิ่มคำแนะนำ
        </button>
      </div>

      {caRecommendations.length > 0 ? (
        <div>
          {caRecommendations.map(rec => (
            <div key={rec.id} style={{
              padding: '1rem', background: '#f9fafb', borderRadius: '8px',
              border: '1px solid #e5e7eb', marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Rec #{rec.id}</span>
                <button type="button" onClick={() => openEdit(rec)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: '#2A9D8F', fontSize: '0.85rem'
                }}>แก้ไข</button>
              </div>
              {rec.problem_description && (
                <div style={{ marginBottom: '0.5rem' }}><strong>ปัญหา:</strong> {rec.problem_description}</div>
              )}
              {rec.solution && (
                <div style={{ marginBottom: '0.5rem' }}><strong>แนวทาง:</strong> {rec.solution}</div>
              )}
              {rec.dsr_calculated && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>DSR:</strong>{' '}
                  <span style={{ fontWeight: 'bold', color: rec.dsr_calculated > 40 ? '#dc2626' : '#16a34a' }}>
                    {rec.dsr_calculated}%
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem', alignItems: 'center' }}>
                {rec.ca_officer && <span>JD: {rec.ca_officer}</span>}
                {rec.co_officer && <span>CO: {rec.co_officer}</span>}
                <span style={{
                  padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem',
                  background: trackingColors[rec.co_tracking_status] || '#f3f4f6',
                  color: trackingTextColors[rec.co_tracking_status] || '#374151',
                }}>
                  {trackingLabels[rec.co_tracking_status] || rec.co_tracking_status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
          <p>ยังไม่มี CA Recommendations — กดปุ่ม "+ เพิ่มคำแนะนำ" เพื่อเริ่มต้น</p>
        </div>
      )}

      {/* Modal */}
      <FormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? 'แก้ไขคำแนะนำ CA' : 'เพิ่มคำแนะนำ CA'}
      >
        <form onSubmit={handleSubmit}>
          {error && <div className={modalStyles.error}>{error}</div>}

          <div className={modalStyles.formGroup}>
            <label className={modalStyles.label}>ปัญหา</label>
            <textarea name="problem_description" value={form.problem_description} onChange={handleChange}
              className={modalStyles.textarea} placeholder="อธิบายปัญหาของลูกค้า..." />
          </div>

          <div className={modalStyles.formGroup}>
            <label className={modalStyles.label}>แนวทางแก้ไข</label>
            <textarea name="solution" value={form.solution} onChange={handleChange}
              className={modalStyles.textarea} placeholder="วิธีการแก้ไข/คำแนะนำ..." />
          </div>

          <div className={modalStyles.row}>
            <div className={modalStyles.formGroup}>
              <label className={modalStyles.label}>เจ้าหน้าที่ JD</label>
              <select name="ca_officer" value={form.ca_officer} onChange={handleChange} className={modalStyles.select}>
                <option value="">-- เลือก --</option>
                {OFFICER_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className={modalStyles.formGroup}>
              <label className={modalStyles.label}>เจ้าหน้าที่ CO</label>
              <select name="co_officer" value={form.co_officer} onChange={handleChange} className={modalStyles.select}>
                <option value="">-- เลือก --</option>
                {OFFICER_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div className={modalStyles.formGroup}>
            <label className={modalStyles.label}>สถานะ CO Tracking</label>
            <select name="co_tracking_status" value={form.co_tracking_status} onChange={handleChange} className={modalStyles.select}>
              {CO_TRACKING_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {!editingItem && (
            <div style={{
              padding: '0.75rem', background: '#f0fdf4', borderRadius: '6px',
              fontSize: '0.8rem', color: '#166534', marginBottom: '0.5rem'
            }}>
              ระบบจะคำนวณ DSR และ breakdown จากรายการหนี้อัตโนมัติ
            </div>
          )}

          <div className={modalStyles.footer} style={{ padding: 0, borderTop: 'none', marginTop: '0.5rem' }}>
            <button type="button" onClick={() => setShowModal(false)} className={modalStyles.btnSecondary}>ยกเลิก</button>
            <button type="submit" disabled={saving} className={modalStyles.btnPrimary}>
              {saving ? 'กำลังบันทึก...' : editingItem ? 'บันทึกการแก้ไข' : 'เพิ่มคำแนะนำ'}
            </button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
