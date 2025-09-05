import bcrypt from 'bcrypt'

export class PasswordUtils {
  private static SALT_ROUNDS = 12

  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS)
  }

  static async compare(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword)
  }

  static validate(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Minimum length check
    if (password.length < 12) {
      errors.push('パスワードは12文字以上である必要があります')
    }

    // Maximum length check
    if (password.length > 128) {
      errors.push('パスワードは128文字以下である必要があります')
    }

    // Character type checks
    if (!/[a-z]/.test(password)) {
      errors.push('パスワードには小文字を含める必要があります')
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('パスワードには大文字を含める必要があります')
    }

    if (!/\d/.test(password)) {
      errors.push('パスワードには数字を含める必要があります')
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('パスワードには特殊文字を含める必要があります')
    }

    // Common password patterns check
    const commonPatterns = [
      /password/i,
      /123456/,
      /qwerty/i,
      /admin/i,
      /letmein/i,
      /welcome/i,
      /monkey/i,
      /dragon/i
    ]

    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        errors.push('一般的すぎるパスワードは使用できません')
        break
      }
    }

    // Sequential characters check
    if (/(.)\1{2,}/.test(password)) {
      errors.push('同じ文字を3回以上連続で使用することはできません')
    }

    // Keyboard patterns check
    const keyboardPatterns = [
      /qwertyuiop/i,
      /asdfghjkl/i,
      /zxcvbnm/i,
      /1234567890/,
      /abcdefghij/i
    ]

    for (const pattern of keyboardPatterns) {
      if (pattern.test(password)) {
        errors.push('キーボード配列に基づくパスワードは使用できません')
        break
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}