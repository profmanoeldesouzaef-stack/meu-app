/**
 * Utilitário de compressão de imagens via Canvas no navegador.
 * Redimensiona imagens com dimensões excessivas e converte para JPEG com compressão controlada,
 * reduzindo payloads de 10MB+ para ~100-200KB sem perda perceptível de qualidade anatômica.
 */
export async function compressImage(
  source: File | Blob | string,
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.82
): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Não foi possível inicializar o contexto 2D para compressão."));
          return;
        }

        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, dataUrl });
            } else {
              // Fallback para conversão manual de dataUrl para blob
              try {
                const byteString = atob(dataUrl.split(",")[1]);
                const mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) {
                  ia[i] = byteString.charCodeAt(i);
                }
                const fallbackBlob = new Blob([ab], { type: mimeString });
                resolve({ blob: fallbackBlob, dataUrl });
              } catch (convErr) {
                reject(convErr);
              }
            }
          },
          "image/jpeg",
          quality
        );
      } catch (drawErr) {
        reject(drawErr);
      }
    };

    img.onerror = (err) => {
      reject(new Error("Erro ao carregar imagem para compressão: " + String(err)));
    };

    if (typeof source === "string") {
      img.src = source;
    } else {
      img.src = URL.createObjectURL(source);
    }
  });
}
