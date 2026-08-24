import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const MONTHS = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December',
];

function FeeAmountModal({ student, month, year, existing, onClose, onSaved }) {
  const [amount, setAmount] = useState(existing?.amount || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/fees', {
        studentId: student.id,
        month,
        year,
        amount: parseFloat(amount) || 0,
        isPaid: existing?.isPaid || false,
      });
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box p-6 max-w-xs">
        <h3 className="text-base font-medium text-gray-900 mb-1">Set Fee Amount</h3>
        <p className="text-xs text-gray-500 mb-4">
          {student.name} — {MONTHS[month - 1]} {year}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-base">Amount (PKR)</label>
            <input
              type="number"
              min="0"
              step="1"
              className="input-base"
              placeholder="e.g. 2000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FeesTab({ classLevel }) {
  const { isAdmin } = useAuth();
  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [amountModal, setAmountModal] = useState(null); // { student, existing }
  const [togglingId, setTogglingId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [studRes, feeRes] = await Promise.all([
        api.get(`/students?class=${classLevel}`),
        api.get(`/fees?class=${classLevel}&month=${month}&year=${year}`),
      ]);
      setStudents(studRes.data);
      setFees(feeRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [classLevel, month, year]);

  const getFee = (studentId) => fees.find((f) => f.studentId === studentId);

  const togglePaid = async (student) => {
    const existing = getFee(student.id);
    setTogglingId(student.id);
    try {
      await api.post('/fees', {
        studentId: student.id,
        month,
        year,
        amount: existing?.amount || 0,
        isPaid: !existing?.isPaid,
      });
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingId(null);
    }
  };

  const paidCount = fees.filter((f) => f.isPaid).length;
  const unpaidCount = students.length - paidCount;
  const totalCollected = fees.filter((f) => f.isPaid).reduce((s, f) => s + f.amount, 0);

  const years = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear - 2; y <= currentYear + 1; y++) years.push(y);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Fee Management</h2>
          <p className="text-xs text-gray-500 mt-0.5">Class {classLevel}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            id={`fee-month-${classLevel}`}
            className="input-base w-auto text-sm"
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
          >
            {MONTHS.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            id={`fee-year-${classLevel}`}
            className="input-base w-auto text-sm"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary */}
      {students.length > 0 && (
        <div className="flex gap-3 mb-4">
          <div className="card px-4 py-2.5 flex-1 text-center">
            <p className="text-xs text-gray-500 mb-0.5">Paid</p>
            <p className="text-lg font-semibold text-green-600">{paidCount}</p>
          </div>
          <div className="card px-4 py-2.5 flex-1 text-center">
            <p className="text-xs text-gray-500 mb-0.5">Unpaid</p>
            <p className="text-lg font-semibold text-red-500">{unpaidCount}</p>
          </div>
          <div className="card px-4 py-2.5 flex-1 text-center">
            <p className="text-xs text-gray-500 mb-0.5">Collected</p>
            <p className="text-lg font-semibold text-gray-900">
              {totalCollected > 0 ? `PKR ${totalCollected.toLocaleString()}` : '-'}
            </p>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400">Loading...</div>
        ) : students.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            No students in Class {classLevel}.
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="table-base">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student Name</th>
                  <th className="text-right">Amount (PKR)</th>
                  <th>Status</th>
                  {isAdmin && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => {
                  const fee = getFee(s.id);
                  return (
                    <tr key={s.id}>
                      <td className="text-gray-400 text-xs">{i + 1}</td>
                      <td className="font-medium text-gray-900">{s.name}</td>
                      <td className="text-right">
                        {fee ? fee.amount.toLocaleString() : '-'}
                      </td>
                      <td>
                        {fee?.isPaid ? (
                          <span className="badge-green">Paid</span>
                        ) : fee ? (
                          <span className="badge-red">Unpaid</span>
                        ) : (
                          <span className="badge-gray">Not set</span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              id={`set-amount-${s.id}-${month}-${year}`}
                              onClick={() => setAmountModal({ student: s, existing: fee })}
                              className="btn-secondary btn-sm"
                            >
                              {fee ? 'Edit Amount' : 'Set Amount'}
                            </button>
                            <button
                              id={`toggle-paid-${s.id}-${month}-${year}`}
                              onClick={() => togglePaid(s)}
                              disabled={togglingId === s.id}
                              className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                                fee?.isPaid
                                  ? 'text-red-500 border-red-200 hover:bg-red-50'
                                  : 'text-green-600 border-green-200 hover:bg-green-50'
                              }`}
                            >
                              {togglingId === s.id
                                ? '...'
                                : fee?.isPaid
                                ? 'Mark Unpaid'
                                : 'Mark Paid'}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {amountModal && (
        <FeeAmountModal
          student={amountModal.student}
          month={month}
          year={year}
          existing={amountModal.existing}
          onClose={() => setAmountModal(null)}
          onSaved={loadData}
        />
      )}
    </div>
  );
}
