import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	const provider = new AnimateView(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(AnimateView.viewType, provider));

	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(_ => provider.updateTheme()));
}

// This method is called when your extension is deactivated
export function deactivate() { }

class AnimateView {
	public static readonly viewType = 'animate';
	private view?: vscode.WebviewView;
	private readonly extensionUri;
	private readonly dark = 'dark';
	private readonly light = 'light';
	private theme: string;

	constructor(extensionUri: vscode.Uri) {
		this.extensionUri = extensionUri;
		this.theme = vscode.window.activeColorTheme.kind === 2 ? this.dark : this.light;
	}

	public updateTheme() {
		const bodyClass = vscode.window.activeColorTheme.kind === 2 ? this.dark : this.light;
		if (this.theme !== bodyClass) {
			this.view?.webview.postMessage({ type: 'bodyClass', add: bodyClass, remove: this.theme });
			this.theme = bodyClass;
		}
	}


	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
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
			<body class="noOverflow ${this.theme}">
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
