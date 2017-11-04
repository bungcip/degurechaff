import { parser, TomlLexer } from "./lib/chevParser"
import { ToAstVisitor } from './lib/toAstVisitor'
import { toJson } from './lib/toJson'
import * as ast from './lib/chevAst'

/**
 * Dump a TOML content to JSON Compatible data structure.
 * Throw exception when content cannot be dumped to json.
 * use parse() for more functionality
 */
export function dump(content: string): Object {
  const ast = parse(content)
  const result = toJson(ast)

  return result
}

/**
 * Parse string containing toml to AST
 * @param content 
 */
export function parse(content: string): ast.Root {
  const lexerResult = TomlLexer.tokenize(content)

  if (lexerResult.errors.length) {
    console.log(lexerResult.errors)
    throw lexerResult.errors
  }

  parser.input = lexerResult.tokens
  const cst = parser.root()

  if(parser.errors.length > 0){
    throw parser.errors
  }

  const toAst = new ToAstVisitor()
  const ast = toAst.visit(cst)

  return ast
}