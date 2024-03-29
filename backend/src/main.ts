import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    allowedHeaders: '*',
    origin: (origin, callback) => {
      const allowedOrigin = process.env.CLIENT_URL;

      if (!allowedOrigin || origin === allowedOrigin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  });
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(+process.env.BACKEND_PORT);
}
bootstrap();
