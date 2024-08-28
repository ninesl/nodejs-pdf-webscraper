export const PARENT_PDF_FOLDER = "D:/~";
export const PROXY_FILENAME = './proxies.txt';
// filename in home dir

//scrape.js
export function scrape_blocked(response_text) {
    return (response_text.includes('HTML Tags'));
}

//scrape_pdf.js
export function pdf_url(pdfCode, country, date) {
    const URL = "https://www.url.com/";
    const URL_2 = `pdf/endpoint`
    const params = `pdf=${pdfCode}&ctry=${country}&date=${date}`
    const url_combo = `${URL}${raceResultsUrl}${params}`
    return url_combo;
}

//scrape_date.js
export const TOP_HTML = `HTML Tags`
export const BOTTOM_HTML = `HTML Tags`
export const NONE_HTML = `404 HTML Tags`

export function date_row(row) {
    let a = row.indexOf("pdf=") + 4
    let b = row.indexOf("&date=")
    const tr = row.substring(a, b).trim()
    a = row.indexOf("ctry=") + 5
    b = row.indexOf(`" `)
    const cy = row.substring(a, b).trim()
    return { tr, cy }
}

export function date_url(s_task) {
    const url = "https://www.url.com/date/endpoint"
    const url2 = `?mo=${s_task.month}&da=${s_task.day}&yr=${s_task.year}`
    return `${url}${url2}`
}