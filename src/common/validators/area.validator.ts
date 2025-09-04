import { Injectable } from '@nestjs/common';
import { 
  ValidatorConstraint, 
  ValidatorConstraintInterface, 
  ValidationArguments 
} from 'class-validator';

@ValidatorConstraint({ name: 'AreaValidator', async: false })
@Injectable()
export class AreaValidator implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const obj = args.object as any;
    const totalArea = obj.total_area;
    const agriculturalArea = obj.agricultural_area || 0;
    const vegetationArea = obj.vegetation_area || 0;
    
    if (!totalArea || totalArea <= 0) return true;
    
    if (agriculturalArea < 0 || vegetationArea < 0) return false;
    
    return (agriculturalArea + vegetationArea) <= totalArea;
  }

  defaultMessage(args: ValidationArguments) {
    const obj = args.object as any;
    const totalArea = obj.total_area || 0;
    const agriculturalArea = obj.agricultural_area || 0;
    const vegetationArea = obj.vegetation_area || 0;
    const sum = agriculturalArea + vegetationArea;
    
    if (agriculturalArea < 0 || vegetationArea < 0) {
      return 'As áreas agricultável e de vegetação devem ser valores positivos';
    }
    
    return `A soma das áreas (${sum}) não pode ultrapassar a área total (${totalArea})`;
  }
}