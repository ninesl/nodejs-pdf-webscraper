# Node.js Web Scraper
This Node.js project uses proxies to asynchronously scrape a specific website and save PDFs to a specified path. I opted to not use Selenium or anything similar as I just need to download from direct links to .pdfs and basic HTML parsing. This is used in a wider project to populate a DB.

## Step-by-Step
`npm install`

`node ./index.js`

1. Assign scraping tasks

>`index.js`
```javascript
for(let i = 0; i < date_length; i++) {
    scrape_tasks.push(async () => {
        let pdfs_to_get = await start_scrape_date(dates[i])
        dates[i]['pdfs_to_get'] = pdfs_to_get
        await scrape_pdfs_by_date(dates[i])
    })
}
```
2. Run tasks in batches with async. I use this Promise.all pattern for these tasks and for scraping the PDFs.

>`index.js`
```javascript
const task_limit = 10
let task_split = split_array(scrape_tasks, task_limit)
console.log("Starting date scrape for", task_limit, "date tasks")
for(let i = 0; i < task_split.length; i++){
    await Promise.all(task_split[i].map(async (task) => {
        try {
            await task()
        } catch (error) {
            console.log('********start_scrape_pdfs() main.js********')
            console.log(task, error)
            console.log('****************')
        }
    }))
}
```
3. Scrape gets performed in parallel using the `pLimit` module.

> `scrape/scrape.js`
```javascript
const fetchOptions = fetchGen.new_fetch_options()
const response = await REQUEST_LIMIT(async () => 
{
    try {
        await short_delay(500, retry_count)
        return await fetch(url, fetchOptions.options)
    } catch (e) {
        //Error handling
    }
})
```
4. Each PDF gets saved locally using the `promisfy` and `pipeline` modules

> `target/scrape_pdf.js`
```javascript
const pipelineAsync = promisify(pipeline)
    
const filePath = `${scrape_pdf_task.pdfDirectory}/${scrape_pdf_task.fileName}.pdf`;
const fileStream = fs.createWriteStream(filePath)
await pipelineAsync(response_info.body.stream(), fileStream).then(() => {
    const fileMessage = `${scrape_pdf_task.fileName}\n`
    fs.appendFileSync(`${filePath}`, fileMessage)
    console.log(`Downloaded ${filePath}`)
})
```
5. While running, scrape progress is console.log()'d to the screen

`.` means the pdf is already downloaded, `#` means the pdf is not found and is getting queued to scrape

>`cli output`
```
|11/6/2012 ........ |
|11/9/2012 .........#...#....##.# | pdf1 pdf2 pdf3 pdf4 pdf5
5 pdf tasks for 11/9/2012
|11/4/2012 ................. |
Retry 1... url { host: '1.1.1.1', port: '0000', retries: 4, success: 7 }
|11/11/2012 ............... |
|11/10/2012 #....###..........#...... | pdf1 pdf2 pdf3 pdf4 pdf5
5 pdf tasks for 11/10/2012
|11/8/2012 ................ |
Downloaded PARENT_DIRECTORY/countryCode/pdf3/2012/11/pdf3_11092012.pdf
Downloaded PARENT_DIRECTORY/countryCode/pdf1/2012/11/pdf1_11102012.pdf
|11/13/2012 ........ |
```

Each scrape request uses a different IP by rotating through a list of proxies from a .txt file formatted like so:

>`proxies.txt`
```
1.1.1.1:0000
2.2.2.2:0001
3.3.3.3:0002
...
```

## Project Structure
```
NODEJS-PDF-WEBSCRAPER/
│
├── scrape/ # Core scraping functionalities
│ ├── fetch-options-generator.js # Generates fetch options with proxy handling/rotating
│ └── scrape.js # Scraping logic. # Returns response_info after successful scrape
│
├── shared/ # Shared configurations and utilities
│ ├── hidden_info.js # Source for parent directory, HTML and URL info
│ ├── url.js # Wrapper module for hidden_info.js
│ └── util.js # Util methods that are reused
│
├── target/ # Specific scraping strategies
│ ├── scrape_date.js # Scrapes a given date and returns list of PDF targets
│ └── scrape_pdf.js # Scrapes PDFs from a list gathered by scrape_date.js
│
├── index.js # Starts scrape based of date range. Assigns tasks to be scraped
└── proxies.txt # Proxy list for scraping tasks
```

## Features/Fixes Planned
- *Cron job/Scheduling* - Every day more pdfs are uploaded to the target website, so I will need to have this
automatically run to get the day before's information.

- I always am finding different ways/fun ways to log info to the console, so that will constantly be in flux.

- *Queue for scrape tasks* - I'd like to replace the Promise.all pattern I use in `index.js` and `target/scrape_pdfs.js` so I can fine tune things easier.

- *Retry limit for scraping* - Current implementation has an exponential backoff in `scrape.js short_delay()` but endlessly hits the same URL until the scrape is successful.

> Maybe I can put the failed scrape at the back of the retry_queue???
