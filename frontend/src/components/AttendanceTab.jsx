import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const TODAY = new Date().toISOString().split('T')[0];

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function AttendanceTab({ classLevel }) {
  const { isAdmin } = useAuth();
  const [students, setStudents] = useState([]);
  const [date, setDate] = useState(TODAY);
  const [attendance, setAttendance] = useState({}); // { studentId: 'PRESENT'|'ABSENT'|null }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const loadStudents = async () => {
    try {
      const res = await api.get(`/students?class=${classLevel}`);
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/attendance?class=${classLevel}&date=${date}`);
      const map = {};
      res.data.forEach((r) => {
        map[r.studentId] = r.status;
      });
      setAttendance(map);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [classLevel]);

  useEffect(() => {
    if (date) loadAttendance();
  }, [date, classLevel]);

  const setStatus = (studentId, status) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const saveAll = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const records = students.map((s) => ({
        studentId: s.id,
        date,
        status: attendance[s.id] || 'ABSENT',
      }));
      await api.post('/attendance/bulk', { records });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const presentCount = students.filter((s) => attendance[s.id] === 'PRESENT').length;
  const absentCount = students.filter((s) => attendance[s.id] === 'ABSENT').length;
  const unmarkedCount = students.filter((s) => !attendance[s.id]).length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Attendance</h2>
          <p className="text-xs text-gray-500 mt-0.5">Class {classLevel}</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="label-base mb-0 text-gray-500 text-xs whitespace-nowrap">Date:</label>
          <input
            type="date"
            id={`attendance-date-${classLevel}`}
            className="input-base w-auto text-sm"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      {/* Summary row */}
      {students.length > 0 && (
        <div className="flex gap-3 mb-4">
          <div className="card px-4 py-2.5 flex-1 text-center">
            <p className="text-xs text-gray-500 mb-0.5">Present</p>
            <p className="text-lg font-semibold text-green-600">{presentCount}</p>
          </div>
          <div className="card px-4 py-2.5 flex-1 text-center">
            <p className="text-xs text-gray-500 mb-0.5">Absent</p>
            <p className="text-lg font-semibold text-red-500">{absentCount}</p>
          </div>
          <div className="card px-4 py-2.5 flex-1 text-center">
            <p className="text-xs text-gray-500 mb-0.5">Unmarked</p>
            <p className="text-lg font-semibold text-gray-400">{unmarkedCount}</p>
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
                  <th>Status</th>
                  {isAdmin && <th className="text-right">Mark</th>}
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => {
                  const status = attendance[s.id];
                  return (
                    <tr key={s.id}>
                      <td className="text-gray-400 text-xs">{i + 1}</td>
                      <td className="font-medium text-gray-900">{s.name}</td>
                      <td>
                        {status === 'PRESENT' ? (
                          <span className="badge-green">Present</span>
                        ) : status === 'ABSENT' ? (
                          <span className="badge-red">Absent</span>
                        ) : (
                          <span className="badge-gray">Not marked</span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              id={`present-${s.id}-${date}`}
                              onClick={() => setStatus(s.id, 'PRESENT')}
                              className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                                status === 'PRESENT'
                                  ? 'bg-green-600 text-white border-green-600'
                                  : 'text-green-600 border-green-200 hover:bg-green-50'
                              }`}
                            >
                              Present
                            </button>
                            <button
                              id={`absent-${s.id}-${date}`}
                              onClick={() => setStatus(s.id, 'ABSENT')}
                              className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                                status === 'ABSENT'
                                  ? 'bg-red-500 text-white border-red-500'
                                  : 'text-red-500 border-red-200 hover:bg-red-50'
                              }`}
                            >
                              Absent
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

      {/* Save button for admin */}
      {isAdmin && students.length > 0 && (
        <div className="flex items-center justify-end gap-3 mt-4">
          {saved && (
            <span className="text-sm text-green-600">Attendance saved.</span>
          )}
          <button
            id={`save-attendance-${classLevel}`}
            onClick={saveAll}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      )}
    </div>
  );
}
