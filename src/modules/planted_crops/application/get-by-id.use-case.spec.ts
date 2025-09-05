import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetByIdUseCase } from './get-by-id.use-case';
import { PlantedCropsRepository } from '../repositories/planted-crops.repository';
import { CustomLoggerService } from '../../../common/logger/custom-logger.service';
import { PlantedCrop } from '../entities/planted-crops.entity';

describe('GetByIdUseCase (PlantedCrop)', () => {
  let getByIdUseCase: GetByIdUseCase;
  let plantedCropRepository: jest.Mocked<PlantedCropsRepository>;
  let logger: jest.Mocked<CustomLoggerService>;

  const mockPlantedCrop: PlantedCrop = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Soja',
    farm_id: '550e8400-e29b-41d4-a716-446655440000',
    farm: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Fazenda Santa Rita',
      producer_id: '550e8400-e29b-41d4-a716-446655440002',
      city: 'Ribeirão Preto',
      state: 'SP',
      total_area: 1000,
      agricultural_area: 800,
      vegetation_area: 200,
      producer: null as any,
      planted_crops: [],
    },
  };

  beforeEach(async () => {
    const mockRepository = {
      findOne: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      warn: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetByIdUseCase,
        { provide: PlantedCropsRepository, useValue: mockRepository },
        { provide: CustomLoggerService, useValue: mockLogger },
      ],
    }).compile();

    getByIdUseCase = module.get<GetByIdUseCase>(GetByIdUseCase);
    plantedCropRepository = module.get(PlantedCropsRepository);
    logger = module.get(CustomLoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return planted crop with farm relation when found', async () => {
      const plantedCropId = '550e8400-e29b-41d4-a716-446655440001';
      plantedCropRepository.findOne.mockResolvedValue(mockPlantedCrop);

      const result = await getByIdUseCase.execute(plantedCropId);

      expect(plantedCropRepository.findOne).toHaveBeenCalledWith(plantedCropId, {
        relations: ['farm']
      });
      expect(result).toEqual(mockPlantedCrop);
      expect(result.name).toBe('Soja');
      expect(result.farm).toBeDefined();
      expect(result.farm?.name).toBe('Fazenda Santa Rita');
    });

    it('should log success when planted crop is found', async () => {
      const plantedCropId = '550e8400-e29b-41d4-a716-446655440001';
      plantedCropRepository.findOne.mockResolvedValue(mockPlantedCrop);

      await getByIdUseCase.execute(plantedCropId);

      expect(logger.log).toHaveBeenCalledWith(
        `Planted retrieved: ${mockPlantedCrop.name}`,
        { plantedCropId: plantedCropId }
      );
    });

    it('should throw NotFoundException when planted crop not found', async () => {
      const plantedCropId = 'non-existent-id';
      plantedCropRepository.findOne.mockResolvedValue(null);

      await expect(getByIdUseCase.execute(plantedCropId)).rejects.toThrow(NotFoundException);
      await expect(getByIdUseCase.execute(plantedCropId)).rejects.toThrow(`Planted Crop with ID ${plantedCropId} not found`);
    });

    it('should log warning when planted crop not found', async () => {
      const plantedCropId = 'non-existent-id';
      plantedCropRepository.findOne.mockResolvedValue(null);

      try {
        await getByIdUseCase.execute(plantedCropId);
      } catch (error) {
      }

      expect(logger.warn).toHaveBeenCalledWith(`Planted Crop not found: ${plantedCropId}`);
    });

    it('should handle repository errors', async () => {
      const plantedCropId = '550e8400-e29b-41d4-a716-446655440001';
      const repositoryError = new Error('Database connection failed');
      plantedCropRepository.findOne.mockRejectedValue(repositoryError);

      await expect(getByIdUseCase.execute(plantedCropId)).rejects.toThrow('Database connection failed');
      expect(plantedCropRepository.findOne).toHaveBeenCalledWith(plantedCropId, {
        relations: ['farm']
      });
    });
  });
});