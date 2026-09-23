import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { CreateProductionLogDto } from './dto/create-production-log.dto';
import { ProductionService } from './production.service';

@ApiTags('Production')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'List recent daily production logs' })
  async getProductionLogs() {
    return this.productionService.getProductionLogs();
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Get a production log by ID' })
  async getProductionLogById(@Param('id') id: string) {
    return this.productionService.getProductionLogById(id);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({
    summary:
      'Record a day of production: materials used from inventory and items made (matched to products)',
  })
  async createProductionLog(
    @Body() body: CreateProductionLogDto,
    @Req() req: { user: JwtPayload },
  ) {
    return this.productionService.createProductionLog(body, req.user.id);
  }
}
