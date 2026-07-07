import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { CustomersService } from './customers.service';
import { FindCustomersQueryDto } from './dto/find-customers-query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@ApiTags('Customers')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({
    summary: 'Get all customers with computed order stats and segments',
  })
  getCustomers(@Query() query: FindCustomersQueryDto) {
    return this.customersService.getCustomers(query);
  }

  @Get(':phone')
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({
    summary: 'Get a customer profile, order history, and product behavior',
  })
  getCustomerDetail(@Param('phone') phone: string) {
    return this.customersService.getCustomerDetail(phone);
  }

  @Patch(':phone')
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Update a customer display name, notes, or tags' })
  updateCustomer(@Param('phone') phone: string, @Body() body: UpdateCustomerDto) {
    return this.customersService.updateCustomer(phone, body);
  }
}
