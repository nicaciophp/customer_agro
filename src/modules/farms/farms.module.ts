import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FarmsController } from './adapters/farms.controller';
import { CreateUseCase } from './application/create.use-case';
import { GetByIdUseCase } from './application/get-by-id.use-case';
import { FarmRepository } from './repositories/farm.repository';
import { Farm } from './entites/farm.entity';
import { UpdateUseCase } from './application/update.use-case';
import { DeleteUseCase } from './application/delete.use-case';

@Module({
   imports: [TypeOrmModule.forFeature([Farm])],
    controllers: [FarmsController], 
    providers: [CreateUseCase, GetByIdUseCase, UpdateUseCase, DeleteUseCase, FarmRepository],
    exports: [FarmRepository]
})
export class FarmsModule {}
