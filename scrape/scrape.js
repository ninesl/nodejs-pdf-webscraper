import nodeFetch from 'node-fetch'
import fetchCookie from 'fetch-cookie'
import pLimit from 'p-limit';
import { fetchOptionsGenerator } from './fetch-options-generator.js'
import { is_scrape_blocked } from '../shared/url.js';
const fetchGen = new fetchOptionsGenerator()

let P_LIMT_REQUEST_MAX = 15 //adjust as needed
let REQUEST_LIMIT = pLimit(P_LIMT_REQUEST_MAX) 

async function short_delay(ms_add, retry_count) {
    const jitter = Math.random() * 1000;
    if (retry_count > 10) {
        retry_count = 10
    }
    let ms = (ms_add + jitter) * ((1 + retry_count) / 2);
    return new Promise(resolve => setTimeout(resolve, ms + Math.floor(Math.random() * 100))); 
    // adds random 0-.1 sec
}

async function scrape(url) {
    const fetch = fetchCookie(nodeFetch) //reset cookies
    let retry_count = 0
    // let time_taken = null;
    do {
        const fetchOptions = fetchGen.new_fetch_options()
        let skip = false
        const response = await REQUEST_LIMIT(async () => 
        {
            // const startTime = Date.now();
            try {
                await short_delay(500, retry_count)
                return await fetch(url, fetchOptions.options)
            } catch (e) {
                // console.log(`${e.message}`)
                skip = true
            }
            
            // const endTime = Date.now()
            // time_taken = (endTime-startTime)
        });
        if(skip || response.status !== 200) {
            if(skip) {
                // console.log(`Error fetching ${url}`)
                process.stdout.write(`-`)
            } else {
                process.stdout.write(`.`)
            }
            fetchGen.increment_retry(fetchOptions)
            // process.stdout.write(`Retry ${++retry_count}... ${url} `)
            ++retry_count
            continue
        }

        let response_info = {
            body: await response.blob(),
            size: response.headers.get('content-length'),
            content_type:  response.headers.get('content-type')
        }
        //wait for response.blob() promise
        response_info['response_text'] = await response_info.body.text()

        // target specific implementation
        if(is_scrape_blocked(response_info.response_text)) {
            // process.stdout.write(`Retry ${++retry_count}... ${url} `)
            ++retry_count
            process.stdout.write(`.`)
            fetchGen.increment_retry(fetchOptions)
            continue
        }
        fetchGen.increment_success(fetchOptions)
        return response_info;
    } while(true);//uh oh. retry logic here. queue?
}

export { scrape, REQUEST_LIMIT };