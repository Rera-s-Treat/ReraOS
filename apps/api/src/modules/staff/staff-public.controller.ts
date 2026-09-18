import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { ClockDto } from './dto/clock.dto';
import { StaffService } from './staff.service';

@ApiTags('Staff Check-in (public)')
@Controller('public/staff')
export class StaffPublicController {
  constructor(private readonly staffService: StaffService) {}

  @Get('roster')
  @ApiOperation({ summary: "Today's active employees for the check-in picker, with today's clock status" })
  async getCheckinRoster() {
    return this.staffService.getCheckinRoster();
  }

  @Post('clock-in')
  @ApiOperation({ summary: 'Clock in for today' })
  async clockIn(@Body() body: ClockDto) {
    return this.staffService.clockIn(body);
  }

  @Post('clock-out')
  @ApiOperation({ summary: 'Clock out for today' })
  async clockOut(@Body() body: ClockDto) {
    return this.staffService.clockOut(body);
  }
}
