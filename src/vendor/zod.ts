export class ZodError extends Error {
  issues: { message: string }[]

  constructor(issues: { message: string }[]) {
    super(issues[0]?.message || 'Invalid input')
    this.issues = issues
  }
}

abstract class BaseSchema<T> {
  optional(): ZodSchema<T | undefined> {
    return new OptionalSchema(this as unknown as ZodSchema<T>)
  }

  abstract parse(input: unknown): T

  safeParse(input: unknown): SafeParseReturnType<T> {
    try {
      const data = this.parse(input)
      return { success: true, data }
    } catch (error) {
      if (error instanceof ZodError) {
        return { success: false, error }
      }
      return {
        success: false,
        error: new ZodError([{ message: error instanceof Error ? error.message : 'Invalid input' }]),
      }
    }
  }

  or<U>(schema: ZodSchema<U>): ZodSchema<T | U> {
    return new UnionSchema([this as unknown as ZodSchema<T>, schema])
  }
}

class StringSchema extends BaseSchema<string> {
  private validators: ((value: string) => void)[] = []
  private transforms: ((value: string) => string)[] = []

  min(length: number, message = `Must be at least ${length} characters`): this {
    this.validators.push((value) => {
      if (value.length < length) throw new ZodError([{ message }])
    })
    return this
  }

  trim(): this {
    this.transforms.push((value) => value.trim())
    return this
  }

  toLowerCase(): this {
    this.transforms.push((value) => value.toLowerCase())
    return this
  }

  regex(pattern: RegExp, message = 'Invalid format'): this {
    this.validators.push((value) => {
      if (!pattern.test(value)) throw new ZodError([{ message }])
    })
    return this
  }

  uuid(message = 'Invalid UUID'): this {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    this.validators.push((value) => {
      if (!uuidRegex.test(value)) throw new ZodError([{ message }])
    })
    return this
  }

  transform(fn: (value: string) => string | undefined): StringSchema {
    this.transforms.push((value) => {
      const next = fn(value)
      return next === undefined ? value : String(next)
    })
    return this
  }

  parse(input: unknown): string {
    if (input === undefined || input === null) throw new ZodError([{ message: 'Required' }])
    let value = String(input)
    for (const transform of this.transforms) value = transform(value)
    for (const validator of this.validators) validator(value)
    return value
  }
}

class LiteralSchema<T> extends BaseSchema<T> {
  private transformFn?: (value: T) => unknown

  constructor(private readonly expected: T) {
    super()
  }

  transform<U>(fn: (value: T) => U): ZodSchema<U> {
    this.transformFn = fn
    return this as unknown as ZodSchema<U>
  }

  parse(input: unknown): T {
    if (input !== this.expected) throw new ZodError([{ message: 'Invalid literal' }])
    const value = this.expected
    return (this.transformFn ? (this.transformFn(value) as T) : value)
  }
}

class EnumSchema<T extends readonly [string, ...string[]]> extends BaseSchema<T[number]> {
  constructor(public readonly options: T) {
    super()
  }

  parse(input: unknown): T[number] {
    if (typeof input !== 'string' || !this.options.includes(input)) {
      throw new ZodError([{ message: 'Invalid enum value' }])
    }
    return input as T[number]
  }
}

class OptionalSchema<T> extends BaseSchema<T | undefined> {
  constructor(private readonly inner: ZodSchema<T>) {
    super()
  }

  parse(input: unknown): T | undefined {
    if (input === undefined || input === null || input === '') return undefined
    return this.inner.parse(input)
  }
}

class UnionSchema<T> extends BaseSchema<T> {
  constructor(private readonly schemas: Array<ZodSchema<unknown>>) {
    super()
  }

  parse(input: unknown): T {
    const issues: { message: string }[] = []
    for (const schema of this.schemas) {
      const result = schema.safeParse(input)
      if (result.success) return result.data as T
      issues.push(...result.error.issues)
    }
    throw new ZodError(issues.length ? issues : [{ message: 'Invalid input' }])
  }
}

class ObjectSchema<T extends Record<string, unknown>> extends BaseSchema<T> {
  constructor(private readonly shape: Record<string, ZodSchema<unknown>>) {
    super()
  }

  parse(input: unknown): T {
    if (typeof input !== 'object' || input === null) throw new ZodError([{ message: 'Expected object' }])
    const result: Record<string, unknown> = {}
    const source = input as Record<string, unknown>
    for (const [key, schema] of Object.entries(this.shape)) {
      const parsed = schema.parse(source[key])
      if (parsed !== undefined) result[key] = parsed
    }
    return result as T
  }
}

class ArraySchema<T> extends BaseSchema<T[]> {
  constructor(private readonly inner: ZodSchema<T>) {
    super()
  }

  parse(input: unknown): T[] {
    if (!Array.isArray(input)) throw new ZodError([{ message: 'Expected array' }])
    return input.map((item) => this.inner.parse(item))
  }

  min(length: number, message = `Must contain at least ${length} items`): ArraySchema<T> {
    const previousParse = this.parse.bind(this)
    this.parse = (input: unknown) => {
      const result = previousParse(input)
      if (result.length < length) throw new ZodError([{ message }])
      return result
    }
    return this
  }
}

export type ZodSchema<T> = BaseSchema<T>

export type SafeParseSuccess<T> = { success: true; data: T }
export type SafeParseError = { success: false; error: ZodError }
export type SafeParseReturnType<T> = SafeParseSuccess<T> | SafeParseError

class ZodNamespace {
  string(): ZodString {
    return new StringSchema()
  }

  array<T>(schema: ZodSchema<T>): ArraySchema<T> {
    return new ArraySchema(schema)
  }

  enum<T extends readonly [string, ...string[]]>(options: T): ZodEnum<T> {
    return new EnumSchema(options)
  }

  literal<T>(value: T): ZodLiteral<T> {
    return new LiteralSchema(value)
  }

  object<T extends Record<string, ZodSchema<unknown>>>(shape: T): ZodObject<T> {
    return new ObjectSchema(shape) as unknown as ZodObject<T>
  }
}

export type ZodString = StringSchema
export type ZodEnum<T extends readonly [string, ...string[]]> = EnumSchema<T>
export type ZodLiteral<T> = LiteralSchema<T>
export type ZodObject<T extends Record<string, ZodSchema<unknown>>> = ObjectSchema<{
  [K in keyof T]: T[K] extends ZodSchema<infer U> ? U : never
}>
export type ZodArray<T> = ArraySchema<T>

export const z = new ZodNamespace()
