const fetch = require('node:fetch');

async function test() {
  const url = 'http://localhost:3001/api/places/search?query=pharmacies&pincode=110001'\;
  console.log('Sending request to', url);
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(`Received ${data.places?.length} places. First place:`, data.places?.[0]?.displayName?.text);
  } catch (err) {
    console.error(err);
  }
}

test();
