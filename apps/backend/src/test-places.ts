import { searchVadodaraPlaces } from './services/placesService.js';

async function testPlaces() {
    console.log("Testing searchVadodaraPlaces('restaurants')");
    const result = await searchVadodaraPlaces('restaurants');
    console.log(JSON.stringify(result, null, 2));
}

testPlaces();
