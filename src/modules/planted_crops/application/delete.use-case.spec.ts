import { Test, TestingModule } from '@nestjs/testing';
import { DeleteUseCase } from './delete.use-case';
import { PlantedCropsRepository } from '../repositories/planted-crops.repository';
import { CustomLoggerService } from '../../../common/logger/custom-logger.service';
import { PlantedCrop } from '../entities/planted-crops.entity';

describe('DeleteUseCase (PlantedCrop)', () => {
  let deleteUseCase: DeleteUseCase;
  let plantedCropRepository: jest.Mocked<PlantedCropsRepository>;
  let logger: jest.Mocked<CustomLoggerService>;

  const mockPlantedCrop: PlantedCrop = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Soja',
    farm_id: '550e8400-e29b-41d4-a716-446655440000',
    farm: null as any,
  };

  const mockSuccessResult = {
    affected: 1,
    success: true,
  };

  const mockFailureResult = {
    affected: 0,
    success: false,
  };

  beforeEach(async () => {
    const mockRepository = {
      findOne: jest.fn(),
      deleteEntity: jest.fn(),
    };

    const mockLogger = {
      logBusinessEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteUseCase,
        { provide: PlantedCropsRepository, useValue: mockRepository },
        { provide: CustomLoggerService, useValue: mockLogger },
      ],
    }).compile();

    deleteUseCase = module.get<DeleteUseCase>(DeleteUseCase);
    plantedCropRepository = module.get(PlantedCropsRepository);
    logger = module.get(CustomLoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should delete planted crop successfully', async () => {
      const plantedCropId = '550e8400-e29b-41d4-a716-446655440001';
      plantedCropRepository.findOne.mockResolvedValue(mockPlantedCrop);
      plantedCropRepository.deleteEntity.mockResolvedValue(mockSuccessResult);

      const result = await deleteUseCase.execute(plantedCropId);

      expect(plantedCropRepository.findOne).toHaveBeenCalledWith(plantedCropId);
      expect(plantedCropRepository.deleteEntity).toHaveBeenCalledWith(plantedCropId);
      expect(result).toEqual(mockSuccessResult);
      expect(result.success).toBe(true);
      expect(result.affected).toBe(1);
    });

    it('should log business events when deletion succeeds', async () => {
      const plantedCropId = '550e8400-e29b-41d4-a716-446655440001';
      plantedCropRepository.findOne.mockResolvedValue(mockPlantedCrop);
      plantedCropRepository.deleteEntity.mockResolvedValue(mockSuccessResult);

      await deleteUseCase.execute(plantedCropId);

      expect(logger.logBusinessEvent).toHaveBeenCalledWith('planted_crop_deletion_started', {
        plantedCropId: plantedCropId,
        plantedCropName: mockPlantedCrop.name,
      });
      expect(logger.logBusinessEvent).toHaveBeenCalledWith('planted_crop_deleted', {
        plantedCropId: plantedCropId,
        plantedCropName: mockPlantedCrop.name,
      });
      expect(logger.logBusinessEvent).toHaveBeenCalledTimes(2);
    });

    it('should not log success when deletion fails', async () => {
      const plantedCropId = '550e8400-e29b-41d4-a716-446655440001';
      plantedCropRepository.findOne.mockResolvedValue(mockPlantedCrop);
      plantedCropRepository.deleteEntity.mockResolvedValue(mockFailureResult);

      await deleteUseCase.execute(plantedCropId);

      expect(logger.logBusinessEvent).toHaveBeenCalledWith('planted_crop_deletion_started', expect.any(Object));
      expect(logger.logBusinessEvent).not.toHaveBeenCalledWith('planted_crop_deleted', expect.any(Object));
      expect(logger.logBusinessEvent).toHaveBeenCalledTimes(1);
    });

    it('should handle repository errors', async () => {
      const plantedCropId = '550e8400-e29b-41d4-a716-446655440001';
      const repositoryError = new Error('Database connection failed');
      plantedCropRepository.findOne.mockRejectedValue(repositoryError);

      await expect(deleteUseCase.execute(plantedCropId)).rejects.toThrow('Database connection failed');
      expect(plantedCropRepository.findOne).toHaveBeenCalledWith(plantedCropId);
    });
  });
});