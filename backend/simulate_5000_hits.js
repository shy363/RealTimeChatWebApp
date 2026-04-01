async function runLoadTest() {
  const BASE_URL = 'http://localhost:5004/api';
  const TOTAL_REQUESTS = 5000;
  const CONCURRENT_BATCH = 20;
  
  console.log('🚀 Starting 5,000 Request Load Test Simulation (using fetch)...');
  
  // 1. Setup Test User
  let token = '';
  try {
    const testUser = {
      username: 'loadtester_' + Date.now(),
      email: 'tester' + Date.now() + '@example.com',
      password: 'Password123'
    };
    
    console.log('Step 1: Registering load test user...');
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser)
    });
    const regData = await regRes.json();
    token = regData.token;
    
    if (!token) throw new Error('No token received: ' + JSON.stringify(regData));
    console.log('User registered and token obtained.');
  } catch (err) {
    console.error('Setup failed:', err.message);
    return;
  }

  // 2. Perform 5000 Requests
  let successCount = 0;
  let errorCount = 0;
  const startTime = Date.now();
  
  console.log(`Step 2: Firing ${TOTAL_REQUESTS} messages in batches of ${CONCURRENT_BATCH}...`);

  for (let i = 0; i < TOTAL_REQUESTS; i += CONCURRENT_BATCH) {
    const batchSize = Math.min(CONCURRENT_BATCH, TOTAL_REQUESTS - i);
    const promises = [];
    
    for (let j = 0; j < batchSize; j++) {
      promises.push(
        fetch(`${BASE_URL}/messages/send`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ content: `Stress test message ${i + j}`, recipientId: null })
        }).then(async res => {
            if (res.ok) {
              successCount++;
            } else {
              errorCount++;
              if (errorCount <= 3) {
                const txt = await res.text();
                console.log(`Response Error: ${res.status} - ${txt}`);
              }
            }
        })
         .catch((err) => {
           errorCount++;
           if (errorCount <= 3) console.log('Network/Fetch error:', err.message);
         })
      );
    }
    
    await Promise.all(promises);
    // Tiny delay to let database release connections
    await new Promise(res => setTimeout(res, 5));
    
    if (i % 500 === 0) {
      console.log(`Progress: ${i} / ${TOTAL_REQUESTS} requests completed...`);
    }
  }

  const endTime = Date.now();
  const totalDuration = (endTime - startTime) / 1000;
  const avgResponseTime = (endTime - startTime) / TOTAL_REQUESTS;

  console.log('\n✅ Load Test Simulation Complete!');
  console.log('-----------------------------------');
  console.log(`Total Requests:    ${TOTAL_REQUESTS}`);
  console.log(`Successes:         ${successCount}`);
  console.log(`Failures:          ${errorCount}`);
  console.log(`Total Duration:    ${totalDuration.toFixed(2)} seconds`);
  console.log(`Avg Response Time: ${avgResponseTime.toFixed(2)} ms`);
  console.log(`Throughput:        ${(TOTAL_REQUESTS / totalDuration).toFixed(2)} req/sec`);
  console.log('-----------------------------------');
  
  if (successCount === TOTAL_REQUESTS) {
    console.log('🏆 RESULT: SYSTEM STABLE - 100% SUCCESS RATE');
  } else {
    console.log(`⚠️ RESULT: SYSTEM HANDLED ${((successCount/TOTAL_REQUESTS)*100).toFixed(2)}% OF TRAFFIC`);
  }
}

runLoadTest();
