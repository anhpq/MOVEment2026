import {
  buildCorsOrigin,
  parseCorsOrigin,
  validateEnvironment,
} from './validate-environment'

const productionEnvironment = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://movement:strong-password@db.example/movement',
  JWT_SECRET: 'a-strong-production-jwt-secret',
  CORS_ORIGIN: 'https://movement.example',
  FRONTEND_PUBLIC_URL: 'https://movement.example',
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

  it('allows only a configured single CORS origin', () => {
    const origin = buildCorsOrigin('https://movement.example')
    if (typeof origin !== 'function') {
      throw new Error('Expected CORS origin callback')
    }
    const callback = jest.fn()

    origin('https://movement.example', callback)
    origin('https://evil.example', callback)

    expect(callback).toHaveBeenNthCalledWith(1, null, true)
    expect(callback).toHaveBeenNthCalledWith(2, null, false)
  })

  it('allows any origin only when wildcard CORS is configured', () => {
    expect(buildCorsOrigin(undefined)).toBe('*')
    expect(buildCorsOrigin('*')).toBe('*')
  })

  it.each([
    ['JWT_SECRET', 'change-me', 'development default'],
    ['CORS_ORIGIN', '*', 'must not be "*"'],
    ['CORS_ORIGIN', 'https://movement.example, *', 'must not be "*"'],
    ['FRONTEND_PUBLIC_URL', 'http://movement.example', 'must be HTTPS'],
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

  it('accepts the legacy PUBLIC_FRONTEND_URL production setting', () => {
    const env = {...productionEnvironment}
    delete (env as Record<string, string | undefined>).FRONTEND_PUBLIC_URL

    expect(
      validateEnvironment({
        ...env,
        PUBLIC_FRONTEND_URL: 'https://movement.example',
      }),
    ).toEqual({
      ...env,
      PUBLIC_FRONTEND_URL: 'https://movement.example',
    })
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
