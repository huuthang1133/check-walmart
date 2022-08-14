const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));
const fs = require("fs");
const csv = require("csv-parser");
const converter = require("json-2-csv");
(async () => {
  let readingFile = new Promise((resolve, reject) => {
    let arr = [];
    fs.createReadStream("./data.csv")
      .pipe(csv())
      .on("data", (data) => arr.push(data))
      .on("end", () => {
        resolve(arr);
      });
  });
  let results = await readingFile;

  const updateData = new Promise((resolve, reject) => {
    let newObject = [];
    results.forEach(async (element, index) => {
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      await page.setViewport({ width: 800, height: 600 });
      await page.goto(element.Link);

      let title = await page.evaluate(() => {
        return document.querySelector("h1[itemprop=name]").innerHTML;
      });

      let price = await page.evaluate(() => {
        return document.querySelector("span[itemprop=price]").innerHTML;
      });

      let handlePrice = price.split("$")[1].replace(".", ",");
      console.log(parseInt(element.Price) - parseInt(handlePrice));

      newObject.push({
        ...element,
        title,
        newPrice: handlePrice,
        different: parseInt(handlePrice) - parseInt(element.Price),
        Status:
          parseInt(handlePrice) - parseInt(element.Price) > 0 ? "Tang" : "Giam",
      });
      if (results.length === newObject.length) {
        resolve(newObject);
      }
    });
  });

  let data = await updateData;
  converter.json2csv(data, (err, csv) => {
    if (err) console.log(err);
    fs.writeFileSync("./newdata.csv", "\uFEFF" + csv, "utf-8");
    console.log("Done");
  });
})();
