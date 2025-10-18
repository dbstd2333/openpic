import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";

/**
 * 批量生成缩略图脚本
 * 不依赖 NestJS，直接读取 public/uploads 目录下的文件并生成缩略图
 * 仅在生产环境首次部署时使用，为已有的原图生成缩略图
 * 避免重复生成产生垃圾webp文件
 */
async function generateThumbnails() {
	console.log("🚀 开始批量生成缩略图...");

	try {
		// 获取上传目录路径
		const uploadDir = path.join(process.cwd(), "public", "uploads");
		
		// 检查上传目录是否存在
		if (!fs.existsSync(uploadDir)) {
			console.error(`❌ 上传目录不存在: ${uploadDir}`);
			process.exit(1);
		}

		// 读取目录中的所有文件
		const files = fs.readdirSync(uploadDir);
		
		// 筛选出图片文件
		const imageFiles = files.filter(
			(file) => {
				const filePath = path.join(uploadDir, file);
				return !fs.statSync(filePath).isDirectory() && 
					/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file);
			}
		);

		console.log(`📊 找到 ${imageFiles.length} 个图片文件`);

		let successCount = 0;
		let skipCount = 0;
		let errorCount = 0;

		// 处理每张图片
		for (const file of imageFiles) {
			try {
				const filePath = path.join(uploadDir, file);
				
				// 获取文件名（不带扩展名）
				const filenameWithoutExt = path.basename(file, path.extname(file));
				
				// 生成缩略图文件名：使用相同文件名前缀，但扩展名固定为.webp
				const thumbnailFilename = `${filenameWithoutExt}.webp`;
				const thumbnailPath = path.join(uploadDir, thumbnailFilename);
				
				// 检查缩略图是否已存在
				if (fs.existsSync(thumbnailPath)) {
					console.log(`⏭️ 图片 ${file} 缩略图已存在，跳过`);
					skipCount++;
					continue;
				}
				
				// 生成缩略图
				await generateThumbnail(filePath, thumbnailPath);
				console.log(`✅ 图片 ${file} 缩略图生成成功`);
				successCount++;
			} catch (error) {
				console.error(`❌ 处理图片 ${file} 失败:`, error.message);
				errorCount++;
			}
		}

		console.log("📈 批量生成缩略图完成");
		console.log(`✅ 成功: ${successCount} 张`);
		console.log(`⏭️ 跳过: ${skipCount} 张`);
		console.log(`❌ 失败: ${errorCount} 张`);

		process.exit(0);
	} catch (error) {
		console.error("❌ 批量生成缩略图失败:", error);
		process.exit(1);
	}
}

/**
 * 生成webp格式的缩略图
 * @param inputPath 原图路径
 * @param outputPath 缩略图输出路径
 * @param width 缩略图宽度，默认400px
 * @param quality 压缩质量，默认80
 */
async function generateThumbnail(
	inputPath: string,
	outputPath: string,
	width: number = 400,
	quality: number = 80,
): Promise<void> {
	try {
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

// 执行脚本
generateThumbnails();
