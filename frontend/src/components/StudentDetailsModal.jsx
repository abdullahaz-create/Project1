import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function SectionTitle({ children }) {
  return <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-5 first:mt-0">{children}</h4>;
}

export default function StudentDetailsModal({ student, onClose }) {
  const { isAdmin } = useAuth();
  const [fees, setFees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    Promise.all([
      api.get(`/fees?studentId=${student.id}`),
      api.get(`/attendance?studentId=${student.id}`),
      api.get(`/results?studentId=${student.id}`),
    ]).then(([f, a, r]) => {
      setFees(f.data);
      setAttendance(a.data);
      setResults(r.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [student.id]);

  // Group results by exam
  const resultsByExam = results.reduce((acc, r) => {
    const examName = r.exam?.name || 'Unknown';
    if (!acc[examName]) acc[examName] = [];
    acc[examName].push(r);
    return acc;
  }, {});

  const tabs = [
    { id: 'info', label: 'Info' },
    { id: 'fees', label: `Fees (${fees.length})` },
    { id: 'attendance', label: `Attendance (${attendance.length})` },
    { id: 'results', label: `Results (${results.length})` },
  ];

  return (
    <div className="modal-backdrop">
      <div className="modal-box" style={{ maxWidth: '560px', maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-semibold text-gray-900">{student.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">Class {student.classLevel}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-100 px-6">
          <nav className="flex gap-0 -mb-px">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-2.5 text-xs font-medium border-b-2 transition-colors mr-1 ${
                  activeTab === t.id
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="px-6 py-5 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-8">Loading...</p>
          ) : (
            <>
              {/* Info Tab */}
              {activeTab === 'info' && (
                <div className="space-y-3">
                  {[
                    { label: 'Name', value: student.name },
                    { label: 'Class', value: `Class ${student.classLevel}` },
                    { label: 'Registration Date', value: formatDate(student.registrationDate) },
                    { label: 'Remarks', value: student.remarks || '-' },
                  ].map(row => (
                    <div key={row.label} className="flex items-start gap-4 py-2 border-b border-gray-50 last:border-0">
                      <span className="text-xs font-medium text-gray-500 w-36 flex-shrink-0">{row.label}</span>
                      <span className="text-sm text-gray-800">{row.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Fees Tab */}
              {activeTab === 'fees' && (
                fees.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No fee records yet.</p>
                ) : (
                  <div className="overflow-x-auto scrollbar-thin">
                    <table className="table-base">
                      <thead>
                        <tr>
                          <th>Month</th>
                          <th>Year</th>
                          <th className="text-right">Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fees.map(f => (
                          <tr key={f.id}>
                            <td>{MONTHS[f.month - 1]}</td>
                            <td>{f.year}</td>
                            <td className="text-right">{f.amount > 0 ? `PKR ${f.amount.toLocaleString()}` : '-'}</td>
                            <td>
                              {f.isPaid
                                ? <span className="badge-green">Paid</span>
                                : <span className="badge-red">Unpaid</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}

              {/* Attendance Tab */}
              {activeTab === 'attendance' && (
                attendance.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No attendance records yet.</p>
                ) : (
                  <div className="overflow-x-auto scrollbar-thin">
                    <table className="table-base">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...attendance].sort((a,b) => new Date(b.date) - new Date(a.date)).map(a => (
                          <tr key={a.id}>
                            <td>{formatDate(a.date)}</td>
                            <td>
                              {a.status === 'PRESENT'
                                ? <span className="badge-green">Present</span>
                                : <span className="badge-red">Absent</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}

              {/* Results Tab */}
              {activeTab === 'results' && (
                Object.keys(resultsByExam).length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No results entered yet.</p>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(resultsByExam).map(([examName, examResults]) => {
                      const totalObtained = examResults.reduce((s, r) => s + r.obtainedMarks, 0);
                      const totalMarks = examResults.reduce((s, r) => s + r.totalMarks, 0);
                      const pct = totalMarks > 0 ? ((totalObtained / totalMarks) * 100).toFixed(1) : null;
                      return (
                        <div key={examName}>
                          <p className="text-xs font-semibold text-gray-700 mb-2">{examName}</p>
                          <div className="overflow-x-auto scrollbar-thin card">
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
                                {examResults.map(r => (
                                  <tr key={r.id}>
                                    <td>{r.subject?.name}</td>
                                    <td className="text-right">{r.obtainedMarks}</td>
                                    <td className="text-right text-gray-500">{r.totalMarks}</td>
                                    <td className="text-right text-gray-500 text-xs">
                                      {r.totalMarks > 0 ? ((r.obtainedMarks / r.totalMarks) * 100).toFixed(1) + '%' : '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              {pct !== null && (
                                <tfoot>
                                  <tr className="bg-gray-50 font-semibold">
                                    <td className="px-4 py-2.5 text-xs">Total</td>
                                    <td className="px-4 py-2.5 text-xs text-right">{totalObtained}</td>
                                    <td className="px-4 py-2.5 text-xs text-right text-gray-500">{totalMarks}</td>
                                    <td className="px-4 py-2.5 text-xs text-right text-gray-700">{pct}%</td>
                                  </tr>
                                </tfoot>
                              )}
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
