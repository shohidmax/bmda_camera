'use client';

import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { LifeBuoy, Send, MessageSquare } from 'lucide-react';

export default function SupportPage() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subject && message) {
      setSubmitted(true);
    }
  };

  const faqs = [
    { q: 'How do I add a new camera?', a: 'Go to the "Devices & Control" tab and click the "Pair Device Node" button. Fill in the hardware MAC address of your ESP32 device and camera source URL.' },
    { q: 'What is the GPIO Pin trigger logic?', a: 'The ESP32 is programmed to monitor D4 (GPIO 4). When it transitions to HIGH (3.3V), it generates a secure alert packet sending timestamps, MAC ID, action type, and zone codes.' },
    { q: 'How does the AI Threat Scoring work?', a: 'Our server runs captured camera frames through Gemini AI to describe the activity. If suspicious intruder activity is detected, a score between 10-100 is generated. Scores over 80% activate external sirens and webhook alarms.' }
  ];

  return (
    <div className="flex min-h-screen bg-base-300">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Support Desk</h2>
            <p className="text-sm text-base-content/60">Resolve operational problems or open support requests with the tech team.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Support Ticket Form */}
          <div className="card bg-base-200 border border-base-100 shadow-xl lg:col-span-2">
            <div className="card-body p-6">
              <h3 className="card-title text-lg font-bold mb-4">Open Support Ticket</h3>

              {submitted ? (
                <div className="text-center py-12 space-y-3">
                  <div className="alert alert-success rounded-xl justify-center font-medium max-w-sm mx-auto">
                    Ticket Submitted Successfully!
                  </div>
                  <p className="text-sm text-base-content/60">
                    A technical specialist will review your request and follow up within 24 hours.
                  </p>
                  <button 
                    onClick={() => { setSubmitted(false); setSubject(''); setMessage(''); }} 
                    className="btn btn-neutral btn-sm rounded-lg"
                  >
                    Submit Another Ticket
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold text-base-content/70">Subject / Category</span>
                    </label>
                    <input 
                      type="text" 
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. ESP32 failing to connect to NTP server" 
                      className="input input-bordered w-full rounded-xl"
                      required
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold text-base-content/70">Detailed Description</span>
                    </label>
                    <textarea 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe the issue in detail..." 
                      className="textarea textarea-bordered w-full h-32 rounded-xl"
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary gap-2 rounded-xl mt-4">
                    <Send className="w-4 h-4" />
                    Dispatch Ticket
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Quick FAQ */}
          <div className="card bg-base-200 border border-base-100 shadow-xl lg:col-span-1">
            <div className="card-body p-6">
              <h3 className="card-title text-lg font-bold mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Frequently Asked
              </h3>

              <div className="space-y-4">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="space-y-1 border-b border-base-100 pb-3 last:border-b-0">
                    <h4 className="font-bold text-sm text-base-content">{faq.q}</h4>
                    <p className="text-xs text-base-content/60 leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
