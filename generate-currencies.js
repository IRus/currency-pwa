const https = require("https");
const fs = require("fs");

https.get(`https://data.fixer.io/api/latest?access_key=${process.env.FIXER_IO_TOKEN}`, (response) => {
    const chunks = [];

    response.on("data", (chunk) => {
        chunks.push(chunk);
    });

    response.on("end", () => {
        const data = JSON.parse(chunks.join(""));
        const allCurrencies = {...data.rates, [data.base]: 1};
        fs.writeFileSync("./src/data.json", JSON.stringify({
          fixer: allCurrencies,
          updated: getBuildDate()
        }));
    });
}).on("error", (err) => {
    console.log(`Error: ${err.message}`);
    process.exit(1);
});

function getBuildDate() {
    const options = {
        year: "numeric",
        month: "long",
        day: "numeric"
    };
    const today = new Date();
    return today.toLocaleDateString("en-US", options);
}
