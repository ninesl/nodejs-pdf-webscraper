import { start_scrape_date } from './target/scrape_date.js';
import { scrape_pdfs_by_date } from './target/scrape_pdf.js';
import { split_array, keypress } from './shared/util.js';
import { format } from 'util';

const START_DATE = new Date()
START_DATE.setDate(START_DATE.getDate() - 1)
// const START_DATE = new Date(2024, 9, 8)
const END_DATE = new Date()
END_DATE.setDate(END_DATE.getDate() - 1) // yesterday... my troubles seemed so far away

console.log(START_DATE, " ", END_DATE)

const TASKS_AT_A_TIME = 20

function set_dates() {
    let dates = [];
    //1991
    for (let d = START_DATE; d <= END_DATE; d.setDate(d.getDate() + 1)) {
        // for (let d = new Date(2020, 3, 27); d <= now; d.setDate(d.getDate() + 1)) {
        const date = new Date(d)
        let date_combo = { //coupled with scrape_date.js start_scrape_date(date_combo)
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate()
        }
        dates.push(date_combo)
    }
    return dates;
}
async function start_scrape_pdfs() {
    let scrape_tasks = []
    const dates = set_dates()
    const date_length = dates.length
    for (let i = 0; i < date_length; i++) {
        scrape_tasks.push(async () => {
            let pdfs_to_get = await start_scrape_date(dates[i])
            dates[i]['pdfs_to_get'] = pdfs_to_get
            await scrape_pdfs_by_date(dates[i])
        })
    }

    // scrape_tasks = shuffle_array(scrape_tasks)
    const task_limit = TASKS_AT_A_TIME
    let task_split = split_array(scrape_tasks, task_limit)
    console.log("Starting date scrape for", task_limit, "date tasks")
    for (let i = 0; i < task_split.length; i++) {
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
}

await start_scrape_pdfs()