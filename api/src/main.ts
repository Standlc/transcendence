import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('Transcendence API')
    .setDescription('API documentation for transcendence')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('/docs', app, document);
  app.use(cookieParser());
  app.enableCors({
    origin: 'http://localhost:3000', // Your frontend origin
    credentials: true, // To allow sending credentials like cookies, authorization headers with requests
  });
  app.setGlobalPrefix('api');
  await app.listen(5000);
}

bootstrap();
