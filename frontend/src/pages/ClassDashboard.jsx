import { useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import StudentsTab from '../components/StudentsTab';
import AttendanceTab from '../components/AttendanceTab';
import ResultsTab from '../components/ResultsTab';
import FeesTab from '../components/FeesTab';

const TABS = [
  { id: 'students', label: 'Students' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'results', label: 'Results' },
  { id: 'fees', label: 'Fees' },
];

export default function ClassDashboard() {
  const { classId } = useParams();
  const classLevel = parseInt(classId);
  const [activeTab, setActiveTab] = useState('students');

  return (
    <Layout>
      <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
            Class {classLevel}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Unique Science Academy
          </p>
        </div>

        {/* Tab navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex gap-0 overflow-x-auto scrollbar-thin">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                id={`tab-${tab.id}-class-${classLevel}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors duration-100 ${
                  activeTab === tab.id
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        {activeTab === 'students' && <StudentsTab classLevel={classLevel} />}
        {activeTab === 'attendance' && <AttendanceTab classLevel={classLevel} />}
        {activeTab === 'results' && <ResultsTab classLevel={classLevel} />}
        {activeTab === 'fees' && <FeesTab classLevel={classLevel} />}
      </div>
    </Layout>
  );
}
