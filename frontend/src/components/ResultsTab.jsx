import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

function ResultModal({ student, subjects, exams, existingResults, onClose, onSaved }) {
  const [examId, setExamId] = useState(exams[0]?.id || '');
  const [marks, setMarks] = useState(() => {
    const initial = {};
    subjects.forEach(sub => {
      const ex = existingResults.find(r => r.subjectId === sub.id && r.examId === (exams[0]?.id));
      initial[sub.id] = { obtained: ex ? ex.obtainedMarks : '', total: ex ? ex.totalMarks : '100' };
    });
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Reload marks when exam changes
  const handleExamChange = (newExamId) => {
    setExamId(newExamId);
    const newMarks = {};
    subjects.forEach(sub => {
      const ex = existingResults.find(r => r.subjectId === sub.id && r.examId === parseInt(newExamId));
      newMarks[sub.id] = { obtained: ex ? ex.obtainedMarks : '', total: ex ? ex.totalMarks : '100' };
    });
    setMarks(newMarks);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const results = subjects.map(sub => ({
        subjectId: sub.id,
        obtainedMarks: parseFloat(marks[sub.id]?.obtained) || 0,
        totalMarks: parseFloat(marks[sub.id]?.total) || 100,
      }));
      await api.post('/results/bulk', { studentId: student.id, examId: parseInt(examId), results });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save results');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-medium text-gray-900">Edit Results — {student.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5">
          <div className="mb-4">
            <label className="label-base">Exam / Test</label>
            <select className="input-base" value={examId} onChange={e => handleExamChange(e.target.value)} required>
              {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-3 text-xs font-medium text-gray-500 px-1 mb-1">
              <span>Subject</span><span className="text-center">Obtained</span><span className="text-center">Total</span>
            </div>
            {subjects.map(sub => (
              <div key={sub.id} className="grid grid-cols-3 gap-3 items-center">
                <span className="text-sm text-gray-700">{sub.name}</span>
                <input
                  type="number" min="0" step="0.5"
                  className="input-base py-1.5 text-sm text-center"
                  placeholder="0"
                  value={marks[sub.id]?.obtained}
                  onChange={e => setMarks(p => ({ ...p, [sub.id]: { ...p[sub.id], obtained: e.target.value } }))}
                />
                <input
                  type="number" min="1" step="0.5"
                  className="input-base py-1.5 text-sm text-center"
                  value={marks[sub.id]?.total}
                  onChange={e => setMarks(p => ({ ...p, [sub.id]: { ...p[sub.id], total: e.target.value } }))}
                />
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mt-4">{error}</p>}
          <div className="flex gap-3 mt-6">
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? 'Saving...' : 'Save Results'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResultsTab({ classLevel }) {
  const { isAdmin } = useAuth();
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedExam, setSelectedExam] = useState('all');
  const [editStudent, setEditStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [studRes, subRes, examRes, resultRes] = await Promise.all([
        api.get(`/students?class=${classLevel}`),
        api.get('/results/subjects'),
        api.get('/exams'),
        api.get(`/results?class=${classLevel}`),
      ]);
      setStudents(studRes.data);
      setSubjects(subRes.data);
      setExams(examRes.data);
      setResults(resultRes.data);
      if (studRes.data.length > 0 && !selectedStudent) {
        setSelectedStudent(studRes.data[0]);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadData();
    setSelectedStudent(null);
    setSelectedExam('all');
  }, [classLevel]);

  // Filter results for selected student + optional exam
  const studentResults = selectedStudent
    ? results.filter(r =>
        r.studentId === selectedStudent.id &&
        (selectedExam === 'all' || r.examId === parseInt(selectedExam))
      )
    : [];

  // Group by exam
  const resultsByExam = studentResults.reduce((acc, r) => {
    const key = r.exam?.name || 'Unknown';
    if (!acc[key]) acc[key] = { examId: r.examId, rows: [] };
    acc[key].rows.push(r);
    return acc;
  }, {});

  const getGrade = (pct) => {
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B';
    if (pct >= 60) return 'C';
    if (pct >= 50) return 'D';
    return 'F';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Results</h2>
          <p className="text-xs text-gray-500 mt-0.5">Subject-wise marks — Class {classLevel}</p>
        </div>
      </div>

      {loading ? (
        <div className="card px-4 py-8 text-center text-sm text-gray-400">Loading...</div>
      ) : students.length === 0 ? (
        <div className="card px-4 py-8 text-center text-sm text-gray-500">No students in Class {classLevel}.</div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Student list */}
          <div className="card lg:w-48 flex-shrink-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Students</p>
            </div>
            <ul className="divide-y divide-gray-100">
              {students.map(s => (
                <li key={s.id}>
                  <button
                    onClick={() => setSelectedStudent(s)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      selectedStudent?.id === s.id ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {s.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Results panel */}
          <div className="flex-1 min-w-0">
            {selectedStudent && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">{selectedStudent.name}</h3>
                  <div className="flex items-center gap-2">
                    <select
                      className="input-base w-auto text-sm py-1.5"
                      value={selectedExam}
                      onChange={e => setSelectedExam(e.target.value)}
                    >
                      <option value="all">All Exams</option>
                      {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                    </select>
                    {isAdmin && (
                      <button
                        id={`edit-results-${selectedStudent.id}`}
                        onClick={() => setEditStudent(selectedStudent)}
                        className="btn-secondary btn-sm"
                      >
                        Edit Results
                      </button>
                    )}
                  </div>
                </div>

                {Object.keys(resultsByExam).length === 0 ? (
                  <div className="card px-4 py-8 text-center">
                    <p className="text-sm text-gray-400">No results entered yet.</p>
                    {isAdmin && (
                      <button onClick={() => setEditStudent(selectedStudent)} className="btn-primary btn-sm mt-3">
                        Add Results
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(resultsByExam).map(([examName, { rows }]) => {
                      const totalObtained = rows.reduce((s, r) => s + r.obtainedMarks, 0);
                      const totalMarks = rows.reduce((s, r) => s + r.totalMarks, 0);
                      const pct = totalMarks > 0 ? ((totalObtained / totalMarks) * 100).toFixed(1) : null;
                      return (
                        <div key={examName} className="card overflow-hidden">
                          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-700">{examName}</span>
                            {pct && (
                              <span className="text-xs text-gray-500">
                                {pct}% — {getGrade(parseFloat(pct))}
                              </span>
                            )}
                          </div>
                          <div className="overflow-x-auto scrollbar-thin">
                            <table className="table-base">
                              <thead>
                                <tr>
                                  <th>Subject</th>
                                  <th className="text-right">Obtained</th>
                                  <th className="text-right">Total</th>
                                  <th className="text-right">%</th>
                                </tr>
                              </thead>
                              <tbody>
                                {rows.map(r => (
                                  <tr key={r.id}>
                                    <td className="font-medium text-gray-800">{r.subject?.name}</td>
                                    <td className="text-right">{r.obtainedMarks}</td>
                                    <td className="text-right text-gray-500">{r.totalMarks}</td>
                                    <td className="text-right text-gray-500 text-xs">
                                      {r.totalMarks > 0 ? ((r.obtainedMarks / r.totalMarks) * 100).toFixed(1) + '%' : '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="bg-gray-50 font-semibold">
                                  <td className="px-4 py-2.5 text-xs">Total</td>
                                  <td className="px-4 py-2.5 text-xs text-right">{totalObtained}</td>
                                  <td className="px-4 py-2.5 text-xs text-right text-gray-500">{totalMarks}</td>
                                  <td className="px-4 py-2.5 text-xs text-right text-gray-700">{pct ? `${pct}%` : '-'}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {editStudent && (
        <ResultModal
          student={editStudent}
          subjects={subjects}
          exams={exams}
          existingResults={results.filter(r => r.studentId === editStudent.id)}
          onClose={() => setEditStudent(null)}
          onSaved={loadData}
        />
      )}
    </div>
  );
}
