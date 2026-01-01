// =============================================================================
// UNIVERSAL NOTIFICATION SYSTEM FOR MICROTECH DASHBOARD
// =============================================================================

import { showToast } from './toast.js';

export class NotificationManager {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.isDropdownOpen = false;
        this.storageKey = 'microtech_notifications';
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.bindEvents();
        this.updateBadge();
    }

    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const data = JSON.parse(stored);
                this.notifications = data.map(notification => ({
                    ...notification,
                    timestamp: new Date(notification.timestamp)
                }));
                this.updateUnreadCount();
            } else {
                this.loadDefaultNotifications();
            }
        } catch (error) {
            console.error('Error loading notifications from storage:', error);
            this.loadDefaultNotifications();
        }
    }

    saveToStorage() {
        try {
            const data = this.notifications.map(notification => ({
                ...notification,
                timestamp: notification.timestamp.toISOString()
            }));
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving notifications to storage:', error);
        }
    }

    loadDefaultNotifications() {
        // Load some sample notifications on first load
        const defaultNotifications = [
            {
                type: 'success',
                title: 'Welcome to MicroTech Dashboard',
                message: 'Notification system is now active. You will receive updates here.',
                category: 'System'
            },
            {
                type: 'info',
                title: 'New Feature: Bulk Operations',
                message: 'You can now perform bulk actions on students and staff records.',
                category: 'System'
            },
            {
                type: 'warning',
                title: 'Pending Approvals',
                message: '8 student applications are waiting for your review.',
                category: 'Students'
            },
            {
                type: 'success',
                title: 'Payment Received',
                message: 'Fee payment of ₹15,000 received from John Doe.',
                category: 'Finance'
            },
            {
                type: 'info',
                title: 'Course Update',
                message: 'Web Development course materials have been updated.',
                category: 'Courses'
            },
            {
                type: 'error',
                title: 'Action Required',
                message: 'Staff attendance records for yesterday are incomplete.',
                category: 'Staff'
            },
            {
                type: 'success',
                title: 'Export Complete',
                message: 'Student data exported successfully to Excel.',
                category: 'Students'
            },
            {
                type: 'warning',
                title: 'Follow-up Reminder',
                message: '3 counselor inquiries need follow-up today.',
                category: 'Counselors'
            }
        ];

        defaultNotifications.forEach(notification => {
            this.addNotification(notification, false); // Don't save to storage yet
        });
        
        // Save all default notifications at once
        this.saveToStorage();
    }

    bindEvents() {
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
            const notificationBell = document.getElementById('notification-bell');
            const notificationsContainer = document.getElementById('notifications-container');
            const markAllRead = document.getElementById('mark-all-read');

            if (notificationBell) {
                notificationBell.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleDropdown();
                });
            }

            if (markAllRead) {
                markAllRead.addEventListener('click', () => {
                    this.markAllAsRead();
                });
            }

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!notificationsContainer?.contains(e.target)) {
                    this.closeDropdown();
                }
            });
        }, 100);
    }

    toggleDropdown() {
        const dropdown = document.getElementById('notifications-dropdown');
        if (!dropdown) return;

        this.isDropdownOpen = !this.isDropdownOpen;
        
        if (this.isDropdownOpen) {
            dropdown.classList.add('show');
            this.renderNotifications();
        } else {
            dropdown.classList.remove('show');
        }
    }

    closeDropdown() {
        const dropdown = document.getElementById('notifications-dropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
            this.isDropdownOpen = false;
        }
    }

    addNotification(notification, saveToStorage = true) {
        const newNotification = {
            id: Date.now() + Math.random(),
            timestamp: new Date(),
            read: false,
            ...notification
        };

        this.notifications.unshift(newNotification);
        this.updateUnreadCount();
        this.updateBadge();
        
        if (this.isDropdownOpen) {
            this.renderNotifications();
        }

        // Keep only last 50 notifications
        if (this.notifications.length > 50) {
            this.notifications = this.notifications.slice(0, 50);
        }

        if (saveToStorage) {
            this.saveToStorage();
        }
    }

    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification && !notification.read) {
            notification.read = true;
            this.updateUnreadCount();
            this.updateBadge();
            this.renderNotifications();
            this.saveToStorage();
        }
    }

    markAllAsRead() {
        this.notifications.forEach(notification => {
            notification.read = true;
        });
        this.updateUnreadCount();
        this.updateBadge();
        this.renderNotifications();
        this.saveToStorage();
        if (typeof showToast === 'function') {
            showToast('All notifications marked as read', 'success');
        }
    }

    updateUnreadCount() {
        this.unreadCount = this.notifications.filter(n => !n.read).length;
    }

    updateBadge() {
        const badge = document.getElementById('notification-badge');
        if (badge) {
            badge.textContent = this.unreadCount;
            badge.style.display = this.unreadCount > 0 ? 'flex' : 'none';
        }
    }

    renderNotifications() {
        const list = document.getElementById('notifications-list');
        if (!list) return;

        if (this.notifications.length === 0) {
            list.innerHTML = `
                <div style="padding: 40px 20px; text-align: center; color: #9CA3AF;">
                    <i class="fas fa-bell-slash" style="font-size: 32px; margin-bottom: 12px; display: block;"></i>
                    No notifications yet
                </div>
            `;
            return;
        }

        list.innerHTML = this.notifications.map(notification => `
            <div class="notification-item ${!notification.read ? 'unread' : ''}" 
                 onclick="window.notificationManager.markAsRead(${notification.id})">
                <div class="notification-icon ${notification.type}">
                    <i class="fas ${this.getIconClass(notification.type)}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${this.formatTime(notification.timestamp)}</div>
                </div>
            </div>
        `).join('');
    }

    getIconClass(type) {
        const icons = {
            success: 'fa-check-circle',
            warning: 'fa-exclamation-triangle',
            error: 'fa-times-circle',
            info: 'fa-info-circle'
        };
        return icons[type] || 'fa-bell';
    }

    formatTime(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }

    // Public methods for integration with any dashboard page
    notifySuccess(title, message) {
        this.addNotification({
            type: 'success',
            title: title,
            message: message
        });
    }

    notifyInfo(title, message) {
        this.addNotification({
            type: 'info',
            title: title,
            message: message
        });
    }

    notifyWarning(title, message) {
        this.addNotification({
            type: 'warning',
            title: title,
            message: message
        });
    }

    notifyError(title, message) {
        this.addNotification({
            type: 'error',
            title: title,
            message: message
        });
    }

    // Student Management specific methods
    notifyStudentAdded(studentName) {
        this.addNotification({
            type: 'success',
            title: 'Student Added',
            message: `${studentName} has been successfully registered.`
        });
    }

    notifyStudentUpdated(studentName) {
        this.addNotification({
            type: 'info',
            title: 'Student Updated',
            message: `${studentName}'s information has been updated.`
        });
    }

    notifyStudentDeleted(studentName) {
        this.addNotification({
            type: 'warning',
            title: 'Student Deleted',
            message: `${studentName} has been removed from the system.`
        });
    }

    notifyExportComplete(type, count) {
        this.addNotification({
            type: 'success',
            title: `${type} Export Complete`,
            message: `Successfully exported ${count} records.`
        });
    }

    notifyBulkUploadComplete(count) {
        this.addNotification({
            type: 'success',
            title: 'Bulk Upload Complete',
            message: `Successfully imported ${count} records.`
        });
    }

    // Staff Management specific methods
    notifyStaffAdded(staffName) {
        this.addNotification({
            type: 'success',
            title: 'Staff Added',
            message: `${staffName} has been added to the team.`
        });
    }

    notifyStaffUpdated(staffName) {
        this.addNotification({
            type: 'info',
            title: 'Staff Updated',
            message: `${staffName}'s information has been updated.`
        });
    }

    // Revenue Management specific methods
    notifyPaymentReceived(amount, source) {
        this.addNotification({
            type: 'success',
            title: 'Payment Received',
            message: `₹${amount} received from ${source}.`
        });
    }

    notifyRevenueGoalReached(goal) {
        this.addNotification({
            type: 'success',
            title: 'Revenue Goal Reached',
            message: `Congratulations! Monthly goal of ₹${goal} achieved.`
        });
    }

    // Communication specific methods
    notifyMessageSent(recipient) {
        this.addNotification({
            type: 'success',
            title: 'Message Sent',
            message: `Message successfully sent to ${recipient}.`
        });
    }

    notifyBroadcastSent(count) {
        this.addNotification({
            type: 'success',
            title: 'Broadcast Sent',
            message: `Message broadcast to ${count} recipients.`
        });
    }

    // Course Management specific methods
    notifyCourseAdded(courseName) {
        this.addNotification({
            type: 'success',
            title: 'Course Added',
            message: `${courseName} has been added to the curriculum.`
        });
    }

    notifyCourseUpdated(courseName) {
        this.addNotification({
            type: 'info',
            title: 'Course Updated',
            message: `${courseName} information has been updated.`
        });
    }

    // Fee Management specific methods
    notifyFeeCollected(studentName, amount) {
        this.addNotification({
            type: 'success',
            title: 'Fee Collected',
            message: `₹${amount} collected from ${studentName}.`
        });
    }

    notifyFeeReminder(count) {
        this.addNotification({
            type: 'info',
            title: 'Fee Reminders Sent',
            message: `Reminders sent to ${count} students.`
        });
    }

    // System specific methods
    notifyBackupComplete() {
        this.addNotification({
            type: 'success',
            title: 'Backup Complete',
            message: 'System data has been successfully backed up.'
        });
    }

    notifySystemUpdate() {
        this.addNotification({
            type: 'info',
            title: 'System Update',
            message: 'System has been updated to the latest version.'
        });
    }

    notifyMaintenanceScheduled(date) {
        this.addNotification({
            type: 'warning',
            title: 'Maintenance Scheduled',
            message: `System maintenance scheduled for ${date}.`
        });
    }
}

// Global initialization function
export function initializeNotifications() {
    if (!window.notificationManager) {
        window.notificationManager = new NotificationManager();
        console.log('✅ Universal notification system initialized');
    }
    return window.notificationManager;
}