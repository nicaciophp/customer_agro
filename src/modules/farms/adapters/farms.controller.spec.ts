import { Test, TestingModule } from "@nestjs/testing"
import { INestApplication } from '@nestjs/common';
import * as request from "supertest"
import { FarmsController } from './farms.controller';
import { CreateUseCase } from "../application/create.use-case"
import { GetByIdUseCase } from '../application/get-by-id.use-case';
import { UpdateUseCase } from "../application/update.use-case";
import { CreateFarmDto } from '../dto/create-farm.dto';
import { NotFoundException } from '@nestjs/common'
import { DeleteUseCase } from "../application/delete.use-case";
import { Farm } from "../entites/farm.entity";
import { UpdateFarmDto } from "../dto/update-farm.dto";

describe("FarmsController (integraion tests)", () => {
  let app: INestApplication;
  let createUseCase: jest.Mocked<CreateUseCase>
  let getByIdUseCase: jest.Mocked<GetByIdUseCase>;
  let updateUseCase: jest.Mocked<UpdateUseCase>
  let deleteUseCase: jest.Mocked<DeleteUseCase>;

  const mockFarm: Farm = {
    id: 'farm-1',
    name: "Fazenda Santa Rita",
    producer_id: 'producer-1',
    city: "Ribeirão Preto",
    state: 'SP',
    total_area: 1000,
    agricultural_area: 800,
    vegetation_area: 200,
    producer: null as any,
    planted_crops: []
  };

  const mockUpdatedFarm: Farm = {
    ...mockFarm,
    name: 'Fazenda Santa Rita Atualizada',
  }

  beforeAll(async () => {
    const mockCreateUseCase = {
      execute: jest.fn(),
    }

    const mockGetByIdUseCase = {
      execute: jest.fn()
    };

    const mockUpdateUseCase = {
      execute: jest.fn(),
    }

    const mockDeleteUseCase = {
      execute: jest.fn()
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [FarmsController],
      providers: [
        { provide: CreateUseCase, useValue: mockCreateUseCase },
        { provide: GetByIdUseCase, useValue: mockGetByIdUseCase },
        { provide: UpdateUseCase, useValue: mockUpdateUseCase },
        { provide: DeleteUseCase, useValue: mockDeleteUseCase },
      ]
    }).compile();

    app = moduleFixture.createNestApplication()
    await app.init();

    createUseCase = moduleFixture.get(CreateUseCase);
    getByIdUseCase = moduleFixture.get(GetByIdUseCase)
    updateUseCase = moduleFixture.get(UpdateUseCase);
    deleteUseCase = moduleFixture.get(DeleteUseCase)
  });

  afterAll(async () => {
    await app.close();
  })

  afterEach(() => {
    jest.clearAllMocks()
  });

  describe('POST /farms', () => {
    it("should create a farm sucessfuly", async () => {
      const createDto: CreateFarmDto = {
        name: 'Fazenda Santa Rita',
        producer_id: "producer-1",
        city: 'Ribeirão Preto',
        state: "SP",
        total_area: 1000,
        agricultural_area: 800,
        vegetation_area: 200
      }
      createUseCase.execute.mockResolvedValue(mockFarm);

      const response = await request(app.getHttpServer())
        .post('/farms')
        .send(createDto)
        .expect(201)

      expect(response.body).toEqual(mockFarm);
      expect(createUseCase.execute).toHaveBeenCalledWith(createDto)
    });

    it("should handle use case erors", async () => {
      const createDto: CreateFarmDto = {
        name: 'Fazenda Santa Rita',
        producer_id: "producer-1",
        city: 'Ribeirão Preto',
        state: "SP",
        total_area: 1000,
        agricultural_area: 800,
        vegetation_area: 200,
      }
      createUseCase.execute.mockRejectedValue(new Error('Database error'));

      await request(app.getHttpServer())
        .post("/farms")
        .send(createDto)
        .expect(500);

      expect(createUseCase.execute).toHaveBeenCalledWith(createDto)
    });
  })

  describe("GET /farms/:id", () => {
    it('should return farm when find', async () => {
      const farmId = "farm-1";
      getByIdUseCase.execute.mockResolvedValue(mockFarm)

      const response = await request(app.getHttpServer())
        .get(`/farms/${farmId}`)
        .expect(200);

      expect(response.body).toEqual(mockFarm)
      expect(getByIdUseCase.execute).toHaveBeenCalledWith(farmId);
    })

    it("should return 404 when farm not found", async () => {
      const farmId = 'non-existent-id';
      getByIdUseCase.execute.mockRejectedValue(new NotFoundException("Farm not found"))

      await request(app.getHttpServer())
        .get(`/farms/${farmId}`)
        .expect(404)

      expect(getByIdUseCase.execute).toHaveBeenCalledWith(farmId);
    });
  });

  describe('PATCH /farms/:id', () => {
    it("should update farm sucessfully", async () => {
      const farmId = 'farm-1';
      const updateDto: UpdateFarmDto = {
        name: "Fazenda Santa Rita Atualizada"
      }
      updateUseCase.execute.mockResolvedValue(mockUpdatedFarm);

      const response = await request(app.getHttpServer())
        .patch(`/farms/${farmId}`)
        .send(updateDto)
        .expect(200)

      expect(response.body).toEqual(mockUpdatedFarm);
      expect(updateUseCase.execute).toHaveBeenCalledWith(farmId, updateDto)
    });

    it('should handle emty update body', async () => {
      const farmId = "farm-1"
      const emptyUpdateDto = {};
      updateUseCase.execute.mockResolvedValue(mockFarm)

      const response = await request(app.getHttpServer())
        .patch(`/farms/${farmId}`)
        .send(emptyUpdateDto)
        .expect(200);

      expect(response.body).toEqual(mockFarm)
      expect(updateUseCase.execute).toHaveBeenCalledWith(farmId, emptyUpdateDto);
    })

    it("should handle update erors", async () => {
      const farmId = 'farm-1';
      const updateDto: UpdateFarmDto = {
        name: "Fazenda Atualizada",
      }
      updateUseCase.execute.mockRejectedValue(new Error("Update failed"));

      await request(app.getHttpServer())
        .patch(`/farms/${farmId}`)
        .send(updateDto)
        .expect(500)

      expect(updateUseCase.execute).toHaveBeenCalledWith(farmId, updateDto);
    });
  })

  describe("DELETE /farms/:id", () => {
    it('should delete farm sucessfuly', async () => {
      const farmId = "farm-1"
      const deleteResult = {
        affected: 1,
        success: true,
      };
      deleteUseCase.execute.mockResolvedValue(deleteResult)

      const response = await request(app.getHttpServer())
        .delete(`/farms/${farmId}`)
        .expect(200);

      expect(response.body).toEqual(deleteResult)
      expect(deleteUseCase.execute).toHaveBeenCalledWith(farmId);
    })

    it("should handle delete erors", async () => {
      const farmId = 'farm-1';
      deleteUseCase.execute.mockRejectedValue(new Error("Delete failed"))

      await request(app.getHttpServer())
        .delete(`/farms/${farmId}`)
        .expect(500);

      expect(deleteUseCase.execute).toHaveBeenCalledWith(farmId)
    });

    it('should handle farm not found for deletion', async () => {
      const farmId = "non-existent-id";
      deleteUseCase.execute.mockRejectedValue(new NotFoundException('Farm not found'));

      await request(app.getHttpServer())
        .delete(`/farms/${farmId}`)
        .expect(404)

      expect(deleteUseCase.execute).toHaveBeenCalledWith(farmId);
    })
  });

  describe('HTTP metods and routs', () => {
    it("should not alow GET on /farms (without ID)", async () => {
      await request(app.getHttpServer())
        .get("/farms")
        .expect(404);
    })

    it('should not alow PUT method', async () => {
      await request(app.getHttpServer())
        .put('/farms/farm-1')
        .send({ name: "Test" })
        .expect(404)
    });

    it("should handle invalid ID format gracefuly", async () => {
      const invalidId = 'invalid-uuid';
      getByIdUseCase.execute.mockResolvedValue(mockFarm)

      const response = await request(app.getHttpServer())
        .get(`/farms/${invalidId}`)
        .expect(200);

      expect(getByIdUseCase.execute).toHaveBeenCalledWith(invalidId)
    });
  })
})