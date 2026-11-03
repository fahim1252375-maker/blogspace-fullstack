/**
 * BlogSpace - Backend JWT Authentication Module
 * Handles API-based user registration and login, form validation,
 * password visibility, password strength feedback, and JWT sessions.
 */

import {
  setCurrentUser,
  setAuthToken,
  showToast,
} from './blog.js';

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

  // Pre-fill remembered email if available
  const rememberedEmail = localStorage.getItem('blogspace_remembered_email');
  if (rememberedEmail && emailInput) {
    emailInput.value = rememberedEmail;
    if (rememberCheckbox) rememberCheckbox.checked = true;
  }

  // Forgot password notice handler
  const forgotPasswordLink = document.getElementById('forgot-password-link');
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('Password reset is not available yet. Please contact the site administrator for help.', 'info', 4500);
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

  let loginSubmitting = false;
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (loginSubmitting) return;
      clearErrors();

      const email = emailInput?.value.trim() || '';
      const password = passwordInput?.value || '';

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

      loginSubmitting = true;
      const loginSubmitBtn = loginForm.querySelector('button[type="submit"]');
      if (loginSubmitBtn) loginSubmitBtn.disabled = true;

      // Authenticate only through the backend JWT API. Never fall back to LocalStorage users.
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.success || !data.user || !data.token) {
          showError(data.message || 'Invalid email or password.');
          loginSubmitting = false;
          if (loginSubmitBtn) loginSubmitBtn.disabled = false;
          return;
        }

        setAuthToken(data.token, Boolean(rememberCheckbox?.checked));
        setCurrentUser(data.user);
      } catch (apiErr) {
        console.error('[BlogSpace Auth] Login API unavailable:', apiErr);
        showError('Unable to connect to the authentication server. Please try again when the server is available.');
        loginSubmitting = false;
        if (loginSubmitBtn) loginSubmitBtn.disabled = false;
        return;
      }

      // Remember me logic
      if (rememberCheckbox && rememberCheckbox.checked) {
        localStorage.setItem('blogspace_remembered_email', email);
      } else {
        localStorage.removeItem('blogspace_remembered_email');
      }

      // Submit feedback button animation
      const submitBtn = loginSubmitBtn;
      if (submitBtn) {
        submitBtn.innerHTML = `
          <svg class="spinner-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
          <span>Signing in...</span>
        `;
      }

      showToast('Login successful. Welcome back!', 'success');
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

  let registerSubmitting = false;
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (registerSubmitting) return;
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

      registerSubmitting = true;
      const registerSubmitBtn = registerForm.querySelector('button[type="submit"]');
      if (registerSubmitBtn) registerSubmitBtn.disabled = true;

      // Create accounts only through the backend; browser storage is never an account database.
      let registeredUser;
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.success || !data.user || !data.token) {
          showError(data.message || 'Registration failed. Please try again.');
          emailInput?.closest('.form-group')?.classList.add('has-error');
          registerSubmitting = false;
          if (registerSubmitBtn) registerSubmitBtn.disabled = false;
          return;
        }

        registeredUser = data.user;
        setAuthToken(data.token, false);
      } catch (apiErr) {
        console.error('[BlogSpace Auth] Registration API unavailable:', apiErr);
        showError('Unable to connect to the registration server. Please try again when the server is available.');
        registerSubmitting = false;
        if (registerSubmitBtn) registerSubmitBtn.disabled = false;
        return;
      }

      setCurrentUser(registeredUser);

      const submitBtn = registerSubmitBtn;
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
