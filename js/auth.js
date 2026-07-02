// ─── Session management ──────────────────
const SESSION_KEY = 'newflix_user';

function getSession() {
  return JSON.parse(localStorage.getItem(SESSION_KEY));
}

function setSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function isLoggedIn() {
  return !!getSession();
}

// ─── Signup ─────────────────────────────
async function signup(name, email, password) {
  try {
    // Check if user exists
    const existing = await getUserByEmail(email);
    if (existing.length > 0) {
      return { success: false, error: 'Email already registered.' };
    }
    // Create user
    const result = await createUser(name, email, password);
    const user = {
      id: result.id,
      name: result.fields.Name,
      email: result.fields.Email
    };
    setSession(user);
    return { success: true, user };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ─── Signin ─────────────────────────────
async function signin(email, password) {
  try {
    const records = await getUserByEmail(email);
    if (records.length === 0) {
      return { success: false, error: 'No account found with this email.' };
    }
    const userRecord = records[0];
    const storedPassword = userRecord.fields.Password;
    if (storedPassword !== password) {
      return { success: false, error: 'Incorrect password.' };
    }
    const user = {
      id: userRecord.id,
      name: userRecord.fields.Name,
      email: userRecord.fields.Email
    };
    setSession(user);
    // Sync local data to cloud (merge)
    try {
      await syncLocalDataToAirtable(user.id);
    } catch (e) {
      console.warn('Sync failed, but login succeeded:', e);
    }
    return { success: true, user };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ─── Logout ─────────────────────────────
function logout() {
  clearSession();
  // Optionally clear local data? We keep it.
}

// ─── Update header with user info ──────
function updateHeaderAuth() {
  const user = getSession();
  const nav = document.querySelector('nav');
  if (!nav) return;
  // Look for auth links
  let authLinks = document.getElementById('authLinks');
  if (!authLinks) {
    authLinks = document.createElement('div');
    authLinks.id = 'authLinks';
    authLinks.style.display = 'flex';
    authLinks.style.alignItems = 'center';
    authLinks.style.gap = '16px';
    nav.parentNode.insertBefore(authLinks, nav.nextSibling);
  }
  if (user) {
    authLinks.innerHTML = `
      <span style="color:#aaa;font-size:0.9rem;"><i class="fas fa-user"></i> ${user.name}</span>
      <button id="logoutBtn" style="background:rgba(255,0,0,0.15);border:1px solid rgba(255,0,0,0.2);color:#ff6b6b;padding:8px 16px;border-radius:40px;cursor:pointer;font-weight:500;transition:0.3s;">
        <i class="fas fa-sign-out-alt"></i> Logout
      </button>
    `;
    document.getElementById('logoutBtn').addEventListener('click', function() {
      logout();
      location.reload();
    });
  } else {
    authLinks.innerHTML = `
      <a href="signin.html" style="color:#aaa;text-decoration:none;font-weight:500;transition:0.3s;">Sign In</a>
      <a href="signup.html" style="color:#00d4ff;text-decoration:none;font-weight:600;transition:0.3s;">Sign Up</a>
    `;
  }
}

// Run on page load
document.addEventListener('DOMContentLoaded', function() {
  updateHeaderAuth();
});