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
  - Offset Date-Time
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
  - Nested Name
- [DONE] Array of Table
- Handle Error on parsing
- Error Recovery

Emitter
- [DONE] JSON
- AST
