declare module '@nestjs/jwt' {
  export interface JwtModuleOptions {
    secret?: string;
    signOptions?: Record<string, unknown>;
    verifyOptions?: Record<string, unknown>;
  }

  export class JwtService {
    sign(payload: any, options?: any): string;
    verify<T = any>(token: string, options?: any): T;
  }

  export class JwtModule {
    static register(options?: JwtModuleOptions): any;
  }
}
