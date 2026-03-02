import fetch from "node-fetch";

async function test() {
    try {
        const res = await fetch("http://localhost:3001/api/places/search?query=restaurants");
        console.log("Status:", res.status);
        if (res.ok) {
            console.log("Success");
        } else {
            console.log(await res.text());
        }
    } catch(err) {
        console.error(err);
    }
}
test();
