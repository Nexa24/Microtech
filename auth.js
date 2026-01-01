// Show/Hide loading overlay
function showLoading(show = true) {
  const loader = document.getElementById("loadingOverlay");
  if (loader) {
    loader.style.display = show ? "flex" : "none";
  }
}

// ==== NOTIFICATION SYSTEM ====
function showToast(message, type = 'info', title = '') {
  // Create toast container if it doesn't exist
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = {
    success: '✓',
    error: '✕',
    warning: '!',
    info: 'i'
  };

  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-content">
      ${title ? `<div class="toast-title">${title}</div>` : ''}
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;

  container.appendChild(toast);

  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

function showAlert(message, type = 'info', title = '') {
  const overlay = document.createElement('div');
  overlay.className = 'custom-alert-overlay';
  
  const icons = {
    success: '✓',
    error: '✕',
    warning: '!',
    info: 'i'
  };
  
  const titles = {
    success: title || 'Success',
    error: title || 'Error',
    warning: title || 'Warning',
    info: title || 'Information'
  };

  overlay.innerHTML = `
    <div class="custom-alert-box ${type}">
      <div class="custom-alert-header">
        <div class="custom-alert-icon">${icons[type] || icons.info}</div>
        <div class="custom-alert-title">${titles[type]}</div>
      </div>
      <div class="custom-alert-body">${message}</div>
      <div class="custom-alert-footer">
        <button class="custom-alert-btn custom-alert-btn-primary" onclick="this.closest('.custom-alert-overlay').remove()">OK</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  
  // Remove on background click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

// Show error on input field
function showInputError(inputId, message) {
  const input = document.getElementById(inputId);
  if (!input) return;
  
  input.classList.add('error');
  
  // Remove existing error message
  const existingError = input.parentElement.querySelector('.error-message');
  if (existingError) existingError.remove();
  
  // Add new error message
  const errorMsg = document.createElement('div');
  errorMsg.className = 'error-message';
  errorMsg.textContent = message;
  input.parentElement.appendChild(errorMsg);
  
  // Remove error on input
  input.addEventListener('input', function removeError() {
    input.classList.remove('error');
    const errMsg = input.parentElement.querySelector('.error-message');
    if (errMsg) errMsg.remove();
    input.removeEventListener('input', removeError);
  });
}

// ==== Firebase Setup ====
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getFirestore,
  getDoc,
  setDoc,
  doc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD5pgNOjCXdkopJW_mtqTpnaa-8MyUZzHc",
  authDomain: "microtech-88235.firebaseapp.com",
  projectId: "microtech-88235",
  storageBucket: "microtech-88235.firebasestorage.app",
  messagingSenderId: "177325108755",
  appId: "1:177325108755:web:37d5a44e9a721a501359e6",
  measurementId: "G-0NXTJF6L49"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===== WAIT FOR DOM TO LOAD =====
document.addEventListener('DOMContentLoaded', () => {
  
  // Auto-fill email if remembered
  const rememberMe = localStorage.getItem('rememberMe');
  const lastEmail = localStorage.getItem('lastEmail');
  
  if (rememberMe === 'true' && lastEmail) {
    const emailInput = document.getElementById('loginEmail');
    const rememberCheckbox = document.getElementById('rememberMe');
    if (emailInput) emailInput.value = lastEmail;
    if (rememberCheckbox) rememberCheckbox.checked = true;
  }

  // ===== LOGIN FORM SUBMISSION =====
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value.trim();
      const rememberMeChecked = document.getElementById("rememberMe")?.checked || false;

      // Basic validation
      if (!email || !password) {
        showInputError('loginEmail', !email ? 'Email is required' : '');
        showInputError('loginPassword', !password ? 'Password is required' : '');
        showToast('Please enter both email and password.', 'error', 'Validation Error');
        return;
      }

      try {
        showLoading(true);
        
        // Set persistence based on remember me
        if (rememberMeChecked) {
          await setPersistence(auth, browserLocalPersistence);
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('lastEmail', email);
        } else {
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('lastEmail');
        }
        
        // Sign in with Firebase
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Get user data from Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        let userData;
        
        if (!userDoc.exists()) {
          // If no user document, create a default admin profile for this user
          console.log("User document not found, creating default admin profile");
          
          userData = {
            email: user.email,
            role: "admin",
            createdAt: new Date(),
            name: user.email.split('@')[0]
          };
          
          try {
            await setDoc(userDocRef, userData);
            console.log("Default admin profile created successfully");
            showToast('Welcome! Your admin profile has been created.', 'success', 'Profile Created');
          } catch (createError) {
            console.error("Error creating user profile:", createError);
            showAlert("Unable to create user profile. Please contact support.", 'error', 'Profile Error');
            await auth.signOut();
            showLoading(false);
            return;
          }
        } else {
          userData = userDoc.data();
        }

        // Redirect based on user role
        switch (userData.role) {
          case "admin":
            window.location.href = "Dashboard/admin-dashboard.html";
            break;
          case "counselor":
            window.location.href = "Dashboard/counselor-dashboard.html";
            break;
          case "teacher":
            window.location.href = "Dashboard/teacher-dashboard.html";
            break;
          case "student":
            window.location.href = "Dashboard/student-dashboard.html";
            break;
          default:
            showAlert("Invalid user role. Please contact support.", 'error', 'Access Denied');
            await auth.signOut();
            showLoading(false);
        }

      } catch (error) {
        console.error("Login error:", error);
        
        // User-friendly error messages
        let errorTitle = "Login Failed";
        let errorMessage = "";
        
        switch (error.code) {
          case 'auth/invalid-email':
            errorMessage = "Invalid email format. Please check and try again.";
            showInputError('loginEmail', 'Invalid email format');
            break;
          case 'auth/user-disabled':
            errorMessage = "This account has been disabled. Please contact support.";
            break;
          case 'auth/user-not-found':
            errorMessage = "No account found with this email address.";
            showInputError('loginEmail', 'Account not found');
            break;
          case 'auth/wrong-password':
            errorMessage = "Incorrect password. Please try again.";
            showInputError('loginPassword', 'Incorrect password');
            break;
          case 'auth/invalid-credential':
            errorMessage = "Invalid email or password. Please check your credentials.";
            showInputError('loginEmail', '');
            showInputError('loginPassword', 'Invalid credentials');
            break;
          case 'auth/too-many-requests':
            errorMessage = "Too many failed login attempts. Please try again later.";
            errorTitle = "Account Temporarily Locked";
            break;
          case 'auth/network-request-failed':
            errorMessage = "Network error. Please check your internet connection.";
            errorTitle = "Connection Error";
            break;
          default:
            errorMessage = error.message || "An unexpected error occurred. Please try again.";
        }
        
        showAlert(errorMessage, 'error', errorTitle);
        showLoading(false);
      }
    });
  }
});

// ===== HANDLE FORGOT PASSWORD LINK =====
const forgotLink = document.querySelector('.forgot-link');
if (forgotLink) {
  forgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail')?.value.trim();
    
    if (!email) {
      showToast("Please enter your email address first", 'warning', 'Email Required');
      showInputError('loginEmail', 'Enter your email to reset password');
      return;
    }
    
    showAlert(`Password reset instructions will be sent to:<br><strong>${email}</strong><br><br>This feature is coming soon. Please contact admin for now.`, 'info', 'Password Reset');
  });
}

// ===== HANDLE REGISTER LINK =====
const registerLink = document.querySelector('.register-link');
if (registerLink) {
  registerLink.addEventListener('click', (e) => {
    e.preventDefault();
    showAlert("Registration is currently managed by administrators only.<br><br>Please contact <strong>support@microtech.com</strong> for account creation.", 'info', 'Registration Info');
  });
}

// ===== CHECK IF ALREADY LOGGED IN =====
// Only redirect if we're on the auth page
const isAuthPage = window.location.pathname.endsWith('auth.html') || window.location.pathname === '/';

if (isAuthPage) {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Redirect to appropriate dashboard
          switch (userData.role) {
            case "admin":
              window.location.href = "Dashboard/admin-dashboard.html";
              break;
            case "counselor":
              window.location.href = "Dashboard/counselor-dashboard.html";
              break;
            case "teacher":
              window.location.href = "Dashboard/teacher-dashboard.html";
              break;
            case "student":
              window.location.href = "Dashboard/student-dashboard.html";
              break;
          }
        }
      } catch (error) {
        console.error("Error checking auth state:", error);
      }
    }
  });
}
