import { useState, useEffect } from 'react';
import api from '../api/client';
import Layout from '../components/Layout';

const CLASS_LABELS = { 9: 'Class 9', 10: 'Class 10', 11: 'Class 11', 12: 'Class 12' };
const SUBJECT_COLORS = {
  Math:      { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200'   },
  Physics:   { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  Urdu:      { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200'  },
  Computer:  { bg: 'bg-cyan-50',   text: 'text-cyan-700',   border: 'border-cyan-200'   },
  Chemistry: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  Bio:       { bg: 'bg-emerald-50',text: 'text-emerald-700',border: 'border-emerald-200'},
  ISL:       { bg: 'bg-rose-50',   text: 'text-rose-700',   border: 'border-rose-200'   },
};

function StatCard({ label, value, sub }) {
  return (
    <div className="card px-5 py-4 flex flex-col gap-1">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function SubjectBar({ name, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const color = SUBJECT_COLORS[name] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
  return (
    <div className="flex items-center gap-3">
      <span className={`w-20 text-xs font-medium ${color.text} flex-shrink-0`}>{name}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${color.bg.replace('bg-', 'bg-').replace('-50', '-400')}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-600 w-8 text-right font-medium">{count}</span>
    </div>
  );
}

export default function StatsDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/stats')
      .then(res => { setStats(res.data); setLoading(false); })
      .catch(err => { setError(err.response?.data?.error || 'Failed to load stats'); setLoading(false); });
  }, []);

  return (
    <Layout>
      <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Academy Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Overview — all classes &amp; subjects</p>
        </div>

        {loading ? (
          <div className="card px-4 py-10 text-center text-sm text-gray-400">Loading stats...</div>
        ) : error ? (
          <div className="card px-4 py-8 text-center text-sm text-red-500">{error}</div>
        ) : stats ? (
          <>
            {/* Overall summary row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <StatCard label="Total Students" value={stats.overall.totalStudents} sub="All classes" />
              {[9, 10, 11, 12].map(cl => (
                <StatCard
                  key={cl}
                  label={`Class ${cl}`}
                  value={stats.classSummary[cl]?.totalStudents ?? 0}
                  sub="students"
                />
              ))}
            </div>

            {/* Overall subject breakdown */}
            <div className="card px-5 py-4 mb-6">
              <h2 className="text-sm font-semibold text-gray-800 mb-4">Overall — Students per Subject</h2>
              <div className="space-y-3">
                {stats.allSubjects.map(sub => (
                  <SubjectBar
                    key={sub}
                    name={sub}
                    count={stats.overall.subjects[sub] ?? 0}
                    total={stats.overall.totalStudents}
                  />
                ))}
              </div>
            </div>

            {/* Per-class breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[9, 10, 11, 12].map(cl => {
                const cls = stats.classSummary[cl];
                if (!cls) return null;
                return (
                  <div key={cl} className="card px-5 py-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-semibold text-gray-800">Class {cl}</h2>
                      <span className="text-xs bg-gray-900 text-white px-2 py-0.5 rounded-full">
                        {cls.totalStudents} student{cls.totalStudents !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {stats.allSubjects.map(sub => (
                        <SubjectBar
                          key={sub}
                          name={sub}
                          count={cls.subjects[sub] ?? 0}
                          total={cls.totalStudents}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : null}
      </div>
    </Layout>
  );
}
