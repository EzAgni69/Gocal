const fetch = require('node:fetch');

async function test() {
  const query = "390007, Vadodara, Gujarat, India";
  const url = `https://places.googleapis.com/v1/places:searchText`;
  const body = {
    textQuery: query,
    maxResultCount: 1,
    languageCode: 'en'
  };
  const headers = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
    'X-Goog-FieldMask': 'places.location'
  };
  
  try {
    const res = await fetch(url, { method: 'POST', body: JSON.stringify(body), headers });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}

test();
