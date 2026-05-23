
const SUPABASE_URL = 'https://zccbgmbjyuzkohufvfvj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_jCL2HLQHU4vgUD9xVFLpzQ_sWX6eWD2';
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let allRequests = [];

let requestsBody, emptyState, searchInput, statusFilter, logoutBtn;
let statTotal, statPending, statInProgress, statCompleted, statPulledOut;

function statusBadge(status) {
  const map = {
    'Pending':     'status-badge--pending',
    'In Progress': 'status-badge--in-progress',
    'Completed':   'status-badge--completed',
    'Pulled Out':  'status-badge--pulled-out',
  };
  const cls = map[status] || 'status-badge--pending';
  return `<span class="status-badge ${cls}">${status}</span>`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function updateStats(requests) {
  statTotal.textContent      = requests.length;
  statPending.textContent    = requests.filter(r => r.status === 'Pending').length;
  statInProgress.textContent = requests.filter(r => r.status === 'In Progress').length;
  statCompleted.textContent  = requests.filter(r => r.status === 'Completed').length;
  statPulledOut.textContent  = requests.filter(r => r.status === 'Pulled Out').length;
}

function renderTable(requests) {
  updateStats(allRequests);

  if (requests.length === 0) {
    requestsBody.innerHTML = '';
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;
  requestsBody.innerHTML = requests.map(r => `
    <tr>
      <td><span class="tracking-number">${r.tracking_number}</span></td>
      <td>
        <span class="requester-name">${r.requester_name}</span>
        <span class="requester-role">${r.department || ''}</span>
      </td>
      <td>${r.service_type}</td>
      <td>${statusBadge(r.status)}</td>
      <td>${formatDate(r.created_at)}</td>
      <td>
        <div class="action-btns">
          <button class="action-btn action-btn--view" title="View" onclick="viewRequest('${r.id}')">
            <i data-lucide="eye"></i>
          </button>
          <button class="action-btn action-btn--edit" title="Edit" onclick="editRequest('${r.id}')">
            <i data-lucide="pencil"></i>
          </button>
          <button class="action-btn action-btn--delete" title="Delete" onclick="deleteRequest('${r.id}')">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  lucide.createIcons();
}

function filterRequests() {
  const query  = searchInput.value.toLowerCase();
  const status = statusFilter.value;

  const filtered = allRequests.filter(r => {
    const matchesSearch = !query ||
      r.tracking_number.toLowerCase().includes(query) ||
      r.requester_name.toLowerCase().includes(query) ||
      (r.department || '').toLowerCase().includes(query);

    const matchesStatus = !status || r.status === status;

    return matchesSearch && matchesStatus;
  });

  renderTable(filtered);
}

async function loadRequests() {
  try {
    const { data, error } = await supabaseClient
      .from('service_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    allRequests = data || [];
    filterRequests();

  } catch (err) {
    console.error('Failed to load requests:', err.message);
    allRequests = [];
    renderTable([]);
  }
}

let viewModalOverlay, viewModalClose;

function openViewModal(r) {
  document.getElementById('viewTrackingNumber').textContent = r.tracking_number || '—';
  document.getElementById('viewRequesterName').textContent  = r.requester_name  || '—';
  document.getElementById('viewDepartment').textContent     = r.department       || '—';
  document.getElementById('viewServiceType').textContent    = r.service_type     || '—';
  document.getElementById('viewCreatedAt').textContent      = r.created_at  ? formatDate(r.created_at)  : '—';
  document.getElementById('viewUpdatedAt').textContent      = r.updated_at  ? formatDate(r.updated_at)  : '—';
  document.getElementById('viewStatus').innerHTML           = statusBadge(r.status);
  document.getElementById('viewDescription').textContent    = r.issue_description || r.remarks || '—';

  viewModalOverlay.hidden = false;
  document.body.style.overflow = 'hidden';
  lucide.createIcons();
}

function closeViewModal() {
  viewModalOverlay.hidden = true;
  document.body.style.overflow = '';
}

function viewRequest(id) {
  const r = allRequests.find(req => String(req.id) === String(id));
  if (r) openViewModal(r);
}

let editModalOverlay, editModalClose, editModalCancel, editModalSave, editStatus, editRemarks;

let editingId = null;

function openEditModal(r) {
  editingId = r.id;
  document.getElementById('editTrackingNumber').textContent = r.tracking_number || '—';
  editStatus.value   = r.status || 'Pending';
  editRemarks.value  = r.remarks || r.issue_description || '';

  editModalOverlay.hidden = false;
  document.body.style.overflow = 'hidden';
  lucide.createIcons();
}

function closeEditModal() {
  editModalOverlay.hidden = true;
  document.body.style.overflow = '';
  editingId = null;
}

function editRequest(id) {
  const r = allRequests.find(req => String(req.id) === String(id));
  if (r) openEditModal(r);
}

let deleteModalOverlay, deleteCancelBtn, deleteConfirmBtn;
let pendingDeleteId = null;

function openDeleteModal(r) {
  pendingDeleteId = r.id;
  document.getElementById('deleteTrackingDisplay').textContent = r.tracking_number || '—';
  deleteModalOverlay.hidden = false;
  document.body.style.overflow = 'hidden';
  lucide.createIcons();
}

function closeDeleteModal() {
  deleteModalOverlay.hidden = true;
  document.body.style.overflow = '';
  pendingDeleteId = null;
}

function deleteRequest(id) {
  const r = allRequests.find(req => String(req.id) === String(id));
  if (r) openDeleteModal(r);
}

async function confirmDelete() {
  if (!pendingDeleteId) return;

  deleteConfirmBtn.disabled = true;
  deleteConfirmBtn.innerHTML = '<i data-lucide="loader-2"></i> Deleting…';
  lucide.createIcons();

  try {
    const { error } = await supabaseClient
      .from('service_requests')
      .delete()
      .eq('id', String(pendingDeleteId));

    if (error) throw error;

    closeDeleteModal();
    await loadRequests();

  } catch (err) {
    alert('Failed to delete: ' + err.message);
  } finally {
    deleteConfirmBtn.disabled = false;
    deleteConfirmBtn.innerHTML = '<i data-lucide="trash-2"></i> Yes, Delete';
    lucide.createIcons();
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  lucide.createIcons();

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return;
  }

  requestsBody   = document.getElementById('requestsBody');
  emptyState     = document.getElementById('emptyState');
  searchInput    = document.getElementById('searchInput');
  statusFilter   = document.getElementById('statusFilter');
  logoutBtn      = document.getElementById('logoutBtn');
  statTotal      = document.getElementById('statTotal');
  statPending    = document.getElementById('statPending');
  statInProgress = document.getElementById('statInProgress');
  statCompleted  = document.getElementById('statCompleted');
  statPulledOut  = document.getElementById('statPulledOut');

  viewModalOverlay = document.getElementById('viewModalOverlay');
  viewModalClose   = document.getElementById('viewModalClose');

  editModalOverlay = document.getElementById('editModalOverlay');
  editModalClose   = document.getElementById('editModalClose');
  editModalCancel  = document.getElementById('editModalCancel');
  editModalSave    = document.getElementById('editModalSave');
  editStatus       = document.getElementById('editStatus');
  editRemarks      = document.getElementById('editRemarks');

  deleteModalOverlay = document.getElementById('deleteModalOverlay');
  deleteCancelBtn    = document.getElementById('deleteCancelBtn');
  deleteConfirmBtn   = document.getElementById('deleteConfirmBtn');

  viewModalClose.addEventListener('click', closeViewModal);
  viewModalOverlay.addEventListener('click', (e) => {
    if (e.target === viewModalOverlay) closeViewModal();
  });

  editModalClose.addEventListener('click', closeEditModal);
  editModalCancel.addEventListener('click', closeEditModal);
  editModalOverlay.addEventListener('click', (e) => {
    if (e.target === editModalOverlay) closeEditModal();
  });

  deleteCancelBtn.addEventListener('click', closeDeleteModal);
  deleteConfirmBtn.addEventListener('click', confirmDelete);
  deleteModalOverlay.addEventListener('click', (e) => {
    if (e.target === deleteModalOverlay) closeDeleteModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!viewModalOverlay.hidden) closeViewModal();
      if (!editModalOverlay.hidden) closeEditModal();
      if (!deleteModalOverlay.hidden) closeDeleteModal();
    }
  });

  editModalSave.addEventListener('click', async () => {
    if (!editingId) return;

    const newStatus  = editStatus.value;
    const newRemarks = editRemarks.value.trim();

    editModalSave.disabled = true;
    editModalSave.textContent = 'Saving…';

    try {
      const { data: updated, error } = await supabaseClient
        .from('service_requests')
        .update({
          status:     newStatus,
          remarks:    newRemarks,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId)
        .select();

      if (error) throw error;

      const idx = allRequests.findIndex(r => String(r.id) === String(editingId));
      if (idx !== -1) {
        allRequests[idx] = {
          ...allRequests[idx],
          status: newStatus,
          remarks: newRemarks,
          updated_at: new Date().toISOString(),
        };
      }

      closeEditModal();
      filterRequests();
      await loadRequests();

    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save: ' + (err.message || JSON.stringify(err)));
    } finally {
      editModalSave.disabled = false;
      editModalSave.innerHTML = '<i data-lucide="save"></i> Save Changes';
      lucide.createIcons();
    }
  });

  logoutBtn.addEventListener('click', async () => {
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
    } catch (err) {
      console.error('Logout error:', err.message);
    } finally {
      window.location.href = 'login.html';
    }
  });

  searchInput.addEventListener('input', filterRequests);
  statusFilter.addEventListener('change', filterRequests);

  loadRequests();
});
