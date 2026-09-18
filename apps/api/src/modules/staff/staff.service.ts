import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PayrollStatus } from '@prisma/client';

import { PrismaService } from '../../common/prisma.service';
import { ClockDto } from './dto/clock.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { CreatePayrollEntryDto } from './dto/create-payroll-entry.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UpdatePayrollEntryDto } from './dto/update-payroll-entry.dto';

/** Nigeria runs on WAT (UTC+1) year-round, no DST — shift before truncating
 * to a date so a clock-in just after midnight WAT lands on the right day. */
function nigeriaWorkDate(at: Date = new Date()): Date {
  const shifted = new Date(at.getTime() + 60 * 60 * 1000);
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()));
}

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------
  // Employees (admin)
  // ---------------------------------------------------------------------

  async getEmployees() {
    return this.prisma.employee.findMany({ orderBy: { fullName: 'asc' } });
  }

  async getEmployeeById(id: string) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    return employee;
  }

  async createEmployee(dto: CreateEmployeeDto) {
    return this.prisma.employee.create({ data: dto });
  }

  async updateEmployee(id: string, dto: UpdateEmployeeDto) {
    await this.getEmployeeById(id);
    return this.prisma.employee.update({ where: { id }, data: dto });
  }

  // ---------------------------------------------------------------------
  // Attendance
  // ---------------------------------------------------------------------

  /** Active employees for the public check-in picker — name only, nothing sensitive. */
  async getCheckinRoster() {
    const employees = await this.prisma.employee.findMany({
      where: { isActive: true },
      select: { id: true, fullName: true },
      orderBy: { fullName: 'asc' },
    });

    const today = nigeriaWorkDate();
    const todaysRecords = await this.prisma.attendanceRecord.findMany({
      where: { workDate: today, employeeId: { in: employees.map((e) => e.id) } },
    });
    const statusByEmployee = new Map(todaysRecords.map((r) => [r.employeeId, r]));

    return employees.map((employee) => {
      const record = statusByEmployee.get(employee.id);
      return {
        id: employee.id,
        fullName: employee.fullName,
        clockedInAt: record?.clockInAt ?? null,
        clockedOutAt: record?.clockOutAt ?? null,
      };
    });
  }

  async clockIn(dto: ClockDto) {
    const employee = await this.prisma.employee.findUnique({ where: { id: dto.employeeId } });
    if (!employee || !employee.isActive) {
      throw new NotFoundException('Employee not found');
    }

    const workDate = nigeriaWorkDate();
    const existing = await this.prisma.attendanceRecord.findUnique({
      where: { employeeId_workDate: { employeeId: dto.employeeId, workDate } },
    });

    if (existing) {
      throw new ConflictException(
        existing.clockOutAt
          ? "You've already clocked out for today"
          : 'Already clocked in for today',
      );
    }

    return this.prisma.attendanceRecord.create({
      data: { employeeId: dto.employeeId, workDate, clockInAt: new Date() },
    });
  }

  async clockOut(dto: ClockDto) {
    const workDate = nigeriaWorkDate();
    const existing = await this.prisma.attendanceRecord.findUnique({
      where: { employeeId_workDate: { employeeId: dto.employeeId, workDate } },
    });

    if (!existing) {
      throw new BadRequestException("You haven't clocked in today yet");
    }
    if (existing.clockOutAt) {
      throw new ConflictException("You've already clocked out for today");
    }

    return this.prisma.attendanceRecord.update({
      where: { id: existing.id },
      data: { clockOutAt: new Date() },
    });
  }

  async getAttendanceRecords(employeeId?: string) {
    return this.prisma.attendanceRecord.findMany({
      where: employeeId ? { employeeId } : undefined,
      include: { employee: { select: { fullName: true } } },
      orderBy: { workDate: 'desc' },
      take: 200,
    });
  }

  // ---------------------------------------------------------------------
  // Payroll (minimal — fixed monthly salary, admin-recorded per period)
  // ---------------------------------------------------------------------

  async getPayrollEntries(employeeId?: string) {
    return this.prisma.payrollEntry.findMany({
      where: employeeId ? { employeeId } : undefined,
      include: { employee: { select: { fullName: true } } },
      orderBy: { periodStart: 'desc' },
    });
  }

  async createPayrollEntry(dto: CreatePayrollEntryDto) {
    await this.getEmployeeById(dto.employeeId);

    return this.prisma.payrollEntry.create({
      data: {
        employeeId: dto.employeeId,
        periodLabel: dto.periodLabel,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        amount: dto.amount,
        notes: dto.notes,
      },
    });
  }

  async updatePayrollEntry(id: string, dto: UpdatePayrollEntryDto) {
    const entry = await this.prisma.payrollEntry.findUnique({ where: { id } });
    if (!entry) {
      throw new NotFoundException('Payroll entry not found');
    }

    const becomingPaid = dto.status === PayrollStatus.PAID && entry.status !== PayrollStatus.PAID;

    return this.prisma.payrollEntry.update({
      where: { id },
      data: {
        amount: dto.amount,
        status: dto.status,
        notes: dto.notes,
        paidAt: becomingPaid ? new Date() : entry.paidAt,
      },
    });
  }
}
