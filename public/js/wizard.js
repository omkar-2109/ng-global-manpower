/**
 * NG Global Manpower Services
 * Candidate Eligibility Wizard & Lead Capture Engine (Mobile-First High Conversion)
 */
(function() {
  'use strict';

  let currentStep = 1;
  let selectedTradeValue = 'Construction & Infrastructure';
  let selectedDestValue = 'Gulf Countries (UAE, Saudi, Qatar)';

  // 1. LocalStorage Draft Keys
  const DRAFT_KEY = 'ng_candidate_draft_v2';
  const BOOKMARKS_KEY = 'ng_saved_job_codes';

  // Trade card selector
  window.selectTrade = function(element, tradeName) {
    document.querySelectorAll('.trade-card-btn').forEach(btn => btn.classList.remove('selected'));
    element.classList.add('selected');
    selectedTradeValue = tradeName;
    saveDraft();
  };

  // Destination card selector
  window.selectDest = function(element, destName) {
    document.querySelectorAll('.dest-card-btn').forEach(btn => btn.classList.remove('selected'));
    element.classList.add('selected');
    selectedDestValue = destName;
    saveDraft();
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
    saveDraft();
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
      // Auto focus name on step 3
      setTimeout(() => {
        const nameInput = document.getElementById('candidateName');
        if (nameInput) nameInput.focus();
      }, 100);
    }
  };

  // Auto-save form draft to localStorage
  function saveDraft() {
    try {
      const nameInput = document.getElementById('candidateName');
      const phoneInput = document.getElementById('candidatePhone');
      const expInput = document.getElementById('candidateExp');
      const cityInput = document.getElementById('candidateCity');

      const draft = {
        trade: selectedTradeValue,
        dest: selectedDestValue,
        name: nameInput ? nameInput.value : '',
        phone: phoneInput ? phoneInput.value : '',
        exp: expInput ? expInput.value : '3 to 5 Years',
        city: cityInput ? cityInput.value : '',
        updatedAt: Date.now()
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (e) {
      // safe fallback
    }
  }

  // Restore form draft on page load
  function restoreDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft.trade) selectedTradeValue = draft.trade;
      if (draft.dest) selectedDestValue = draft.dest;

      const nameInput = document.getElementById('candidateName');
      const phoneInput = document.getElementById('candidatePhone');
      const expInput = document.getElementById('candidateExp');
      const cityInput = document.getElementById('candidateCity');

      if (nameInput && draft.name) nameInput.value = draft.name;
      if (phoneInput && draft.phone) phoneInput.value = draft.phone;
      if (expInput && draft.exp) expInput.value = draft.exp;
      if (cityInput && draft.city) cityInput.value = draft.city;
    } catch (e) {
      // safe fallback
    }
  }

  // Handle Form Submission: Persist to Server then show Reassurance Modal + Handoff to WhatsApp
  window.handleFormSubmission = async function(event) {
    if (event) event.preventDefault();

    const nameInput = document.getElementById('candidateName');
    const phoneInput = document.getElementById('candidatePhone');
    const expInput = document.getElementById('candidateExp');
    const cityInput = document.getElementById('candidateCity');

    const candidateName = nameInput ? nameInput.value.trim() : '';
    const candidatePhone = phoneInput ? phoneInput.value.trim() : '';
    const candidateExp = expInput ? expInput.value : '3 to 5 Years';
    const candidateCity = cityInput && cityInput.value.trim() ? cityInput.value.trim() : 'Not Specified';

    if (!candidateName || candidateName.length < 2) {
      showToast('Please enter your full name as per your passport.');
      if (nameInput) nameInput.focus();
      return;
    }

    const cleanPhone = candidatePhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 8 || cleanPhone.length > 15) {
      showToast('Please enter a valid 10-digit mobile or WhatsApp number.');
      if (phoneInput) phoneInput.focus();
      return;
    }

    // Trigger celebration confetti
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#1E40AF', '#10B981', '#F59E0B']
      });
    }

    const recruiterNumber = window.NG_SETTINGS?.whatsappNumber || '918080025670';
    let applicationRef = 'NG-' + Math.floor(1000 + Math.random() * 9000);

    let whatsappRedirectUrl = `https://wa.me/${recruiterNumber}?text=${encodeURIComponent(
      `*APPLICATION FOR OVERSEAS EMPLOYMENT (NG GLOBAL)*\n` +
      `Ref: #${applicationRef}\n` +
      `----------------------------------------\n` +
      `👤 *Candidate:* ${candidateName}\n` +
      `📞 *Phone:* ${candidatePhone}\n` +
      `🛠️ *Applied Trade:* ${selectedTradeValue}\n` +
      `🌍 *Destination Preference:* ${selectedDestValue}\n` +
      `⏱️ *Experience:* ${candidateExp}\n` +
      `📍 *Location:* ${candidateCity}\n` +
      `----------------------------------------\n` +
      `Hello NG Global HR, I have submitted my candidate profile for review. Please check my eligibility, explain company contract terms, and guide me on interview schedules.`
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
      if (data.success) {
        if (data.applicationRef) applicationRef = data.applicationRef;
        if (data.whatsappUrl) whatsappRedirectUrl = data.whatsappUrl;
      }
    } catch (err) {
      console.warn('[Lead Submission] Network notice, continuing to WhatsApp:', err.message);
    }

    // Clear draft on successful submission
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}

    // Show Reassurance Confirmation Modal
    showReassuranceModal({
      refId: '#' + applicationRef,
      name: candidateName,
      trade: selectedTradeValue,
      destination: selectedDestValue,
      phone: candidatePhone,
      whatsappUrl: whatsappRedirectUrl
    });
  };

  // Reassurance Confirmation Modal Display & Auto-Redirect
  let redirectTimeout = null;

  function showReassuranceModal(data) {
    const modal = document.getElementById('reassuranceModal');
    if (!modal) {
      // Fallback: direct redirect
      window.location.href = data.whatsappUrl;
      return;
    }

    const refEl = document.getElementById('modalRefId');
    const summaryEl = document.getElementById('modalCandidateSummary');
    const directBtn = document.getElementById('modalWhatsappDirectBtn');
    const noteEl = document.getElementById('modalRedirectTimerNote');

    if (refEl) refEl.textContent = data.refId;
    if (directBtn) directBtn.href = data.whatsappUrl;

    if (summaryEl) {
      summaryEl.innerHTML = `
        <div class="summary-line"><span class="sum-label"><i class="fa-solid fa-user"></i> Name:</span> <span class="sum-val"><strong>${data.name}</strong></span></div>
        <div class="summary-line"><span class="sum-label"><i class="fa-solid fa-wrench"></i> Trade:</span> <span class="sum-val">${data.trade}</span></div>
        <div class="summary-line"><span class="sum-label"><i class="fa-solid fa-earth-americas"></i> Region:</span> <span class="sum-val">${data.destination}</span></div>
        <div class="summary-line"><span class="sum-label"><i class="fa-brands fa-whatsapp"></i> WhatsApp:</span> <span class="sum-val">${data.phone}</span></div>
      `;
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Auto-launch countdown (2.5 seconds gives reassurance, doesn't get blocked by browser popup killer)
    let countdown = 3;
    if (noteEl) noteEl.textContent = `Connecting to official WhatsApp in ${countdown}s...`;

    const timerInterval = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        if (noteEl) noteEl.textContent = `Connecting to official WhatsApp in ${countdown}s...`;
      } else {
        clearInterval(timerInterval);
        if (noteEl) noteEl.textContent = 'Redirecting to WhatsApp...';
        // Open WhatsApp via direct navigation
        window.location.href = data.whatsappUrl;
      }
    }, 1000);

    // Cancel timer if user manually clicks
    if (directBtn) {
      directBtn.onclick = function() {
        clearInterval(timerInterval);
      };
    }
  }

  window.closeReassuranceModal = function() {
    const modal = document.getElementById('reassuranceModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  // Save Job Bookmark in localStorage
  window.saveJobBookmark = function(jobCode, btn) {
    try {
      let saved = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]');
      const index = saved.indexOf(jobCode);
      const icon = btn.querySelector('i');

      if (index === -1) {
        saved.push(jobCode);
        localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(saved));
        if (icon) {
          icon.className = 'fa-solid fa-bookmark';
          icon.style.color = '#1D4ED8';
        }
        showToast(`Job ${jobCode} saved to your bookmarks.`);
      } else {
        saved.splice(index, 1);
        localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(saved));
        if (icon) {
          icon.className = 'fa-regular fa-bookmark';
          icon.style.color = '';
        }
        showToast(`Job ${jobCode} removed from bookmarks.`);
      }
    } catch (e) {
      showToast('Job saved.');
    }
  };

  // Share Job Opening via Web Share API or Clipboard Copy
  window.shareJobOpening = function(jobCode, title) {
    const shareUrl = `${window.location.origin}/jobs/${jobCode}`;
    const shareData = {
      title: `${title} | NG Global Manpower`,
      text: `Verified overseas job opening: ${title}. Check details and apply:`,
      url: shareUrl
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast('Job link copied to clipboard!');
      }).catch(() => {
        prompt('Copy job link:', shareUrl);
      });
    }
  };

  // Simple, sleek mobile toast notification
  function showToast(message) {
    let toast = document.getElementById('ngGlobalToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'ngGlobalToast';
      toast.className = 'ng-global-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('visible');
    setTimeout(() => {
      toast.classList.remove('visible');
    }, 2800);
  }

  // Restore draft and listen to input changes
  document.addEventListener('DOMContentLoaded', () => {
    restoreDraft();

    // Attach input change listeners for instant drafting
    ['candidateName', 'candidatePhone', 'candidateExp', 'candidateCity'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', saveDraft);
        el.addEventListener('change', saveDraft);
      }
    });

    // Delegate trade and destination selection clicks
    const funnel = document.getElementById('lead-funnel');
    if (funnel) {
      funnel.addEventListener('click', (e) => {
        const tradeCard = e.target.closest('.trade-card-btn');
        if (tradeCard) {
          const tradeTitle = tradeCard.querySelector('h4') || tradeCard.querySelector('.trade-card-name');
          if (tradeTitle) selectTrade(tradeCard, tradeTitle.textContent.trim());
          return;
        }

        const destCard = e.target.closest('.dest-card-btn');
        if (destCard) {
          const destTitle = destCard.querySelector('h4');
          if (destTitle) selectDest(destCard, destTitle.textContent.trim());
          return;
        }
      });
    }

    // Highlight previously bookmarked jobs
    try {
      const saved = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]');
      if (saved.length > 0) {
        document.querySelectorAll('[data-job-code]').forEach(el => {
          const code = el.getAttribute('data-job-code');
          if (saved.includes(code)) {
            const card = el.closest('.job-card-premium');
            if (card) {
              const bookmarkBtn = card.querySelector('[onclick*="saveJobBookmark"] i');
              if (bookmarkBtn) {
                bookmarkBtn.className = 'fa-solid fa-bookmark';
                bookmarkBtn.style.color = '#1D4ED8';
              }
            }
          }
        });
      }
    } catch (e) {}
  });

})();
