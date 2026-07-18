import { validateEnvironment } from './validate-environment'

const productionEnvironment = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://movement:strong-password@db.example/movement',
  JWT_SECRET: 'a-strong-production-jwt-secret',
  SCORING_CODE: '9157',
  CORS_ORIGIN: 'https://movement.example',
}

describe('validateEnvironment', () => {
  it('accepts a complete production configuration', () => {
    expect(validateEnvironment(productionEnvironment)).toEqual(
      productionEnvironment,
    )
  })

  it.each([
    ['JWT_SECRET', 'change-me'],
    ['SCORING_CODE', '2468'],
    ['CORS_ORIGIN', '*'],
  ])('rejects a default production %s', (key, value) => {
    expect(() =>
      validateEnvironment({ ...productionEnvironment, [key]: value }),
    ).toThrow('development default')
  })

  it('requires all production settings', () => {
    const { JWT_SECRET: _jwtSecret, ...withoutJwtSecret } = productionEnvironment

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
