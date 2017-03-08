(WIP) Degurechaff - Toml Parser in Typescript
=================

TODO:

Lexer:
- [DONE] integer
- [DONE] float
- [DONE] support exponent syntax
- [DONE] comment
- string
  - Basic string
    - [DONE] Single
    - [DONE] Multiline
  - Literal string
    - [DONE] Single
    - [DONE] Multiline
- Date
  - [DONE] Offset Date-Time
  - [DONE] Local Date-Time
  - [DONE] Local Date
- Unicode Escape Code

Parser
- [DONE] Key
  - [DONE] BasicString
  - [DONE] Integer
- Value
  - [DONE] Array
  - Primitive
    - [DONE] BasicString
      - Parsing multi line
    - LiteralString
      - Parsing multi line
    - [DONE] Integer
    - [DONE] Boolean
    - [DONE] Float
    - [DONE] Date
  - [DONE] Inline Table
- [DONE] Table
  - [DONE] single name
  - [DONE] Nested Name
- [DONE] Array of Table
- Handle Error on parsing
- Error Recovery
- Ignore Comment Token

Emitter
- [DONE] JSON
  - [DONE] emit Date
  - [DONE] emit Table with nested name
  - [DONE] emit array of table
  - [DONE] emit multiline basic string
  - emit multiline literal string
- AST

Test using *.toml from TOML SPEC
Create Simple Page To Convert Toml to JSON