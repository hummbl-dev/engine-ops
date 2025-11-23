import * as vscode from 'vscode';
import * as path from 'path';
import { LanguageClient, TransportKind } from 'vscode-languageclient/node';

let client: LanguageClient;

export async function activate(context: vscode.ExtensionContext) {
    // Server module (bundled MCP server)
    const serverModule = context.asAbsolutePath(
        path.join('dist', 'server', 'index.js')
    );

    const serverOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
            options: { execArgv: ['--nolazy', '--inspect=6009'] }
        }
    };

    const clientOptions = {
        documentSelector: [{ scheme: 'file', language: 'typescript' }],
        synchronize: {
            fileEvents: vscode.workspace.createFileSystemWatcher('**/*.ts')
        }
    };

    client = new LanguageClient(
        'hummblEngine',
        'HUMMBL Engine MCP',
        serverOptions,
        clientOptions
    );

    client.start();

    // Register chat participant
    const participant = vscode.chat.createChatParticipant('hummbl.chat', {
        async provideResponse(request, token, progress, history) {
            // Translate prompt to JSON using vscode.lm
            const translation = await vscode.lm.translate(request.prompt, {
                targetLanguage: 'json',
                temperature: 0.2
            });

            // Send to MCP server (running in extension host)
            const response = await client.sendRequest('engine/consult', {
                payload: translation
            });

            return new vscode.ChatResponse(response);
        }
    });

    context.subscriptions.push(participant);
}
