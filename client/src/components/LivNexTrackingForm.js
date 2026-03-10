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

const STATUS_CONFIG = {
  approved: { label: 'อนุมัติ', color: '#f59e0b', bg: '#fffbeb' },
  active: { label: 'ดำเนินการ', color: '#3b82f6', bg: '#eff6ff' },
  transferred: { label: 'โอนแล้ว', color: '#10b981', bg: '#ecfdf5' },
  cancelled: { label: 'ยกเลิก', color: '#ef4444', bg: '#fef2f2' },
};

const TRANSITIONS = {
  approved: ['active', 'cancelled'],
  active: ['transferred', 'cancelled'],
  transferred: [],
  cancelled: [],
};

export default function LivNexTrackingForm({ customerId, livnexTracking, onDataChange }) {
  const { authenticatedFetch } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setEditingItem(null);
    setForm({
      status: 'approved',
      approval_date: new Date().toISOString().split('T')[0],
      jd_officer: '',
      co_officer: '',
      notes: '',
    });
    setError('');
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      status: item.status || 'approved',
      approval_date: item.approval_date || '',
      transfer_date: item.transfer_date || '',
      jd_officer: item.jd_officer || '',
      co_officer: item.co_officer || '',
      notes: item.notes || '',
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
        res = await authenticatedFetch(API_ENDPOINTS.LIVNEX_TRACKING_BY_ID(editingItem.id), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await authenticatedFetch(API_ENDPOINTS.LIVNEX_TRACKING, {
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

  const allowedNext = editingItem ? (TRANSITIONS[editingItem.status] || []) : [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button type="button" onClick={openAdd} style={{
          padding: '0.5rem 1rem', background: '#2A9D8F', color: '#fff',
          border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem'
        }}>
          + เพิ่ม Tracking
        </button>
      </div>

      {livnexTracking.length > 0 ? (
        <div>
          {livnexTracking.map(track => {
            const cfg = STATUS_CONFIG[track.status] || { label: track.status, color: '#6b7280', bg: '#f3f4f6' };
            const canEdit = TRANSITIONS[track.status]?.length > 0;
            return (
              <div key={track.id} style={{
                padding: '1rem', background: '#f9fafb', borderRadius: '8px',
                border: '1px solid #e5e7eb', marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 'bold' }}>Tracking #{track.id}</span>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{
                      padding: '2px 12px', borderRadius: '12px', fontSize: '0.85rem',
                      fontWeight: 600, color: '#fff', background: cfg.color
                    }}>
                      {cfg.label}
                    </span>
                    {canEdit && (
                      <button type="button" onClick={() => openEdit(track)} style={{
                        background: 'none', border: 'none', cursor: 'pointer', color: '#2A9D8F', fontSize: '0.85rem'
                      }}>แก้ไข</button>
                    )}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem', fontSize: '0.85rem' }}>
                  {track.approval_date && <div>อนุมัติ: {track.approval_date}</div>}
                  {track.transfer_date && <div>โอน: {track.transfer_date}</div>}
                  {track.jd_officer && <div>JD: {track.jd_officer}</div>}
                  {track.co_officer && <div>CO: {track.co_officer}</div>}
                </div>
                {track.notes && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#6b7280' }}>
                    หมายเหตุ: {track.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
          <p>ยังไม่มีข้อมูล Tracking — กดปุ่ม "+ เพิ่ม Tracking" เพื่อเริ่มต้น</p>
        </div>
      )}

      {/* Modal */}
      <FormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? 'แก้ไข Tracking' : 'เพิ่ม Tracking ใหม่'}
      >
        <form onSubmit={handleSubmit}>
          {error && <div className={modalStyles.error}>{error}</div>}

          {editingItem ? (
            <>
              <div style={{
                padding: '0.75rem', background: STATUS_CONFIG[editingItem.status]?.bg || '#f3f4f6',
                borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem'
              }}>
                สถานะปัจจุบัน: <strong>{STATUS_CONFIG[editingItem.status]?.label}</strong>
              </div>

              {allowedNext.length > 0 && (
                <div className={modalStyles.formGroup}>
                  <label className={modalStyles.label}>เปลี่ยนสถานะเป็น</label>
                  <select name="status" value={form.status} onChange={handleChange} className={modalStyles.select}>
                    <option value={editingItem.status}>{STATUS_CONFIG[editingItem.status]?.label} (ไม่เปลี่ยน)</option>
                    {allowedNext.map(s => (
                      <option key={s} value={s}>{STATUS_CONFIG[s]?.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {form.status === 'transferred' && (
                <div className={modalStyles.formGroup}>
                  <label className={modalStyles.label}>วันที่โอน</label>
                  <input name="transfer_date" type="date" value={form.transfer_date || ''} onChange={handleChange} className={modalStyles.input} />
                </div>
              )}
            </>
          ) : (
            <div className={modalStyles.formGroup}>
              <label className={modalStyles.label}>วันที่อนุมัติ</label>
              <input name="approval_date" type="date" value={form.approval_date} onChange={handleChange} className={modalStyles.input} />
            </div>
          )}

          <div className={modalStyles.row}>
            <div className={modalStyles.formGroup}>
              <label className={modalStyles.label}>เจ้าหน้าที่ JD</label>
              <select name="jd_officer" value={form.jd_officer} onChange={handleChange} className={modalStyles.select}>
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
            <label className={modalStyles.label}>หมายเหตุ</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} className={modalStyles.textarea}
              placeholder="หมายเหตุเพิ่มเติม..." />
          </div>

          <div className={modalStyles.footer} style={{ padding: 0, borderTop: 'none', marginTop: '0.5rem' }}>
            <button type="button" onClick={() => setShowModal(false)} className={modalStyles.btnSecondary}>ยกเลิก</button>
            <button type="submit" disabled={saving} className={modalStyles.btnPrimary}>
              {saving ? 'กำลังบันทึก...' : editingItem ? 'บันทึกการแก้ไข' : 'สร้าง Tracking'}
            </button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
