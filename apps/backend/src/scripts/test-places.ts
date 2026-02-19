import { searchVadodaraPlaces } from '../services/placesService';

async function test() {
    console.log('Searching for luxury stores in Vadodara...');
    const result = await searchVadodaraPlaces('luxury stores');

    if (result.error) {
        console.error('Error:', result.error);
        return;
    }

    console.log(`Found ${result.places.length} places:`);
    result.places.forEach((place, index) => {
        console.log(`\n${index + 1}. ${place.displayName.text}`);
        console.log(`   Address: ${place.formattedAddress}`);
        console.log(`   Rating: ${place.rating} (${place.userRatingCount} reviews)`);
        console.log(`   ID: ${place.id}`);
    });
}

test().catch(console.error);
