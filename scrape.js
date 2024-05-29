const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeQuotes() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const url = 'http://quotes.toscrape.com';
    console.log('Loading a page ', url)
    await page.goto(url, { waitUntil: 'load', timeout: 0 });
    console.log('Page loaded successfully');

    console.log('Starting Page scrapping');
    // Function to extract quotes from a single page
    async function extractQuotes() {
        const quotes = page.evaluate(() => {
            const quoteElements = document.querySelectorAll('.quote');
            const quotesArray = [];
            quoteElements.forEach(quoteElement => {
                const text = quoteElement.querySelector('.text').innerText;
                const author = quoteElement.querySelector('.author').innerText;

                const tags = Array.from(quoteElement.querySelectorAll('.tag')).map(tag => tag.innerText);
                quotesArray.push({ text, author, tags });
            });
            return quotesArray;
        });

        return quotes
    }

    let quotes = [];
    let nextPageExists = true;
    let pageIndex = 1;

    // Loop through all pages and collect quotes
    while (nextPageExists) {
        console.log('Stated Scrapping For Page', pageIndex)
        quotes = quotes.concat(await extractQuotes());
        nextPageExists = await page.evaluate(() => {
            const nextButton = document.querySelector('.pager .next a');
            if (nextButton) {
                nextButton.click();
                return true;
            }
            return false;
        })

        // Wait for the next page to load
        if (nextPageExists) {
            pageIndex++
            await page.waitForNavigation({ waitUntil: 'networkidle2' })
        }
    }

    // Close the browser
    await browser.close();

    // Return the collected quotes
    return quotes;
}



scrapeQuotes().then(quotes => {
    // console.log('Quotes', quotes);
    fs.writeFile('quotes.json', JSON.stringify(quotes, null, 2), (error) => {
        if (error) throw error;
        console.log('All the Quotes Saved to quotes.json')
    })
}).catch(error => {
    console.error('Error occurred while scraping quotes', error)
})
