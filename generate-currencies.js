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
        const indexTemplate = fs.readFileSync("./dist/index.template.html", {encoding: "UTF-8"});
        const renderedTemplate = indexTemplate.replace(`{"EUR": 1, "USD": 2, "BYN": 3}`, JSON.stringify(allCurrencies));
        fs.writeFileSync("./dist/index.html", renderedTemplate);
    });
}).on("error", (err) => {
    console.log(`Error: ${err.message}`);
    process.exit(1);
});
