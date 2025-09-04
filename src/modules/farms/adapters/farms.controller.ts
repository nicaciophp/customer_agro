import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { GetByIdUseCase } from '../application/get-by-id.use-case';
import { DeleteUseCase } from '../application/delete.use-case';
import { CreateUseCase } from '../application/create.use-case';
import { UpdateUseCase } from '../application/update.use-case';
import { CreateFarmDto } from '../dto/create-farm.dto';
import { UpdateFarmDto } from '../dto/update-farm.dto';

@Controller('farms')
export class FarmsController {
  constructor(
    private readonly createUseCase: CreateUseCase,
    private readonly getByIdUseCase: GetByIdUseCase,
    private readonly updateUseCase: UpdateUseCase,
    private readonly deleteUseCase: DeleteUseCase
  ) { }

  @Post()
  create(@Body() createProducerDto: CreateFarmDto) {
    return this.createUseCase.execute(createProducerDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.getByIdUseCase.execute(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProducerDto: UpdateFarmDto) {
    return this.updateUseCase.execute(id, updateProducerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deleteUseCase.execute(id);
  }
}
