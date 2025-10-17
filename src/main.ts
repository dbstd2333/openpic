import { NestFactory } from "@nestjs/core";
import {
	FastifyAdapter,
	NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { join } from "path";
import * as fs from "fs";

async function bootstrap() {
	const app = await NestFactory.create<NestFastifyApplication>(
		AppModule,
		new FastifyAdapter(),
	);

	// Enable CORS
	app.enableCors({
		origin: true,
		credentials: true,
	});

	// Global validation pipe
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			transform: true,
		}),
	);

	// Register static files
	const publicPath = join(__dirname, "..", "public");
	if (!fs.existsSync(publicPath)) {
		fs.mkdirSync(publicPath, { recursive: true });
	}

	await app.register(require("@fastify/static"), {
		root: publicPath,
		prefix: "/public/",
	});

	// Cookie parser middleware
	await app.register(require("@fastify/cookie"));

	// Multipart support for file uploads
	await app.register(require("@fastify/multipart"), {
		limits: {
			fileSize: 10 * 1024 * 1024, // 10MB
			fieldSize: 1024 * 1024, // 1MB for form fields
		},
		attachFieldsToBody: false,
	});

	// Swagger configuration
	const config = new DocumentBuilder()
		.setTitle("Picbed API")
		.setDescription("API for photo management and album organization")
		.setVersion("1.0")
		.addCookieAuth("token")
		.build();
	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup("api", app, document);

	// Create default user on startup after app is initialized
	// Note: This will be handled in OnModuleInit lifecycle hook

	await app.listen({
		port: process.env.PORT ? parseInt(process.env.PORT) : 3001,
		host: "0.0.0.0",
	});
}
bootstrap();
