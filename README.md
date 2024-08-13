# Node.js Web Scraper

## Overview
This Node.js project asynchronously scrapes web data and saves PDFs to a specified path. This was my first
project regarding scrapers, I opted to not use selenium or anything similar as I just need to download
from direct links to .pdfs.
Each scrape is run in parallel using the `pLimit` module

## Step-by-Step
`node ./index.js`
1. Assigns scraping tasks
`    for(let i = 0; i < date_length; i++) {
        scrape_tasks.push(async () => {
            let pdfs_to_get = await start_scrape_date(dates[i])
            dates[i]['pdfs_to_get'] = pdfs_to_get
            await scrape_pdfs_by_date(dates[i])
        })
    }`
2. Run tasks in batches with async. I use this Promise.all pattern for these tasks and for scraping the PDFs.
`    const task_limit = 10
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
    }`
3. Each PDF gets saved locally using the `promisfy` module

- While running, scrape progress is console.log()'d to the screen 
- . means pdf already downloaded, # means pdf not found and is getting queued to scrape
`    ...
    |11/6/2012 ........ |
    |11/9/2012 .........#...#....##.# |
    5 pdf tasks for 11/9/2012
    |11/4/2012 ................. |
    |11/11/2012 ............... |
    |11/10/2012 #....###..........#...... |
    5 pdf tasks for 11/10/2012
    |11/8/2012 ................ |
    Downloaded PARENT_DIRECTORY/countryCode/pdfCode1/2012/11/pdfCode_11092012.pdf
    Downloaded PARENT_DIRECTORY/countryCode/pdfCode2/2012/11/pdfCode_11092012.pdf
    |11/13/2012 ........ |
    ...`

Each scrape request uses a different IP by rotating through a list of proxies from a .txt file formatted like so:
`    //proxies.txt
    1.1.1.1:0000
    2.2.2.2:0001
    3.3.3.3:0002
    ...`

## Project Structure
NODE-JS-WEBSCRAPER/
│
├── scrape/ # Core scraping functionalities
│ ├── fetch-options-generator.js # Generates fetch options with proxy handling/rotating
│ └── scrape.js # Scraping logic. # Returns response_info for parent implementations
│
├── shared/ # Shared configurations and utilities
│ ├── hidden_info.js # Source for parent directory, HTML and URL info
│ ├── url.js # Wrapper module for hidden_info.js
│ └── util.js # Util methods that can be reused
│
├── target/ # Specific scraping strategies
│ ├── scrape_date.js # Scrapes a given date and returns list of PDF targets
│ └── scrape_pdf.js # Scrapes PDFs from a list
│
├── index.js # Starts scrape based of date range. Takes 
├── package.json
├── proxies.txt # Proxy list for scraping tasks
└──package-lock.json

## Features/Fixes Planned
- I always am finding different ways to log info to the console, so will constantly be in flux
- Retry limit for scraping. Current implementation has an exponential backoff in `scrape.js short_delay()` but continues to hit the same URL until the scrape is successful.
- Queue for scrape tasks. I'd like to replace the Promise.all pattern I use in index.js and scrape_pdfs.js so I can fine tune things easier.
