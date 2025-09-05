import { Test, TestingModule } from "@nestjs/testing"
import { FindUseCase } from './find.use-case';
import { FarmRepository } from "../../../modules/farms/repositories/farm.repository"
import { PlantedCropsRepository } from '../../../modules/planted_crops/repositories/planted-crops.repository';
import { ProducersRepository } from "../../../modules/producers/repositories/producers.repository"

describe('FindUseCase (Dashboard)', () => {
  let findUseCase: FindUseCase;
  let farmRepository: jest.Mocked<FarmRepository>
  let producerRepository: jest.Mocked<ProducersRepository>;
  let plantedCropRepository: jest.Mocked<PlantedCropsRepository>

  const mockFarmsByState = [
    { name: "SP", value: 45, totalArea: 15000 },
    { name: 'MG', value: 35, totalArea: 12000 }
  ];

  const mockCropsData = [
    { name: 'Soja', value: 120, totalArea: 8000 },
    { name: "Milho", value: 90, totalArea: 6000 }
  ]

  const mockLandUseData = [
    { name: "Área Agricultável", value: 15000 },
    { name: 'Área de Vegetação', value: 10000 }
  ];

  const mockAveragesData = {
    avgFarmSize: 312.5,
    avgAgriculturalArea: 250.0,
    avgVegetationArea: 62.5
  }

  beforeEach(async () => {
    const mockFarmRepo = {
      count: jest.fn(),
      getTotalHectares: jest.fn(),
      getFarmsByState: jest.fn(),
      getLandUseData: jest.fn(),
      getAverageData: jest.fn(),
      getStateStatistics: jest.fn(),
      getTopProductiveFarms: jest.fn()
    };

    const mockProducerRepo = {
      count: jest.fn(),
    }

    const mockPlantedCropRepo = {
      getCropsByType: jest.fn(),
      getCropStatistics: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindUseCase,
        { provide: FarmRepository, useValue: mockFarmRepo },
        { provide: ProducersRepository, useValue: mockProducerRepo },
        { provide: PlantedCropsRepository, useValue: mockPlantedCropRepo },
      ],
    }).compile();

    findUseCase = module.get<FindUseCase>(FindUseCase)
    farmRepository = module.get(FarmRepository);
    producerRepository = module.get(ProducersRepository)
    plantedCropRepository = module.get(PlantedCropsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getDashboardData', () => {
    it("should return complete dashboard data sucessfuly", async () => {
      farmRepository.count.mockResolvedValue(150);
      farmRepository.getTotalHectares.mockResolvedValue(25000.5)
      producerRepository.count.mockResolvedValue(85);
      farmRepository.getFarmsByState.mockResolvedValue(mockFarmsByState)
      plantedCropRepository.getCropsByType.mockResolvedValue(mockCropsData);
      farmRepository.getLandUseData.mockResolvedValue(mockLandUseData)
      farmRepository.getAverageData.mockResolvedValue(mockAveragesData);

      const result = await findUseCase.getDashboardData()

      expect(result.totalFarms).toBe(150);
      expect(result.totalHectares).toBe(25000.5)
      expect(result.totalProducers).toBe(85);
      expect(result.chartData.farmsByState).toHaveLength(2)
      expect(result.chartData.cropsByType).toHaveLength(2);
      expect(result.chartData.landUse).toHaveLength(2)
      expect(result.averages).toEqual(mockAveragesData);
      expect(result.topStates).toHaveLength(2)
      expect(result.topCrops).toHaveLength(2);
    })

    it('should calculate percentages corretly', async () => {
      farmRepository.count.mockResolvedValue(150)
      farmRepository.getTotalHectares.mockResolvedValue(25000.5);
      producerRepository.count.mockResolvedValue(85)
      farmRepository.getFarmsByState.mockResolvedValue(mockFarmsByState);
      plantedCropRepository.getCropsByType.mockResolvedValue(mockCropsData)
      farmRepository.getLandUseData.mockResolvedValue(mockLandUseData);
      farmRepository.getAverageData.mockResolvedValue(mockAveragesData)

      const result = await findUseCase.getDashboardData();

      expect(result.chartData.farmsByState[0].percentage).toBe(56.25)
      expect(result.chartData.farmsByState[1].percentage).toBe(43.75);
      expect(result.chartData.cropsByType[0].percentage).toBe(57.14)
      expect(result.chartData.cropsByType[1].percentage).toBe(42.86);
    });

    it("should handle empty data gracefuly", async () => {
      farmRepository.count.mockResolvedValue(0);
      farmRepository.getTotalHectares.mockResolvedValue(0)
      producerRepository.count.mockResolvedValue(0);
      farmRepository.getFarmsByState.mockResolvedValue([])
      plantedCropRepository.getCropsByType.mockResolvedValue([]);
      farmRepository.getLandUseData.mockResolvedValue([])
      farmRepository.getAverageData.mockResolvedValue({
        avgFarmSize: 0,
        avgAgriculturalArea: 0,
        avgVegetationArea: 0
      });

      const result = await findUseCase.getDashboardData()

      expect(result.totalFarms).toBe(0);
      expect(result.totalHectares).toBe(0)
      expect(result.totalProducers).toBe(0);
      expect(result.chartData.farmsByState).toHaveLength(0)
      expect(result.chartData.cropsByType).toHaveLength(0);
      expect(result.topStates).toHaveLength(0)
    });

    it('should handle repository erors', async () => {
      farmRepository.count.mockRejectedValue(new Error("Database error"))

      await expect(findUseCase.getDashboardData()).rejects.toThrow('Database error');
    });
  })

  describe("getStateStatistics", () => {
    it('should return state statistics', async () => {
      const mockStateStats = [
        { state: "SP", farms: 45, totalArea: 15000 },
        { state: 'MG', farms: 35, totalArea: 12000 }
      ];
      farmRepository.getStateStatistics.mockResolvedValue(mockStateStats)

      const result = await findUseCase.getStateStatistics();

      expect(result).toEqual(mockStateStats)
      expect(farmRepository.getStateStatistics).toHaveBeenCalledTimes(1);
    })
  });

  describe('getCropStatistics', () => {
    it("should return crop statistics", async () => {
      const mockCropStats = [
        { crop: 'Soja', count: 120, totalArea: 8000 },
        { crop: "Milho", count: 90, totalArea: 6000 }
      ]
      plantedCropRepository.getCropStatistics.mockResolvedValue(mockCropStats);

      const result = await findUseCase.getCropStatistics()

      expect(result).toEqual(mockCropStats);
      expect(plantedCropRepository.getCropStatistics).toHaveBeenCalledTimes(1)
    });
  })

  describe("getTopProductiveFarms", () => {
    it('should return top productive farms with default limit', async () => {
      const mockTopFarms = [
        { id: "farm-1", name: 'Fazenda A', totalArea: 5000 },
        { id: 'farm-2', name: "Fazenda B", totalArea: 4500 }
      ];
      farmRepository.getTopProductiveFarms.mockResolvedValue(mockTopFarms)

      const result = await findUseCase.getTopProductiveFarms();

      expect(result).toEqual(mockTopFarms)
      expect(farmRepository.getTopProductiveFarms).toHaveBeenCalledWith(10);
    })

    it("should return top productive farms with custom limit", async () => {
      const mockTopFarms = [
        { id: 'farm-1', name: "Fazenda A", totalArea: 5000 }
      ];
      farmRepository.getTopProductiveFarms.mockResolvedValue(mockTopFarms);

      const result = await findUseCase.getTopProductiveFarms(5)

      expect(result).toEqual(mockTopFarms);
      expect(farmRepository.getTopProductiveFarms).toHaveBeenCalledWith(5)
    });
  });

  describe('calculatePercentages', () => {
    it("should calculate percentages corretly for valid data", () => {
      const testData = [
        { name: 'A', value: 30 },
        { name: "B", value: 70 }
      ];

      const result = findUseCase['calculatePercentages'](testData)

      expect(result[0].percentage).toBe(30.0);
      expect(result[1].percentage).toBe(70.0)
      expect(result[0].name).toBe('A');
      expect(result[1].name).toBe("B")
    })

    it('should handle zero total gracefuly', () => {
      const testData = [
        { name: "A", value: 0 },
        { name: 'B', value: 0 }
      ];

      const result = findUseCase['calculatePercentages'](testData);

      expect(result[0].percentage).toBe(0)
      expect(result[1].percentage).toBe(0);
    });
  })
})