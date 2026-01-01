// Courses Management JavaScript
import { initializeUserProfile, addProfileStyles } from './profile-utils.js';
import { showToast } from './toast.js';
import { NotificationManager } from '../notification-manager.js';

let notificationManager = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Courses management page loaded');
    
    // Initialize notification system
    initializeNotifications();
    
    // Initialize profile functionality
    addProfileStyles();
    initializeUserProfile();
    
    // Initialize courses-specific functionality
    initializeCoursesManagement();
});

function initializeNotifications() {
    notificationManager = new NotificationManager('courses-management');
    
    // Load some default course notifications if empty
    if (notificationManager.getUnreadCount() === 0) {
        notificationManager.addNotification({
            title: 'Welcome to Courses Management',
            message: 'Manage all academic courses and curriculum here.',
            type: 'info',
            priority: 'medium'
        });
    }
}

function initializeCoursesManagement() {
    console.log('Initializing courses management...');
    // Courses management functionality will be implemented here
    showToast('Courses management page loaded successfully', 'success');
    
    // Add course-specific notification example
    addCourseNotification(
        'Course Database Updated',
        'All course information has been synchronized.',
        'success'
    );
}

// Function to add course-related notifications
function addCourseNotification(title, message, type = 'info') {
    if (notificationManager) {
        notificationManager.notifyCourseUpdated(title, message, type);
    }
}