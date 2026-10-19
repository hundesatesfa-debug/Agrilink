import { Controller, Get } from '@nestjs/common';
import { CropsService } from './crops.service';
import { Public } from '../auth/public.decorator';

@Controller('crops')
export class CropsController {
  constructor(private cropsService: CropsService) {}

  @Public()
  @Get()
  list() {
    return this.cropsService.listActive();
  }
}
