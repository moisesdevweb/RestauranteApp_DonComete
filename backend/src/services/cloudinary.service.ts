import cloudinary from '../config/cloudinary';
import { UploadApiResponse } from 'cloudinary';

// Subir desde archivo (buffer de Multer)
export const subirImagen = async (
  buffer: Buffer,
  nombreArchivo: string
): Promise<{ url: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'don-camote/productos',
        public_id: `producto_${Date.now()}_${nombreArchivo}`,
        transformation: [
          { width: 800, height: 600, crop: 'fill' }, // redimensiona automático
          { quality: 'auto' },                        // optimiza calidad
          { fetch_format: 'auto' },                   // convierte a webp si el browser soporta
        ],
      },
      (error, result: UploadApiResponse | undefined) => {
        if (error || !result) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
};

// Subir desde URL externa (el admin pega una URL)
export const subirImagenDesdeUrl = async (
  url: string
): Promise<{ url: string; publicId: string }> => {
  const result = await cloudinary.uploader.upload(url, {
    folder: 'don-camote/productos',
    public_id: `producto_url_${Date.now()}`,
    transformation: [
      { width: 800, height: 600, crop: 'fill' },
      { quality: 'auto' },
      { fetch_format: 'auto' },
    ],
  });
  return { url: result.secure_url, publicId: result.public_id };
};

// Eliminar imagen de Cloudinary (cuando se edita o elimina producto)
export const eliminarImagen = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};