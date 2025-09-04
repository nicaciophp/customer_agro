import { Module } from '@nestjs/common';
import { FindUseCase } from './application/find.use-case';
import { DashboardController } from './adapters/dashboard.controller';
import { FarmsModule } from '../farms/farms.module';
import { ProducersModule } from '../producers/producers.module';
import { PlantedCropsModule } from '../planted_crops/planted.crops.module';

@Module({
   imports: [
    FarmsModule,
    ProducersModule,
    PlantedCropsModule,
  ],
  controllers: [DashboardController],
  providers: [FindUseCase]
})
export class DashboardModule {}
