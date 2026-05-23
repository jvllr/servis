lucide.createIcons();

// ── Supabase config ───────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://zccbgmbjyuzkohufvfvj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_jCL2HLQHU4vgUD9xVFLpzQ_sWX6eWD2';
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── DOM refs ──────────────────────────────────────────────────────────────────
var loginForm  = document.getElementById('loginForm');
var emailInput = document.getElementById('email');
var passwordInput = document.getElementById('password');
var signInBtn  = document.getElementById('signInBtn');

// ── Helpers ───────────────────────────────────────────────────────────────────
function setLoading(isLoading) {
  signInBtn.disabled    = isLoading;
  signInBtn.textContent = isLoading ? 'Signing in…' : 'Sign In';
}

function showError(message) {
  var existing = loginForm.querySelector('.login-error');
  if (existing) existing.remove();

  var error = document.createElement('p');
  error.className   = 'login-error';
  error.textContent = message;
  signInBtn.insertAdjacentElement('beforebegin', error);
}

function clearError() {
  var existing = loginForm.querySelector('.login-error');
  if (existing) existing.remove();
}

// ── Auth ──────────────────────────────────────────────────────────────────────
loginForm.addEventListener('submit', async function (e) {
  e.preventDefault();
  clearError();

  var email    = emailInput.value.trim();
  var password = passwordInput.value.trim();

  if (!email || !password) {
    showError('Please enter both email and password.');
    return;
  }

  setLoading(true);

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) throw error;

    // TODO: redirect to admin dashboard on success
    console.log('Signed in:', data.user);
    window.location.href = 'dashboard.html';

  } catch (err) {
    showError(err.message || 'Sign-in failed. Please try again.');
  } finally {
    setLoading(false);
  }
});
