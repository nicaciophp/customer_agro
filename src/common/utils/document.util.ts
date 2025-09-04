export function cleanDocument(document: string): string {
  return document.replace(/[^\d]/g, '');
}

export function isValidCPF(cpf: string): boolean {
  const cleanCPF = cleanDocument(cpf);
  
  if (cleanCPF.length !== 11) return false;
  
  if (/^(\d)\1+$/.test(cleanCPF)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  let digit1 = remainder >= 10 ? 0 : remainder;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  let digit2 = remainder >= 10 ? 0 : remainder;
  
  return (
    parseInt(cleanCPF.charAt(9)) === digit1 &&
    parseInt(cleanCPF.charAt(10)) === digit2
  );
}

export function isValidCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cleanDocument(cnpj);
  
  if (cleanCNPJ.length !== 14) return false;
  
  if (/^(\d)\1+$/.test(cleanCNPJ)) return false;
  
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i];
  }
  let remainder = sum % 11;
  let digit1 = remainder < 2 ? 0 : 11 - remainder;
  
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
  }
  remainder = sum % 11;
  let digit2 = remainder < 2 ? 0 : 11 - remainder;
  
  return (
    parseInt(cleanCNPJ.charAt(12)) === digit1 &&
    parseInt(cleanCNPJ.charAt(13)) === digit2
  );
}

export function isValidDocument(document: string): boolean {
    if (typeof document !== 'string') return false;
  
  const cleanValue = cleanDocument(document);
  
  if (cleanValue.length === 11) {
    return isValidCPF(document);
  } else if (cleanValue.length === 14) {
    return isValidCNPJ(document);
  }
  
  return false;
}