import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsAreaValid(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isAreaValid',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj = args.object as any;
          const totalArea = obj.total_area;
          const agriculturalArea = obj.agricultural_area || 0;
          const vegetationArea = obj.vegetation_area || 0;
          
          if (!totalArea) return true;
          
          return (agriculturalArea + vegetationArea) <= totalArea;
        },
        defaultMessage(args: ValidationArguments) {
          return 'A soma da área agricultável e área de vegetação não pode ultrapassar a área total da propriedade';
        },
      },
    });
  };
}
