/**
 * Pure calculator engine - no React dependencies.
 * Uses the shunting-yard algorithm for expression evaluation.
 * Supports: +, -, *, /, parentheses, decimals, percentage, negation,
 * and scientific functions (sin, cos, tan, log, ln, sqrt, pow, pi, e).
 */

type Token = {
  type: 'number' | 'operator' | 'function' | 'lparen' | 'rparen'
  value: string
}

const OPERATORS: Record<string, { precedence: number; associativity: 'left' | 'right' }> = {
  '+': { precedence: 2, associativity: 'left' },
  '-': { precedence: 2, associativity: 'left' },
  '*': { precedence: 3, associativity: 'left' },
  '/': { precedence: 3, associativity: 'left' },
  '^': { precedence: 4, associativity: 'right' },
}

const FUNCTIONS = ['sin', 'cos', 'tan', 'log', 'ln', 'sqrt']

const CONSTANTS: Record<string, number> = {
  'pi': Math.PI,
  'e': Math.E,
}

export function tokenize(expression: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  const expr = expression.replace(/\s+/g, '')

  while (i < expr.length) {
    const char = expr[i]!

    // Numbers (including decimals)
    if (/\d/.test(char) || (char === '.' && i + 1 < expr.length && /\d/.test(expr[i + 1]!))) {
      let num = ''
      while (i < expr.length && (/\d/.test(expr[i]!) || expr[i] === '.')) {
        num += expr[i]!
        i++
      }
      // Check for percentage
      if (i < expr.length && expr[i]! === '%') {
        const value = parseFloat(num) / 100
        tokens.push({ type: 'number', value: String(value) })
        i++
      } else {
        tokens.push({ type: 'number', value: num })
      }
      continue
    }

    // Unary minus: at start, after operator, or after left paren
    if (char === '-' && (tokens.length === 0 || tokens[tokens.length - 1]!.type === 'operator' || tokens[tokens.length - 1]!.type === 'lparen')) {
      let num = '-'
      i++
      if (i < expr.length && expr[i]! === '(') {
        // Handle -(expression) by inserting -1 *
        tokens.push({ type: 'number', value: '-1' })
        tokens.push({ type: 'operator', value: '*' })
        continue
      }
      while (i < expr.length && (/\d/.test(expr[i]!) || expr[i] === '.')) {
        num += expr[i]!
        i++
      }
      if (num === '-') {
        // standalone minus that we couldn't parse as unary
        tokens.push({ type: 'operator', value: '-' })
      } else {
        if (i < expr.length && expr[i]! === '%') {
          const value = parseFloat(num) / 100
          tokens.push({ type: 'number', value: String(value) })
          i++
        } else {
          tokens.push({ type: 'number', value: num })
        }
      }
      continue
    }

    // Operators
    if (char in OPERATORS) {
      tokens.push({ type: 'operator', value: char })
      i++
      continue
    }

    // Parentheses
    if (char === '(') {
      tokens.push({ type: 'lparen', value: '(' })
      i++
      continue
    }
    if (char === ')') {
      tokens.push({ type: 'rparen', value: ')' })
      i++
      continue
    }

    // Functions and constants (alphabetic)
    if (/[a-zA-Z]/.test(char)) {
      let name = ''
      while (i < expr.length && /[a-zA-Z]/.test(expr[i]!)) {
        name += expr[i]!
        i++
      }
      const lower = name.toLowerCase()
      if (FUNCTIONS.includes(lower)) {
        tokens.push({ type: 'function', value: lower })
      } else if (lower in CONSTANTS) {
        tokens.push({ type: 'number', value: String(CONSTANTS[lower]!) })
      } else {
        throw new Error(`Unknown function or constant: ${name}`)
      }
      continue
    }

    throw new Error(`Unexpected character: ${char}`)
  }

  return tokens
}

function shuntingYard(tokens: Token[]): Token[] {
  const output: Token[] = []
  const operatorStack: Token[] = []

  for (const token of tokens) {
    switch (token.type) {
      case 'number':
        output.push(token)
        break

      case 'function':
        operatorStack.push(token)
        break

      case 'operator': {
        const op = OPERATORS[token.value]!
        while (operatorStack.length > 0) {
          const top = operatorStack[operatorStack.length - 1]!
          if (top.type === 'lparen') break
          if (top.type === 'function') {
            output.push(operatorStack.pop()!)
            continue
          }
          const topOp = OPERATORS[top.value]
          if (!topOp) break
          if (
            (op.associativity === 'left' && op.precedence <= topOp.precedence) ||
            (op.associativity === 'right' && op.precedence < topOp.precedence)
          ) {
            output.push(operatorStack.pop()!)
          } else {
            break
          }
        }
        operatorStack.push(token)
        break
      }

      case 'lparen':
        operatorStack.push(token)
        break

      case 'rparen':
        while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1]!.type !== 'lparen') {
          output.push(operatorStack.pop()!)
        }
        if (operatorStack.length === 0) {
          throw new Error('Mismatched parentheses')
        }
        operatorStack.pop() // Remove lparen
        // If there's a function on top, pop it
        if (operatorStack.length > 0 && operatorStack[operatorStack.length - 1]!.type === 'function') {
          output.push(operatorStack.pop()!)
        }
        break
    }
  }

  while (operatorStack.length > 0) {
    const top = operatorStack.pop()!
    if (top.type === 'lparen' || top.type === 'rparen') {
      throw new Error('Mismatched parentheses')
    }
    output.push(top)
  }

  return output
}

function evaluateRPN(tokens: Token[]): number {
  const stack: number[] = []

  for (const token of tokens) {
    if (token.type === 'number') {
      stack.push(parseFloat(token.value))
      continue
    }

    if (token.type === 'function') {
      if (stack.length < 1) throw new Error('Insufficient operands')
      const a = stack.pop()!
      switch (token.value) {
        case 'sin':
          stack.push(Math.sin(a))
          break
        case 'cos':
          stack.push(Math.cos(a))
          break
        case 'tan':
          stack.push(Math.tan(a))
          break
        case 'log':
          stack.push(Math.log10(a))
          break
        case 'ln':
          stack.push(Math.log(a))
          break
        case 'sqrt':
          stack.push(Math.sqrt(a))
          break
        default:
          throw new Error(`Unknown function: ${token.value}`)
      }
      continue
    }

    if (token.type === 'operator') {
      if (stack.length < 2) throw new Error('Insufficient operands')
      const b = stack.pop()!
      const a = stack.pop()!
      switch (token.value) {
        case '+':
          stack.push(a + b)
          break
        case '-':
          stack.push(a - b)
          break
        case '*':
          stack.push(a * b)
          break
        case '/':
          if (b === 0) throw new Error('Division by zero')
          stack.push(a / b)
          break
        case '^':
          stack.push(Math.pow(a, b))
          break
        default:
          throw new Error(`Unknown operator: ${token.value}`)
      }
    }
  }

  if (stack.length !== 1) {
    throw new Error('Invalid expression')
  }

  return stack[0]!
}

export function evaluate(expression: string): string {
  try {
    if (!expression || expression.trim() === '') {
      return '0'
    }

    const tokens = tokenize(expression)
    if (tokens.length === 0) return '0'

    const rpn = shuntingYard(tokens)
    const result = evaluateRPN(rpn)

    if (!isFinite(result)) {
      return 'Error'
    }

    // Round to avoid floating point issues (max 12 decimal places)
    const rounded = parseFloat(result.toPrecision(12))
    return String(rounded)
  } catch {
    return 'Error'
  }
}

export function formatDisplay(value: string): string {
  if (value === 'Error' || value === '') return value

  const num = parseFloat(value)
  if (isNaN(num)) return value

  // If it's an integer, format with commas
  if (Number.isInteger(num) && !value.includes('.')) {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(num)
  }

  // For decimals, preserve the decimal part
  const parts = value.split('.')
  const intPart = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(parseInt(parts[0]!, 10))

  if (parts.length > 1) {
    return `${intPart}.${parts[1]!}`
  }

  return intPart
}
