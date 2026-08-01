'use client';

import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { AlertTriangle, Send } from 'lucide-react';

export default function ComplainPage() {
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintBody, setComplaintBody] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (complaintTitle && complaintBody) {
      setSubmitted(true);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-base-300">
      <Sidebar />

      <main className="flex-1 p-4 lg:p-8 overflow-y-auto max-h-screen w-full">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-base-content">Complain Department</h2>
            <p className="text-sm text-base-content/80">Log security failures, unauthorized access audits, or hardware errors.</p>
          </div>
        </div>

        <div className="card bg-base-200 border border-base-100 shadow-xl max-w-2xl">
          <div className="card-body p-6">
            <h3 className="card-title text-lg font-bold mb-4 flex items-center gap-2 text-warning text-base-content">
              <AlertTriangle className="w-5 h-5" />
              File Security Complain
            </h3>

            {submitted ? (
              <div className="text-center py-12 space-y-3">
                <div className="alert alert-success rounded-xl justify-center font-medium max-w-md mx-auto">
                  Complain Lodged Successfully
                </div>
                <p className="text-sm text-base-content/80 max-w-sm mx-auto leading-relaxed">
                  Your formal complaint has been filed in the secure ledger. Our compliance and operations leads will audit logs within 12 hours.
                </p>
                <button 
                  onClick={() => { setSubmitted(false); setComplaintTitle(''); setComplaintBody(''); }} 
                  className="btn btn-neutral btn-sm rounded-lg"
                >
                  File Another Complain
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-semibold text-base-content/70">Complain Heading / Title</span>
                  </label>
                  <input 
                    type="text" 
                    value={complaintTitle}
                    onChange={(e) => setComplaintTitle(e.target.value)}
                    placeholder="e.g. Unflagged intruder entrance at East Fence" 
                    className="input input-bordered w-full rounded-xl text-base-content"
                    required
                  />
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-semibold text-base-content/70">Severity Level</span>
                  </label>
                  <select 
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="select select-bordered w-full rounded-xl font-medium text-base-content"
                  >
                    <option value="low">Low (Hardware Glitch)</option>
                    <option value="medium">Medium (AI False Alarm)</option>
                    <option value="high">High (Undetected Threat Event)</option>
                  </select>
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-semibold text-base-content/70">Explain the Situation</span>
                  </label>
                  <textarea 
                    value={complaintBody}
                    onChange={(e) => setComplaintBody(e.target.value)}
                    placeholder="Provide timestamps, affected camera nodes, and specific details..." 
                    className="textarea textarea-bordered w-full h-32 rounded-xl text-base-content"
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary gap-2 rounded-xl mt-4">
                  <Send className="w-4 h-4" />
                  Submit Formal Complain
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
