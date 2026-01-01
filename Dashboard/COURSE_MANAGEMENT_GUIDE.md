# 📚 Course Management Module - Complete Guide

## 🎯 Overview
Complete Course Management System for MicroTech Admin Panel with Firebase Firestore integration, real-time sync, analytics, and export capabilities.

---

## ✨ Features Implemented

### 1. **CRUD Operations**
- ✅ Create new courses with auto-generated Course ID
- ✅ Read/View course details
- ✅ Update existing courses
- ✅ Delete courses (with confirmation)
- ✅ Real-time Firestore synchronization

### 2. **Course Information**
- Course Name
- Division (CAPT/LBS/Gama)
- Duration (in months)
- Total Fee & Admission Fee
- Course Description
- Course Image URL
- Status (Active/Inactive)
- Start Date & End Date
- Multiple Course Providers
- Students Enrolled (array)
- Auto-generated Course ID
- Created/Updated timestamps

### 3. **Search & Filter**
- ✅ Search by course name or description
- ✅ Filter by division (CAPT/LBS/Gama)
- ✅ Filter by status (Active/Inactive)
- ✅ Real-time filter updates

### 4. **View Options**
- ✅ Card View (default) - Beautiful grid layout
- ✅ Table View - Compact table format
- ✅ Toggle between views seamlessly

### 5. **Provider Management**
- ✅ Add multiple providers dynamically
- ✅ Remove providers
- ✅ Display providers in course details

### 6. **Statistics Dashboard**
- ✅ Total Courses Count
- ✅ Total Enrollments
- ✅ Active Courses Count
- ✅ Total Providers Count
- ✅ Auto-updates in real-time

### 7. **Analytics & Charts**
- ✅ Courses by Division (Pie Chart)
- ✅ Enrollment Statistics (Bar Chart)
- ✅ Chart.js integration
- ✅ Responsive charts

### 8. **Export Functionality**
- ✅ Export to CSV with all course data
- ✅ Export to PDF (browser print)
- ✅ Print course details

### 9. **UI/UX Features**
- ✅ Dark theme throughout
- ✅ Responsive design (mobile & desktop)
- ✅ Beautiful modals for add/edit
- ✅ Toast notifications
- ✅ Empty state handling
- ✅ Loading states
- ✅ Smooth animations

### 10. **Role-Based Access (Ready)**
- ✅ Firebase Authentication integrated
- ✅ User role detection ready
- ✅ Can be extended for different permissions

---

## 🗄️ Firestore Database Structure

### Collection: `courses`

```javascript
{
  courseID: "CRS-1234567890-ABC123DEF",
  name: "Full Stack Web Development",
  division: "CAPT",
  duration: 6,
  totalFee: 50000,
  admissionFee: 5000,
  description: "Complete web development course...",
  providers: ["John Doe", "Jane Smith"],
  studentsEnrolled: ["studentID1", "studentID2"],
  startDate: "2025-01-15",
  endDate: "2025-07-15",
  imageURL: "https://example.com/course-image.jpg",
  status: "Active",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 🚀 How to Use

### **1. Adding a New Course**
1. Click **"Add Course"** button
2. Fill in required fields (marked with *)
3. Add course providers (click "Add Provider")
4. Click **"Save Course"**
5. Success toast will appear
6. Course will be added to Firestore and displayed

### **2. Editing a Course**
1. Click **Edit** button (✏️) on any course card
2. Modify the fields in the modal
3. Click **"Save Course"**
4. Changes will be saved to Firestore

### **3. Viewing Course Details**
1. Click **View** button (👁️) on any course card
2. View complete course information
3. Print details if needed
4. Click **Close** to exit

### **4. Deleting a Course**
1. Click **Delete** button (🗑️) on any course card
2. Confirm deletion in the dialog
3. Course will be removed from Firestore

### **5. Searching & Filtering**
- **Search**: Type in search box (searches name & description)
- **Division Filter**: Select CAPT, LBS, or Gama
- **Status Filter**: Select Active or Inactive
- Filters work together (AND logic)

### **6. Switching Views**
- Click **"Card View"** for grid layout
- Click **"Table View"** for table format

### **7. Exporting Data**
- **CSV Export**: Click "Export CSV" button
- **PDF Export**: Click "Export PDF" or use Ctrl+P

---

## 🎨 UI Components

### **Statistics Cards**
- Total Courses (Purple gradient)
- Total Enrollments (Pink gradient)
- Active Courses (Blue gradient)
- Total Providers (Green gradient)

### **Action Bar**
- Search input
- Division filter dropdown
- Status filter dropdown
- Export CSV button
- Export PDF button
- Add Course button

### **Course Cards** (Card View)
- Course image/icon
- Course name
- Division badge
- Duration, fee, enrolled count
- Description preview
- Status indicator
- Action buttons (View, Edit, Delete)

### **Course Table** (Table View)
- Compact table layout
- All course information in rows
- Action buttons in last column

### **Modals**
- Add/Edit Course Modal
- View Course Details Modal
- Smooth animations
- Dark theme styling

### **Charts**
- Division Distribution (Pie Chart)
- Enrollment Statistics (Bar Chart)

---

## 🔧 Technical Details

### **Technologies Used**
- HTML5
- CSS3 (Dark Theme)
- JavaScript ES6+ (Modules)
- Firebase SDK 10.7.1
  - Firestore (Database)
  - Authentication
- Chart.js (Analytics)
- Font Awesome (Icons)

### **Firebase Configuration**
```javascript
const firebaseConfig = {
    apiKey: "AIzaSyDUJut5RTre7-dMnZa1F7aMUgYMz3xN06Y",
    authDomain: "microtech-88235.firebaseapp.com",
    projectId: "microtech-88235",
    storageBucket: "microtech-88235.appspot.com",
    messagingSenderId: "156750699730",
    appId: "1:156750699730:web:5ec11e8b5af90a21a26159"
};
```

### **Real-Time Features**
- Firestore `onSnapshot()` listener
- Auto-updates when data changes
- Real-time statistics refresh
- Real-time chart updates

### **Code Structure**
```
courses.js
├── Imports (Firebase, Utils, Toast, Notifications)
├── Firebase Configuration
├── Global Variables
├── CourseManager Class
│   ├── Initialization
│   ├── Event Listeners
│   ├── Firestore Operations (CRUD)
│   ├── UI Rendering
│   ├── Filtering & Search
│   ├── Statistics
│   ├── Charts
│   ├── Modals
│   ├── Export Functions
│   └── Utilities
└── Document Ready Handler
```

---

## 📊 Statistics & Analytics

### **Real-Time Statistics**
- Auto-updates when courses change
- Counts active vs inactive courses
- Tracks total enrollments
- Monitors unique providers

### **Charts (Chart.js)**
- **Division Chart**: Shows distribution across CAPT/LBS/Gama
- **Enrollment Chart**: Shows top 5 courses by enrollment

---

## 🔒 Role-Based Access (Implementation Ready)

### **Current Setup**
```javascript
let userRole = 'admin'; // Default
```

### **To Implement Different Roles**

```javascript
// After authentication
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Fetch user role from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        userRole = userDoc.data().role; // 'admin', 'counselor', 'teacher', 'student'
        
        // Update UI based on role
        updateUIForRole(userRole);
    }
});

function updateUIForRole(role) {
    const addButton = document.querySelector('.btn-export');
    
    switch(role) {
        case 'admin':
            // Full access - no changes
            break;
        case 'counselor':
            // Hide delete button, allow view/edit
            document.querySelectorAll('.btn-delete').forEach(btn => btn.style.display = 'none');
            break;
        case 'teacher':
            // View only assigned courses
            addButton.style.display = 'none';
            document.querySelectorAll('.btn-edit, .btn-delete').forEach(btn => btn.style.display = 'none');
            break;
        case 'student':
            // View only enrolled courses
            addButton.style.display = 'none';
            document.querySelectorAll('.btn-edit, .btn-delete').forEach(btn => btn.style.display = 'none');
            break;
    }
}
```

---

## 🐛 Troubleshooting

### **Courses Not Loading**
1. Check Firebase configuration
2. Check Firestore rules
3. Check browser console for errors
4. Verify internet connection

### **Can't Add/Edit Courses**
1. Check Firestore write permissions
2. Verify authentication
3. Check required fields are filled

### **Charts Not Displaying**
1. Verify Chart.js CDN loaded
2. Check canvas elements exist
3. Check console for errors

### **Export Not Working**
1. **CSV**: Check browser allows downloads
2. **PDF**: Use browser print (Ctrl+P)

---

## 📝 Best Practices

### **Adding Courses**
- Use clear, descriptive names
- Add detailed descriptions
- Set appropriate fees
- Add multiple providers for accuracy
- Use high-quality image URLs

### **Managing Providers**
- Keep provider names consistent
- Update when staff changes
- Link to staff collection (future enhancement)

### **Data Management**
- Regularly export backups (CSV)
- Archive old/inactive courses
- Monitor enrollment numbers
- Update course status as needed

---

## 🔮 Future Enhancements

### **Planned Features**
1. **Student Linking**
   - Link students from student collection
   - View enrolled student details
   - Enrollment management

2. **Batch Management**
   - Multiple batches per course
   - Batch schedules
   - Batch-wise student tracking

3. **Advanced Analytics**
   - Revenue by course
   - Completion rates
   - Student feedback scores
   - Historical trends

4. **Notifications**
   - Email notifications for course updates
   - Student notifications for new courses
   - Provider notifications

5. **File Upload**
   - Upload course materials
   - Upload course images to Firebase Storage
   - Document attachments

6. **Advanced Filters**
   - Filter by fee range
   - Filter by duration
   - Filter by enrollment count
   - Sort options

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review browser console logs
3. Check Firebase console
4. Review Firestore rules

---

## 🎉 Success!

Your Course Management Module is now fully functional with:
- ✅ Complete CRUD operations
- ✅ Real-time Firestore sync
- ✅ Beautiful dark theme UI
- ✅ Search & filter capabilities
- ✅ Statistics dashboard
- ✅ Analytics charts
- ✅ Export functionality
- ✅ Responsive design
- ✅ Role-based access ready

**Start managing your courses now!** 🚀
