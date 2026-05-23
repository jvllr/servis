// track_request.js
// SERVIS | Manila City Hall EDP

// ── Supabase config ───────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://zccbgmbjyuzkohufvfvj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_jCL2HLQHU4vgUD9xVFLpzQ_sWX6eWD2';
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', function () {

  const input      = document.getElementById('tracking-input');
  const trackBtn   = document.getElementById('track-btn');
  const resultArea = document.getElementById('tr-result-area');

  // ── Status config ──────────────────────────────────────────────────────

  const STATUS_STEPS = {
    'Pending':     1,
    'In Progress': 2,
    'Completed':   3,
    'Pulled Out':  0,  // no steps active
  };

  const STATUS_BADGE_CLASS = {
    'Pending':     'tr-badge--pending',
    'In Progress': 'tr-badge--inprogress',
    'Completed':   'tr-badge--completed',
    'Pulled Out':  'tr-badge--pulledout',
  };

  const STEP_LABELS = ['Pending', 'In Progress', 'Completed'];

  // ── Service type display map ───────────────────────────────────────────

  const SERVICE_LABELS = {
    'hardware-repair':       'Hardware Repair',
    'software-installation': 'Software Installation',
    'network-issues':        'Network Issues',
    'printer-issues':        'Printer Issues',
    'data-backup-recovery':  'Data Backup/Recovery',
    'system-upgrade':        'System Upgrade',
    'other':                 'Other',
  };

  // ── Track action ───────────────────────────────────────────────────────

  async function doTrack() {
    const query = input.value.trim().toUpperCase();
    if (!query) {
      input.focus();
      return;
    }

    // Show loading state
    trackBtn.disabled = true;
    trackBtn.textContent = 'Searching…';
    resultArea.innerHTML = '';

    try {
      const { data, error } = await supabaseClient
        .from('service_requests')
        .select('*')
        .ilike('tracking_number', query)
        .single();

      if (error || !data) {
        renderNotFound();
      } else {
        renderResult(data);
      }

    } catch (err) {
      renderNotFound();
    } finally {
      trackBtn.disabled = false;
      trackBtn.textContent = 'Track';
    }
  }

  trackBtn.addEventListener('click', doTrack);

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') doTrack();
  });

  // ── Render: found ──────────────────────────────────────────────────────

  function renderResult(r) {
    const activeStep   = STATUS_STEPS[r.status] || 1;
    const badgeClass   = STATUS_BADGE_CLASS[r.status] || 'tr-badge--pending';
    const serviceLabel = SERVICE_LABELS[r.service_type] || r.service_type || '—';

    const submittedAt = formatDate(r.created_at);
    const updatedAt   = r.updated_at ? formatDate(r.updated_at) : null;

    // Build stepper HTML
    const isPulledOut = r.status === 'Pulled Out';
    let stepperHTML = '';

    if (isPulledOut) {
      stepperHTML = `<p class="tr-pulledout-note">This request has been pulled out and is no longer being processed.</p>`;
    } else {
      STEP_LABELS.forEach(function (label, idx) {
        const stepNum  = idx + 1;
        const isActive = stepNum <= activeStep;

        if (idx > 0) {
          stepperHTML += `<div class="tr-step-connector ${isActive ? 'active' : ''}"></div>`;
        }

        stepperHTML += `
          <div class="tr-step">
            <div class="tr-step-circle ${isActive ? 'active' : ''}">${stepNum}</div>
            <span class="tr-step-label ${isActive ? 'active' : ''}">${label}</span>
          </div>
        `;
      });
    }

    // Timestamp rows
    let timestampsHTML = `
      <div class="tr-timestamp">
        <i data-lucide="clock" aria-hidden="true"></i>
        <span>Submitted on ${submittedAt}</span>
      </div>
    `;
    if (updatedAt) {
      timestampsHTML += `
        <div class="tr-timestamp">
          <i data-lucide="clock" aria-hidden="true"></i>
          <span>Last updated on ${updatedAt}</span>
        </div>
      `;
    }

    // Remarks block — only show if there are remarks
    const remarksHTML = r.remarks ? `
      <hr class="tr-divider" />
      <div class="tr-desc-block">
        <i data-lucide="message-square" aria-hidden="true"></i>
        <div class="tr-detail-texts">
          <span class="tr-detail-field">Remarks</span>
          <span class="tr-detail-value">${escapeHTML(r.remarks)}</span>
        </div>
      </div>
    ` : '';

    resultArea.innerHTML = `
      <!-- Status card -->
      <div class="tr-card tr-status-card">
        <div class="tr-status-header">
          <div>
            <p class="tr-status-label">Tracking Number</p>
            <p class="tr-tracking-number">${escapeHTML(r.tracking_number)}</p>
          </div>
          <span class="tr-badge ${badgeClass}">${escapeHTML(r.status)}</span>
        </div>

        <div class="tr-stepper">
          ${stepperHTML}
        </div>
      </div>

      <!-- Details card -->
      <div class="tr-card tr-details-card">
        <h2>Request Details</h2>

        <div class="tr-details-grid">
          <div class="tr-detail-item">
            <i data-lucide="user" aria-hidden="true"></i>
            <div class="tr-detail-texts">
              <span class="tr-detail-field">Requester</span>
              <span class="tr-detail-value">${escapeHTML(r.requester_name)}</span>
            </div>
          </div>
          <div class="tr-detail-item">
            <i data-lucide="building-2" aria-hidden="true"></i>
            <div class="tr-detail-texts">
              <span class="tr-detail-field">Department</span>
              <span class="tr-detail-value">${escapeHTML(r.department)}</span>
            </div>
          </div>
          <div class="tr-detail-item">
            <i data-lucide="phone" aria-hidden="true"></i>
            <div class="tr-detail-texts">
              <span class="tr-detail-field">Contact Number</span>
              <span class="tr-detail-value">${escapeHTML(r.contact_number)}</span>
            </div>
          </div>
          <div class="tr-detail-item">
            <i data-lucide="mail" aria-hidden="true"></i>
            <div class="tr-detail-texts">
              <span class="tr-detail-field">Email</span>
              <span class="tr-detail-value">${escapeHTML(r.email)}</span>
            </div>
          </div>
        </div>

        <hr class="tr-divider" />

        <div class="tr-details-row">
          <div class="tr-plain-field">
            <span class="tr-detail-field">Service Type</span>
            <span class="tr-detail-value">${escapeHTML(serviceLabel)}</span>
          </div>
        </div>

        <hr class="tr-divider" />

        <div class="tr-desc-block">
          <i data-lucide="file-text" aria-hidden="true"></i>
          <div class="tr-detail-texts">
            <span class="tr-detail-field">Issue Description</span>
            <span class="tr-detail-value">${escapeHTML(r.issue_description)}</span>
          </div>
        </div>

        ${remarksHTML}

        <hr class="tr-divider" />

        <div class="tr-timestamps">
          ${timestampsHTML}
        </div>
      </div>
    `;

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // ── Render: not found ──────────────────────────────────────────────────

  function renderNotFound() {
    resultArea.innerHTML = `
      <div class="tr-card tr-notfound-card">
        <div class="tr-notfound-icon">
          <i data-lucide="alert-circle" aria-hidden="true"></i>
        </div>
        <h2>Request Not Found</h2>
        <p>We couldn't find a service request with that tracking number. Please check and try again.</p>
        <button class="tr-try-again-btn" id="try-again-btn">Try Again</button>
      </div>
    `;

    if (typeof lucide !== 'undefined') lucide.createIcons();

    document.getElementById('try-again-btn').addEventListener('click', function () {
      resultArea.innerHTML = '';
      input.value = '';
      input.focus();
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  function formatDate(isoString) {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-PH', {
      year: 'numeric', month: 'long', day: 'numeric',
    }) + ' at ' + d.toLocaleTimeString('en-PH', {
      hour: '2-digit', minute: '2-digit',
    });
  }

  function escapeHTML(str) {
    if (!str) return '—';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

});
