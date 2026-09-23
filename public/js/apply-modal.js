/**
 * NG Global Manpower Services - Interactive 5-Step Job Application Modal
 * Connects candidates directly to WhatsApp with automated candidate pitch message.
 */

(function () {
  'use strict';

  let currentJob = {
    code: '',
    title: '',
    country: '',
    salary: '',
    category: ''
  };

  let currentStep = 1;
  const totalSteps = 6;

  const candidateData = {
    name: '',
    phone: '',
    experience: '3 to 5 Years',
    passport: 'Yes, Ready with Passport',
    location: '',
    expectedSalary: ''
  };

  window.openApplyModal = function (code, title, country, salary, category) {
    currentJob = {
      code: code || 'NG-VACANCY',
      title: title || 'Overseas Role',
      country: country || 'International',
      salary: salary || 'Offered Package',
      category: category || 'General Trade'
    };

    candidateData.expectedSalary = currentJob.salary;

    // Set modal header text
    const titleEl = document.getElementById('modal-job-title');
    const countryEl = document.getElementById('modal-job-country');
    const codeEl = document.getElementById('modal-job-code');
    const expSalaryInput = document.getElementById('step-expected-salary');

    if (titleEl) titleEl.textContent = currentJob.title;
    if (countryEl) countryEl.textContent = currentJob.country;
    if (codeEl) codeEl.textContent = currentJob.code;
    if (expSalaryInput) expSalaryInput.value = currentJob.salary;

    currentStep = 1;
    updateStepVisibility();

    const modal = document.getElementById('job-apply-modal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      // Auto-focus input
      setTimeout(() => {
        const nameInput = document.getElementById('step-name');
        if (nameInput) nameInput.focus();
      }, 150);
    }
  };

  window.closeApplyModal = function () {
    const modal = document.getElementById('job-apply-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  window.nextApplyStep = function () {
    if (currentStep === 1) {
      const nameInput = document.getElementById('step-name');
      const val = nameInput ? nameInput.value.trim() : '';
      if (!val || val.length < 2) {
        showStepError('step-1', 'Please enter your full legal name as in Passport.');
        return;
      }
      candidateData.name = val;
      clearStepError('step-1');
    } else if (currentStep === 2) {
      const phoneInput = document.getElementById('step-phone');
      const val = phoneInput ? phoneInput.value.trim() : '';
      const digitsOnly = val.replace(/\D/g, '');
      if (!val || digitsOnly.length < 8 || digitsOnly.length > 15) {
        showStepError('step-2', 'Please enter a valid mobile / WhatsApp number (at least 8 to 12 digits).');
        return;
      }
      candidateData.phone = val;
      clearStepError('step-2');
    } else if (currentStep === 3) {
      const expSelected = document.querySelector('input[name="apply-experience"]:checked');
      candidateData.experience = expSelected ? expSelected.value : '3 to 5 Years';
    } else if (currentStep === 4) {
      const passSelected = document.querySelector('input[name="apply-passport"]:checked');
      candidateData.passport = passSelected ? passSelected.value : 'Yes, Ready with Passport';
    } else if (currentStep === 5) {
      const locInput = document.getElementById('step-location');
      const val = locInput ? locInput.value.trim() : '';
      if (!val || val.length < 2) {
        showStepError('step-5', 'Please enter your current city & state.');
        return;
      }
      candidateData.location = val;
      clearStepError('step-5');
    } else if (currentStep === 6) {
      const salInput = document.getElementById('step-expected-salary');
      candidateData.expectedSalary = salInput && salInput.value.trim() ? salInput.value.trim() : currentJob.salary;
      submitAndOpenWhatsApp();
      return;
    }

    if (currentStep < totalSteps) {
      currentStep++;
      updateStepVisibility();
    }
  };

  window.prevApplyStep = function () {
    if (currentStep > 1) {
      currentStep--;
      updateStepVisibility();
    }
  };

  function updateStepVisibility() {
    // Update step indicator pills
    const stepIndicators = document.querySelectorAll('.modal-step-dot');
    stepIndicators.forEach((dot, index) => {
      const stepNum = index + 1;
      if (stepNum === currentStep) {
        dot.className = 'modal-step-dot active';
      } else if (stepNum < currentStep) {
        dot.className = 'modal-step-dot completed';
      } else {
        dot.className = 'modal-step-dot';
      }
    });

    const stepCounter = document.getElementById('modal-step-counter');
    if (stepCounter) {
      stepCounter.textContent = `Step ${currentStep} of ${totalSteps}`;
    }

    // Toggle step containers
    for (let i = 1; i <= totalSteps; i++) {
      const stepEl = document.getElementById(`modal-step-${i}`);
      if (stepEl) {
        if (i === currentStep) {
          stepEl.style.display = 'block';
        } else {
          stepEl.style.display = 'none';
        }
      }
    }

    // Update buttons
    const prevBtn = document.getElementById('modal-prev-btn');
    const nextBtn = document.getElementById('modal-next-btn');

    if (prevBtn) {
      prevBtn.style.visibility = currentStep === 1 ? 'hidden' : 'visible';
    }

    if (nextBtn) {
      if (currentStep === totalSteps) {
        nextBtn.innerHTML = '<span>Apply on WhatsApp</span> <i class="fa-brands fa-whatsapp"></i>';
        nextBtn.className = 'btn btn-gold btn-whatsapp-finish';
      } else {
        nextBtn.innerHTML = '<span>Continue</span> <i class="fa-solid fa-arrow-right"></i>';
        nextBtn.className = 'btn btn-gold';
      }
    }

    // Auto focus appropriate inputs
    if (currentStep === 1) {
      setTimeout(() => { const el = document.getElementById('step-name'); if (el) el.focus(); }, 100);
    } else if (currentStep === 2) {
      setTimeout(() => { const el = document.getElementById('step-phone'); if (el) el.focus(); }, 100);
    } else if (currentStep === 5) {
      setTimeout(() => { const loc = document.getElementById('step-location'); if (loc) loc.focus(); }, 100);
    } else if (currentStep === 6) {
      setTimeout(() => { const sal = document.getElementById('step-expected-salary'); if (sal) sal.focus(); }, 100);
    }
  }

  function showStepError(stepId, msg) {
    const errorEl = document.getElementById(`${stepId}-error`);
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.style.display = 'block';
    }
  }

  function clearStepError(stepId) {
    const errorEl = document.getElementById(`${stepId}-error`);
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.style.display = 'none';
    }
  }

  async function submitAndOpenWhatsApp() {
    // 1. Generate the exact formatted message requested by the user:
    const message = 
      `Hello NG Global Overseas Recruitment Team,\n\n` +
      `I am applying for the verified opening: *${currentJob.title}*\n` +
      `📌 *Country / Quota:* ${currentJob.country}\n` +
      `🆔 *Job Code:* ${currentJob.code}\n\n` +
      `👤 *Full Name:* ${candidateData.name}\n` +
      `📞 *WhatsApp / Phone:* ${candidateData.phone}\n` +
      `🛠️ *Trade Experience:* ${candidateData.experience}\n` +
      `🛂 *Passport Status:* ${candidateData.passport}\n` +
      `📍 *Location:* ${candidateData.location}\n` +
      `💰 *Offered/Expected Salary:* ${candidateData.expectedSalary}\n\n` +
      `My documents are ready. Please guide me with the interview process and visa documentation.`;

    // 2. Asynchronously record the lead into the database for the recruiter CRM
    try {
      fetch('/api/v1/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: candidateData.name,
          phone: candidateData.phone,
          trade: currentJob.category || currentJob.title,
          destination: currentJob.country,
          experience: candidateData.experience,
          city: candidateData.location,
          job_code: currentJob.code,
          source: 'apply_modal',
          notes: `Passport: ${candidateData.passport} | Expected: ${candidateData.expectedSalary}`
        })
      }).catch(err => console.warn('[Apply Modal] Background lead sync note:', err));
    } catch (e) {
      // Non-blocking
    }

    // 3. Launch WhatsApp directly to recruiter
    const recruiterNumber = window.NG_SETTINGS?.whatsappNumber || '918080025670';
    const whatsappUrl = `https://wa.me/${recruiterNumber}?text=${encodeURIComponent(message)}`;

    // Close modal
    closeApplyModal();

    // Trigger fireworks/confetti if available
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 }
      });
    }

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
  }

  // Keyboard accessibility
  document.addEventListener('keydown', function (e) {
    const modal = document.getElementById('job-apply-modal');
    if (modal && modal.classList.contains('active')) {
      if (e.key === 'Escape') {
        closeApplyModal();
      } else if (e.key === 'Enter') {
        const target = e.target;
        if (target && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          nextApplyStep();
        }
      }
    }
  });

  // Attach global aliases for job apply buttons
  window.triggerJobApply = function (btn) {
    if (!btn) return;
    const code = btn.getAttribute('data-job-code') || '';
    const title = btn.getAttribute('data-job-title') || '';
    const country = btn.getAttribute('data-job-country') || '';
    const salary = btn.getAttribute('data-job-salary') || '';
    const category = btn.getAttribute('data-job-category') || '';
    openApplyModal(code, title, country, salary, category);
  };

  window.applyForJob = function (code, title, country, salary, category) {
    openApplyModal(code, title, country, salary, category);
  };

  // Delegated click listener for all job apply buttons across the page
  document.addEventListener('DOMContentLoaded', function () {
    document.addEventListener('click', function (e) {
      const applyBtn = e.target.closest('.job-card-apply-btn');
      if (applyBtn) {
        e.preventDefault();
        triggerJobApply(applyBtn);
      }
    });
  });

})();
