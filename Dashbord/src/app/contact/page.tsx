'use client';

import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email && message) {
      setSubmitted(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-base-300">
      <Sidebar />

      <main className="flex-1 p-4 lg:p-8 overflow-y-auto max-h-screen w-full">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-base-content">Contact Us</h2>
            <p className="text-sm text-base-content/80">Connect with Aegis Eye support, security advisors, or system coordinators.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Direct contact form */}
          <div className="card bg-base-200 border border-base-100 shadow-xl lg:col-span-2">
            <div className="card-body p-6">
              <h3 className="card-title text-lg font-bold mb-4 text-base-content">Send a Message</h3>

              {submitted ? (
                <div className="text-center py-12 space-y-3">
                  <div className="alert alert-success rounded-xl justify-center font-medium max-w-sm mx-auto">
                    Message Dispatched!
                  </div>
                  <p className="text-sm text-base-content/80">
                    Thank you. We have received your query and will reply via email shortly.
                  </p>
                  <button 
                    onClick={() => { setSubmitted(false); setName(''); setEmail(''); setMessage(''); }} 
                    className="btn btn-neutral btn-sm rounded-lg"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control w-full">
                      <label className="label">
                        <span className="label-text font-semibold text-base-content/70">Full Name</span>
                      </label>
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe" 
                        className="input input-bordered w-full rounded-xl text-base-content"
                        required
                      />
                    </div>

                    <div className="form-control w-full">
                      <label className="label">
                        <span className="label-text font-semibold text-base-content/70">Email Address</span>
                      </label>
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com" 
                        className="input input-bordered w-full rounded-xl text-base-content"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold text-base-content/70">Message Content</span>
                    </label>
                    <textarea 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write your query here..." 
                      className="textarea textarea-bordered w-full h-32 rounded-xl text-base-content"
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary gap-2 rounded-xl mt-4">
                    <Send className="w-4 h-4" />
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Contact Details */}
          <div className="card bg-base-200 border border-base-100 shadow-xl lg:col-span-1">
            <div className="card-body p-6 space-y-6">
              <h3 className="card-title text-lg font-bold text-base-content">Contact Details</h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 text-primary p-2.5 rounded-xl shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Security Operations</h4>
                    <p className="text-xs text-base-content/80">ops@aegiseye.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 text-primary p-2.5 rounded-xl shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Emergency Desk</h4>
                    <p className="text-xs text-base-content/80">+1 (800) 555-EYES</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 text-primary p-2.5 rounded-xl shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Headquarters</h4>
                    <p className="text-xs text-base-content/80">
                      100 Surveillance Parkway<br />
                      Suite 400, Security Valley, CA
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
