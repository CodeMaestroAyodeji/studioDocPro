// A robust number-to-words converter for Nigerian Naira (NGN)

const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const thousands = ['', 'thousand', 'million', 'billion', 'trillion'];

function convertChunk(num: number): string {
    if (num === 0) return '';
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) {
        const t = Math.floor(num / 10);
        const o = num % 10;
        return tens[t] + (o > 0 ? '-' + ones[o] : '');
    }
    const h = Math.floor(num / 100);
    const rest = num % 100;
    return ones[h] + ' hundred' + (rest > 0 ? ' and ' + convertChunk(rest) : '');
}

function convert(num: number): string {
    if (num === 0) return 'zero';
    if (num < 0) return 'minus ' + convert(Math.abs(num));

    let words = '';
    let i = 0;

    do {
        const chunk = num % 1000;
        if (chunk !== 0) {
            words = convertChunk(chunk) + ' ' + thousands[i] + ' ' + words;
        }
        num = Math.floor(num / 1000);
        i++;
    } while (num > 0);

    return words.trim();
}

export function numberToWords(num: number): string {
    if (typeof num !== 'number') return '';
    if (num === 0) return 'zero naira only';

    const naira = Math.floor(num);
    const kobo = Math.round((num - naira) * 100);

    let nairaWords = convert(naira);
    nairaWords = nairaWords.charAt(0).toUpperCase() + nairaWords.slice(1);
    
    let result = `${nairaWords} naira`;

    if (kobo > 0) {
        let koboWords = convert(kobo);
        koboWords = koboWords.charAt(0).toUpperCase() + koboWords.slice(1);
        result += ` and ${koboWords} kobo`;
    }

    return result + ' only';
}

    