import { Controller, Get } from '@nestjs/common';
import { EventConfigService } from './event-config.service';

@Controller('event-config')
export class EventConfigController {
  constructor(private readonly eventConfigService: EventConfigService) {}

  @Get()
  getPublicConfig() {
    return this.eventConfigService.getPublicConfig();
  }
}
