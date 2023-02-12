(function() {
    'use strict';

    function cssbeautify(style, opt) {
        var options, index = 0,
            length = style.length,
            blocks, formatted = '',
            ch, ch2, str, state, State, depth, quote, comment, openbracesuffix = true,
            autosemicolon = false,
            trimRight;
        options = arguments.length > 1 ? opt : {};
        if (typeof options.indent === 'undefined') {
            options.indent = '    ';
        }
        if (typeof options.openbrace === 'string') {
            openbracesuffix = (options.openbrace === 'end-of-line');
        }
        if (typeof options.autosemicolon === 'boolean') {
            autosemicolon = options.autosemicolon;
        }

        function isWhitespace(c) {
            return (c === ' ') || (c === '\n') || (c === '\t') || (c === '\r') || (c === '\f');
        }

        function isQuote(c) {
            return (c === '\'') || (c === '"');
        }

        function isName(c) {
            return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9') || '-_*.:#'.indexOf(c) >= 0;
        }

        function appendIndent() {
            var i;
            for (i = depth; i > 0; i -= 1) {
                formatted += options.indent;
            }
        }

        function openBlock() {
            formatted = trimRight(formatted);
            if (openbracesuffix) {
                formatted += ' {';
            } else {
                formatted += '\n';
                appendIndent();
                formatted += '{';
            }
            if (ch2 !== '\n') {
                formatted += '\n';
            }
            depth += 1;
        }

        function closeBlock() {
            depth -= 1;
            formatted = trimRight(formatted);
            if (autosemicolon) {
                if (formatted.charAt(formatted.length - 1) !== ';') {
                    formatted += ';';
                }
            }
            formatted += '\n';
            appendIndent();
            formatted += '}';
            blocks.push(formatted);
            formatted = '';
        }
        if (String.prototype.trimRight) {
            trimRight = function(s) {
                return s.trimRight();
            };
        } else {
            trimRight = function(s) {
                return s.replace(/\s+$/, '');
            };
        }
        State = {
            Start: 0,
            AtRule: 1,
            Block: 2,
            Selector: 3,
            Ruleset: 4,
            Property: 5,
            Separator: 6,
            Expression: 7,
            URL: 8
        };
        depth = 0;
        state = State.Start;
        comment = false;
        blocks = [];
        style = style.replace(/\r\n/g, '\n');
        while (index < length) {
            ch = style.charAt(index);
            ch2 = style.charAt(index + 1);
            index += 1;
            if (isQuote(quote)) {
                formatted += ch;
                if (ch === quote) {
                    quote = null;
                }
                if (ch === '\\' && ch2 === quote) {
                    formatted += ch2;
                    index += 1;
                }
                continue;
            }
            if (isQuote(ch)) {
                formatted += ch;
                quote = ch;
                continue;
            }
            if (comment) {
                formatted += ch;
                if (ch === '*' && ch2 === '/') {
                    comment = false;
                    formatted += ch2;
                    index += 1;
                }
                continue;
            } else {
                if (ch === '/' && ch2 === '*') {
                    comment = true;
                    formatted += ch;
                    formatted += ch2;
                    index += 1;
                    continue;
                }
            }
            if (state === State.Start) {
                if (blocks.length === 0) {
                    if (isWhitespace(ch) && formatted.length === 0) {
                        continue;
                    }
                }
                if (ch <= ' ' || ch.charCodeAt(0) >= 128) {
                    state = State.Start;
                    formatted += ch;
                    continue;
                }
                if (isName(ch) || (ch === '@')) {
                    str = trimRight(formatted);
                    if (str.length === 0) {
                        if (blocks.length > 0) {
                            formatted = '\n\n';
                        }
                    } else {
                        if (str.charAt(str.length - 1) === '}' || str.charAt(str.length - 1) === ';') {
                            formatted = str + '\n\n';
                        } else {
                            while (true) {
                                ch2 = formatted.charAt(formatted.length - 1);
                                if (ch2 !== ' ' && ch2.charCodeAt(0) !== 9) {
                                    break;
                                }
                                formatted = formatted.substr(0, formatted.length - 1);
                            }
                        }
                    }
                    formatted += ch;
                    state = (ch === '@') ? State.AtRule : State.Selector;
                    continue;
                }
            }
            if (state === State.AtRule) {
                if (ch === ';') {
                    formatted += ch;
                    state = State.Start;
                    continue;
                }
                if (ch === '{') {
                    openBlock();
                    state = State.Block;
                    continue;
                }
                formatted += ch;
                continue;
            }
            if (state === State.Block) {
                if (isName(ch)) {
                    str = trimRight(formatted);
                    if (str.length === 0) {
                        if (blocks.length > 0) {
                            formatted = '\n\n';
                        }
                    } else {
                        if (str.charAt(str.length - 1) === '}') {
                            formatted = str + '\n\n';
                        } else {
                            while (true) {
                                ch2 = formatted.charAt(formatted.length - 1);
                                if (ch2 !== ' ' && ch2.charCodeAt(0) !== 9) {
                                    break;
                                }
                                formatted = formatted.substr(0, formatted.length - 1);
                            }
                        }
                    }
                    appendIndent();
                    formatted += ch;
                    state = State.Selector;
                    continue;
                }
                if (ch === '}') {
                    closeBlock();
                    state = State.Start;
                    continue;
                }
                formatted += ch;
                continue;
            }
            if (state === State.Selector) {
                if (ch === '{') {
                    openBlock();
                    state = State.Ruleset;
                    continue;
                }
                if (ch === '}') {
                    closeBlock();
                    state = State.Start;
                    continue;
                }
                formatted += ch;
                continue;
            }
            if (state === State.Ruleset) {
                if (ch === '}') {
                    closeBlock();
                    state = State.Start;
                    if (depth > 0) {
                        state = State.Block;
                    }
                    continue;
                }
                if (ch === '\n') {
                    formatted = trimRight(formatted);
                    formatted += '\n';
                    continue;
                }
                if (!isWhitespace(ch)) {
                    formatted = trimRight(formatted);
                    formatted += '\n';
                    appendIndent();
                    formatted += ch;
                    state = State.Property;
                    continue;
                }
                formatted += ch;
                continue;
            }
            if (state === State.Property) {
                if (ch === ':') {
                    formatted = trimRight(formatted);
                    formatted += ': ';
                    state = State.Expression;
                    if (isWhitespace(ch2)) {
                        state = State.Separator;
                    }
                    continue;
                }
                if (ch === '}') {
                    closeBlock();
                    state = State.Start;
                    if (depth > 0) {
                        state = State.Block;
                    }
                    continue;
                }
                formatted += ch;
                continue;
            }
            if (state === State.Separator) {
                if (!isWhitespace(ch)) {
                    formatted += ch;
                    state = State.Expression;
                    continue;
                }
                if (isQuote(ch2)) {
                    state = State.Expression;
                }
                continue;
            }
            if (state === State.Expression) {
                if (ch === '}') {
                    closeBlock();
                    state = State.Start;
                    if (depth > 0) {
                        state = State.Block;
                    }
                    continue;
                }
                if (ch === ';') {
                    formatted = trimRight(formatted);
                    formatted += ';\n';
                    state = State.Ruleset;
                    continue;
                }
                formatted += ch;
                if (ch === '(') {
                    if (formatted.charAt(formatted.length - 2) === 'l' && formatted.charAt(formatted.length - 3) === 'r' && formatted.charAt(formatted.length - 4) === 'u') {
                        state = State.URL;
                        continue;
                    }
                }
                continue;
            }
            if (state === State.URL) {
                if (ch === ')' && formatted.charAt(formatted.length - 1 !== '\\')) {
                    formatted += ch;
                    state = State.Expression;
                    continue;
                }
            }
            formatted += ch;
        }
        formatted = blocks.join('') + formatted;
        return formatted;
    }
    if (typeof exports !== 'undefined') {
        module.exports = exports = cssbeautify;
    } else if (typeof window === 'object') {
        window.cssbeautify = cssbeautify;
    }
}());