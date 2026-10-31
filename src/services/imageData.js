const MAX_IMAGE_DATA_LENGTH = 250_000;

export async function imageFileToDataUrl(file) {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Choose a valid image file.');
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Choose an image smaller than 10 MB.');
  }

  const image = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Your browser could not process this image.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.82, 0.68, 0.54, 0.4]) {
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      if (dataUrl.length <= MAX_IMAGE_DATA_LENGTH) return dataUrl;
    }
    throw new Error('This image is too detailed to store safely. Choose a smaller image.');
  } finally {
    image.close();
  }
}
