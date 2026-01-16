import { SetMetadata } from '@nestjs/common';
import { Role } from '../guards/roles.guard';

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
