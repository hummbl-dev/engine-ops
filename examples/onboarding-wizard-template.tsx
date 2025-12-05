import React, { useState } from 'react';

const steps = [
  'Check OS & Hardware',
  'Validate Dependencies',
  'Clone Repository',
  'Install Dependencies',
  'Run Tests',
  'Configure Cloud Credentials',
  'Finish & Dashboard',
];

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [status, setStatus] = useState<string[]>(Array(steps.length).fill('pending'));

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  return (
    <div className="wizard-container">
      <h2>Engine-Ops Onboarding Wizard</h2>
      <ol>
        {steps.map((step, idx) => (
          <li key={step} className={idx === currentStep ? 'active' : ''}>
            {step} <span>({status[idx]})</span>
          </li>
        ))}
      </ol>
      <button onClick={handleNext} disabled={currentStep >= steps.length - 1}>
        Next
      </button>
      {currentStep === steps.length - 1 && <div>Onboarding Complete! Go to Dashboard.</div>}
    </div>
  );
}
