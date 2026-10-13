/** Datos de una foto ya procesada. La foto original no se guarda: solo esto y una miniatura. */
export type Photo = {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
  /** Fecha y hora local de la cámara, sin zona horaria: "2024-03-14T18:42". */
  takenAt?: string;
  camera?: string;
  iso?: number;
  fNumber?: number;
  /** Tiempo de exposición en segundos (0.004 = 1/250). */
  exposure?: number;
  /** Código ISO de dos letras del país; ausente si no hay GPS o cae en el mar. */
  country?: string;
  city?: string;
  /** Miniatura como object URL; ausente si el navegador no pudo decodificar la imagen (p. ej. HEIC). */
  thumb?: string;
};

/** Resultado del worker por archivo. */
export type ParsedPhoto = Omit<Photo, "thumb" | "id" | "name"> & { thumbBlob?: Blob };

export type WorkerRequest = { id: string; file: File };
export type WorkerResponse = { id: string; ok: true; photo: ParsedPhoto } | { id: string; ok: false };
