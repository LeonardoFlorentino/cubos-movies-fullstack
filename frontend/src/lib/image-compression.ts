export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

type CompressionResult = {
  file: File;
  wasCompressed: boolean;
  originalSize: number;
  finalSize: number;
};

const MIN_QUALITY = 0.45;
const SCALE_STEP = 0.85;
const MIN_DIMENSION = 640;
const MAX_ATTEMPTS = 12;

function toMegabytesLabel(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

function buildCompressedName(originalName: string, mimeType: string) {
  const base = originalName.replace(/\.[^.]+$/, "");
  const extension = mimeType === "image/webp" ? "webp" : "jpg";
  return `${base}-compressed.${extension}`;
}

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Não foi possível converter a imagem."));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}

export async function compressImageIfNeeded(
  file: File,
  maxBytes: number = MAX_IMAGE_UPLOAD_BYTES,
): Promise<CompressionResult> {
  if (file.size <= maxBytes) {
    return {
      file,
      wasCompressed: false,
      originalSize: file.size,
      finalSize: file.size,
    };
  }

  const imageBitmap = await createImageBitmap(file);

  try {
    let width = imageBitmap.width;
    let height = imageBitmap.height;
    let quality = 0.9;
    const outputType = file.type === "image/webp" ? "image/webp" : "image/jpeg";

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Não foi possível processar a imagem.");
      }

      context.drawImage(imageBitmap, 0, 0, width, height);
      const blob = await canvasToBlob(canvas, outputType, quality);

      if (blob.size <= maxBytes) {
        const compressedFile = new File(
          [blob],
          buildCompressedName(file.name, outputType),
          {
            type: outputType,
            lastModified: Date.now(),
          },
        );

        return {
          file: compressedFile,
          wasCompressed: true,
          originalSize: file.size,
          finalSize: blob.size,
        };
      }

      if (quality > MIN_QUALITY) {
        quality = Math.max(MIN_QUALITY, quality - 0.1);
        continue;
      }

      const nextWidth = Math.round(width * SCALE_STEP);
      const nextHeight = Math.round(height * SCALE_STEP);

      if (nextWidth < MIN_DIMENSION || nextHeight < MIN_DIMENSION) {
        break;
      }

      width = nextWidth;
      height = nextHeight;
      quality = 0.88;
    }
  } finally {
    imageBitmap.close();
  }

  throw new Error(
    `Não foi possível comprimir para menos de ${toMegabytesLabel(maxBytes)}.`,
  );
}

export function formatMegabytes(bytes: number) {
  return toMegabytesLabel(bytes);
}
