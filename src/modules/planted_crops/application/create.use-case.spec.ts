import { Test, TestingModule } from '@nestjs/testing';
import { CreateUseCase } from './create.use-case';
import { PlantedCropsRepository } from '../repositories/planted-crops.repository';
import { CustomLoggerService } from '../../../common/logger/custom-logger.service';
import { CreatePlantedCropDto } from '../dto/create-planted_crop.dto';
import { PlantedCrop } from '../entities/planted-crops.entity';

describe('CreateUseCase (PlantedCrop)', () => {
  let createUseCase: CreateUseCase;
  let plantedCropsRepository: jest.Mocked<PlantedCropsRepository>;
  let logger: jest.Mocked<CustomLoggerService>;

  const mockPlantedCrop: PlantedCrop = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Soja',
    farm_id: '550e8400-e29b-41d4-a716-446655440000',
    farm: null as any,
  };

  const mockCreateDto: CreatePlantedCropDto = {
    name: 'Soja',
    farm_id: '550e8400-e29b-41d4-a716-446655440000',
  };

  beforeEach(async () => {
    const mockRepository = {
      createEntity: jest.fn(),
    };

    const mockLogger = {
      logBusinessEvent: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUseCase,
        { provide: PlantedCropsRepository, useValue: mockRepository },
        { provide: CustomLoggerService, useValue: mockLogger },
      ],
    }).compile();

    createUseCase = module.get<CreateUseCase>(CreateUseCase);
    plantedCropsRepository = module.get(PlantedCropsRepository);
    logger = module.get(CustomLoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should create planted crop successfully', async () => {
      plantedCropsRepository.createEntity.mockResolvedValue(mockPlantedCrop);

      const result = await createUseCase.execute(mockCreateDto);

      expect(plantedCropsRepository.createEntity).toHaveBeenCalledWith(mockCreateDto);
      expect(result).toEqual(mockPlantedCrop);
      expect(result.name).toBe('Soja');
      expect(result.farm_id).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should log business events', async () => {
      plantedCropsRepository.createEntity.mockResolvedValue(mockPlantedCrop);

      await createUseCase.execute(mockCreateDto);

      expect(logger.logBusinessEvent).toHaveBeenCalledWith('planted_crops_creation_started', {
        farmId: mockCreateDto.farm_id,
        farmName: mockCreateDto.name,
      });
      expect(logger.logBusinessEvent).toHaveBeenCalledWith('planted_crops_created', {
        plantedCropsId: mockPlantedCrop.id,
        farmId: mockPlantedCrop.farm_id,
        farmName: mockPlantedCrop.name,
      });
      expect(logger.logBusinessEvent).toHaveBeenCalledTimes(2);
    });

    it('should handle repository errors', async () => {
      const repositoryError = new Error('Database connection failed');
      plantedCropsRepository.createEntity.mockRejectedValue(repositoryError);

      await expect(createUseCase.execute(mockCreateDto)).rejects.toThrow('Database connection failed');
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to create planted crops',
        repositoryError.stack,
        { farmId: mockCreateDto.farm_id }
      );
    });
  });
});