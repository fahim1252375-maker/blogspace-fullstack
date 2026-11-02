/**
 * BlogSpace - Authentication Module (Simulated Frontend Auth)
 * Handles User Registration, Login, Form Validations, Password Toggles,
 * Strength Meter, and Session Storage.
 */

import {
  STORAGE_KEYS,
  DEFAULT_USERS,
  initStorage,
  getCurrentUser,
  setCurrentUser,
  setAuthToken,
  hashPassword,
  verifyPassword,
  showToast,
  escapeHtml,
} from './blog.js';

// Initialize storage upon script execution
initStorage();

/**
 * Checks email regex format
 */
export function isValidEmail(email) {
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;
  return re.test(String(email).toLowerCase().trim());
}

/**
 * Checks password strength: returns { score: 0-4, label: string }
 */
export function evaluatePasswordStrength(password) {
  if (!password || password.length < 6) {
    return { score: 0, label: 'Too short (min 6 chars)', color: '#ef4444' };
  }
  let score = 1;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;

  if (score === 1) return { score: 1, label: 'Weak', color: '#ef4444' };
  if (score === 2) return { score: 2, label: 'Fair', color: '#f59e0b' };
  if (score === 3) return { score: 3, label: 'Good', color: '#3b82f6' };
  return { score: 4, label: 'Strong', color: '#10b981' };
}

/**
 * Setup password toggle visibility
 */
function setupPasswordToggles() {
  const toggleButtons = document.querySelectorAll('.password-toggle-btn');
  toggleButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (!input) return;

      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';

      // Update button icon
      btn.innerHTML = isPassword
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
      btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    });
  });
}

/**
 * Initialize Login Page
 */
export function initLoginPage() {
  setupPasswordToggles();

  const loginForm = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const rememberCheckbox = document.getElementById('remember-me');
  const errorAlert = document.getElementById('auth-error-alert');
  const demoLoginBtn = document.getElementById('demo-login-btn');

  // Pre-fill remembered email if available
  const rememberedEmail = localStorage.getItem('blogspace_remembered_email');
  if (rememberedEmail && emailInput) {
    emailInput.value = rememberedEmail;
    if (rememberCheckbox) rememberCheckbox.checked = true;
  }

  // Quick Demo fill button
  if (demoLoginBtn) {
    demoLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (emailInput) emailInput.value = 'alex@blogspace.io';
      if (passwordInput) passwordInput.value = 'password123';
      clearErrors();
      showToast('Demo credentials filled! Click "Sign In" or press Enter.', 'info');
    });
  }

  // Forgot password notice handler
  const forgotPasswordLink = document.getElementById('forgot-password-link');
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('Demo notice: For this prototype, sign in with alex@blogspace.io / password123 or click "Auto-fill test credentials".', 'info', 4500);
    });
  }

  function showError(message) {
    if (errorAlert) {
      errorAlert.textContent = message;
      errorAlert.classList.remove('hidden');
    } else {
      showToast(message, 'error');
    }
  }

  function clearErrors() {
    if (errorAlert) {
      errorAlert.textContent = '';
      errorAlert.classList.add('hidden');
    }
    document.querySelectorAll('.form-group').forEach((g) => g.classList.remove('has-error'));
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors();

      const email = emailInput?.value.trim() || '';
      const password = passwordInput?.value || '';

      let hasError = false;

      // Validation
      if (!email) {
        showError('Please enter your email address.');
        emailInput?.closest('.form-group')?.classList.add('has-error');
        emailInput?.focus();
        return;
      }

      if (!isValidEmail(email)) {
        showError('Please enter a valid email address.');
        emailInput?.closest('.form-group')?.classList.add('has-error');
        emailInput?.focus();
        return;
      }

      if (!password) {
        showError('Please enter your password.');
        passwordInput?.closest('.form-group')?.classList.add('has-error');
        passwordInput?.focus();
        return;
      }

      // Connect to Backend REST API: POST /api/auth/login
      let foundUser = null;
      let loginSuccess = false;

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();

        if (response.ok && data.success && data.user) {
          loginSuccess = true;
          foundUser = data.user;
          if (data.token) {
            setAuthToken(data.token);
          }
        } else {
          showError(data.message || 'Invalid email or password.');
          return;
        }
      } catch (apiErr) {
        console.warn('[BlogSpace Auth] Backend API offline, verifying with local credentials:', apiErr);
        // Fallback to local user verify
        let users = DEFAULT_USERS;
        try {
          const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS);
          const parsed = rawUsers ? JSON.parse(rawUsers) : null;
          if (Array.isArray(parsed)) users = parsed;
        } catch (err) {
          users = DEFAULT_USERS;
        }

        for (const u of users) {
          if (u && u.email && u.email.toLowerCase() === email.toLowerCase()) {
            const isMatch = await verifyPassword(password, u.password);
            if (isMatch) {
              foundUser = u;
              loginSuccess = true;
              break;
            }
          }
        }

        if (!loginSuccess || !foundUser) {
          showError('Invalid email or password. Please verify your credentials or use the demo login.');
          return;
        }
      }

      // Remember me logic
      if (rememberCheckbox && rememberCheckbox.checked) {
        localStorage.setItem('blogspace_remembered_email', email);
      } else {
        localStorage.removeItem('blogspace_remembered_email');
      }

      // Save user session
      setCurrentUser(foundUser);

      // Submit feedback button animation
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <svg class="spinner-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
          <span>Signing in...</span>
        `;
      }

      showToast(`Welcome back, ${foundUser.name}!`, 'success');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 700);
    });
  }
}

/**
 * Initialize Register Page
 */
export function initRegisterPage() {
  setupPasswordToggles();

  const registerForm = document.getElementById('register-form');
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const termsCheckbox = document.getElementById('terms-agree');
  const errorAlert = document.getElementById('auth-error-alert');

  // Strength meter elements
  const strengthBar = document.getElementById('strength-bar');
  const strengthText = document.getElementById('strength-text');

  if (passwordInput && strengthBar && strengthText) {
    passwordInput.addEventListener('input', () => {
      const val = passwordInput.value;
      if (!val) {
        strengthBar.style.width = '0%';
        strengthText.textContent = '';
        return;
      }
      const { score, label, color } = evaluatePasswordStrength(val);
      const percent = (score / 4) * 100;
      strengthBar.style.width = `${percent}%`;
      strengthBar.style.backgroundColor = color;
      strengthText.textContent = label;
      strengthText.style.color = color;
    });
  }

  function showError(message) {
    if (errorAlert) {
      errorAlert.textContent = message;
      errorAlert.classList.remove('hidden');
    } else {
      showToast(message, 'error');
    }
  }

  function clearErrors() {
    if (errorAlert) {
      errorAlert.textContent = '';
      errorAlert.classList.add('hidden');
    }
    document.querySelectorAll('.form-group').forEach((g) => g.classList.remove('has-error'));
  }

  // Terms link handler
  const termsLink = document.getElementById('terms-conditions-link');
  if (termsLink) {
    termsLink.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('BlogSpace Terms: By creating an account, you agree to publish respectful, high-quality editorial content.', 'info', 4000);
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors();

      const name = nameInput?.value.trim() || '';
      const email = emailInput?.value.trim() || '';
      const password = passwordInput?.value || '';
      const confirmPassword = confirmPasswordInput?.value || '';
      const agreed = termsCheckbox ? termsCheckbox.checked : true;

      // Validation
      if (!name || name.length < 2) {
        showError('Please enter your full name (at least 2 characters).');
        nameInput?.closest('.form-group')?.classList.add('has-error');
        nameInput?.focus();
        return;
      }

      if (!email || !isValidEmail(email)) {
        showError('Please enter a valid email address.');
        emailInput?.closest('.form-group')?.classList.add('has-error');
        emailInput?.focus();
        return;
      }

      if (!password || password.length < 6) {
        showError('Password must be at least 6 characters long.');
        passwordInput?.closest('.form-group')?.classList.add('has-error');
        passwordInput?.focus();
        return;
      }

      if (password !== confirmPassword) {
        showError('Passwords do not match. Please re-enter.');
        confirmPasswordInput?.closest('.form-group')?.classList.add('has-error');
        confirmPasswordInput?.focus();
        return;
      }

      if (termsCheckbox && !agreed) {
        showError('You must agree to the Terms and Conditions to create an account.');
        termsCheckbox.focus();
        return;
      }

      // Connect to Backend REST API: POST /api/auth/register
      let registeredUser = null;
      let registrationSuccess = false;

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await response.json();

        if (response.ok && data.success && data.user) {
          registrationSuccess = true;
          registeredUser = data.user;
          if (data.token) {
            setAuthToken(data.token);
          }
        } else {
          showError(data.message || 'Registration failed. Please try again.');
          emailInput?.closest('.form-group')?.classList.add('has-error');
          return;
        }
      } catch (apiErr) {
        console.warn('[BlogSpace Auth] Backend API offline, saving user locally:', apiErr);
        // Check duplicate email locally
        let users = DEFAULT_USERS;
        try {
          const raw = localStorage.getItem(STORAGE_KEYS.USERS);
          const parsed = raw ? JSON.parse(raw) : null;
          if (Array.isArray(parsed)) users = parsed;
        } catch (err) {
          users = DEFAULT_USERS;
        }

        const duplicate = users.some((u) => u && u.email && u.email.toLowerCase() === email.toLowerCase());
        if (duplicate) {
          showError('An account with this email already exists. Please sign in or use another email.');
          emailInput?.closest('.form-group')?.classList.add('has-error');
          emailInput?.focus();
          return;
        }

        // Create new user with hashed password
        const avatars = [
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
          'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=160&q=80',
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=160&q=80',
        ];
        const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
        const hashedPassword = await hashPassword(password);

        registeredUser = {
          id: 'user-' + Date.now(),
          name,
          email,
          password: hashedPassword,
          avatar: randomAvatar,
          bio: 'Writer and reader on BlogSpace.',
          joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        };

        users.push(registeredUser);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        registrationSuccess = true;
      }

      setCurrentUser(registeredUser);

      const submitBtn = registerForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <svg class="spinner-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
          <span>Creating account...</span>
        `;
      }

      showToast(`Account created successfully! Welcome to BlogSpace, ${name}!`, 'success');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 700);
    });
  }
}
