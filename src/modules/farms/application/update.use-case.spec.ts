import { Test, TestingModule } from '@nestjs/testing';
import { UpdateUseCase } from './update.use-case';
import { FarmRepository } from '../repositories/farm.repository';
import { CustomLoggerService } from '../../../common/logger/custom-logger.service';
import { UpdateFarmDto } from '../dto/update-farm.dto';
import { Farm } from '../entites/farm.entity';

describe('UpdateUseCase (Farm)', () => {
  let updateUseCase: UpdateUseCase;
  let farmRepository: jest.Mocked<FarmRepository>;
  let logger: jest.Mocked<CustomLoggerService>;

  const mockExistingFarm: Farm = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Fazenda Original',
    producer_id: '550e8400-e29b-41d4-a716-446655440000',
    city: 'Ribeirão Preto',
    state: 'SP',
    total_area: 1000,
    agricultural_area: 800,
    vegetation_area: 200,
    producer: null as any,
    planted_crops: [],
  };

  const mockUpdatedFarm: Farm = {
    ...mockExistingFarm,
    name: 'Fazenda Atualizada',
    city: 'Campinas',
    total_area: 1200,
  };

  const mockUpdateDto: UpdateFarmDto = {
    name: 'Fazenda Atualizada',
    city: 'Campinas',
    total_area: 1200,
  };

  beforeEach(async () => {
    const mockFarmRepository = {
      findOne: jest.fn(),
      updateEntity: jest.fn(),
    };

    const mockLogger = {
      logBusinessEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateUseCase,
        { provide: FarmRepository, useValue: mockFarmRepository },
        { provide: CustomLoggerService, useValue: mockLogger },
      ],
    }).compile();

    updateUseCase = module.get<UpdateUseCase>(UpdateUseCase);
    farmRepository = module.get(FarmRepository);
    logger = module.get(CustomLoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should update farm successfully', async () => {
      const farmId = '550e8400-e29b-41d4-a716-446655440001';
      farmRepository.findOne.mockResolvedValue(mockExistingFarm);
      farmRepository.updateEntity.mockResolvedValue(mockUpdatedFarm);

      const result = await updateUseCase.execute(farmId, mockUpdateDto);

      expect(farmRepository.findOne).toHaveBeenCalledWith(farmId);
      expect(farmRepository.updateEntity).toHaveBeenCalledWith(
        farmId,
        mockUpdateDto,
        ['producer']
      );
      expect(result).toEqual(mockUpdatedFarm);
    });

    it('should log business events', async () => {
      const farmId = '550e8400-e29b-41d4-a716-446655440001';
      farmRepository.findOne.mockResolvedValue(mockExistingFarm);
      farmRepository.updateEntity.mockResolvedValue(mockUpdatedFarm);

      await updateUseCase.execute(farmId, mockUpdateDto);

      expect(logger.logBusinessEvent).toHaveBeenCalledWith('farm_update_started', {
        farmId: farmId,
        changes: mockUpdateDto,
      });
      expect(logger.logBusinessEvent).toHaveBeenCalledWith('farm_updated', {
        farmId: farmId,
        oldData: mockExistingFarm,
        newData: mockUpdatedFarm,
      });
      expect(logger.logBusinessEvent).toHaveBeenCalledTimes(2);
    });

    it('should handle repository errors', async () => {
      const farmId = '550e8400-e29b-41d4-a716-446655440001';
      const repositoryError = new Error('Database error');
      farmRepository.findOne.mockRejectedValue(repositoryError);

      await expect(updateUseCase.execute(farmId, mockUpdateDto)).rejects.toThrow('Database error');
      expect(farmRepository.findOne).toHaveBeenCalledWith(farmId);
    });
  });
});