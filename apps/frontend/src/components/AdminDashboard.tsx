import React, { useState } from 'react';
import { ShieldAlert, Check, Trash2 } from 'lucide-react';
import { Report } from '../types';

interface AdminDashboardProps {
  reports: Report[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ reports }) => {
  const [localReports, setLocalReports] = useState(reports);

  const handleAction = (id: string, action: 'Resolved' | 'Dismissed') => {
    setLocalReports(localReports.map(r => r.id === id ? { ...r, status: action } : r));
  };

  const getStatusClasses = (status: string) => {
    if (status === 'Pending') return 'bg-yellow-100 text-yellow-800';
    if (status === 'Resolved') return 'bg-green-100 text-green-800';
    return 'bg-gray-200 text-gray-800';
  };

  return (
    <div className="min-h-screen pt-32 bg-gray-100 p-4 sm:p-6 md:p-8">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-black">Super Admin Console</h1>
        <p className="text-sm sm:text-base text-gray-900">Global Oversight & Moderation</p>
      </header>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center">
          <ShieldAlert className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
          <h2 className="text-lg sm:text-xl font-bold text-black">Reported Contact Cards</h2>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-900 text-sm uppercase font-bold">
              <tr>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {localReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold text-gray-900">{report.vendorName}</td>
                  <td className="px-6 py-4">
                    <span className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs font-bold uppercase">{report.reason}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusClasses(report.status)}`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {report.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => handleAction(report.id, 'Resolved')}
                          className="p-2 bg-green-500 text-white rounded hover:bg-green-600" title="Approve/Keep"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleAction(report.id, 'Dismissed')}
                          className="p-2 bg-red-500 text-white rounded hover:bg-red-600" title="Delete/Ban"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-100">
          {localReports.map((report) => (
            <div key={report.id} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-black">{report.vendorName}</h3>
                  <span className="inline-block mt-1 bg-red-50 text-red-700 px-2 py-0.5 rounded text-xs font-bold uppercase">
                    {report.reason}
                  </span>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusClasses(report.status)}`}>
                  {report.status}
                </span>
              </div>

              {report.status === 'Pending' && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleAction(report.id, 'Resolved')}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 active:bg-green-700 transition-colors text-sm font-medium"
                  >
                    <Check className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(report.id, 'Dismissed')}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 active:bg-red-700 transition-colors text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {localReports.length === 0 && (
          <div className="p-6 sm:p-8 text-center text-gray-600">All clean. No reports.</div>
        )}
      </div>
    </div>
  );
};