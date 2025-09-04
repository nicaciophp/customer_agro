import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FindUseCase } from '../application/find.use-case';

@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: FindUseCase) {}

  @Get()
  @ApiOperation({ 
    summary: 'Dashboard principal com métricas gerais',
    description: 'Retorna estatísticas completas incluindo gráficos de pizza e metricas principais'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Dados do dashboard carergados com sucesso',
    schema: {
      example: {
        totalFarms: 150,
        totalHectares: 25000.5,
        totalProducers: 85,
        chartData: {
          farmsByState: [
            { name: "SP", value: 45, percentage: 30.0 },
            { name: "MG", value: 35, percentage: 23.33 }
          ],
          cropsByType: [
            { name: "Soja", value: 120, percentage: 40.0 },
            { name: "Milho", value: 90, percentage: 30.0 }
          ],
          landUse: [
            { name: "Área Agricultável", value: 15000, percentage: 60.0 },
            { name: "Área de Vegetação", value: 10000, percentage: 40.0 }
          ]
        }
      }
    }
  })
  async getDashboard() {
    return await this.dashboardService.getDashboardData();
  }
}
