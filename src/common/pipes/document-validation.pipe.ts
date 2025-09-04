import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { cleanDocument, isValidCPF, isValidCNPJ } from '../utils/document.util';

@Injectable()
export class DocumentValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.data === 'document' && typeof value.document === 'string') {
      const cleanDoc = cleanDocument(value.document);
      
      if (cleanDoc.length === 11 && !isValidCPF(value.document)) {
        throw new BadRequestException('CPF inválido');
      } else if (cleanDoc.length === 14 && !isValidCNPJ(value.document)) {
        throw new BadRequestException('CNPJ inválido');
      } else if (cleanDoc.length !== 11 && cleanDoc.length !== 14) {
        throw new BadRequestException('Documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)');
      }
    }
    
    return value;
  }
}