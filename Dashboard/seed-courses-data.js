/**
 * ============================================
 * FIREBASE COURSES COLLECTION - SAMPLE DATA SEEDER
 * ============================================
 * 
 * This script adds sample course data to your Firestore database
 * Use this for testing and demonstration purposes
 * 
 * HOW TO USE:
 * 1. Make sure you're authenticated as an admin
 * 2. Run this in browser console on courses.html page
 * 3. Or integrate into your admin panel
 */

// Sample courses data
const sampleCourses = [
  {
    courseID: `CRS-${Date.now()}-CAPT001`,
    name: "Full Stack Web Development",
    division: "CAPT",
    duration: 6,
    totalFee: 50000,
    admissionFee: 5000,
    status: "Active",
    description: "Master modern web development with HTML5, CSS3, JavaScript, React, Node.js, MongoDB, and deployment. Build real-world projects and become a professional web developer.",
    imageURL: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800",
    startDate: "2025-01-15",
    endDate: "2025-07-15",
    providers: ["John Doe", "Jane Smith"],
    studentsEnrolled: []
  },
  {
    courseID: `CRS-${Date.now() + 1}-CAPT002`,
    name: "Python Programming & Data Science",
    division: "CAPT",
    duration: 4,
    totalFee: 40000,
    admissionFee: 4000,
    status: "Active",
    description: "Learn Python from basics to advanced including data science, machine learning, pandas, numpy, and data visualization. Perfect for beginners and professionals.",
    imageURL: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800",
    startDate: "2025-02-01",
    endDate: "2025-06-01",
    providers: ["Dr. Sharma", "Prof. Kumar"],
    studentsEnrolled: []
  },
  {
    courseID: `CRS-${Date.now() + 2}-CAPT003`,
    name: "Mobile App Development",
    division: "CAPT",
    duration: 5,
    totalFee: 45000,
    admissionFee: 4500,
    status: "Active",
    description: "Create iOS and Android apps using React Native. Learn mobile UI/UX, app architecture, API integration, and publish apps to App Store and Google Play.",
    imageURL: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800",
    startDate: "2025-01-20",
    endDate: "2025-06-20",
    providers: ["Sarah Johnson"],
    studentsEnrolled: []
  },
  {
    courseID: `CRS-${Date.now() + 3}-LBS001`,
    name: "Digital Marketing Professional",
    division: "LBS",
    duration: 3,
    totalFee: 35000,
    admissionFee: 3500,
    status: "Active",
    description: "Master digital marketing strategies including SEO, SEM, social media marketing, content marketing, email campaigns, and analytics. Get Google certified.",
    imageURL: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
    startDate: "2025-02-01",
    endDate: "2025-05-01",
    providers: ["Rahul Verma"],
    studentsEnrolled: []
  },
  {
    courseID: `CRS-${Date.now() + 4}-LBS002`,
    name: "Business Management & Leadership",
    division: "LBS",
    duration: 6,
    totalFee: 55000,
    admissionFee: 5500,
    status: "Active",
    description: "Develop essential business management skills including leadership, strategy, finance, operations, and team management. Perfect for entrepreneurs and managers.",
    imageURL: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800",
    startDate: "2025-01-10",
    endDate: "2025-07-10",
    providers: ["Dr. Priya Singh", "Mr. Arjun Mehta"],
    studentsEnrolled: []
  },
  {
    courseID: `CRS-${Date.now() + 5}-LBS003`,
    name: "Financial Planning & Analysis",
    division: "LBS",
    duration: 4,
    totalFee: 42000,
    admissionFee: 4200,
    status: "Active",
    description: "Learn financial planning, investment strategies, accounting, taxation, and financial analysis. Prepare for professional certifications.",
    imageURL: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800",
    startDate: "2025-02-15",
    endDate: "2025-06-15",
    providers: ["CA Rajesh Kumar"],
    studentsEnrolled: []
  },
  {
    courseID: `CRS-${Date.now() + 6}-GAMA001`,
    name: "Fashion Design Fundamentals",
    division: "Gama",
    duration: 12,
    totalFee: 80000,
    admissionFee: 10000,
    status: "Active",
    description: "Comprehensive fashion design course covering sketching, pattern making, fabrics, garment construction, fashion illustration, and portfolio development.",
    imageURL: "https://images.unsplash.com/photo-1558769132-cb1aea1c036c?w=800",
    startDate: "2025-01-05",
    endDate: "2026-01-05",
    providers: ["Aisha Khan", "Rajesh Malhotra"],
    studentsEnrolled: []
  },
  {
    courseID: `CRS-${Date.now() + 7}-GAMA002`,
    name: "Interior Design Professional",
    division: "Gama",
    duration: 8,
    totalFee: 65000,
    admissionFee: 7000,
    status: "Active",
    description: "Learn interior design principles, space planning, color theory, furniture design, 3D visualization, and project management for residential and commercial spaces.",
    imageURL: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800",
    startDate: "2025-01-25",
    endDate: "2025-09-25",
    providers: ["Neha Kapoor"],
    studentsEnrolled: []
  },
  {
    courseID: `CRS-${Date.now() + 8}-GAMA003`,
    name: "Graphic Design & Visual Communication",
    division: "Gama",
    duration: 6,
    totalFee: 48000,
    admissionFee: 5000,
    status: "Active",
    description: "Master graphic design using Adobe Creative Suite. Learn typography, branding, logo design, print media, digital design, and create professional portfolios.",
    imageURL: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800",
    startDate: "2025-02-10",
    endDate: "2025-08-10",
    providers: ["Vikram Desai", "Ananya Shah"],
    studentsEnrolled: []
  },
  {
    courseID: `CRS-${Date.now() + 9}-CAPT004`,
    name: "Cybersecurity Fundamentals",
    division: "CAPT",
    duration: 5,
    totalFee: 52000,
    admissionFee: 5200,
    status: "Active",
    description: "Learn cybersecurity essentials including network security, ethical hacking, penetration testing, security audits, and industry certifications preparation.",
    imageURL: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800",
    startDate: "2025-03-01",
    endDate: "2025-08-01",
    providers: ["Amit Sharma"],
    studentsEnrolled: []
  },
  {
    courseID: `CRS-${Date.now() + 10}-LBS004`,
    name: "Human Resource Management",
    division: "LBS",
    duration: 4,
    totalFee: 38000,
    admissionFee: 3800,
    status: "Inactive",
    description: "Learn HR fundamentals including recruitment, training, performance management, employee relations, and HR analytics. Perfect for HR professionals.",
    imageURL: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800",
    startDate: "2025-04-01",
    endDate: "2025-08-01",
    providers: ["Priya Reddy"],
    studentsEnrolled: []
  },
  {
    courseID: `CRS-${Date.now() + 11}-GAMA004`,
    name: "Photography & Videography",
    division: "Gama",
    duration: 5,
    totalFee: 55000,
    admissionFee: 5500,
    status: "Active",
    description: "Professional photography and videography course covering camera techniques, lighting, composition, editing, and building a creative portfolio.",
    imageURL: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800",
    startDate: "2025-02-20",
    endDate: "2025-07-20",
    providers: ["Karan Johar", "Maya Kapoor"],
    studentsEnrolled: []
  }
];

/**
 * Function to add all sample courses to Firestore
 * Run this function in browser console or integrate into admin panel
 */
async function seedCoursesData() {
  console.log('🌱 Starting to seed courses data...');
  
  // Check if Firebase is initialized
  if (typeof db === 'undefined') {
    console.error('❌ Firebase not initialized. Make sure you are on the courses.html page.');
    return;
  }
  
  const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const course of sampleCourses) {
    try {
      // Add timestamps
      const courseData = {
        ...course,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Add to Firestore
      const docRef = await addDoc(collection(db, 'courses'), courseData);
      console.log(`✅ Added: ${course.name} (ID: ${docRef.id})`);
      successCount++;
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`❌ Error adding ${course.name}:`, error);
      errorCount++;
    }
  }
  
  console.log('\n📊 Seeding Complete!');
  console.log(`✅ Success: ${successCount} courses`);
  console.log(`❌ Errors: ${errorCount} courses`);
  console.log(`📚 Total: ${sampleCourses.length} courses\n`);
  
  if (successCount > 0) {
    console.log('🎉 Refresh the page to see your courses!');
  }
}

/**
 * Function to clear all courses (use with caution!)
 */
async function clearAllCourses() {
  const confirmDelete = confirm('⚠️ Are you sure you want to delete ALL courses? This cannot be undone!');
  
  if (!confirmDelete) {
    console.log('❌ Operation cancelled');
    return;
  }
  
  console.log('🗑️ Deleting all courses...');
  
  const { collection, getDocs, deleteDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
  
  const querySnapshot = await getDocs(collection(db, 'courses'));
  let deleteCount = 0;
  
  for (const document of querySnapshot.docs) {
    await deleteDoc(doc(db, 'courses', document.id));
    deleteCount++;
  }
  
  console.log(`✅ Deleted ${deleteCount} courses`);
}

// Export functions for use
if (typeof window !== 'undefined') {
  window.seedCoursesData = seedCoursesData;
  window.clearAllCourses = clearAllCourses;
  window.sampleCourses = sampleCourses;
}

// Instructions
console.log(`
╔════════════════════════════════════════════════════════════╗
║       Firebase Courses Collection - Sample Data Seeder      ║
╚════════════════════════════════════════════════════════════╝

📚 12 Sample Courses Ready:
   • 4 CAPT courses (Computer Training)
   • 4 LBS courses (Business Studies)  
   • 4 Gama courses (Creative Arts)

🚀 To add sample courses:
   1. Open courses.html in your browser
   2. Open browser console (F12)
   3. Run: seedCoursesData()

🗑️ To delete all courses:
   Run: clearAllCourses()

📊 To view sample data:
   Run: console.table(sampleCourses)

⚠️ Note: You must be authenticated as an admin to add courses
`);
