import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello from Nest!';
  }

  getHealth() {
    return {
      status: 'ok',
      service: 'my-nest-app',
      timestamp: new Date().toISOString(),
    };
  }
}
