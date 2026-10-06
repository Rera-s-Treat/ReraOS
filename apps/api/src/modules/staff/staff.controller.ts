import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { CreatePayrollEntryDto } from './dto/create-payroll-entry.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UpdatePayrollEntryDto } from './dto/update-payroll-entry.dto';
import { StaffService } from './staff.service';

@ApiTags('Staff')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get('employees')
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'List all employees' })
  async getEmployees() {
    return this.staffService.getEmployees();
  }

  @Post('employees')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Add a new employee' })
  async createEmployee(@Body() body: CreateEmployeeDto) {
    return this.staffService.createEmployee(body);
  }

  @Patch('employees/:id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Update an employee (role, salary, active status)' })
  async updateEmployee(@Param('id') id: string, @Body() body: UpdateEmployeeDto) {
    return this.staffService.updateEmployee(id, body);
  }

  @Get('attendance')
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'List attendance records, optionally filtered by employee' })
  async getAttendanceRecords(@Query('employeeId') employeeId?: string) {
    return this.staffService.getAttendanceRecords(employeeId);
  }

  @Get('payroll')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'List payroll entries, optionally filtered by employee' })
  async getPayrollEntries(@Query('employeeId') employeeId?: string) {
    return this.staffService.getPayrollEntries(employeeId);
  }

  @Post('payroll')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Record a payroll entry for an employee for a pay period' })
  async createPayrollEntry(@Body() body: CreatePayrollEntryDto) {
    return this.staffService.createPayrollEntry(body);
  }

  @Patch('payroll/:id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Update a payroll entry (amount, mark paid, notes)' })
  async updatePayrollEntry(@Param('id') id: string, @Body() body: UpdatePayrollEntryDto) {
    return this.staffService.updatePayrollEntry(id, body);
  }
}
