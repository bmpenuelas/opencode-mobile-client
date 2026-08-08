import { existsSync, readdirSync, renameSync, unlinkSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import sharp from "sharp";

const repoRoot = resolve(import.meta.dirname, "..");
const inputDir = resolve(repoRoot, process.argv[2] ?? "docs/screenshots/design/iphone");
const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const targetSizes = [
  [1242, 2688], [2688, 1242], [1284, 2778], [2778, 1284],
].map(([width, height]) => ({ width, height, aspectRatio: width / height }));

function listImages(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return listImages(path);
    const extension = entry.name.slice(entry.name.lastIndexOf(".")).toLowerCase();
    return imageExtensions.has(extension) ? [path] : [];
  });
}

function closestTarget(width, height) {
  const aspectRatio = width / height;
  return targetSizes.reduce((closest, target) => (
    Math.abs(target.aspectRatio - aspectRatio) < Math.abs(closest.aspectRatio - aspectRatio)
      ? target
      : closest
 ));
}

if (!existsSync(inputDir)) {
  console.error(`Screenshot directory does not exist: ${inputDir}`);
  console.error("Pass a directory explicitly, for example: npm run screenshots:ios:resize -- docs/screenshots/design/iphone");
  process.exit(1);
}

const images = listImages(inputDir);
if (images.length === 0) {
  console.error(`No PNG, JPEG, or WebP images found in ${inputDir}`);
  process.exit(1);
}

let failed = false;
for (const imagePath of images) {
  try {
    const { width, height } = await sharp(imagePath).metadata();
    if (!width || !height) throw new Error("could not read image dimensions");

    if (targetSizes.some((target) => target.width === width && target.height === height)) {
      console.log(`${relative(repoRoot, imagePath)}: already ${width}x${height}`);
      continue;
    }

    const target = closestTarget(width, height);
    const cropHeight = Math.round(width / target.aspectRatio);
    if (cropHeight > height) {
      throw new Error(
        `cannot reach ${target.width}x${target.height} by trimming only top and bottom `
        + `(source is ${width}x${height})`,
      );
    }

    const top = Math.floor((height - cropHeight) / 2);
    const extension = imagePath.slice(imagePath.lastIndexOf("."));
    const tempPath = `${imagePath}.ios-store-tmp${extension}`;
    try {
      await sharp(imagePath)
        .extract({ left: 0, top, width, height: cropHeight })
        .resize(target.width, target.height, { fit: "fill" })
        .toFile(tempPath);
      renameSync(tempPath, imagePath);
    } catch (error) {
      if (existsSync(tempPath)) unlinkSync(tempPath);
      throw error;
    }

    console.log(
      `${relative(repoRoot, imagePath)}: ${width}x${height} → ${target.width}x${target.height} `
      + `(cropped ${top}px top, ${height - cropHeight - top}px bottom)`,
    );
  } catch (error) {
    failed = true;
    console.error(`${relative(repoRoot, imagePath)}: ${error.message}`);
  }
}

if (failed) process.exit(1);
