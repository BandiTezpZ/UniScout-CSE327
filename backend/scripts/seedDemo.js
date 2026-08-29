require('dotenv').config();
const fs = require('fs'); const path = require('path'); const { v4: uuid } = require('uuid');
const file = path.join(__dirname, '../data/local_db.json');
const required = ['DEMO_STUDENT_PASSWORD','DEMO_FACULTY_PASSWORD','DEMO_ADMIN_PASSWORD'];
if (required.some(k => !process.env[k])) { console.error(`Set ${required.join(', ')} before running the demo seed.`); process.exit(1); }
(async()=>{const now=new Date().toISOString(); const data={users:[],verification_tokens:[],student_profiles:[],recommendation_requests:[]};
const studentId=1,facultyId=2,adminId=3;
data.users.push(
 {id:studentId,fullName:'Demo Student',email:'student@uniscout.test',password:process.env.DEMO_STUDENT_PASSWORD,mobileNumber:'01700000001',role:'Student',email_verified:true,isVerified:true,isBlocked:false,verification_otp:null,otp_expires_at:null,createdAt:now},
 {id:facultyId,fullName:'Dr. Demo Faculty',email:'faculty@uniscout.test',password:process.env.DEMO_FACULTY_PASSWORD,mobileNumber:'01700000002',role:'Faculty',email_verified:true,isVerified:true,isBlocked:false,verification_otp:null,otp_expires_at:null,institution:'UniScout University',department:'Computer Science',designation:'Associate Professor',createdAt:now},
 {id:adminId,fullName:'Demo Admin',email:'admin@uniscout.test',password:process.env.DEMO_ADMIN_PASSWORD,mobileNumber:'01700000003',role:'Admin',email_verified:true,isVerified:true,isBlocked:false,verification_otp:null,otp_expires_at:null,createdAt:now});
data.student_profiles.push({id:uuid(),userId:studentId,skills:[],createdAt:now});
data.recommendation_requests.push({id:uuid(),studentId,studentName:'Demo Student',studentEmail:'student@uniscout.test',facultyName:'Dr. Demo Faculty',facultyEmail:'faculty@uniscout.test',facultyInstitution:'UniScout University',facultyDepartment:'Computer Science',facultyDesignation:'Associate Professor',relationshipToStudent:'Course instructor',coursesTaught:'Algorithms',purpose:'Graduate admission',studentMessage:'Thank you for considering my request.',deadline:new Date(Date.now()+30*86400000).toISOString().slice(0,10),status:'pending',respondedAt:null,createdAt:now,updatedAt:now});
fs.writeFileSync(file,JSON.stringify(data,null,2)); console.log('Seeded development demo accounts and one pending recommendation request.');})();
