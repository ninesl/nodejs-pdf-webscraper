import { scrape } from '../scrape/scrape.js';
import { promisify } from 'util';
import { pipeline } from 'stream';
import fs from 'fs';
import { split_array, shuffle_array } from '../shared/util.js';
import { determine_pdf_url, PARENT_PDF_FOLDER } from '../shared/url.js';

// month, day, year, pdfCode, countrycode
// gathered from scrape_date and passed into here

const pipelineAsync = promisify(pipeline);

function set_scrape_pdf_task(pdfCode, countryCode, date) {
    let m = date.month.toString().padStart(2, '0')
    let d = date.day.toString().padStart(2, '0')
    const fileName = `${pdfCode}_${m}${d}${date.year}`
    const date_string = `${date.month}/${date.day}/${date.year}`

    const scrape_pdf_task = {
        pdfCode: pdfCode,
        date: date_string,
        country: countryCode,
        url: determine_pdf_url(pdfCode, countryCode, date_string),
        pdfDirectory: `${PARENT_PDF_FOLDER}/${countryCode}/${pdfCode}/${date.year}/${date.month}`,
        fileName: fileName
    }
    return scrape_pdf_task
}

let pdfs_downloaded = 0
async function scrape_pdfs_by_date(date) {
    let tasks = []
    const pdfs_to_get = date.pdfs_to_get
    const date_msg = `${date.month}/${date.day}/${date.year}`
    process.stdout.write(`|${date_msg} `)
    for (const [pdf_code, country_code] of Object.entries(pdfs_to_get)) {
        let pdf_task = set_scrape_pdf_task(pdf_code, country_code, date)
        if(!fs.existsSync(`${pdf_task.pdfDirectory}/${pdf_task.fileName}.pdf`)) {
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
    if(tasks.length > 0) {
        tasks = shuffle_array(tasks)
        const task_limit = 10
        let task_split = split_array(tasks, task_limit)
        console.log(tasks.length, "pdf tasks for", date_msg)
        for(let i = 0; i < task_split.length; i++){
            await Promise.all(task_split[i].map(async (task) => {
                try {
                    await scrape_pdf(task)
                    pdfs_downloaded += 1
                } catch (error) {
                    console.log('********scrape_pdfs() scrape_pdf.js********')
                    console.log(task, error)
                    console.log('****************')
                }
            }))
        }
    }
}

async function scrape_pdf(scrape_pdf_task) {
    let response_info = await scrape(scrape_pdf_task.url).then(async (response_info) => {
        if (!response_info.content_type.includes('application/pdf'))
            console.log(`response_info.content_type is ${response_info.content_type}. Retrying...`)
            return await scrape(scrape_pdf_task.url)
    });

    if (!fs.existsSync(scrape_pdf_task.pdfDirectory)) {
        console.log(`\nCreating directory: ${scrape_pdf_task.pdfDirectory}`);
        fs.mkdirSync(scrape_pdf_task.pdfDirectory, { recursive: true });
    }
    
    const filePath = `${scrape_pdf_task.pdfDirectory}/${scrape_pdf_task.fileName}.pdf`;
    const fileStream = fs.createWriteStream(filePath);
    await pipelineAsync(response_info.body.stream(), fileStream).then(() => {
        const fileMessage = `${scrape_pdf_task.fileName}\n`;
        fs.appendFileSync(`${filePath}`, fileMessage);
        console.log(`Downloaded ${filePath}`)
    })
}

export {scrape_pdfs_by_date}