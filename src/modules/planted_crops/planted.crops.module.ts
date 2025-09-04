import { Module } from '@nestjs/common';
import { CreateUseCase } from './application/create.use-case';
import { DeleteUseCase } from './application/delete.use-case';
import { UpdateUseCase } from './application/update.use-case';
import { GetByIdUseCase } from './application/get-by-id.use-case';
import { PlantedCropsRepository } from './repositories/planted-crops.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlantedCrop } from './entities/planted-crops.entity';
import { PlantedCropsController } from './adapters/planted-crops.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PlantedCrop])],
  controllers: [PlantedCropsController], 
  providers: [CreateUseCase, GetByIdUseCase, UpdateUseCase, DeleteUseCase, PlantedCropsRepository],
  exports: [PlantedCropsRepository]
})
export class PlantedCropsModule {}
