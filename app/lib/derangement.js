// Sattolo’s algorithm: returns a single-cycle permutation (no fixed points)
export function sattoloDerangement(items) {
    const arr = items.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * i); // 0 <= j < i
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}