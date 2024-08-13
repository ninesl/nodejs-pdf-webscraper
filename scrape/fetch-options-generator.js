import randomUserAgent from 'random-useragent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import fs from 'fs';
import { shuffle_array } from '../shared/util.js';
import { PROXY_FILENAME } from '../shared/url.js';

export class fetchOptionsGenerator {
    constructor() {
        this.threshold = 50
        this.PROXIES = shuffle_array(load_proxies(PROXY_FILENAME))
        this.proxy_index = -1
        //incremented to 0 when used. Don't care enough to improve logic
    }
    new_fetch_options() {
        let retries = null
        let proxy = null
        do {
            this.proxy_index += 1
            if(this.proxy_index >= this.PROXIES.length)
                this.proxy_index = 0
            proxy = this.PROXIES[this.proxy_index];
            retries = this.PROXIES[this.proxy_index].retries
        } while(retries > this.threshold)
        if(!proxy)
            throw new Error('Proxy was null')
        return create_fetch_options(proxy, this.proxy_index);
    }
    increment_retry(fetchOptions) {
        this.PROXIES[fetchOptions.proxy_index].retries++
        console.log(this.PROXIES[fetchOptions.proxy_index])
        // process.stdout.write(JSON.stringify(this.PROXIES[fetchOptions.proxy_index]));
    }
    increment_success(fetchOptions) {
        this.PROXIES[fetchOptions.proxy_index].success++
        // process.stdout.write(JSON.stringify(this.PROXIES[fetchOptions.proxy_index]));
    }
}
function create_fetch_options(proxy, proxy_index) {
    return {
        options: {
            headers: {
                // "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0Safari/537.36",
                "User-Agent": randomUserAgent.getRandom(),
                "Accept": "text/html,application/xhtml+xml,application/xmlq=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,applicationsigned-exchange;v=b3;q=0.7",
                "Accept-Language": random_accept_languages(),
                "Cache-Control": "max-age=0",
                "Priority": "u=0, i",
                "Sec-Ch-Ua": "\"Not/A)Brand\";v=\"8\", \"Chromium\"v=\"126\", \"Google Chrome\";v=\"126\"",
                "Sec-Ch-Ua-Mobile": "?0",
                "Sec-Ch-Ua-Platform": "\"Windows\"",
                "Sec-Fetch-Dest": "document",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Site": "none",
                "Sec-Fetch-User": "?1",
                "Upgrade-Insecure-Requests": "1"
            },
            agent: new HttpsProxyAgent(`http://${proxy.host}:${proxy.port}`)
            // agentOptions: {
            //     rejectUnauthorized: false
            // }
        },
        proxy_index: proxy_index
    }
}
function random_accept_languages() {
    const languages = [
        "en-US,en;q=0.9",
        "en-GB,en;q=0.8",
        "en-CA,en;q=0.7",
        "en-AU,en;q=0.6",
        "fr-FR,fr;q=0.9,en;q=0.8",
        "de-DE,de;q=0.9,en;q=0.8"
    ];
    return languages[Math.floor(Math.random() * languages.length)];
}
function load_proxies(filePath) {
    let retries = 0
    let success = 0
    const proxyList = fs.readFileSync(filePath, 'utf-8').trim().split('\n');
    return proxyList.map(proxy => {
        let [host, port] = proxy.split(':');
        port = port.trim()
        return { host, port, retries, success };
    });
}