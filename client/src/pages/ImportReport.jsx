import React, { useState, useEffect } from 'react';
import api from '../api';

export default function ImportReport() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/imports');
      setReports(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch import reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (id) => {
    if (!window.confirm('Are you sure you want to delete this upload report?')) return;
    try {
      await api.delete(`/imports/${id}`);
      fetchReports();
    } catch (err) {
      console.error(err);
      alert('Failed to delete report log');
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-up">
      {/* Review Table Container matching Stitch */}
      <section className="glass-card rounded-xl overflow-hidden shadow-md">
        <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between bg-[#f0ecf9]/30">
          <h3 className="font-bold text-sm text-on-surface">Review Processing Items (Upload Logs)</h3>
          <span className="text-[10px] font-mono font-bold bg-[#eae6f4] text-on-surface-variant px-2.5 py-1 rounded-md">
            {reports.length} Batches Loaded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-outline-variant/20 text-on-surface-variant font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Group Name</th>
                <th className="px-6 py-4">Source File</th>
                <th className="px-6 py-4 text-center">Transactions Loaded</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 pl-4">Upload Date</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 text-on-surface">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-primary/5 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-primary">
                    #TX-00{report.id}
                  </td>
                  <td className="px-6 py-4 font-bold">
                    {report.groupName}
                  </td>
                  <td className="px-6 py-4 font-mono text-on-surface-variant text-[11px]">
                    {report.fileName}
                  </td>
                  <td className="px-6 py-4 text-center font-mono font-bold">
                    {report.rowsImported} rows
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-secondary-container text-on-secondary-container">
                      <span className="w-1 h-1 rounded-full bg-secondary animate-ping"></span>
                      <span>{report.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-outline font-semibold">
                    {report.createdAt}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleDeleteReport(report.id)}
                      className="p-1 rounded text-outline hover:text-error hover:bg-error-container/40 transition-colors"
                      title="Delete upload report"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-on-surface-variant font-medium">
                    No import batches logged in the system.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 bg-surface-container-low/30 flex justify-between items-center text-xs text-on-surface-variant border-t border-outline-variant/20">
          <span>Showing {reports.length} batches</span>
          <div className="flex gap-1">
            <button className="p-1 rounded hover:bg-surface-container-high transition-colors" disabled>
              <span className="material-symbols-outlined text-sm font-semibold">chevron_left</span>
            </button>
            <button className="p-1 rounded hover:bg-surface-container-high transition-colors" disabled>
              <span className="material-symbols-outlined text-sm font-semibold">chevron_right</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
