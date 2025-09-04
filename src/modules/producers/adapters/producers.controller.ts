import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CreateProducerDto } from '../dto/create-producer.dto';
import { UpdateProducerDto } from '../dto/update-producer.dto';
import { CreateUseCase } from '../application/create.use-case';
import { GetByIdUseCase } from '../application/get-by-id.use-case';
import { UpdateUseCase } from '../application/update.use-case';
import { DeleteUseCase } from '../application/delete.use-case';
@Controller('producers')
export class ProducersController {
  constructor(
    private readonly createUseCase: CreateUseCase,
    private readonly getByIdUseCase: GetByIdUseCase,
    private readonly updateUseCase: UpdateUseCase,
    private readonly deleteUseCase: DeleteUseCase
  ) {}

  @Post()
  create(@Body() createProducerDto: CreateProducerDto) {
    return this.createUseCase.execute(createProducerDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.getByIdUseCase.execute(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProducerDto: UpdateProducerDto) {
    return this.updateUseCase.execute(id, updateProducerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deleteUseCase.execute(id);
  }
}
