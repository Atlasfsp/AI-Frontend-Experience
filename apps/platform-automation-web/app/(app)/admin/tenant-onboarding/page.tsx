'use client';

import React, { useState } from 'react';

type OnboardingStep = 'org-details' | 'workspace-config' | 'user-setup' | 'policy-selection' | 'review';

const STEPS: { key: OnboardingStep; title: string; description: string }[] = [
  { key: 'org-details', title: 'Organization Details', description: 'Enter your organization name, region, and tier.' },
  { key: 'workspace-config', title: 'Workspace Configuration', description: 'Configure your initial workspace, quotas, and resource limits.' },
  { key: 'user-setup', title: 'User Setup', description: 'Invite initial users and assign roles.' },
  { key: 'policy-selection', title: 'Policy Selection', description: 'Choose governance and compliance policies.' },
  { key: 'review', title: 'Review & Provision', description: 'Review settings and trigger workspace provisioning.' },
];

export default function TenantOnboardingPage() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('org-details');
  const [formData, setFormData] = useState({
    orgName: '', region: 'ng', tier: 'standard',
    workspaceName: '', quotaCpu: '4', quotaMemory: '8Gi', quotaStorage: '100Gi',
    users: [{ email: '', role: 'MEMBER' }],
    policies: { requireApproval: true, enforceCompliance: true, enableAudit: true },
  });

  const currentIndex = STEPS.findIndex(s => s.key === currentStep);

  // Render stepper + form fields for current step
  // Each step has specific form fields
  // Final step shows review summary and "Provision Workspace" button

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="mb-2 text-2xl font-bold text-white">Tenant Onboarding</h1>
      <p className="mb-8 text-sm text-slate-400">Set up a new tenant workspace on the BAC platform.</p>

      {/* Stepper */}
      <div className="mb-8 flex items-center gap-2">
        {STEPS.map((step, i) => (
          <React.Fragment key={step.key}>
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
              i <= currentIndex ? 'bg-cyan-500 text-white' : 'bg-white/10 text-slate-500'
            }`}>
              {i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 ${i < currentIndex ? 'bg-cyan-500' : 'bg-white/10'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step content */}
      <div className="rounded-xl border border-white/10 bg-[#0d1f3c] p-6">
        <h2 className="mb-1 text-lg font-semibold text-white">{STEPS[currentIndex].title}</h2>
        <p className="mb-6 text-sm text-slate-400">{STEPS[currentIndex].description}</p>

        {currentStep === 'org-details' && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Organization Name</label>
              <input type="text" value={formData.orgName} onChange={e => setFormData(d => ({ ...d, orgName: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                placeholder="Acme Corp" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Region</label>
              <select value={formData.region} onChange={e => setFormData(d => ({ ...d, region: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                <option value="ng">Nigeria</option>
                <option value="za">South Africa</option>
                <option value="eu">Europe</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Tier</label>
              <select value={formData.tier} onChange={e => setFormData(d => ({ ...d, tier: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                <option value="standard">Standard</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
        )}

        {currentStep === 'workspace-config' && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Workspace Name</label>
              <input type="text" value={formData.workspaceName} onChange={e => setFormData(d => ({ ...d, workspaceName: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" placeholder="production" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">CPU Quota</label>
                <input type="text" value={formData.quotaCpu} onChange={e => setFormData(d => ({ ...d, quotaCpu: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">Memory Quota</label>
                <input type="text" value={formData.quotaMemory} onChange={e => setFormData(d => ({ ...d, quotaMemory: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">Storage Quota</label>
                <input type="text" value={formData.quotaStorage} onChange={e => setFormData(d => ({ ...d, quotaStorage: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
              </div>
            </div>
          </div>
        )}

        {currentStep === 'user-setup' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">Add initial users to this tenant.</p>
            {formData.users.map((user, i) => (
              <div key={i} className="flex gap-3">
                <input type="email" value={user.email} onChange={e => {
                  const users = [...formData.users];
                  users[i] = { ...users[i], email: e.target.value };
                  setFormData(d => ({ ...d, users }));
                }}
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" placeholder="user@example.com" />
                <select value={user.role} onChange={e => {
                  const users = [...formData.users];
                  users[i] = { ...users[i], role: e.target.value };
                  setFormData(d => ({ ...d, users }));
                }}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                  <option value="VIEWER">Viewer</option>
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                  <option value="OPERATOR">Operator</option>
                </select>
              </div>
            ))}
            <button onClick={() => setFormData(d => ({ ...d, users: [...d.users, { email: '', role: 'MEMBER' }] }))}
              className="text-xs text-cyan-400 hover:text-cyan-300">+ Add user</button>
          </div>
        )}

        {currentStep === 'policy-selection' && (
          <div className="space-y-4">
            {Object.entries(formData.policies).map(([key, value]) => (
              <label key={key} className="flex items-center gap-3">
                <input type="checkbox" checked={value} onChange={e => setFormData(d => ({
                  ...d, policies: { ...d.policies, [key]: e.target.checked }
                }))} className="rounded border-white/20 bg-white/5" />
                <span className="text-sm text-slate-300">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
              </label>
            ))}
          </div>
        )}

        {currentStep === 'review' && (
          <div className="space-y-3 text-sm text-slate-300">
            <p><strong className="text-white">Organization:</strong> {formData.orgName} ({formData.region}, {formData.tier})</p>
            <p><strong className="text-white">Workspace:</strong> {formData.workspaceName}</p>
            <p><strong className="text-white">Quotas:</strong> {formData.quotaCpu} CPU, {formData.quotaMemory} memory, {formData.quotaStorage} storage</p>
            <p><strong className="text-white">Users:</strong> {formData.users.filter(u => u.email).length} user(s)</p>
            <p><strong className="text-white">Policies:</strong> {Object.entries(formData.policies).filter(([,v]) => v).map(([k]) => k).join(', ')}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <button onClick={() => setCurrentStep(STEPS[currentIndex - 1]?.key)} disabled={currentIndex === 0}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-30">
            Back
          </button>
          {currentStep === 'review' ? (
            <button className="rounded-lg bg-cyan-500 px-6 py-2 text-sm font-medium text-white hover:bg-cyan-400">
              Provision Workspace
            </button>
          ) : (
            <button onClick={() => setCurrentStep(STEPS[currentIndex + 1]?.key)}
              className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20">
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
