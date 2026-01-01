// =============================================================================
// NOTIFICATIONS PAGE - COMPREHENSIVE DISPLAY
// =============================================================================

import { showToast } from './toast.js';
import { NotificationManager, initializeNotifications } from './notification-manager.js';

// Global state
let notificationManager;
let currentFilter = 'all';
let allNotifications = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📢 Notifications page initializing...');
    
    // Initialize notification manager
    notificationManager = initializeNotifications();
    
    // Small delay to ensure manager is ready
    setTimeout(() => {
        loadAllNotifications();
        setupEventListeners();
    }, 200);
});

/**
 * Load all notifications from the manager
 */
function loadAllNotifications() {
    if (!notificationManager) {
        console.error('❌ Notification manager not initialized');
        return;
    }
    
    allNotifications = notificationManager.notifications || [];
    console.log(`📢 Loaded ${allNotifications.length} notifications`);
    
    if (allNotifications.length === 0) {
        console.warn('⚠️ No notifications found. Click "Reset Notifications" to load defaults.');
    }
    
    updateStats();
    renderNotifications();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            filterButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked
            btn.classList.add('active');
            // Set current filter
            currentFilter = btn.getAttribute('data-filter');
            // Re-render
            renderNotifications();
        });
    });
    
    // Mark all as read
    const markAllReadBtn = document.getElementById('mark-all-read-btn');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', () => {
            notificationManager.markAllAsRead();
            loadAllNotifications();
            showToast('All notifications marked as read', 'success');
        });
    }
    
    // Clear all
    const clearAllBtn = document.getElementById('clear-all-btn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all notifications? This action cannot be undone.')) {
                notificationManager.notifications = [];
                notificationManager.saveToStorage();
                loadAllNotifications();
                showToast('All notifications cleared', 'info');
            }
        });
    }
    
    // Reset notifications (load default samples)
    const resetBtn = document.getElementById('reset-notifications-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            // Clear localStorage and reload
            localStorage.removeItem('microtech_notifications');
            showToast('Resetting notifications...', 'info');
            setTimeout(() => {
                location.reload();
            }, 500);
        });
    }
}

/**
 * Update statistics
 */
function updateStats() {
    const totalEl = document.getElementById('total-notifications');
    const unreadEl = document.getElementById('unread-notifications');
    
    if (totalEl) {
        totalEl.textContent = allNotifications.length;
    }
    
    if (unreadEl) {
        const unreadCount = allNotifications.filter(n => !n.read).length;
        unreadEl.textContent = unreadCount;
    }
}

/**
 * Render notifications based on current filter
 */
function renderNotifications() {
    const container = document.getElementById('notifications-page-list');
    const emptyState = document.getElementById('empty-state');
    
    if (!container) return;
    
    // Filter notifications
    let filtered = [...allNotifications];
    
    switch(currentFilter) {
        case 'success':
            filtered = filtered.filter(n => n.type === 'success');
            break;
        case 'info':
            filtered = filtered.filter(n => n.type === 'info');
            break;
        case 'warning':
            filtered = filtered.filter(n => n.type === 'warning');
            break;
        case 'error':
            filtered = filtered.filter(n => n.type === 'error');
            break;
        case 'unread':
            filtered = filtered.filter(n => !n.read);
            break;
        case 'all':
        default:
            // Show all
            break;
    }
    
    // Check if empty
    if (filtered.length === 0) {
        container.style.display = 'none';
        if (emptyState) {
            emptyState.style.display = 'block';
        }
        return;
    }
    
    container.style.display = 'block';
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    // Render notifications
    container.innerHTML = filtered.map(notification => `
        <div class="notification-page-item ${!notification.read ? 'unread' : ''}" 
             onclick="markAsRead('${notification.id}')">
            <div class="notification-page-icon ${notification.type}">
                <i class="fas ${getIconClass(notification.type)}"></i>
            </div>
            <div class="notification-page-content">
                <div class="notification-page-header">
                    <div>
                        <div class="notification-page-title">${notification.title}</div>
                        <div class="notification-page-message">${notification.message}</div>
                        ${notification.category ? `<span class="notification-page-category">${notification.category}</span>` : ''}
                    </div>
                    <div class="notification-page-time">${formatTime(notification.timestamp)}</div>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Mark notification as read
 */
window.markAsRead = function(notificationId) {
    notificationManager.markAsRead(parseFloat(notificationId));
    loadAllNotifications();
};

/**
 * Get icon class based on notification type
 */
function getIconClass(type) {
    const icons = {
        success: 'fa-check-circle',
        warning: 'fa-exclamation-triangle',
        error: 'fa-times-circle',
        info: 'fa-info-circle'
    };
    return icons[type] || 'fa-bell';
}

/**
 * Format timestamp
 */
function formatTime(timestamp) {
    const now = new Date();
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    // Format as date
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
}

console.log('✅ Notifications page module loaded');