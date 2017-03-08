(WIP) Degurechaff - Toml Parser in Typescript
=================

TODO:

Lexer:
- [DONE] integer
- [DONE] float
- [DONE] support exponent syntax
- [DONE] comment
- [DONE] string
  - [DONE] Basic string
    - [DONE] Single
    - [DONE] Multiline
  - [DONE] Literal string
    - [DONE] Single
    - [DONE] Multiline
- [DONE] Date
  - [DONE] Offset Date-Time
  - [DONE] Local Date-Time
  - [DONE] Local Date
- [DONE] Unicode Escape Code

Parser
- [DONE] Key
  - [DONE] BasicString
  - [DONE] Integer
- Value
  - [DONE] Array
  - [DONE] Primitive
    - [DONE] BasicString
      - [DONE] Parsing multi line
    - [DONE] LiteralString
      - [DONE] Parsing multi line
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
  - [DONE] emit multiline literal string
- AST

Test using *.toml from TOML SPEC
Create Simple Page To Convert Toml to JSON