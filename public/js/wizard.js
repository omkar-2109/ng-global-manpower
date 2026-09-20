/**
 * NG Global Manpower Services
 * Candidate Eligibility Wizard & Lead Capture Engine
 */
(function() {
  'use strict';

  let currentStep = 1;
  let selectedTradeValue = 'Construction & Infrastructure';
  let selectedDestValue = 'Gulf Countries (UAE, Saudi, Qatar)';

  // Trade card selector
  window.selectTrade = function(element, tradeName) {
    document.querySelectorAll('.trade-card-btn').forEach(btn => btn.classList.remove('selected'));
    element.classList.add('selected');
    selectedTradeValue = tradeName;
  };

  // Destination card selector
  window.selectDest = function(element, destName) {
    document.querySelectorAll('.dest-card-btn').forEach(btn => btn.classList.remove('selected'));
    element.classList.add('selected');
    selectedDestValue = destName;
  };

  // Prefill destination from cards across homepage
  window.prefillDestination = function(destName) {
    selectedDestValue = destName;
    document.querySelectorAll('.dest-card-btn').forEach(btn => {
      const heading = btn.querySelector('h4');
      if (heading && heading.textContent.toLowerCase().includes(destName.split(' ')[0].toLowerCase())) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
    });

    const funnel = document.getElementById('lead-funnel');
    if (funnel) {
      funnel.scrollIntoView({ behavior: 'smooth' });
      window.goToStep(2);
    }
  };

  // Step navigation
  window.goToStep = function(stepNumber) {
    currentStep = stepNumber;

    const p1 = document.getElementById('panelStep1');
    const p2 = document.getElementById('panelStep2');
    const p3 = document.getElementById('panelStep3');

    if (p1) p1.classList.remove('active');
    if (p2) p2.classList.remove('active');
    if (p3) p3.classList.remove('active');

    const fill = document.getElementById('wizardFill');
    const b1 = document.getElementById('stepBubble1');
    const b2 = document.getElementById('stepBubble2');
    const b3 = document.getElementById('stepBubble3');

    [b1, b2, b3].forEach(b => {
      if (b) {
        b.classList.remove('active');
        b.classList.remove('completed');
      }
    });

    if (stepNumber === 1 && p1) {
      p1.classList.add('active');
      if (fill) fill.style.width = '0%';
      if (b1) b1.classList.add('active');
    } else if (stepNumber === 2 && p2) {
      p2.classList.add('active');
      if (fill) fill.style.width = '50%';
      if (b1) b1.classList.add('completed');
      if (b2) b2.classList.add('active');
    } else if (stepNumber === 3 && p3) {
      p3.classList.add('active');
      if (fill) fill.style.width = '100%';
      if (b1) b1.classList.add('completed');
      if (b2) b2.classList.add('completed');
      if (b3) b3.classList.add('active');
    }
  };

  // Handle Form Submission: Persist to Server then Handoff to WhatsApp
  window.handleFormSubmission = async function(event) {
    if (event) event.preventDefault();

    const nameInput = document.getElementById('candidateName');
    const phoneInput = document.getElementById('candidatePhone');
    const expInput = document.getElementById('candidateExp');
    const cityInput = document.getElementById('candidateCity');

    const candidateName = nameInput ? nameInput.value.trim() : '';
    const candidatePhone = phoneInput ? phoneInput.value.trim() : '';
    const candidateExp = expInput ? expInput.value : '1 to 2 Years';
    const candidateCity = cityInput && cityInput.value.trim() ? cityInput.value.trim() : 'Not Specified';

    if (!candidateName || !candidatePhone) {
      alert('Please fill in your Full Name and WhatsApp Phone Number.');
      return;
    }

    // Trigger celebration confetti
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#F59E0B', '#38BDF8', '#10B981']
      });
    }

    // Show simulated verification overlay
    const modal = document.getElementById('simulationModal');
    const modalStatus = modal ? modal.querySelector('.sim-status-text') : null;
    if (modal) modal.classList.add('active');

    const recruiterNumber = window.NG_SETTINGS?.whatsappNumber || '918080025670';
    let whatsappRedirectUrl = `https://wa.me/${recruiterNumber}?text=${encodeURIComponent(
      `*APPLICATION FOR OVERSEAS RECRUITMENT (NG GLOBAL)*\n` +
      `👤 Name: ${candidateName}\n📞 Phone: ${candidatePhone}\n🛠️ Trade: ${selectedTradeValue}\n🌍 Destination: ${selectedDestValue}\n⏱️ Experience: ${candidateExp}\n📍 Location: ${candidateCity}`
    )}`;

    try {
      // Asynchronously submit lead to Node.js backend
      const res = await fetch('/api/v1/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          full_name: candidateName,
          phone: candidatePhone,
          trade: selectedTradeValue,
          destination: selectedDestValue,
          experience: candidateExp,
          city: candidateCity,
          source: 'eligibility_wizard'
        })
      });

      const data = await res.json();
      if (data.success && data.whatsappUrl) {
        whatsappRedirectUrl = data.whatsappUrl;
        if (modalStatus) {
          modalStatus.textContent = `Dossier Saved (#${data.applicationRef || 'NG-VERIFIED'}). Redirecting to WhatsApp...`;
        }
      }
    } catch (err) {
      console.warn('[Lead Submission] Network notice, continuing to WhatsApp:', err.message);
    }

    // Smooth delay for user feedback then launch WhatsApp
    setTimeout(() => {
      window.open(whatsappRedirectUrl, '_blank');
      if (modal) modal.classList.remove('active');
    }, 1400);
  };

  // Instant WhatsApp Quick-Apply for featured jobs
  window.applyForJob = async function(jobId, jobTitle, country, salary) {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#D4AF37', '#38BDF8', '#10B981']
      });
    }

    const message = `*APPLICATION FOR JOB OPENING [${jobId}]*\n` +
      `----------------------------------------\n` +
      `🛠️ *Position:* ${jobTitle}\n` +
      `🌍 *Country/Location:* ${country}\n` +
      `💵 *Offered Package:* ${salary}\n` +
      `----------------------------------------\n` +
      `*Candidate Note:* Hello NG Global, I want to apply for this opening. Please connect with me to assess my credentials, discuss terms, and guide me on embassy processing.`;

    const encodedMessage = encodeURIComponent(message);
    const recruiterNumber = window.NG_SETTINGS?.whatsappNumber || '918080025670';
    const whatsappUrl = `https://wa.me/${recruiterNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  // Event Delegation for Lead Funnel clicks
  document.addEventListener('DOMContentLoaded', () => {
    const funnel = document.getElementById('lead-funnel');
    if (!funnel) return;

    funnel.addEventListener('click', (e) => {
      // Step 1: Trade selection
      const tradeCard = e.target.closest('.trade-card-btn');
      if (tradeCard) {
        const tradeTitle = tradeCard.querySelector('h4');
        if (tradeTitle) selectTrade(tradeCard, tradeTitle.textContent.trim());
        return;
      }

      // Step 2: Destination selection
      const destCard = e.target.closest('.dest-card-btn');
      if (destCard) {
        const destTitle = destCard.querySelector('h4');
        if (destTitle) selectDest(destCard, destTitle.textContent.trim());
        return;
      }
    });
  });
})();
