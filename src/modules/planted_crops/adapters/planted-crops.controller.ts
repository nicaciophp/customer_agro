import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CreateUseCase } from '../application/create.use-case';
import { GetByIdUseCase } from '../application/get-by-id.use-case';
import { UpdateUseCase } from '../application/update.use-case';
import { DeleteUseCase } from '../application/delete.use-case';
import { CreatePlantedCropDto } from '../dto/create-planted_crop.dto';
import { UpdatePlantedCropDto } from '../dto/update-planted_crop.dto';

@Controller('planted-crops')
export class PlantedCropsController {
  constructor(
      private readonly createUseCase: CreateUseCase,
      private readonly getByIdUseCase: GetByIdUseCase,
      private readonly updateUseCase: UpdateUseCase,
      private readonly deleteUseCase: DeleteUseCase
    ) {}

  @Post()
    create(@Body() createProducerDto: CreatePlantedCropDto) {
      return this.createUseCase.execute(createProducerDto);
    }
  
    @Get(':id')
    findOne(@Param('id') id: string) {
      return this.getByIdUseCase.execute(id);
    }
  
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateProducerDto: UpdatePlantedCropDto) {
      return this.updateUseCase.execute(id, updateProducerDto);
    }
  
    @Delete(':id')
    remove(@Param('id') id: string) {
      return this.deleteUseCase.execute(id);
    }
}
