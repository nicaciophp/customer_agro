export function maskDocument(document: string): string {
    if (!document) return 'N/A';

    const cleanDoc = document.replace(/\D/g, '');

    if (cleanDoc.length === 11) {
        return `${cleanDoc.substring(0, 3)}.***.***-${cleanDoc.substring(9)}`;
    } else if (cleanDoc.length === 14) {
        return `${cleanDoc.substring(0, 2)}.${cleanDoc.substring(2, 5)}.***/**${cleanDoc.substring(10, 12)}-${cleanDoc.substring(12)}`;
    } else {
        if (cleanDoc.length <= 4) return cleanDoc.replace(/./g, '*');
        return `${cleanDoc.substring(0, 2)}***${cleanDoc.substring(cleanDoc.length - 2)}`;
    }
}