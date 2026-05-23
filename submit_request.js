// submit_request.js
// SERVIS | Manila City Hall EDP

// ── Supabase config ───────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://zccbgmbjyuzkohufvfvj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_jCL2HLQHU4vgUD9xVFLpzQ_sWX6eWD2';
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', function () {

  const form       = document.getElementById('job-order-form');
  const modal      = document.getElementById('success-modal');
  const closeBtn   = document.getElementById('modal-close-btn');
  const trackingEl = document.getElementById('tracking-number');
  const submitBtn  = form.querySelector('button[type="submit"]');

  // ── Validation rules ──────────────────────────────────────────────────

  const fields = {
    'full-name': {
      el: document.getElementById('full-name'),
      err: document.getElementById('full-name-error'),
      validate(v) {
        if (!v) return 'Full name is required.';
        if (v.length < 2) return 'Please enter your full name.';
        return '';
      }
    },
    'department': {
      el: document.getElementById('department'),
      err: document.getElementById('department-error'),
      validate(v) {
        if (!v) return 'Department/Office is required.';
        return '';
      }
    },
    'contact-number': {
      el: document.getElementById('contact-number'),
      err: document.getElementById('contact-number-error'),
      validate(v) {
        if (!v) return 'Contact number is required.';
        // Philippine mobile: 09XX XXX XXXX or +639XX XXX XXXX
        const clean = v.replace(/\s/g, '');
        if (!/^(09\d{9}|(\+63)9\d{9})$/.test(clean)) {
          return 'Enter a valid Philippine mobile number (e.g. 09XX XXX XXXX).';
        }
        return '';
      }
    },
    'email': {
      el: document.getElementById('email'),
      err: document.getElementById('email-error'),
      validate(v) {
        if (!v) return 'Email address is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address.';
        return '';
      }
    },
    'service-type': {
      el: document.getElementById('service-type'),
      err: document.getElementById('service-type-error'),
      validate(v) {
        if (!v) return 'Please select a service type.';
        return '';
      }
    },
    'issue-description': {
      el: document.getElementById('issue-description'),
      err: document.getElementById('issue-description-error'),
      validate(v) {
        if (!v) return 'Issue description is required.';
        return '';
      }
    }
  };

  // ── Phone number auto-format ──────────────────────────────────────────

  const contactInput = document.getElementById('contact-number');
  contactInput.addEventListener('input', function () {
    let digits = this.value.replace(/\D/g, '');
    if (digits.startsWith('63')) digits = '0' + digits.slice(2);
    if (digits.length > 11) digits = digits.slice(0, 11);

    // Format: 09XX XXX XXXX
    let formatted = digits;
    if (digits.length > 4 && digits.length <= 7) {
      formatted = digits.slice(0, 4) + ' ' + digits.slice(4);
    } else if (digits.length > 7) {
      formatted = digits.slice(0, 4) + ' ' + digits.slice(4, 7) + ' ' + digits.slice(7);
    }
    this.value = formatted;
  });

  // ── Live validation on blur ───────────────────────────────────────────

  Object.values(fields).forEach(function (field) {
    field.el.addEventListener('blur', function () {
      validateField(field);
    });
    field.el.addEventListener('input', function () {
      if (field.el.classList.contains('invalid')) {
        validateField(field);
      }
    });
  });

  function validateField(field) {
    const value = field.el.value.trim();
    const error = field.validate(value);
    field.err.textContent = error;
    field.el.classList.toggle('invalid', !!error);
    return !error;
  }

  function validateAll() {
    return Object.values(fields).map(validateField).every(Boolean);
  }

  // ── Tracking number generator ─────────────────────────────────────────

  function generateTrackingNumber() {
    const now  = new Date();
    const year = now.getFullYear().toString().slice(2);
    const mon  = String(now.getMonth() + 1).padStart(2, '0');
    const day  = String(now.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return 'EDP-' + year + mon + day + '-' + rand;
  }

  // ── Loading state helpers ─────────────────────────────────────────────

  function setLoading(isLoading) {
    submitBtn.disabled     = isLoading;
    submitBtn.textContent  = isLoading ? 'Submitting…' : 'Submit Job Order';
  }

  // ── Form submit ───────────────────────────────────────────────────────

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!validateAll()) return;

    setLoading(true);

    try {
      const trackingNumber = generateTrackingNumber();

      const { error } = await supabaseClient
        .from('service_requests')
        .insert([{
          tracking_number:   trackingNumber,
          requester_name:    fields['full-name'].el.value.trim(),
          department:        fields['department'].el.value.trim(),
          contact_number:    fields['contact-number'].el.value.trim(),
          email:             fields['email'].el.value.trim(),
          service_type:      fields['service-type'].el.value,
          issue_description: fields['issue-description'].el.value.trim(),
          status:            'Pending',
        }]);

      if (error) throw error;

      // Show success modal
      trackingEl.textContent = trackingNumber;
      modal.hidden = false;
      document.body.style.overflow = 'hidden';

      // Re-init lucide for modal icon
      if (typeof lucide !== 'undefined') lucide.createIcons();

    } catch (err) {
      alert('Failed to submit request: ' + (err.message || 'Please try again.'));
    } finally {
      setLoading(false);
    }
  });

  // ── Modal close ───────────────────────────────────────────────────────

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
    form.reset();
    Object.values(fields).forEach(function (field) {
      field.el.classList.remove('invalid');
      field.err.textContent = '';
    });
  }

  closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });

});
