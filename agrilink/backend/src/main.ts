import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { static as serveStatic } from 'express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );
  app.setGlobalPrefix('api');
  app.use('/uploads', serveStatic(join(process.cwd(), 'uploads')));
  const port = process.env.PORT || 3001;
  await app.listen(port);
  Logger.log(`AgriLink backend running on http://localhost:${port}/api`, 'Bootstrap');
}
bootstrap();
