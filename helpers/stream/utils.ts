/**
 * Utility functions for stream-related operations
 */

/**
 * Returns a new array with duplicate values removed
 */
export function unique<T>(array: T[]): T[] {
    return [...new Set(array)];
}

/**
 * Finds the last index in an array that matches a predicate
 */
export function findLastIndex<T>(array: T[], predicate: (value: T) => boolean): number {
    for (let i = array.length - 1; i >= 0; i--) {
        if (predicate(array[i]))
            return i;
    }
    return -1;
}

/**
 * Creates a delay Promise that resolves after the specified time
 */
export async function sleep(ms = 4000): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export const PATH_SEP = ">";
export const ROOT_ID = "$"; 