export function formatPaperName(input) {
    const smallWords = new Set(['and', 'or', 'the', 'of', 'in', 'on', 'to', 'with', 'a', 'an', 'for', 'at', 'by', 'from']);

    return input
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .split(' ')
        .map((word, index, arr) => {
            if (smallWords.has(word) && index !== 0 && index !== arr.length - 1) {
                return word;
            }
            return word[0].toUpperCase() + word.slice(1);
        })
        .join(' ');
}

export function formatMonth(input) {
    const monthMap = {
        jan: 'JAN', feb: 'FEB', mar: 'MAR', apr: 'APR',
        may: 'MAY', jun: 'JUN', jul: 'JUL', aug: 'AUG',
        sep: 'SEP', oct: 'OCT', nov: 'NOV', dec: 'DEC'
    };

    const normalize = (str) => {
        const key = str.trim().toLowerCase().slice(0, 3);
        return monthMap[key] || key.toUpperCase();
    };

    const cleanInput = input.trim().toLowerCase().replace(/\s+/g, '');

    if (cleanInput.includes('-')) {
        const [start, end] = cleanInput.split('-');
        return `${normalize(start)}-${normalize(end)}`;
    } else {
        return normalize(cleanInput);
    }
}


