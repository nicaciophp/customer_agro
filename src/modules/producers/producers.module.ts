import { Module } from '@nestjs/common';
import { ProducersRepository } from './repositories/producers.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FarmRepository } from 'src/modules/farms/repositories/farm.repository';
import { PlantedCrop } from 'src/modules/planted_crops/entities/planted-crops.entity';
import { Producer } from './entities/producer.entity';
import { Farm } from '../farms/entites/farm.entity';
import { ProducersController } from './adapters/producers.controller';
import { CreateUseCase } from './application/create.use-case';
import { GetByIdUseCase } from './application/get-by-id.use-case';
import { UpdateUseCase } from './application/update.use-case';
import { DeleteUseCase } from './application/delete.use-case';
import { PlantedCropsRepository } from '../planted_crops/repositories/planted-crops.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Producer, Farm, PlantedCrop])],
  controllers: [ProducersController],
  providers: [
    CreateUseCase,
    ProducersRepository,
    GetByIdUseCase,
    UpdateUseCase,
    DeleteUseCase,
    FarmRepository,
    PlantedCropsRepository
  ],
  exports: [ProducersRepository]
})
export class ProducersModule { }
