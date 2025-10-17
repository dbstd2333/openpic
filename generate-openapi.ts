import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { AppModule } from './src/app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';

async function generateOpenAPI() {
  console.log('🚀 Generating OpenAPI documentation...');

  // Create a NestJS application instance
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // Configure Swagger document builder (same as in main.ts)
  const config = new DocumentBuilder()
    .setTitle('Picbed API')
    .setDescription('API for photo management and album organization')
    .setVersion('1.0')
    .addCookieAuth('token')
    .build();

  // Create the OpenAPI document
  const document = SwaggerModule.createDocument(app, config);

  // Write the document to a file
  writeFileSync('openapi-spec.json', JSON.stringify(document, null, 2));

  console.log('✅ OpenAPI documentation generated successfully!');
  console.log('📄 File saved as: openapi-spec.json');
  console.log('🌐 You can view the Swagger UI at: http://localhost:3001/api when the app is running');

  await app.close();
}

generateOpenAPI().catch((error) => {
  console.error('❌ Error generating OpenAPI documentation:', error);
  process.exit(1);
});