// I hate util files like this but I need to refactor my codebase

//Splits arrays into chunks to be processed by Promise.all pattern
export function split_array(array, chunk_size) {
    let result = [];
    for (let i = 0; i < array.length; i += chunk_size) {
        result.push(array.slice(i, i + chunk_size));
    }
    return result;
}

// Fisher-Yates shuffle algorithm​
export function shuffle_array(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
    return array;
}

//https://stackoverflow.com/questions/19687407/press-any-key-to-continue-in-nodejs
export const keypress = async () => {
    process.stdin.setRawMode(true)
    return new Promise(resolve => process.stdin.once('data', () => {
        process.stdin.setRawMode(false)
        resolve()
    }))
}
