import { BadRequestException, Body, Controller, Get, Post, Put, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { mkdirSync } from 'fs';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { FarmersService } from './farmers.service';
import { UpdateFarmerProfileDto } from './dto/update-farmer.dto';
import { CreateProducePostDto } from './dto/create-produce-post.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { Public } from '../auth/public.decorator';

const uploadDirectory = join(process.cwd(), 'uploads', 'farmer-posts');
const imageExtensions: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

@Controller('farmers')
export class FarmersController {
  constructor(private farmersService: FarmersService) {}

  @Public()
  @Get('posts')
  listProducePosts() {
    return this.farmersService.listProducePosts();
  }

  @Post('me/posts')
  @Roles(Role.FARMER)
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: (_request, _file, callback) => {
        mkdirSync(uploadDirectory, { recursive: true });
        callback(null, uploadDirectory);
      },
      filename: (_request, file, callback) => {
        callback(null, `${randomUUID()}${imageExtensions[file.mimetype] || extname(file.originalname)}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (_request, file, callback) => {
      if (!imageExtensions[file.mimetype]) {
        callback(new BadRequestException('Upload a JPEG, PNG, or WebP image'), false);
        return;
      }
      callback(null, true);
    },
  }))
  createProducePost(
    @CurrentUser('id') userId: number,
    @Body() dto: CreateProducePostDto,
    @UploadedFile() image?: { filename: string },
  ) {
    if (!image) {
      throw new BadRequestException('A produce image is required');
    }
    return this.farmersService.createProducePost(userId, {
      ...dto,
      imageUrl: `/uploads/farmer-posts/${image.filename}`,
    });
  }

  @Get('me/posts')
  @Roles(Role.FARMER)
  listMyProducePosts(@CurrentUser('id') userId: number) {
    return this.farmersService.listProducePosts(userId);
  }

  @Get('me')
  @Roles(Role.FARMER)
  getMe(@CurrentUser('id') userId: number) {
    return this.farmersService.getMeProfile(userId);
  }

  @Get('me/dashboard')
  @Roles(Role.FARMER)
  getDashboard(@CurrentUser('id') userId: number) {
    return this.farmersService.getFarmerWithDashboard(userId);
  }

  @Put('me')
  @Roles(Role.FARMER)
  updateMe(@CurrentUser('id') userId: number, @Body() dto: UpdateFarmerProfileDto) {
    return this.farmersService.updateMeProfile(userId, dto);
  }
}
