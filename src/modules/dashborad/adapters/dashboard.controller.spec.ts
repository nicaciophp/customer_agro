import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from "@nestjs/common";
import * as request from 'supertest'
import { DashboardController } from './dashboard.controller';
import { FindUseCase } from "../application/find.use-case"
import { BadRequestException } from '@nestjs/common';

describe("DashboardController (integraion)", () => {
  let app: INestApplication;
  let findUseCase: jest.Mocked<FindUseCase>

  const mockDashboardData = {
    totalFarms: 150,
    totalHectares: 25000.5,
    totalProducers: 85,
    chartData: {
      farmsByState: [
        { name: "SP", value: 45, percentage: 30.0 },
        { name: 'MG', value: 35, percentage: 23.33 }
      ],
      cropsByType: [
        { name: 'Soja', value: 120, percentage: 40.0 },
        { name: "Milho", value: 90, percentage: 30.0 }
      ],
      landUse: [
        { name: "Área Agricultável", value: 15000, percentage: 60.0 },
        { name: 'Área de Vegetação', value: 10000, percentage: 40.0 }
      ]
    }
  } as any

  beforeAll(async () => {
    const mockFindUseCase = {
      getDashboardData: jest.fn(),
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        { provide: FindUseCase, useValue: mockFindUseCase }
      ],
    }).compile()

    app = moduleFixture.createNestApplication();
    await app.init()

    findUseCase = moduleFixture.get(FindUseCase);
  })

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /dashboard', () => {
    it("should return dashboard data sucessfully", async () => {
      findUseCase.getDashboardData.mockResolvedValue(mockDashboardData)

      const response = await request(app.getHttpServer())
        .get('/dashboard')
        .expect(200);

      expect(response.body).toEqual(mockDashboardData)
      expect(findUseCase.getDashboardData).toHaveBeenCalledTimes(1);
    })

    it('should handle service erors', async () => {
      findUseCase.getDashboardData.mockRejectedValue(new Error("Database connection failed"))

      await request(app.getHttpServer())
        .get("/dashboard")
        .expect(500)

      expect(findUseCase.getDashboardData).toHaveBeenCalledTimes(1);
    });

    it("should return empty data when no records found", async () => {
      const emptyData = {
        totalFarms: 0,
        totalHectares: 0,
        totalProducers: 0,
        chartData: {
          farmsByState: [],
          cropsByType: [],
          landUse: []
        }
      } as any
      findUseCase.getDashboardData.mockResolvedValue(emptyData);

      const response = await request(app.getHttpServer())
        .get('/dashboard')
        .expect(200)

      expect(response.body).toEqual(emptyData);
      expect(response.body.totalFarms).toBe(0)
    })

    it('should handle invalid request gracefuly', async () => {
      findUseCase.getDashboardData.mockRejectedValue(new BadRequestException("Invalid parameters"));

      await request(app.getHttpServer())
        .get("/dashboard")
        .expect(400)

      expect(findUseCase.getDashboardData).toHaveBeenCalled();
    });

    it("should return correct data structure", async () => {
      findUseCase.getDashboardData.mockResolvedValue(mockDashboardData)

      const response = await request(app.getHttpServer())
        .get('/dashboard')
        .expect(200);

      expect(response.body).toHaveProperty('totalFarms');
      expect(response.body).toHaveProperty("totalHectares")
      expect(response.body).toHaveProperty('totalProducers');
      expect(response.body).toHaveProperty("chartData")
      expect(response.body.chartData).toHaveProperty('farmsByState');
      expect(response.body.chartData).toHaveProperty("cropsByType")
      expect(response.body.chartData).toHaveProperty('landUse');
    })

    it('should validate chart data percentages', async () => {
      findUseCase.getDashboardData.mockResolvedValue(mockDashboardData);

      const response = await request(app.getHttpServer())
        .get("/dashboard")
        .expect(200)

      const chartData = response.body.chartData;
      
      expect(chartData.farmsByState[0]).toHaveProperty("percentage")
      expect(chartData.cropsByType[0]).toHaveProperty('percentage');
      expect(chartData.landUse[0]).toHaveProperty("percentage")
      
      expect(typeof chartData.farmsByState[0].percentage).toBe('number');
      expect(typeof chartData.cropsByType[0].percentage).toBe("number")
    });
  });

  describe("HTTP methods validation", () => {
    it('should not alow POST method', async () => {
      await request(app.getHttpServer())
        .post("/dashboard")
        .expect(404)
    })

    it("should not alow PUT method", async () => {
      await request(app.getHttpServer())
        .put('/dashboard')
        .expect(404);
    });

    it('should not alow DELETE method', async () => {
      await request(app.getHttpServer())
        .delete("/dashboard")
        .expect(404)
    })

    it("should handle invalid query parameters gracefuly", async () => {
      findUseCase.getDashboardData.mockResolvedValue(mockDashboardData);

      const response = await request(app.getHttpServer())
        .get('/dashboard?invalid=param')
        .expect(200)

      expect(response.body).toEqual(mockDashboardData);
    });
  })
})