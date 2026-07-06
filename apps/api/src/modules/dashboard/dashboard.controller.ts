import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: "Get today's order and revenue overview stats" })
  getOverview() {
    return this.dashboardService.getOverview();
  }

  @Get('sales-trend')
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Get daily revenue and order count for the last 7 or 30 days' })
  getSalesTrend(@Query('days') daysParam?: string) {
    const days = daysParam === '30' ? 30 : 7;
    return this.dashboardService.getSalesTrend(days);
  }

  @Get('order-status-summary')
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Get order counts grouped by unified status' })
  getOrderStatusSummary() {
    return this.dashboardService.getOrderStatusSummary();
  }

  @Get('top-products')
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Get top-selling products by quantity or revenue' })
  getTopProducts(
    @Query('days') daysParam?: string,
    @Query('by') byParam?: string,
    @Query('limit') limitParam?: string,
  ) {
    const days = daysParam === '30' ? 30 : 7;
    const by = byParam === 'revenue' ? 'revenue' : 'quantity';
    const limit = Math.min(Math.max(Number(limitParam) || 5, 1), 20);

    return this.dashboardService.getTopProducts(days, by, limit);
  }

  @Get('inventory-alerts')
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Get low-stock and out-of-stock inventory items' })
  getInventoryAlerts() {
    return this.dashboardService.getInventoryAlerts();
  }

  @Get('action-queue')
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Get recent, unpaid, and pending-confirmation orders' })
  getActionQueue() {
    return this.dashboardService.getActionQueue();
  }
}
