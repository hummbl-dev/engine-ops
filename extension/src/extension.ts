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
            try {
                // Extract member and topic from user prompt using vscode.lm
                const [model] = await vscode.lm.selectChatModels({ family: 'gpt-4' });

                const extractionMessages = [
                    vscode.LanguageModelChatMessage.User(
                        `You are an intent parser. Extract the 'topic' and 'member' from this query: "${request.prompt}".

Valid members: sun_tzu, marcus_aurelius, machiavelli.
Default member: sun_tzu (use this if no member is specified).

Return ONLY a valid JSON object. Example: {"member": "sun_tzu", "topic": "strategy"}
Do not include any explanation or markdown formatting, only the JSON object.`
                    )
                ];

                const chatResponse = await model.sendRequest(extractionMessages, {}, token);

                // Accumulate the text response
                let extractedText = '';
                for await (const chunk of chatResponse.text) {
                    extractedText += chunk;
                    token.onCancellationRequested(() => {
                        throw new Error('Request cancelled');
                    });
                }

                // Clean up the text (remove markdown code blocks if present)
                extractedText = extractedText.trim();
                if (extractedText.startsWith('```json')) {
                    extractedText = extractedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
                } else if (extractedText.startsWith('```')) {
                    extractedText = extractedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
                }

                // Parse the JSON
                let parsed: { member: string; topic: string };
                try {
                    parsed = JSON.parse(extractedText);
                } catch (parseError) {
                    // Fallback to Sun Tzu if JSON parsing fails
                    parsed = {
                        member: 'sun_tzu',
                        topic: request.prompt
                    };
                }

                // Validate member is one of the allowed values
                const validMembers = ['sun_tzu', 'marcus_aurelius', 'machiavelli'];
                if (!validMembers.includes(parsed.member)) {
                    parsed.member = 'sun_tzu';
                }

                // Ensure topic exists
                if (!parsed.topic || parsed.topic.trim() === '') {
                    parsed.topic = request.prompt;
                }

                // Call the consult_council tool via MCP 'tools/call' method
                const response = await client.sendRequest('tools/call', {
                    name: 'consult_council',
                    arguments: {
                        topic: parsed.topic,
                        member: parsed.member
                    }
                });

                // The response from McpServer tool call is { content: [{ type: 'text', text: '...' }] }
                // We need to extract the text.
                const mcpResponse = response as { content: { type: string; text: string }[] };
                const responseText = mcpResponse.content[0]?.text || "No response content";

                return new vscode.ChatResponse(responseText);
            } catch (error) {
                // Fallback: use Sun Tzu with the original prompt as topic
                try {
                    const response = await client.sendRequest('tools/call', {
                        name: 'consult_council',
                        arguments: {
                            topic: request.prompt,
                            member: 'sun_tzu'
                        }
                    });
                    const mcpResponse = response as { content: { type: string; text: string }[] };
                    return new vscode.ChatResponse(mcpResponse.content[0]?.text || "No response content");
                } catch (fallbackError) {
                    return new vscode.ChatResponse(`Error consulting council: ${error}`);
                }
            }
        }
    });

    context.subscriptions.push(participant);
}
