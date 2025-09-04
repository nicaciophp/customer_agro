import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateFarmDto } from './create-farm.dto';

export class UpdateFarmDto extends PartialType(
  OmitType(CreateFarmDto, ['producer_id'] as const),
) {}
