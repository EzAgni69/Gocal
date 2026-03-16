const http = require('http');
const fs = require('fs');

const data = JSON.stringify({
  planType: 'card_only',
  fullName: 'Test User',
  phone: '1234567890',
  businessName: 'Test Business',
  category: 'Other',
  city: 'Test City'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/card-requests',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', d => { body += d; });
  res.on('end', () => {
    fs.writeFileSync('/Users/agni/Developer/Vanij/api-resp.txt', `STATUS: ${res.statusCode}\nBODY: ${body}`);
  });
});

req.on('error', error => {
    fs.writeFileSync('/Users/agni/Developer/Vanij/api-resp.txt', `ERROR: ${error.message}`);
});

req.write(data);
req.end();
