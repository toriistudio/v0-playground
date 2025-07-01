import { useState } from "react";

export function useCompressedImage() {
  const [base64, setBase64] = useState<string | null>(null);

  const processImage = (file: File) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 256;
        const scaleFactor = Math.min(1, MAX_WIDTH / img.width);

        const canvas = document.createElement("canvas");
        canvas.width = img.width * scaleFactor;
        canvas.height = img.height * scaleFactor;

        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Grayscale
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
          data[i] = data[i + 1] = data[i + 2] = gray;
        }
        ctx.putImageData(imageData, 0, 0);

        // Compress
        const compressed = canvas.toDataURL("image/jpeg", 0.2);
        setBase64(compressed);
      };
      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  };

  return { base64, processImage };
}
