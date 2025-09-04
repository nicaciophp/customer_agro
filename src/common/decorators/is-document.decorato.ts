import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { isValidDocument } from '../utils/document.util';

export function IsDocument(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isDocument',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return isValidDocument(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} deve ser um CPF ou CNPJ válido`;
        },
      },
    });
  };
}
