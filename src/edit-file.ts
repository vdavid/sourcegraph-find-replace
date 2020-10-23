/**
 * Edit a file to apply a string replacement
 */
export function editFile(text: string, findString: string, replacement: string): string {
    if (findString.length === 0) {
        return text
    }

    if (!text.includes(findString)) {
        return text
    }

    return text.split(findString).join(replacement)
}
