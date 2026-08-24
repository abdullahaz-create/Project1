import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import QuickAddModal from './QuickAddModal';
import StudentDetailsModal from './StudentDetailsModal';

const ALL_SUBJECTS = ['Math', 'Physics', 'Urdu', 'Computer', 'Chemistry', 'Bio', 'ISL'];

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StudentModal({ classLevel, student, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: student?.name || '',
    classLevel: student?.classLevel || classLevel,
    registrationDate: student?.registrationDate
      ? new Date(student.registrationDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    remarks: student?.remarks || '',
    subjects: student?.subjects || [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggleSubject = (sub) => {
    setForm(prev => ({
      ...prev,
      subjects: prev.subjects.includes(sub)
        ? prev.subjects.filter(s => s !== sub)
        : [...prev.subjects, sub],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.subjects.length === 0) {
      setError('Please select at least one subject.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      let saved;
      if (student) {
        const res = await api.put(`/students/${student.id}`, form);
        saved = res.data;
      } else {
        const res = await api.post('/students', form);
        saved = res.data;
      }
      onSaved(saved, !student);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save student');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-medium text-gray-900">
            {student ? 'Edit Student' : 'Add Student'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="label-base">Student Name *</label>
            <input className="input-base" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Full name" required />
          </div>
          <div>
            <label className="label-base">Class *</label>
            <select className="input-base" value={form.classLevel} onChange={e => setForm({...form, classLevel: parseInt(e.target.value)})} required>
              {[9,10,11,12].map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>
          <div>
            <label className="label-base">Subjects *</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {ALL_SUBJECTS.map(sub => (
                <label key={sub} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={form.subjects.includes(sub)}
                    onChange={() => toggleSubject(sub)}
                    className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">{sub}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="label-base">Registration Date</label>
            <input type="date" className="input-base" value={form.registrationDate} onChange={e => setForm({...form, registrationDate: e.target.value})} />
          </div>
          <div>
            <label className="label-base">Remarks (optional)</label>
            <textarea className="input-base resize-none" rows={2} value={form.remarks} onChange={e => setForm({...form, remarks: e.target.value})} placeholder="Optional notes..." />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? 'Saving...' : student ? 'Update Student' : 'Add Student'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}


function DeleteConfirm({ student, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/students/${student.id}`);
      onDeleted();
      onClose();
    } catch (err) { console.error(err); }
    finally { setDeleting(false); }
  };
  return (
    <div className="modal-backdrop">
      <div className="modal-box p-6 max-w-sm">
        <h3 className="text-base font-medium text-gray-900 mb-2">Remove Student</h3>
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to remove <strong>{student.name}</strong>? This will also delete their attendance, results, and fee records. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={handleDelete} disabled={deleting} className="btn-primary bg-red-600 hover:bg-red-700 focus:ring-red-600 flex-1 justify-center">
            {deleting ? 'Removing...' : 'Remove Student'}
          </button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function StudentsTab({ classLevel }) {
  const { isAdmin } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [deleteStudent, setDeleteStudent] = useState(null);
  const [quickAddStudent, setQuickAddStudent] = useState(null); // newly added student
  const [viewStudent, setViewStudent] = useState(null); // student details

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/students?class=${classLevel}`);
      setStudents(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadStudents(); }, [classLevel]);

  // Called when student is saved; if isNew, show QuickAddModal
  const handleSaved = (savedStudent, isNew) => {
    loadStudents();
    if (isNew) setQuickAddStudent(savedStudent);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Students</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {students.length} student{students.length !== 1 ? 's' : ''} in Class {classLevel}
          </p>
        </div>
        {isAdmin && (
          <button id={`add-student-class-${classLevel}`} onClick={() => setShowAdd(true)} className="btn-primary btn-sm">
            Add Student
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400">Loading...</div>
        ) : students.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-gray-500">No students in Class {classLevel} yet.</p>
            {isAdmin && <button onClick={() => setShowAdd(true)} className="btn-primary btn-sm mt-3">Add First Student</button>}
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="table-base">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Subjects</th>
                  <th>Registration Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={s.id}>
                    <td className="text-gray-400 text-xs">{i + 1}</td>
                    <td>
                      <button
                        onClick={() => setViewStudent(s)}
                        className="font-medium text-gray-900 hover:text-gray-600 hover:underline text-left"
                      >
                        {s.name}
                      </button>
                    </td>
                    <td className="text-gray-500">{formatDate(s.registrationDate)}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {(s.subjects || []).length > 0
                          ? (s.subjects || []).map(sub => (
                              <span key={sub} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">{sub}</span>
                            ))
                          : <span className="text-xs text-gray-400">—</span>
                        }
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewStudent(s)}
                          className="btn-secondary btn-sm text-xs"
                        >
                          View
                        </button>
                        {isAdmin && (
                          <>
                            <button id={`edit-student-${s.id}`} onClick={() => setEditStudent(s)} className="btn-secondary btn-sm">Edit</button>
                            <button id={`delete-student-${s.id}`} onClick={() => setDeleteStudent(s)} className="btn-danger">Remove</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAdd && (
        <StudentModal classLevel={classLevel} onClose={() => setShowAdd(false)} onSaved={handleSaved} />
      )}
      {editStudent && (
        <StudentModal classLevel={classLevel} student={editStudent} onClose={() => setEditStudent(null)} onSaved={handleSaved} />
      )}
      {deleteStudent && (
        <DeleteConfirm student={deleteStudent} onClose={() => setDeleteStudent(null)} onDeleted={loadStudents} />
      )}
      {quickAddStudent && (
        <QuickAddModal student={quickAddStudent} onClose={() => setQuickAddStudent(null)} />
      )}
      {viewStudent && (
        <StudentDetailsModal student={viewStudent} onClose={() => setViewStudent(null)} />
      )}
    </div>
  );
}
