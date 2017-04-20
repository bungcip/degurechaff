import { TomlParser, TomlLexer } from "./lib/chevParser";

/**
 * Dump a TOML content to JSON Compatible data structure
 */
function dump(content: string): Object {
    const lexerResult = TomlLexer.tokenize(content)
    if(lexerResult.errors){
        throw lexerResult.errors
    }

    const parser = new TomlParser(lexerResult.tokens)
    const cst = parser.root()

    return {}
}