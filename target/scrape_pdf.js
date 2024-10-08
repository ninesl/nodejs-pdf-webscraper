import { scrape } from '../scrape/scrape.js';
import { promisify } from 'util';
import { pipeline } from 'stream';
import fs from 'fs';
import { split_array, shuffle_array } from '../shared/util.js';
import { determine_pdf_url, determine_pdf_static_url, PARENT_PDF_FOLDER, PDF_NOT_FOUND_HTML } from '../shared/url.js';

// month, day, year, pdfCode, countrycode
// gathered from scrape_date and passed into here

const pipelineAsync = promisify(pipeline);

function set_scrape_pdf_task(pdfCode, countryCode, date) {
    let m = date.month.toString().padStart(2, '0')
    let d = date.day.toString().padStart(2, '0')
    const fileName = `${pdfCode}_${m}${d}${date.year}`
    const date_string = `${date.month}/${date.day}/${date.year}`
    const pdfDirectory = `${PARENT_PDF_FOLDER}/${countryCode}/${pdfCode}/${date.year}/${date.month}`

    const txt_path = `${m}_${d}_${date.year}`
    const txt_string = `${pdfDirectory}/${d}`

    const fileNameBackup = `${m}-${d}-${date.year}`

    const scrape_pdf_task = {
        pdfCode: pdfCode,
        txt_path: txt_path,
        txt_string: txt_string,
        country: countryCode,
        url: determine_pdf_url(pdfCode, countryCode, date_string),
        pdfDirectory: pdfDirectory,
        fileName: fileName,
        fileNameBackup: fileNameBackup,
        date: date,
    }
    return scrape_pdf_task
}

let pdfs_queued = 0
async function scrape_pdfs_by_date(date) {
    let tasks = []
    const pdfs_to_get = date.pdfs_to_get
    const date_msg = `${date.month}/${date.day}/${date.year}`
    process.stdout.write(`|${date_msg} `)
    for (const [pdf_code, country_code] of Object.entries(pdfs_to_get)) {
        let pdf_task = set_scrape_pdf_task(pdf_code, country_code, date)
        if (!fs.existsSync(`${pdf_task.pdfDirectory}/${pdf_task.fileName}.pdf`)) {
            tasks.push(pdf_task)
            process.stdout.write(`#`)
        }
        else {
            process.stdout.write(`.`)
        }
    }
    process.stdout.write(` |`)
    tasks.map((task) => {
        process.stdout.write(` ${task.pdfCode}`)
    })
    console.log()
    if (tasks.length > 0) {
        tasks = shuffle_array(tasks)
        const task_limit = 10
        let task_split = split_array(tasks, task_limit)
        pdfs_queued += tasks.length
        console.log(tasks.length, "pdf tasks for", date_msg, "pdfs queued:", pdfs_queued)
        for (let i = 0; i < task_split.length; i++) {
            await Promise.all(task_split[i].map(async (task) => {
                try {
                    await scrape_pdf(task)
                    console.log(`${--pdfs_queued} pdfs_queued`)
                } catch (error) {
                    console.log('********scrape_pdfs() scrape_pdf.js********')
                    console.log(task, error)
                    console.log('****************')
                }
            }))
        }
    }
}

function write_error(url) {
    try {
        fs.appendFileSync('err_pdfs.txt', url + '\n');
    } catch (error) {
        console.error(`Failed to append error URL: ${url}`, error);
    }
}
async function scrape_pdf(scrape_pdf_task) {
    console.log(scrape_pdf_task.url)
    let response_info = await scrape(scrape_pdf_task.url).then(async (response_info) => {
        console.log(scrape_pdf_task.url)
        console.log(response_info.size)
        while (!response_info.content_type.includes('application/pdf') || response_info.size < 5000) {// 5kb
            if (response_info.response_text.includes(PDF_NOT_FOUND_HTML)) {
                write_error(scrape_pdf_task.url)
                return null
            } else if (response_info.size < 5000) {// PDF found but something is funky with it
                scrape_pdf_task.url = determine_pdf_static_url(scrape_pdf_task.pdfCode, scrape_pdf_task.country, scrape_pdf_task.date)
            } else {
                write_error(scrape_pdf_task.url)
                return null
            }
            console.log(`response_info.content_type is ${response_info.content_type}.`)
            console.log(`response_info.source_url is ${response_info.source_url}.`)
            console.log(`response_info.size is ${response_info.size}. Retrying...`)
            console.log(`Trying again with url: ${scrape_pdf_task.url}`)
            response_info = await scrape(scrape_pdf_task.url)
        }
        return response_info
    });

    if (!response_info) {
        return;
    }

    if (!fs.existsSync(scrape_pdf_task.pdfDirectory)) {
        console.log(`\nCreating directory: ${scrape_pdf_task.pdfDirectory}`);
        fs.mkdirSync(scrape_pdf_task.pdfDirectory, { recursive: true });
    }


    const filePath = `${scrape_pdf_task.pdfDirectory}/${scrape_pdf_task.fileName}.pdf`;
    const fileStream = fs.createWriteStream(filePath);
    console.log(`Downloading ${filePath}`)
    await pipelineAsync(response_info.body.stream(), fileStream).then(() => {
        // txt file to have paths stored for usage later.
        // redis or kafka could replace this but this is easier

        const txt_path = `date_filepaths/${scrape_pdf_task.txt_path}.txt`
        const backup_path = `date_filepaths_gen/${scrape_pdf_task.date.year}/${scrape_pdf_task.date.month}/${scrape_pdf_task.fileNameBackup}.txt`

        if (!fs.existsSync(`date_filepaths_gen/${scrape_pdf_task.date.year}`)) {
            console.log(`\nCreating directory: date_filepaths_gen/${scrape_pdf_task.date.year}`);
            fs.mkdirSync(`date_filepaths_gen/${scrape_pdf_task.date.year}`, { recursive: true });
        }
        if (!fs.existsSync(`date_filepaths_gen/${scrape_pdf_task.date.year}/${scrape_pdf_task.date.month}`)) {
            console.log(`\nCreating directory: date_filepaths_gen/${scrape_pdf_task.date.year}/${scrape_pdf_task.date.month}`);
            fs.mkdirSync(`date_filepaths_gen/${scrape_pdf_task.date.year}/${scrape_pdf_task.date.month}`, { recursive: true });
        }

        console.log(`Downloaded ${filePath} | Writing path to ${txt_path} | Writing path to ${backup_path}`)
        fs.appendFileSync(txt_path, `${scrape_pdf_task.txt_string}\n`);
        fs.appendFileSync(backup_path, `${scrape_pdf_task.txt_string}\n`);
    })
}

export { scrape_pdfs_by_date }