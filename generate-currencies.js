const http = require("http");
const fs = require("fs");

http.get(`http://data.fixer.io/api/latest?access_key=${process.env.FIXER_IO_TOKEN}&format=1`, (response) => {
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
