import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DeleteUseCase } from './delete.use-case';
import { ProducersRepository } from '../repositories/producers.repository';
import { FarmRepository } from '../../../modules/farms/repositories/farm.repository';
import { PlantedCropsRepository } from '../../../modules/planted_crops/repositories/planted-crops.repository';
import { CustomLoggerService } from '../../../common/logger/custom-logger.service';
import { Producer } from '../entities/producer.entity';
import { maskDocument } from '../../../common/helpers/mask-document.helpers';
import { PlantedCrop } from 'src/modules/planted_crops/entities/planted-crops.entity';
import { Farm } from 'src/modules/farms/entites/farm.entity';

jest.mock('../../../common/helpers/mask-document.helpers', () => ({
  maskDocument: jest.fn((doc: string) => `masked_${doc}`),
}));

describe('DeleteUseCase (Producer)', () => {
  let deleteUseCase: DeleteUseCase;
  let producersRepository: jest.Mocked<ProducersRepository>;
  let farmRepository: jest.Mocked<FarmRepository>;
  let plantedCropsRepository: jest.Mocked<PlantedCropsRepository>;
  let logger: jest.Mocked<CustomLoggerService>;

  const mockPlantedCrop: PlantedCrop = {
    id: 'crop-1',
    name: 'Soja',
    farm_id: 'farm-1',
    farm: null as any,
  };

  const mockFarm: Farm = {
    id: 'farm-1',
    name: 'Fazenda Santa Rita',
    producer_id: 'producer-1',
    city: 'Ribeirão Preto',
    state: 'SP',
    total_area: 1000,
    agricultural_area: 800,
    vegetation_area: 200,
    producer: null as any,
    planted_crops: [mockPlantedCrop],
  };

  const mockProducer: Producer = {
    id: 'producer-1',
    name: 'João Silva',
    document: '12345678901',
    document_type: 'pf',
    farms: [mockFarm],
  };

  const mockDeleteResult = {
    affected: 1,
    success: true,
  };

  beforeEach(async () => {
    const mockProducersRepo = {
      findOne: jest.fn(),
      deleteEntity: jest.fn(),
    };

    const mockFarmRepo = {
      findBy: jest.fn(),
      deleteEntity: jest.fn(),
    };

    const mockPlantedCropsRepo = {
      deleteEntity: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      logBusinessEvent: jest.fn(),
      logPerformanceMetric: jest.fn(),
      logSecurityEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteUseCase,
        { provide: ProducersRepository, useValue: mockProducersRepo },
        { provide: FarmRepository, useValue: mockFarmRepo },
        { provide: PlantedCropsRepository, useValue: mockPlantedCropsRepo },
        { provide: CustomLoggerService, useValue: mockLogger },
      ],
    }).compile();

    deleteUseCase = module.get<DeleteUseCase>(DeleteUseCase);
    producersRepository = module.get(ProducersRepository);
    farmRepository = module.get(FarmRepository);
    plantedCropsRepository = module.get(PlantedCropsRepository);
    logger = module.get(CustomLoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should delete producer with cascade successfully', async () => {
      const producerId = 'producer-1';
      producersRepository.findOne.mockResolvedValue(mockProducer);
      farmRepository.findBy.mockResolvedValue([mockFarm]);
      plantedCropsRepository.deleteEntity.mockResolvedValue(mockDeleteResult);
      farmRepository.deleteEntity.mockResolvedValue(mockDeleteResult);
      producersRepository.deleteEntity.mockResolvedValue(mockDeleteResult);

      const result = await deleteUseCase.execute(producerId);

      expect(producersRepository.findOne).toHaveBeenCalledWith(producerId, {
        relations: ['farms', 'farms.planted_crops']
      });
      expect(farmRepository.findBy).toHaveBeenCalledWith(
        { producer_id: producerId },
        { relations: ['planted_crops'] }
      );
      expect(plantedCropsRepository.deleteEntity).toHaveBeenCalledWith(mockPlantedCrop.id);
      expect(farmRepository.deleteEntity).toHaveBeenCalledWith(mockFarm.id);
      expect(producersRepository.deleteEntity).toHaveBeenCalledWith(producerId);
      expect(result.success).toBe(true);
    });

    it('should log business events for successful deletion', async () => {
      const producerId = 'producer-1';
      producersRepository.findOne.mockResolvedValue(mockProducer);
      farmRepository.findBy.mockResolvedValue([mockFarm]);
      plantedCropsRepository.deleteEntity.mockResolvedValue(mockDeleteResult);
      farmRepository.deleteEntity.mockResolvedValue(mockDeleteResult);
      producersRepository.deleteEntity.mockResolvedValue(mockDeleteResult);

      await deleteUseCase.execute(producerId);

      expect(logger.logBusinessEvent).toHaveBeenCalledWith('producer_deletion_started',
        expect.objectContaining({
          producerId: producerId,
          producerName: mockProducer.name,
        })
      );
      expect(logger.logBusinessEvent).toHaveBeenCalledWith('producer_deleted',
        expect.objectContaining({
          producerId: producerId,
          producerName: mockProducer.name,
        })
      );
      expect(maskDocument).toHaveBeenCalledWith(mockProducer.document);
    });

    it('should log performance metrics', async () => {
      const producerId = 'producer-1';
      producersRepository.findOne.mockResolvedValue(mockProducer);
      farmRepository.findBy.mockResolvedValue([mockFarm]);
      plantedCropsRepository.deleteEntity.mockResolvedValue(mockDeleteResult);
      farmRepository.deleteEntity.mockResolvedValue(mockDeleteResult);
      producersRepository.deleteEntity.mockResolvedValue(mockDeleteResult);

      await deleteUseCase.execute(producerId);

      expect(logger.logPerformanceMetric).toHaveBeenCalledWith(
        'producer_deletion_duration',
        expect.any(Number),
        'ms',
        expect.objectContaining({
          producerId: producerId,
          entitiesDeleted: expect.any(Number),
        })
      );
    });

    it('should throw NotFoundException when producer not found', async () => {
      const producerId = 'non-existent-id';
      producersRepository.findOne.mockResolvedValue(null);

      await expect(deleteUseCase.execute(producerId)).rejects.toThrow(NotFoundException);
      await expect(deleteUseCase.execute(producerId)).rejects.toThrow(`Producer with ID ${producerId} not found`);
      
      expect(logger.warn).toHaveBeenCalledWith('Producer not found for deletion', expect.any(Object));
      expect(logger.logSecurityEvent).toHaveBeenCalledWith(
        'producer_deletion_attempt_not_found',
        'low',
        expect.any(Object)
      );
    });

    it('should handle repository errors and log failure', async () => {
      const producerId = 'producer-1';
      const repositoryError = new Error('Database connection failed');
      producersRepository.findOne.mockRejectedValue(repositoryError);

      await expect(deleteUseCase.execute(producerId)).rejects.toThrow('Database connection failed');
      
      expect(logger.error).toHaveBeenCalledWith(
        'Producer deletion failed',
        repositoryError.stack,
        expect.objectContaining({
          producerId: producerId,
          errorMessage: 'Database connection failed',
        })
      );

      expect(logger.logBusinessEvent).toHaveBeenCalledWith('producer_deletion_failed',
        expect.objectContaining({
          producerId: producerId,
          errorMessage: 'Database connection failed',
        })
      );
    });

    it('should handle producer without farms', async () => {
      const producerId = 'producer-1';
      const producerWithoutFarms = { ...mockProducer, farms: [] };
      producersRepository.findOne.mockResolvedValue(producerWithoutFarms);
      farmRepository.findBy.mockResolvedValue([]);
      producersRepository.deleteEntity.mockResolvedValue(mockDeleteResult);

      const result = await deleteUseCase.execute(producerId);

      expect(farmRepository.findBy).toHaveBeenCalledWith(
        { producer_id: producerId },
        { relations: ['planted_crops'] }
      );
      expect(plantedCropsRepository.deleteEntity).not.toHaveBeenCalled();
      expect(farmRepository.deleteEntity).not.toHaveBeenCalled();
      expect(producersRepository.deleteEntity).toHaveBeenCalledWith(producerId);
      expect(result.success).toBe(true);
    });

    it('should handle farms without planted crops', async () => {
      const producerId = 'producer-1';
      const farmWithoutCrops = { ...mockFarm, planted_crops: [] };
      producersRepository.findOne.mockResolvedValue(mockProducer);
      farmRepository.findBy.mockResolvedValue([farmWithoutCrops]);
      farmRepository.deleteEntity.mockResolvedValue(mockDeleteResult);
      producersRepository.deleteEntity.mockResolvedValue(mockDeleteResult);

      const result = await deleteUseCase.execute(producerId);

      expect(plantedCropsRepository.deleteEntity).not.toHaveBeenCalled();
      expect(farmRepository.deleteEntity).toHaveBeenCalledWith(farmWithoutCrops.id);
      expect(producersRepository.deleteEntity).toHaveBeenCalledWith(producerId);
      expect(result.success).toBe(true);
    });
  });
});