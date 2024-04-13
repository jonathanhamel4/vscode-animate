// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "animate-extension" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// // The commandId parameter must match the command field in package.json
	// let disposable = vscode.commands.registerCommand('animate-extension.helloWorld', () => {
	// 	// The code you place here will be executed every time your command is executed
	// 	// Display a message box to the user
	// 	vscode.window.showInformationMessage('Hello World from animate-extension!');
	// });

	// context.subscriptions.push(disposable);

	const provider = new AnimateView(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(AnimateView.viewType, provider));
}

// This method is called when your extension is deactivated
export function deactivate() { }

class AnimateView {

	public static readonly viewType = 'animate';
	private view?: vscode.WebviewView;
	private readonly extensionUri;

	constructor(extensionUri: vscode.Uri) {
		this.extensionUri = extensionUri;
	}


	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this.view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this.extensionUri
			]
		};

		webviewView.webview.html = this.getWebViewHtml();

		webviewView.webview.onDidReceiveMessage(data => {
			console.log(data);
			// switch (data.type) {
			// 	case 'colorSelected':
			// 		{
			// 			vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(`#${data.value}`));
			// 			break;
			// 		}
			// }
		});
	}

	private getWebViewHtml() {
		const scriptUri = this.view?.webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'assets', 'main.js'));
		const styleMainUri = this.view?.webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'assets', 'main.css'));

		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${this.view?.webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Animate</title>
				<link href="${styleMainUri}" rel="stylesheet">
			</head>
			<body>
				<div id="zone"><div>
				<template id="drop"><span class="drop"></span></template>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
