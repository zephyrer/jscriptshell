/*******************************************************************
*                   *******  *******  *******     *****  *******   *
* JScript Shell       *****  *******  ******   *  ******  ****   ***
* Version 0.2           ***  *******  *****   **  *******  *   *****
* 2009-02-09             **           ****   ***  *******    *******
*                         *  *******  ***         *****   *  *******
*   <johnhax@gmail.com>   *  *******  **   *****  ***   ****  ******
*                            *******  *   ******  *   *******  *****
********************************************************************
* Copyright (C) 2009 HE Shi-Jun                                    *
*                                                                  *
* Licensed under the Apache License, Version 2.0 (the "License");  *
* you may not use this file except in compliance with the License. *
* You may obtain a copy of the License at                          *
*                                                                  *
*     http://www.apache.org/licenses/LICENSE-2.0                   *
*                                                                  *
* Unless required by applicable law or agreed to in writing,       *
* software distributed under the License is distributed on an      *
* "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,     *
* either express or implied. See the License for the specific      *
* language governing permissions and limitations.                  *
*******************************************************************/


var J$criptShell = new function () {
	
	
	var $ = this
	var W = WScript
	var S = W.CreateObject('WScript.Shell')
	var A = Array
	var join = A.prototype.join
	var f2s = Function.prototype.toString
	var global = new Function('return this')()
	
	
	function builtin_toString() {
		return '\n' + f2s.call(this).
			replace(/\{([^\u0000]*)\}/, '{\n    [native code]\n}\n').
			replace(/^function .+_toString\(/, 'function toString(') +
			'\n'
	}
	builtin_toString.toString = builtin_toString
	
	function $_toString() {
		return '[object JScriptShell]'
	}
	$_toString.toString = builtin_toString
	
	function global_toString() {
		return '[object global]'
	}
	global_toString.toString = builtin_toString
	
	$.toString = $_toString
	global.toString = global_toString
	
	
	function help() {
		return join.call([
			'Command                Description',
			'=======                ===========',
			'help()                 Display usage and help messages',
			"load(['foo.js' ...])   Load files named by string arugments",
			'print([expr ...])      Evaluate and print expressions',
			'quit()                 Quit the shell',
			'gc()                   Runs the garbage collector',
			'sleep(dt)              Sleep for dt seconds',
			'readUrl(url)           Reads the contents of the url',
		], '\n')
	}
	
	function load() {
		/// TODO
		for (var i = 0, f; i < arguments.length; i++) {
			f = arguments[i]
			eval(readUrl(f))
		}
	}
	
	function print() {
		W.StdOut.WriteLine(join.call(arguments, ' '))
	}
	
	function quit() {
		W.Quit()
	}
	
	var cg = CollectGarbage
	function gc() {
		cg()
	}
	
	function sleep(dt) {
		W.Sleep(dt * 1000)
	}
	
	function readUrl(url) {
		if (isRelative(url)) url = W.ScriptFullName + '/../' + url
		if (xhr == null) xhr = createXHR()
		xhr.open('GET', url, false)
		xhr.send(null)
		return xhr.responseText
	}
	
	var xhr
	
	function isRelative(url) {
		return !/^[a-zA-Z]+:/.test(url)
	}
	
	function createXHR() {
		var progIds = [
			'Msxml2.XMLHTTP.6.0',
			'Msxml2.XMLHTTP.3.0',
			'Microsoft.XMLHTTP' // msxml 2.x
		]
		for (var i = 0; i < progIds.length; i++) {
			try {
				return W.CreateObject(progIds[i])
			} catch(e) {}
		}
	}
	
	var builtins = {}
	
	initBuiltins(help, load, print, quit, gc, sleep, readUrl)
	
	function initBuiltins() {
		for (var i = 0, f, name; i < arguments.length; i++) {
			f = arguments[i]
			name = fname(f)
			f.toString = builtin_toString
			global[name] = builtins[name] = f
		}
	}
	
	function fname(f) {
		return f.name || /^function\s+(.*?)\s*[(]/.exec(f2s.call(f))[1]
	}
	
	useCScript()
	
	function useCScript() {
		try {
			welcome()
		} catch(e) {
			if (W.FullName.indexOf('cscript') == -1) {
				var WshShell = W.CreateObject('WScript.Shell')
				WshShell.Run('cscript.exe /nologo "' + W.ScriptFullName + '"')
			}
			W.Quit()
		}
	}
	
	function welcome() {
		W.StdOut.WriteLine('JScriptShell 0.2')
		W.StdOut.WriteLine('Copyright (C) 2009 HE Shi-Jun')
		/*
		W.StdOut.WriteLine([
			"This program comes with ABSOLUTELY NO WARRANTY; for details type `show w'.",
			"This is free software, and you are welcome to redistribute it",
"under certain conditions; type `show c' for details."]
		.join('\n'))
		*/
		W.StdOut.WriteLine()
	}
	
	/*
	var l = 0, status = 0, input, output, lastLine
	while (true) {
		if (status == 0) {
			WScript.StdOut.Write('js> ')
			if (WScript.StdIn.AtEndOfStream) break
			input = WScript.StdIn.ReadLine()
			if (input == '?') input = 'help()'
		} else {
			WScript.StdOut.Write('  > ')
			if (WScript.StdIn.AtEndOfStream) status = 2
			else input += '\n' + (lastLine = WScript.StdIn.ReadLine())
		}
		l++
		try {
			output = eval(input)
			status = 0
		} catch(e) {
			if (e instanceof SyntaxError && status != 2) {
				status = 1
				continue
			}
			output = '<stdin>, line ' + l + '/' + WScript.StdIn.Line + ': ' + e.name + ': ' + e.message + e.file + e.line + e.number
		}
		W.StdOut.WriteLine(String(output))
	}*/
	
	$.global = global
	$.builtins = builtins
	
	$.PS1 = $.PS2 = null
	var PS1 = 'js> ', PS2 = '  > '
	
	function prompt(ps2) {
		var p = ps2 ? $.PS2 || PS2 : $.PS1 || PS1
		return typeof p == 'function' ? p() : String(p)
	}
	
	var l = 0
	
	$.input = function () {
		W.StdOut.Write(prompt())
		if (W.StdIn.AtEndOfStream) quit()
		var code = W.StdIn.ReadLine()
		l++
		if (code == '?') return 'help()'
		while(true) {
			try {
				new Function(code)
				return code
			} catch(e) {
				/*
				var test = S.Exec('cscript.exe /e:jscript /i /nologo test.js')
				var out = test.StdErr.ReadLine()
				W.StdOut.Write(out)
				W.StdOut.Write(test.ExitCode)
				W.StdOut.Write([e.name, e.message, e.number >>> 16, e.number & 0xffff])*/
				W.StdOut.Write(prompt(true))
				if (W.StdIn.AtEndOfStream) return code
				code += '\n' + W.StdIn.ReadLine()
				l++
			}
		}
	}
	$.output = function (v) {
		if (v !== undefined) W.StdOut.WriteLine(v)
	}
	$.error = function (e) {
		W.StdOut.WriteLine('<stdin>, line ' +
			l /*+ '/' + (WScript.StdIn.Line - 1)*/ + ': ' +
			e.name + ': ' + e.message +
			' (' + (e.number & 0xffff) + ')')
	}
	
}()

while(true) {
	try {
		J$criptShell.output(
			eval(J$criptShell.input())
		)
	} catch(J$criptShell_RuntimeError) {
		try {
			J$criptShell.error(J$criptShell_RuntimeError)
		} catch(J$criptShell_FatalError) {
			throw new Error('JScriptShell fatal error: ' +
				J$criptShell_FatalError.name + ': ' +
				J$criptShell_FatalError.message)
		}
	}
}