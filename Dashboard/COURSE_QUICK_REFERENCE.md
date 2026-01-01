# 🚀 Course Management - Quick Reference

## 📋 Quick Actions

| Action | Steps |
|--------|-------|
| **Add Course** | Click "Add Course" → Fill form → Click "Save Course" |
| **Edit Course** | Click ✏️ on course card → Modify → Save |
| **View Details** | Click 👁️ on course card |
| **Delete Course** | Click 🗑️ on course card → Confirm |
| **Search** | Type in search box |
| **Filter** | Use division/status dropdowns |
| **Switch View** | Click "Card View" or "Table View" |
| **Export CSV** | Click "Export CSV" button |
| **Export PDF** | Click "Export PDF" or Ctrl+P |

---

## 🎯 Required Fields (Add/Edit)

✅ Course Name  
✅ Division (CAPT/LBS/Gama)  
✅ Duration (months)  
✅ Total Fee  
✅ Admission Fee  
✅ Status (Active/Inactive)  

Optional: Start Date, End Date, Description, Image URL, Providers

---

## 📊 Statistics Overview

- **Total Courses**: All courses in database
- **Total Enrollments**: Sum of all enrolled students
- **Active Courses**: Courses with status = Active
- **Total Providers**: Unique provider count

---

## 🎨 Division Badges

- 🟣 **CAPT** - Purple badge
- 🔴 **LBS** - Pink badge
- 🟢 **Gama** - Green badge

---

## 🔧 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+P` | Print/Export PDF |
| `Esc` | Close modal |
| `Enter` | Submit form (in modal) |

---

## 🗄️ Firestore Collection

**Collection Name**: `courses`

**Auto-Generated Fields**:
- `courseID` - Unique identifier
- `createdAt` - Timestamp
- `updatedAt` - Timestamp
- `studentsEnrolled` - Array (initially empty)

---

## 🎭 Features at a Glance

✅ Real-time sync  
✅ Search & filter  
✅ Two view modes  
✅ Statistics dashboard  
✅ Analytics charts  
✅ CSV export  
✅ PDF print  
✅ Dark theme  
✅ Responsive design  
✅ Toast notifications  
✅ Modal forms  
✅ Provider management  
✅ Image support  

---

## 🐛 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Courses not loading | Check Firebase config & internet |
| Can't add course | Fill all required fields |
| Export not working | Check browser download settings |
| Charts not showing | Verify Chart.js CDN loaded |

---

## 📱 Mobile Support

✅ Fully responsive  
✅ Touch-friendly buttons  
✅ Swipe-friendly cards  
✅ Optimized layouts  

---

## 🔐 Security

- Firebase Authentication integrated
- Firestore security rules enforced
- Role-based access ready
- Data validation on client & server

---

## 📈 Analytics

**Division Chart** (Pie)
- Shows course distribution by division
- Updates in real-time

**Enrollment Chart** (Bar)
- Shows top 5 courses by enrollment
- Updates in real-time

---

## 💾 Data Backup

**Recommended**: Export CSV daily/weekly
**Location**: Downloads folder
**Format**: `courses_YYYY-MM-DD.csv`

---

## 🎓 Provider Management

- Add unlimited providers per course
- Remove providers with ❌ button
- Display in course details
- Optional field (can be empty)

---

## 📞 Need Help?

1. Check `COURSE_MANAGEMENT_GUIDE.md`
2. Review browser console (F12)
3. Check Firebase Console
4. Verify Firestore rules

---

**Version**: 1.0.0  
**Last Updated**: October 12, 2025  
**Status**: ✅ Production Ready
