import * as hidden from './hidden_info.js'
/* 
 * Only abstracted this way to make it easier to hide 
 * html/url specific implementation for public repo.
 * I don't normally like wrapping abstraction like this. 
 * These methods were within the modules themselves
 */
// Can modify these for other implementations
export const PARENT_PDF_FOLDER = hidden.PARENT_PDF_FOLDER
export const PROXY_FILENAME = hidden.PROXY_FILENAME

//scrape.js
export function is_scrape_blocked(...args) {
    return hidden.scrape_blocked(...args)
}

//scrape_pdfs.js
export const PDF_NOT_FOUND_HTML = hidden.PDF_NOT_FOUND_HTML

export function determine_pdf_url(...args) {
    return hidden.pdf_url(...args)
}

//scrape_date.js
export const TOP_HTML = hidden.TOP_HTML
export const BOTTOM_HTML = hidden.BOTTOM_HTML
export const NONE_HTML = hidden.NONE_HTML

export function parse_date_row(...args){
    return hidden.date_row(...args)
}

export function determine_date_url(...args) {
    return hidden.date_url(...args)
}
