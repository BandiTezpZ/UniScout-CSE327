async function test() {
  try {
    const ts = Date.now();
    // Register student
    const sRes = await fetch('http://localhost:5001/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Student Test', email: `stu${ts}@test.com`, password: 'password', role: 'Student', mobileNumber: '01700000000' })
    });
    console.log(await sRes.text());
    
    // Register faculty
    const fRes = await fetch('http://localhost:5001/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Faculty Test', email: `fac${ts}@test.com`, password: 'password', role: 'Faculty', mobileNumber: '01800000000', institution: 'MIT', department: 'CS', designation: 'Professor' })
    });
    console.log(await fRes.text());
    
    // Login student
    const sLog = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `stu${ts}@test.com`, password: 'password' })
    });
    const sData = await sLog.json();
    const sToken = sData.token;
    
    // Login faculty
    const fLog = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `fac${ts}@test.com`, password: 'password' })
    });
    const fData = await fLog.json();
    const fToken = fData.token;
    
    // Create recommendation
    const recRes = await fetch('http://localhost:5001/api/recommendations', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sToken}` },
      body: JSON.stringify({
        facultyName: 'Faculty Test', facultyEmail: `fac${ts}@test.com`,
        relationshipToStudent: 'Professor', purpose: 'Grad School',
        deadline: '2030-12-31'
      })
    });
    console.log('Create rec status:', recRes.status);
    console.log('Create rec body:', await recRes.text());
    
    // List faculty
    const flRes = await fetch('http://localhost:5001/api/recommendations/faculty', {
      headers: { 'Authorization': `Bearer ${fToken}` }
    });
    console.log('Faculty list body:', await flRes.text());
    
  } catch (err) {
    console.error(err);
  }
}
test();
