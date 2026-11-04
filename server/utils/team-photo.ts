import sharp from 'sharp'

const ALLOWED_PHOTO_MIMES = ['image/jpeg', 'image/png', 'image/webp']

export async function processTeamPhoto(input: {
  data: Buffer
  filename: string
  mimeType: string
  memberId: string
}) {
  validateUploadMetadata(input.filename, input.mimeType, input.data.length, ALLOWED_PHOTO_MIMES, 5)

  let optimized: Buffer
  try {
    optimized = await sharp(input.data)
      .rotate()
      .resize({ width: 1200, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 84 })
      .toBuffer()
  } catch {
    throw createError({
      statusCode: 422,
      statusMessage: 'Foto tidak dapat diproses. Gunakan file JPG, PNG, atau WebP yang valid.'
    })
  }

  return savePrivateUpload({
    data: optimized,
    originalName: `team-${input.memberId}.webp`,
    mimeType: 'image/webp',
    allowedMimes: ['image/webp'],
    maxMB: 5,
    folder: `team/${input.memberId}`
  })
}
