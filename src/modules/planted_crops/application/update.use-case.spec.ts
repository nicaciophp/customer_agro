import { Test, TestingModule } from '@nestjs/testing';
import { UpdateUseCase } from './update.use-case';
import { PlantedCropsRepository } from '../repositories/planted-crops.repository';
import { CustomLoggerService } from '../../../common/logger/custom-logger.service';
import { UpdatePlantedCropDto } from '../dto/update-planted_crop.dto';
import { PlantedCrop } from '../entities/planted-crops.entity';

describe('UpdateUseCase (PlantedCrop)', () => {
  let updateUseCase: UpdateUseCase;
  let plantedCropsRepository: jest.Mocked<PlantedCropsRepository>;
  let logger: jest.Mocked<CustomLoggerService>;

  const mockExistingPlantedCrop: PlantedCrop = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Soja',
    farm_id: '550e8400-e29b-41d4-a716-446655440000',
    farm: null as any,
  };

  const mockUpdatedPlantedCrop: PlantedCrop = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Milho',
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

  const mockUpdateDto: UpdatePlantedCropDto = {
    name: 'Milho',
  };

  beforeEach(async () => {
    const mockRepository = {
      findOne: jest.fn(),
      updateEntity: jest.fn(),
    };

    const mockLogger = {
      logBusinessEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateUseCase,
        { provide: PlantedCropsRepository, useValue: mockRepository },
        { provide: CustomLoggerService, useValue: mockLogger },
      ],
    }).compile();

    updateUseCase = module.get<UpdateUseCase>(UpdateUseCase);
    plantedCropsRepository = module.get(PlantedCropsRepository);
    logger = module.get(CustomLoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should update planted crop successfully', async () => {
      const plantedCropId = '550e8400-e29b-41d4-a716-446655440001';
      plantedCropsRepository.findOne.mockResolvedValue(mockExistingPlantedCrop);
      plantedCropsRepository.updateEntity.mockResolvedValue(mockUpdatedPlantedCrop);

      const result = await updateUseCase.execute(plantedCropId, mockUpdateDto);

      expect(plantedCropsRepository.findOne).toHaveBeenCalledWith(plantedCropId);
      expect(plantedCropsRepository.updateEntity).toHaveBeenCalledWith(
        plantedCropId,
        mockUpdateDto,
        ['farm']
      );
      expect(result).toEqual(mockUpdatedPlantedCrop);
      expect(result?.name).toBe('Milho');
      expect(result?.farm).toBeDefined();
    });

    it('should log business events', async () => {
      const plantedCropId = '550e8400-e29b-41d4-a716-446655440001';
      plantedCropsRepository.findOne.mockResolvedValue(mockExistingPlantedCrop);
      plantedCropsRepository.updateEntity.mockResolvedValue(mockUpdatedPlantedCrop);

      await updateUseCase.execute(plantedCropId, mockUpdateDto);

      expect(logger.logBusinessEvent).toHaveBeenCalledWith('planted_crop_update_started', {
        plantedCropId: plantedCropId,
        changes: mockUpdateDto,
      });
      expect(logger.logBusinessEvent).toHaveBeenCalledWith('planted_crop_updated', {
        plantedCropId: plantedCropId,
        oldData: mockExistingPlantedCrop,
        newData: mockUpdatedPlantedCrop,
      });
      expect(logger.logBusinessEvent).toHaveBeenCalledTimes(2);
    });

    it('should handle repository errors', async () => {
      const plantedCropId = '550e8400-e29b-41d4-a716-446655440001';
      const repositoryError = new Error('Database error');
      plantedCropsRepository.findOne.mockRejectedValue(repositoryError);

      await expect(updateUseCase.execute(plantedCropId, mockUpdateDto)).rejects.toThrow('Database error');
      expect(plantedCropsRepository.findOne).toHaveBeenCalledWith(plantedCropId);
    });
  });
});