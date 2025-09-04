import { PartialType } from '@nestjs/swagger';
import { CreatePlantedCropDto } from './create-planted_crop.dto';

export class UpdatePlantedCropDto extends PartialType(CreatePlantedCropDto) {}
