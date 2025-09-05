import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetByIdUseCase } from './get-by-id.use-case';
import { FarmRepository } from '../repositories/farm.repository';
import { Farm } from '../entites/farm.entity';

describe('GetByIdUseCase (Farm)', () => {
  let getByIdUseCase: GetByIdUseCase;
  let farmRepository: jest.Mocked<FarmRepository>;

  const mockFarm: Farm = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Fazenda Santa Rita',
    producer_id: '550e8400-e29b-41d4-a716-446655440000',
    city: 'Ribeirão Preto',
    state: 'SP',
    total_area: 1250.75,
    agricultural_area: 950.50,
    vegetation_area: 300.25,
    producer: null as any,
    planted_crops: [],
  };

  beforeEach(async () => {
    const mockFarmRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      createEntity: jest.fn(),
      deleteEntity: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetByIdUseCase,
        {
          provide: FarmRepository,
          useValue: mockFarmRepository,
        },
      ],
    }).compile();

    getByIdUseCase = module.get<GetByIdUseCase>(GetByIdUseCase);
    farmRepository = module.get(FarmRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return farm when found', async () => {
      const farmId = '550e8400-e29b-41d4-a716-446655440001';
      farmRepository.findOne.mockResolvedValue(mockFarm);

      const result = await getByIdUseCase.execute(farmId);

      expect(farmRepository.findOne).toHaveBeenCalledWith(farmId);
      expect(result).toEqual(mockFarm);
      expect(result.id).toBe(farmId);
      expect(result.name).toBe('Fazenda Santa Rita');
    });

    it('should throw NotFoundException when farm not found', async () => {
      const farmId = 'non-existent-id';
      farmRepository.findOne.mockResolvedValue(null);

      await expect(getByIdUseCase.execute(farmId)).rejects.toThrow(NotFoundException);
      await expect(getByIdUseCase.execute(farmId)).rejects.toThrow('Farm not found');
      expect(farmRepository.findOne).toHaveBeenCalledWith(farmId);
    });

    it('should call repository with correct id', async () => {
      const farmId = '550e8400-e29b-41d4-a716-446655440001';
      farmRepository.findOne.mockResolvedValue(mockFarm);

      await getByIdUseCase.execute(farmId);

      expect(farmRepository.findOne).toHaveBeenCalledTimes(1);
      expect(farmRepository.findOne).toHaveBeenCalledWith(farmId);
    });

    it('should handle repository errors', async () => {
      const farmId = '550e8400-e29b-41d4-a716-446655440001';
      const repositoryError = new Error('Database connection failed');
      farmRepository.findOne.mockRejectedValue(repositoryError);

      await expect(getByIdUseCase.execute(farmId)).rejects.toThrow('Database connection failed');
      expect(farmRepository.findOne).toHaveBeenCalledWith(farmId);
    });
  });
});