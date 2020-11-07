const TOK_START = 0 // ^
const TOK_END = 1 // $
const TOK_ANY = 2 // .
const TOK_SET = 3 // [set]
const TOK_0ORMORE = 4 // *
const TOK_1ORMORE = 5 // +
const TOK_0ORMORELAZY = 6 // -
const TOK_0OR1 = 7 // ?
const TOK_CHAR = 8 // literal
const TOK_CAPTURE = 9 // %num
const TOK_FRONTIER = 10 // %f[]
const TOK_BALANCED = 11 // %b
const TOK_CLASS = 12 // %class
const TOK_ESCAPED = 13 // %escaped
const TOK_LPAR = 14 // (
const TOK_RPAR = 15 // )
const TokToStr = [
	"START",
	"END",
	"ANY",
	"SET",
	"0ORMORE",
	"1ORMORE",
	"0ORMORELAZY",
	"0OR1",
	"CHAR",
	"CAPTURE",
	"FRONTIER",
	"BALANCED",
	"CLASS",
	"ESCAPED",
	"LPAR",
	"RPAR",
]

class Token {
	constructor(tk, str) {
		this.type = tk
		this.string = str
	}
}

class Lexer {
	constructor(str) {
		this.input = str
		this.len = str.length - 1
		this.tokens = []
		this.current = ""
		this.caret = 0
	}

	Next() {
		this.current = this.input.charAt(++this.caret)
	}
}

function debuglog(...varg) {
	// console.log(varg)
}

function ParsePattern(input) {
	const Tokens = []
	let error
	let caret = 0
	let char = input.charAt(caret)
	if (char == "^") {
		Tokens.push(new Token(TOK_START))
		caret++
	}
	debuglog("Str", input)
	debuglog("Len", input.length)
	try {
		function match_class(cl) {
			switch (cl) {
				case 'a': return true;
				case 'A': return true;
				case 'c': return true;
				case 'C': return true;
				case 'd': return true;
				case 'D': return true;
				case 'g': return true;
				case 'G': return true;
				case 'l': return true;
				case 'L': return true;
				case 'p': return true;
				case 'P': return true;
				case 's': return true;
				case 'S': return true;
				case 'u': return true;
				case 'U': return true;
				case 'w': return true;
				case 'W': return true;
				case 'x': return true;
				case 'X': return true;
				case 'z': return true;
				case 'z': return true;
				default: return false;
			}
		};

		function classend() {
			switch (input.charAt(caret)) {
				case "%":
					debuglog("classend%")
					if (caret == input.length - 1) throw new Error("malformed pattern (ends with '%')");
					return caret + 1
				case "[":
					debuglog("classend[")
					if (input.charAt(caret) == "^") { debuglog("^"); caret++; }
					do {
						if (caret == input.length - 1) throw new Error("malformed pattern (missing ']')");
						if (input.charAt(caret++) == "%" && caret < input.length - 1) caret++;
					} while (input.charAt(caret) != "]")
					return caret + 1
				default:
					return caret
			}
		}

		for (; caret < input.length; caret++) {
			let char = input.charAt(caret)
			let start
			switch (char) {
				case "(":
					debuglog("(")
					Tokens.push(new Token(TOK_LPAR))
					break
				case ")":
					debuglog(")")
					Tokens.push(new Token(TOK_RPAR))
					break
				case "$":
					debuglog("$")
					if (caret == input.length - 1) {
						Tokens.push(new Token(TOK_END))
					} else {
						Tokens.push(new Token(TOK_CHAR, char))
					}
					break
				case "%":
					debuglog("%")
					let lookahead = input.charAt(caret + 1)
					switch (lookahead) {
						case "b":
							debuglog("%b")
							if (caret + 3 > input.length - 1) throw new Error("malformed pattern (missing arguments to '%b')")
							start = caret
							caret += 3
							Tokens.push(new Token(TOK_BALANCED, input.substring(start + 2, start + 4)))
							break
						case "f":
							debuglog("%f")
							caret += 2
							if (input.charAt(caret) != "[") throw new Error("missing '[' after '%f' in pattern");
							start = caret
							Tokens.push(new Token(TOK_FRONTIER, input.substring(start + 1, classend() - 1)))
							break
						case '0': case '1': case '2': case '3':
						case '4': case '5': case '6': case '7':
						case '8': case '9':
							debuglog("%num")
							Tokens.push(new Token(TOK_CAPTURE, lookahead))
							break
						default:
							classend()
							if (match_class(lookahead)) {
								debuglog("%class")
								Tokens.push(new Token(TOK_CLASS, lookahead))
							} else {
								debuglog("%escaped")
								Tokens.push(new Token(TOK_ESCAPED, lookahead))
							}
							caret++
							break
					}
					break
				case ".":
					debuglog(".")
					Tokens.push(new Token(TOK_ANY, char))
					break
				case "[":
					start = caret

					debuglog("[]", input.charAt(caret))
					Tokens.push(new Token(TOK_SET, input.substring(start + 1, classend() - 1)))
					break
				case "+":
					Tokens.push(new Token(TOK_1ORMORE))
					break
				case "-":
					Tokens.push(new Token(TOK_0ORMORELAZY))
					break
				case "*":
					Tokens.push(new Token(TOK_0ORMORE))
					break
				case "?":
					Tokens.push(new Token(TOK_0OR1))
					break
				default:
					debuglog("default", char)
					Tokens.push(new Token(TOK_CHAR, char))
					break
			}
		}
	}
	catch (e) {
		error = e.name + ": " + e.message
	}

	const result = document.getElementById('result');
	while (result.firstChild) {
		result.removeChild(result.firstChild);
	}

	for (const token of Tokens) {
		let element = document.createElement("div");
		let p = document.createElement("a")
		p.className = "input"
		let name = document.createElement("a")
		name.className = "name"
		let description = document.createElement("a")
		description.className = "description"
		element.className = "token"
		if (token.type == TOK_CHAR) {
			p.appendChild(document.createTextNode(token.string))
			name.appendChild(document.createTextNode("Character."))
			description.appendChild(document.createTextNode("Matches literal character."))
			element.id = "char"
		} else {
			p.appendChild(document.createTextNode((token.string ? "[" + (token.string) + "] " : "") + TokToStr[token.type]))
			element.id = "token"
		}
		element.appendChild(p)
		element.appendChild(name)
		element.appendChild(description)
		result.appendChild(element)
	}

	if (error) {
		let element = document.createElement("div");
		element.className = "error"
		element.appendChild(document.createTextNode(error))
		result.appendChild(element)
	}
}