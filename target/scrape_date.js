import { scrape } from '../scrape/scrape.js';
import { determine_date_url, parse_date_row, TOP_HTML, BOTTOM_HTML, NONE_HTML } from '../shared/url.js';

function parse_date_table(response_text) {
    let pdfs_this_date = {}

    const start = response_text.indexOf(TOP_HTML) + TOP_HTML.length
    const end = response_text.indexOf(BOTTOM_HTML)
    const dateTableHTML = response_text.substring(start,end)

    //Checks if response_text is supposed to have dates
    if(dateTableHTML.indexOf(NONE_HTML) > -1) {
        console.log("No pdfs found for this date. Skipping...")
        return pdfs_this_date; //return blank dictionary
    }

    const rows = dateTableHTML.split('\n').filter(row => row.trim() !== '');
    for(const row of rows) {
        if(row.indexOf('<a') != -1) {
            const {tr, cy} = parse_date_row(row)
            pdfs_this_date[tr] = cy
        }
    }
    if(Object.keys(pdfs_this_date).length == 0) {
        console.log("Blank pdfs_this_date. Trying again...")
        throw "Blank_Pdfs"
    }
    return pdfs_this_date
}

async function scrape_date(scrape_date_task) {
    scrape_date_task['url'] = determine_date_url(scrape_date_task)
    const response_info = await scrape(scrape_date_task.url)
    const response_text = response_info.response_text
    try {
        return parse_date_table(response_text)
    } catch (e) {
        console.log(`Exception caught while parsing date table. ${scrape_date_task.url}`)
        console.log(`${e.message}`)
        return await scrape_date(scrape_date_task)
    }
}

async function start_scrape_date(date_combo) {
    let scrape_date_task = date_combo
    const pdfs_this_date = await scrape_date(scrape_date_task)
    await (async (pdfs_this_date) => {
        console.log(pdfs_this_date.length, "pdfs found")
    })
    return pdfs_this_date
}

// scrape_date(scrape_date_task)

export {start_scrape_date}