import bcrypt from 'bcryptjs'

const BCRYPT_ROUNDS = 12

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string) {
  if (!hash) return false
  return bcrypt.compare(password, hash)
}

export function passwordProblems(password: string) {
  if (typeof password !== 'string' || password.length < 10) {
    return 'Kata sandi minimal 10 karakter.'
  }
  if (password.length > 128) return 'Kata sandi maksimal 128 karakter.'
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Kata sandi harus memuat huruf dan angka.'
  }
  return ''
}
