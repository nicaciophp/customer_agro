import { Injectable, NotFoundException } from "@nestjs/common";
import { ProducersRepository } from "../repositories/producers.repository";
import { FarmRepository } from "src/modules/farms/repositories/farm.repository";
import { CustomLoggerService } from "src/common/logger/custom-logger.service";
import { LogMethod } from "src/common/decorators/log-method.decorator";
import { PlantedCropsRepository } from "src/modules/planted_crops/repositories/planted-crops.repository";

@Injectable()
export class DeleteUseCase {
    constructor(
        private readonly producersRepository: ProducersRepository,
        private readonly farmRepository: FarmRepository,
        private readonly plantedCropRepository: PlantedCropsRepository,
        private readonly logger: CustomLoggerService,
    ) {}

    @LogMethod('Delete producer with cascade')
    async execute(id: string) {
        const startTime = Date.now();
        const operationId = `delete-producer-${Date.now()}`;
        
        try {
            this.logger.log('Starting producer deletion process', {
                operationId,
                producerId: id
            });

            const producer = await this.getProducerWithRelations(id, operationId);

            const farms = await this.getFarmsByProducer(id, operationId);

            const deletionStats = await this.collectDeletionStatistics(id, farms, operationId);

            this.logger.logBusinessEvent('producer_deletion_started', {
                operationId,
                producerId: id,
                producerName: producer.name,
                producerDocument: this.maskDocument(producer.document),
                relatedEntities: deletionStats
            });

            await this.executeCascadeDeletion(id, farms, operationId);

            const duration = Date.now() - startTime;

            this.logger.logBusinessEvent('producer_deleted', {
                operationId,
                producerId: id,
                producerName: producer.name,
                producerDocument: this.maskDocument(producer.document),
                deletedEntities: deletionStats,
                duration
            });

            this.logger.logPerformanceMetric('producer_deletion_duration', duration, 'ms', {
                operationId,
                producerId: id,
                entitiesDeleted: deletionStats.totalEntities
            });

            this.logger.log('Producer deletion completed successfully', {
                operationId,
                producerId: id,
                producerName: producer.name,
                deletedEntities: deletionStats,
                duration,
                success: true
            });

            return {
                success: true,
                message: 'Producer and all related entities deleted successfully',
                deletedEntities: deletionStats,
                duration
            };

        } catch (error) {
            const duration = Date.now() - startTime;
            
            this.logger.error('Producer deletion failed', error.stack, {
                operationId,
                producerId: id,
                duration,
                errorMessage: error.message,
                errorType: error.constructor.name
            });

            this.logger.logBusinessEvent('producer_deletion_failed', {
                operationId,
                producerId: id,
                errorMessage: error.message,
                duration
            });

            throw error;
        }
    }

    private async getProducerWithRelations(id: string, operationId: string) {
        this.logger.debug('Fetching producer data', { operationId, producerId: id });
        
        const producer = await this.producersRepository.findOne(id, {
            relations: ['farms', 'farms.planted_crops']
        });

        if (!producer) {
            this.logger.warn('Producer not found for deletion', {
                operationId,
                producerId: id
            });

            this.logger.logSecurityEvent('producer_deletion_attempt_not_found', 'low', {
                operationId,
                producerId: id
            });

            throw new NotFoundException(`Producer with ID ${id} not found`);
        }

        this.logger.log('Producer found for deletion', {
            operationId,
            producerId: id,
            producerName: producer.name,
            producerDocument: this.maskDocument(producer.document),
            farmsCount: producer.farms?.length || 0
        });

        return producer;
    }

    private async getFarmsByProducer(producerId: string, operationId: string) {
        this.logger.debug('Fetching farms for producer', { operationId, producerId });
        
        const farms = await this.farmRepository.findBy(
            { producer_id: producerId },
            { relations: ['planted_crops'] }
        );

        this.logger.log('Farms found for producer', {
            operationId,
            producerId,
            farmsCount: farms.length,
            farmIds: farms.map(f => f.id)
        });

        return farms;
    }

    private async collectDeletionStatistics(producerId: string, farms: any[], operationId: string) {
        this.logger.debug('Collecting deletion statistics', { operationId, producerId });

        const farmIds = farms.map(farm => farm.id);
        const totalPlantedCrops = farms.reduce((sum, farm) => sum + (farm.planted_crops?.length || 0), 0);

        const stats = {
            producer: 1,
            farms: farms.length,
            plantedCrops: totalPlantedCrops,
            totalEntities: 1 + farms.length + totalPlantedCrops,
            farmIds,
            totalFarmArea: farms.reduce((sum, farm) => sum + (farm.total_area || 0), 0)
        };

        this.logger.log('Deletion statistics collected', {
            operationId,
            producerId,
            statistics: stats
        });

        return stats;
    }

    private async executeCascadeDeletion(producerId: string, farms: any[], operationId: string) {
        this.logger.log('Starting cascade deletion process', {
            operationId,
            producerId,
            farmsCount: farms.length
        });

        let deletedCrops = 0;
        let deletedFarms = 0;

        for (const farm of farms) {
            if (farm.planted_crops && farm.planted_crops.length > 0) {
                this.logger.debug('Deleting planted crops for farm', {
                    operationId,
                    farmId: farm.id,
                    farmName: farm.name,
                    cropsCount: farm.planted_crops.length
                });

                for (const crop of farm.planted_crops) {
                    await this.plantedCropRepository.deleteEntity(crop.id);
                    deletedCrops++;

                    this.logger.debug('Planted crop deleted', {
                        operationId,
                        cropId: crop.id,
                        cropName: crop.name,
                        farmId: farm.id
                    });
                }

                this.logger.log('All planted crops deleted for farm', {
                    operationId,
                    farmId: farm.id,
                    deletedCropsCount: farm.planted_crops.length
                });
            }
        }

        for (const farm of farms) {
            this.logger.debug('Deleting farm', {
                operationId,
                farmId: farm.id,
                farmName: farm.name,
                farmArea: farm.total_area
            });

            await this.farmRepository.deleteEntity(farm.id);
            deletedFarms++;

            this.logger.log('Farm deleted', {
                operationId,
                farmId: farm.id,
                farmName: farm.name
            });
        }

        this.logger.debug('Deleting producer', {
            operationId,
            producerId
        });

        const producerDeletionResult = await this.producersRepository.deleteEntity(producerId);

        this.logger.log('Cascade deletion completed', {
            operationId,
            producerId,
            deletedEntities: {
                producer: producerDeletionResult.success ? 1 : 0,
                farms: deletedFarms,
                plantedCrops: deletedCrops,
                total: (producerDeletionResult.success ? 1 : 0) + deletedFarms + deletedCrops
            }
        });

        if (!producerDeletionResult.success) {
            throw new Error('Failed to delete producer after cascade deletion');
        }
    }

    private maskDocument(document: string): string {
        if (!document) return 'N/A';
        
        const cleanDoc = document.replace(/\D/g, '');
        
        if (cleanDoc.length === 11) {
            return `${cleanDoc.substring(0, 3)}.***.***-${cleanDoc.substring(9)}`;
        } else if (cleanDoc.length === 14) {
            return `${cleanDoc.substring(0, 2)}.${cleanDoc.substring(2, 5)}.***/**${cleanDoc.substring(10, 12)}-${cleanDoc.substring(12)}`;
        } else {
            if (cleanDoc.length <= 4) return cleanDoc.replace(/./g, '*');
            return `${cleanDoc.substring(0, 2)}***${cleanDoc.substring(cleanDoc.length - 2)}`;
        }
    }
}