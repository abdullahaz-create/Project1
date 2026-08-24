import { useState, useEffect } from 'react';
import api from '../api/client';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const TODAY = new Date().toISOString().split('T')[0];

// ─── Fee Form ───────────────────────────────────────────────────────
function FeeForm({ student, onDone }) {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [form, setForm] = useState({ month: currentMonth, year: currentYear, amount: '', isPaid: false });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const years = [];
  for (let y = currentYear - 1; y <= currentYear + 1; y++) years.push(y);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await api.post('/fees', { studentId: student.id, ...form, amount: parseFloat(form.amount) || 0 });
      setSaved(true);
    } catch (err) { setError(err.response?.data?.error || 'Failed to save fee'); }
    finally { setSaving(false); }
  };

  if (saved) return (
    <div className="text-center py-6">
      <p className="text-sm font-medium text-green-700 mb-4">Fee record saved successfully.</p>
      <button onClick={onDone} className="btn-secondary btn-sm">Done</button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-2">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label-base">Month</label>
          <select className="input-base" value={form.month} onChange={e => setForm({...form, month: parseInt(e.target.value)})}>
            {MONTHS.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="label-base">Year</label>
          <select className="input-base" value={form.year} onChange={e => setForm({...form, year: parseInt(e.target.value)})}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label-base">Amount (PKR)</label>
        <input type="number" min="0" className="input-base" placeholder="e.g. 2000" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
      </div>
      <div>
        <label className="label-base">Payment Status</label>
        <div className="flex gap-3 mt-1">
          {['Paid','Unpaid'].map(s => (
            <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="fee-status" checked={form.isPaid === (s === 'Paid')} onChange={() => setForm({...form, isPaid: s === 'Paid'})} />
              {s}
            </label>
          ))}
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button type="submit" disabled={saving} className="btn-primary w-full justify-center mt-1">
        {saving ? 'Saving...' : 'Save Fee'}
      </button>
    </form>
  );
}

// ─── Attendance Form ─────────────────────────────────────────────────
function AttendanceForm({ student, onDone }) {
  const [form, setForm] = useState({ date: TODAY, status: 'PRESENT' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await api.post('/attendance', { studentId: student.id, date: form.date, status: form.status });
      setSaved(true);
    } catch (err) { setError(err.response?.data?.error || 'Failed to save'); }
    finally { setSaving(false); }
  };

  if (saved) return (
    <div className="text-center py-6">
      <p className="text-sm font-medium text-green-700 mb-4">Attendance saved successfully.</p>
      <button onClick={onDone} className="btn-secondary btn-sm">Done</button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-2">
      <div>
        <label className="label-base">Date</label>
        <input type="date" className="input-base" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
      </div>
      <div>
        <label className="label-base">Status</label>
        <div className="flex gap-4 mt-1">
          {['PRESENT','ABSENT'].map(s => (
            <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="att-status" checked={form.status === s} onChange={() => setForm({...form, status: s})} />
              {s === 'PRESENT' ? 'Present' : 'Absent'}
            </label>
          ))}
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button type="submit" disabled={saving} className="btn-primary w-full justify-center mt-1">
        {saving ? 'Saving...' : 'Save Attendance'}
      </button>
    </form>
  );
}

// ─── Result Form ─────────────────────────────────────────────────────
function ResultForm({ student, onDone }) {
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState('');
  const [marks, setMarks] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/results/subjects'), api.get('/exams')]).then(([s, e]) => {
      // Filter subjects to only those the student is enrolled in
      const allSubs = s.data;
      const enrolled = student.subjects && student.subjects.length > 0
        ? allSubs.filter(sub => (student.subjects || []).includes(sub.name))
        : allSubs;
      setSubjects(enrolled);
      setExams(e.data);
      // Prefer 'Test' exam, fallback to first
      const testExam = e.data.find(ex => ex.name === 'Test') || e.data[0];
      if (testExam) setExamId(testExam.id);
      const init = {};
      enrolled.forEach(sub => { init[sub.id] = { obtained: '', total: '100' }; });
      setMarks(init);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!examId) { setError('Please select an exam.'); return; }
    setSaving(true); setError('');
    try {
      const results = subjects.map(sub => ({
        subjectId: sub.id,
        obtainedMarks: parseFloat(marks[sub.id]?.obtained) || 0,
        totalMarks: parseFloat(marks[sub.id]?.total) || 100,
      }));
      await api.post('/results/bulk', { studentId: student.id, examId: parseInt(examId), results });
      setSaved(true);
    } catch (err) { setError(err.response?.data?.error || 'Failed to save results'); }
    finally { setSaving(false); }
  };

  if (saved) return (
    <div className="text-center py-6">
      <p className="text-sm font-medium text-green-700 mb-4">Results saved successfully.</p>
      <button onClick={onDone} className="btn-secondary btn-sm">Done</button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-2">
      <div>
        <label className="label-base">Exam / Test</label>
        <select className="input-base" value={examId} onChange={e => setExamId(e.target.value)} required>
          {exams.length > 0
            ? exams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)
            : <option value="test">Test</option>
          }
        </select>
      </div>
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2 text-xs font-medium text-gray-500 px-1">
          <span>Subject</span><span className="text-center">Obtained</span><span className="text-center">Total</span>
        </div>
        {subjects.map(sub => (
          <div key={sub.id} className="grid grid-cols-3 gap-2 items-center">
            <span className="text-sm text-gray-700">{sub.name}</span>
            <input type="number" min="0" step="0.5" className="input-base py-1.5 text-sm text-center"
              placeholder="0"
              value={marks[sub.id]?.obtained || ''}
              onChange={e => setMarks(p => ({...p, [sub.id]: {...p[sub.id], obtained: e.target.value}}))} />
            <input type="number" min="1" step="0.5" className="input-base py-1.5 text-sm text-center"
              value={marks[sub.id]?.total || '100'}
              onChange={e => setMarks(p => ({...p, [sub.id]: {...p[sub.id], total: e.target.value}}))} />
          </div>
        ))}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button type="submit" disabled={saving} className="btn-primary w-full justify-center mt-1">
        {saving ? 'Saving...' : 'Save Results'}
      </button>
    </form>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────
export default function QuickAddModal({ student, onClose }) {
  const [activeSection, setActiveSection] = useState(null); // 'fee' | 'attendance' | 'result'

  const actions = [
    { id: 'fee', label: 'Add Fee', desc: 'Record monthly fee payment' },
    { id: 'attendance', label: 'Add Attendance', desc: 'Mark attendance for a date' },
    { id: 'result', label: 'Add Result', desc: 'Enter subject-wise marks' },
  ];

  return (
    <div className="modal-backdrop">
      <div className="modal-box" style={{ maxWidth: '460px' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Student Added</h3>
            <p className="text-xs text-gray-500 mt-0.5">{student.name} — Class {student.classLevel}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {!activeSection ? (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Student registered successfully. Would you like to add any details now?
              </p>
              <div className="space-y-2">
                {actions.map(a => (
                  <button
                    key={a.id}
                    onClick={() => setActiveSection(a.id)}
                    className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-left group"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{a.label}</p>
                      <p className="text-xs text-gray-500">{a.desc}</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
              <button onClick={onClose} className="btn-secondary w-full justify-center mt-4 text-xs">
                Skip for now
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveSection(null)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 mb-4"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <p className="text-sm font-medium text-gray-900 mb-1">
                {activeSection === 'fee' ? 'Add Fee' : activeSection === 'attendance' ? 'Add Attendance' : 'Add Result'}
              </p>
              <p className="text-xs text-gray-500 mb-3">For: {student.name}</p>

              {activeSection === 'fee' && <FeeForm student={student} onDone={onClose} />}
              {activeSection === 'attendance' && <AttendanceForm student={student} onDone={onClose} />}
              {activeSection === 'result' && <ResultForm student={student} onDone={onClose} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
