import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { RoleResponseDto } from './dto/role-response.dto';

@ApiTags('Roles')
@ApiBearerAuth('bearer')
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'List all roles (super admin only)' })
  @ApiOkResponse({
    description: 'Roles retrieved successfully',
    type: RoleResponseDto,
    isArray: true,
  })
  @ApiForbiddenResponse({ description: 'Requires the SUPER_ADMIN role' })
  async getRoles() {
    return this.rolesService.getRoles();
  }
}
