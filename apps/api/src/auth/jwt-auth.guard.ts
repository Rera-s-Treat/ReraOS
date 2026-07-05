import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

interface AuthenticatedUser {
  id: string;
  email: string;
  roleId: string;
}

interface RequestWithHeaders {
  headers: {
    authorization?: string;
  };
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext): RequestWithHeaders {
    const request = context.switchToHttp().getRequest<RequestWithHeaders>();

    console.log('AUTH HEADER:', request.headers.authorization);

    return request;
  }

  handleRequest<TUser = AuthenticatedUser>(
    err: unknown,
    user: TUser | false | null,
    info: unknown,
    _context: ExecutionContext,
    _status?: unknown,
  ): TUser {
    console.log('JWT GUARD USER:', user);
    console.log('JWT GUARD ERR:', err);
    console.log('JWT GUARD INFO:', info);

    if (err || !user) {
      throw err instanceof Error
        ? err
        : new UnauthorizedException('Unauthorized');
    }

    return user;
  }
}
