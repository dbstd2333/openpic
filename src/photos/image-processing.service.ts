import { Injectable } from "@nestjs/common";
import * as sharp from "sharp";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class ImageProcessingService {
	/**
	 * 生成webp格式的缩略图
	 * @param inputPath 原图路径
	 * @param outputPath 缩略图输出路径
	 * @param width 缩略图宽度，默认400px
	 * @param quality 压缩质量，默认80
	 */
	async generateThumbnail(
		inputPath: string,
		outputPath: string,
		width: number = 400,
		quality: number = 80,
	): Promise<void> {
		try {
			// 确保输出目录存在
			const outputDir = path.dirname(outputPath);
			if (!fs.existsSync(outputDir)) {
				fs.mkdirSync(outputDir, { recursive: true });
			}

			// 使用sharp生成缩略图
			await sharp(inputPath)
				.resize(width, null, {
					withoutEnlargement: true, // 不放大图片
					fit: "inside", // 保持宽高比
				})
				.webp({ quality })
				.toFile(outputPath);

			console.log(`缩略图生成成功: ${outputPath}`);
		} catch (error) {
			console.error(`生成缩略图失败: ${inputPath} -> ${outputPath}`, error);
			throw error;
		}
	}

	/**
	 * 批量为指定目录下的所有jpg图片生成缩略图
	 * @param directory 目录路径
	 * @param thumbnailDir 缩略图目录路径，默认为原目录下的thumbnails子目录
	 * @param suffix 缩略图文件名后缀，默认为空
	 */
	async batchGenerateThumbnails(
		directory: string,
		thumbnailDir?: string,
		suffix?: string,
	): Promise<{ success: number; failed: number; errors: string[] }> {
		const result = {
			success: 0,
			failed: 0,
			errors: [] as string[],
		};

		try {
			// 确保目录存在
			if (!fs.existsSync(directory)) {
				throw new Error(`目录不存在: ${directory}`);
			}

			// 如果没有指定缩略图目录，则使用原目录下的thumbnails子目录
			const targetThumbnailDir =
				thumbnailDir || path.join(directory, "thumbnails");

			// 确保缩略图目录存在
			if (!fs.existsSync(targetThumbnailDir)) {
				fs.mkdirSync(targetThumbnailDir, { recursive: true });
			}

			// 读取目录中的所有文件
			const files = fs.readdirSync(directory);

			// 筛选出jpg/jpeg格式的图片
			const imageFiles = files.filter(
				(file) =>
					/\.(jpg|jpeg)$/i.test(file) &&
					!fs.statSync(path.join(directory, file)).isDirectory(),
			);

			console.log(`找到 ${imageFiles.length} 个jpg图片文件`);

			// 为每个图片生成缩略图
			for (const file of imageFiles) {
				try {
					const inputPath = path.join(directory, file);

					// 生成缩略图文件名（保持原文件名，添加后缀，扩展名改为webp）
					const baseName = path.basename(file, path.extname(file));
					const thumbnailFileName = `${baseName}${suffix || ''}.webp`;
					const outputPath = path.join(targetThumbnailDir, thumbnailFileName);

					// 检查缩略图是否已存在
					if (fs.existsSync(outputPath)) {
						console.log(`缩略图已存在，跳过: ${thumbnailFileName}`);
						result.success++;
						continue;
					}

					// 生成缩略图
					await this.generateThumbnail(inputPath, outputPath);
					result.success++;
				} catch (error) {
					const errorMsg = `处理文件 ${file} 失败: ${error.message}`;
					console.error(errorMsg);
					result.errors.push(errorMsg);
					result.failed++;
				}
			}
		} catch (error) {
			const errorMsg = `批量处理失败: ${error.message}`;
			console.error(errorMsg);
			result.errors.push(errorMsg);
		}

		return result;
	}

	/**
	 * 获取图片信息
	 * @param imagePath 图片路径
	 */
	async getImageInfo(imagePath: string): Promise<sharp.Metadata> {
		try {
			const metadata = await sharp(imagePath).metadata();
			return metadata;
		} catch (error) {
			console.error(`获取图片信息失败: ${imagePath}`, error);
			throw error;
		}
	}

	/**
	 * 压缩图片
	 * @param inputPath 输入路径
	 * @param outputPath 输出路径
	 * @param quality 压缩质量 (0-100)
	 * @param format 输出格式，默认保持原格式
	 */
	async compressImage(
		inputPath: string,
		outputPath: string,
		quality: number = 80,
		format?: "jpeg" | "png" | "webp",
	): Promise<void> {
		try {
			// 确保输出目录存在
			const outputDir = path.dirname(outputPath);
			if (!fs.existsSync(outputDir)) {
				fs.mkdirSync(outputDir, { recursive: true });
			}

			// 获取图片元数据
			const metadata = await this.getImageInfo(inputPath);
			const outputFormat = format || (metadata.format as any) || "jpeg";

			// 使用sharp压缩图片
			let pipeline = sharp(inputPath);

			switch (outputFormat) {
				case "jpeg":
					pipeline = pipeline.jpeg({ quality });
					break;
				case "png":
					pipeline = pipeline.png({ quality: Math.round(quality / 10) }); // PNG质量范围是0-9
					break;
				case "webp":
					pipeline = pipeline.webp({ quality });
					break;
				default:
					pipeline = pipeline.jpeg({ quality });
			}

			await pipeline.toFile(outputPath);
			console.log(`图片压缩成功: ${outputPath}`);
		} catch (error) {
			console.error(`压缩图片失败: ${inputPath} -> ${outputPath}`, error);
			throw error;
		}
	}
}
