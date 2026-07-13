import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ProductCategory } from '@prisma/client';

import { StartSessionDto } from './dto/start-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { WhatsappSessionsService } from './whatsapp-sessions.service';

@ApiTags('WhatsApp Ordering')
@Controller('whatsapp-sessions')
export class WhatsappSessionsController {
  constructor(
    private readonly whatsappSessionsService: WhatsappSessionsService,
  ) {}

  @Get('menu')
  @ApiOperation({ summary: 'Get available products for the ordering flow, optionally filtered by category' })
  @ApiQuery({ name: 'category', enum: ProductCategory, required: false })
  async getMenu(@Query('category') category?: string) {
    const validCategory = Object.values(ProductCategory).includes(
      category as ProductCategory,
    )
      ? (category as ProductCategory)
      : undefined;

    return this.whatsappSessionsService.getMenu(validCategory);
  }

  @Post()
  @ApiOperation({ summary: 'Start or resume an ordering session by phone number' })
  async startSession(@Body() body: StartSessionDto) {
    return this.whatsappSessionsService.startOrResumeSession(body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get the current state of an ordering session' })
  async getSession(@Param('id') id: string) {
    return this.whatsappSessionsService.getSessionById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update the cart, step, or details of a session' })
  async updateSession(
    @Param('id') id: string,
    @Body() body: UpdateSessionDto,
  ) {
    return this.whatsappSessionsService.updateSession(id, body);
  }

  @Post(':id/checkout')
  @ApiOperation({ summary: 'Convert the session cart into a real order' })
  async checkout(@Param('id') id: string) {
    return this.whatsappSessionsService.checkout(id);
  }

  @Post(':id/mark-paid')
  @ApiOperation({
    summary: 'Customer claims they have paid; flags the order for staff review',
  })
  async markPaymentClaimed(@Param('id') id: string) {
    return this.whatsappSessionsService.markPaymentClaimed(id);
  }
}
