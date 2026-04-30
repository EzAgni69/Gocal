import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

async function runTests() {
    console.log('--- Running Vulnerability Tests ---');

    // 1. Test Card Request without auth
    console.log('\\n[TEST 1] Testing POST /api/card-requests without auth...');
    const cardRes = await fetch(`${API_BASE}/card-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            planType: 'card_only', fullName: 'Test', phone: '123',
            businessName: 'Test', category: 'Test', city: 'Test'
        })
    });
    console.log(`Status expected: 401. Received: ${cardRes.status}`);

    // 2. Test Rate Limiting
    console.log('\\n[TEST 2] Testing Rate Limits on /api/places...');
    let rateLimitExceeded = false;
    for(let i=0; i<60; i++) {
        const lpRes = await fetch(`${API_BASE}/`);
        if(lpRes.status === 429) {
            rateLimitExceeded = true;
            break;
        }
    }
    // We configured max 1000 per 15 minutes, so 60 requests won't triggger it, but let's check headers.
    const headersRes = await fetch(`${API_BASE}/places/autocomplete?input=vadodara`);
    console.log(`Rate limit headers present: ${headersRes.headers.has('ratelimit-limit')}`);
    
    // 3. Test global error handler stack trace leakage
    console.log('\\n[TEST 3] Testing Global Error Handler...');
    const errRes = await fetch(`${API_BASE}/places/invalid_route_that_throws`);
    const errBody = await errRes.text();
    console.log(`Status: ${errRes.status}`);
    console.log('Stack trace hidden:', !errBody.includes('.ts:') && !errBody.includes('node_modules'));

    console.log('\\n--- Tests Completed ---');
}

runTests().catch(console.error);
