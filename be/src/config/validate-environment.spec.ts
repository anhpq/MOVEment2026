import { parseCorsOrigin, validateEnvironment } from './validate-environment'

const productionEnvironment = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://movement:strong-password@db.example/movement',
  JWT_SECRET: 'a-strong-production-jwt-secret',
  SCORING_CODE: '9157',
  CORS_ORIGIN: 'https://movement.example',
  PUBLIC_FRONTEND_URL: 'https://movement.example',
}

describe('validateEnvironment', () => {
  it('accepts a complete production configuration', () => {
    expect(validateEnvironment(productionEnvironment)).toEqual(
      productionEnvironment,
    )
  })

  it('parses comma-separated CORS origins', () => {
    expect(
      parseCorsOrigin('https://movement.example, https://admin.example'),
    ).toEqual(['https://movement.example', 'https://admin.example'])
  })

  it.each([
    ['JWT_SECRET', 'change-me', 'development default'],
    ['SCORING_CODE', '2468', 'development default'],
    ['CORS_ORIGIN', '*', 'must not be "*"'],
    ['CORS_ORIGIN', 'https://movement.example, *', 'must not be "*"'],
    ['PUBLIC_FRONTEND_URL', 'http://movement.example', 'must be HTTPS'],
  ])('rejects an insecure production %s', (key, value, message) => {
    expect(() =>
      validateEnvironment({ ...productionEnvironment, [key]: value }),
    ).toThrow(message)
  })

  it('requires all production settings', () => {
    const withoutJwtSecret: Record<string, string | undefined> = {
      ...productionEnvironment,
    }
    delete withoutJwtSecret.JWT_SECRET

    expect(() => validateEnvironment(withoutJwtSecret)).toThrow(
      'JWT_SECRET must be set',
    )
  })

  it('does not impose production restrictions during development', () => {
    expect(
      validateEnvironment({
        NODE_ENV: 'development',
        JWT_SECRET: 'change-me',
      }),
    ).toEqual({ NODE_ENV: 'development', JWT_SECRET: 'change-me' })
  })
})
