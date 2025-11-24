import * as vscode from 'vscode';
import * as http from 'http';

// Engine URL - can be configured via VS Code settings
const ENGINE_URL = vscode.workspace.getConfiguration('hummbl').get<string>('engineUrl') || 'http://localhost:8080';

// Helper function to make HTTP requests (using Node's built-in http module)
function httpRequest(url: string, options: { method: string; headers: Record<string, string>; body: string }): Promise<{ status: number; statusText: string; data: any }> {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            path: urlObj.pathname,
            method: options.method,
            headers: options.headers
        };

        const req = http.request(requestOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        status: res.statusCode || 500,
                        statusText: res.statusMessage || '',
                        data: jsonData
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode || 500,
                        statusText: res.statusMessage || '',
                        data: { error: data }
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(options.body);
        req.end();
    });
}

export async function activate(context: vscode.ExtensionContext) {
    // Register chat participant
    const participant = vscode.chat.createChatParticipant('hummbl.chat', {
        async provideResponse(request, token, progress, history) {
            try {
                // Extract member and topic from user prompt using vscode.lm
                let parsed: { member: string; topic: string };
                
                try {
                    const [model] = await vscode.lm.selectChatModels({ family: 'gpt-4' });

                    const extractionMessages = [
                        vscode.LanguageModelChatMessage.User(
                            `You are an intent parser. Extract the 'topic' and 'member' from this query: "${request.prompt}".

Valid members: sun_tzu, marcus_aurelius, machiavelli, plato, aristotle, carl_jung, hypatia, ada_lovelace, marie_curie, benjamin_franklin, paulo_freire, dame_whina_cooper, ibn_rushd.
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
                        if (token.isCancellationRequested) {
                            throw new Error('Request cancelled');
                        }
                    }

                    // Clean up the text (remove markdown code blocks if present)
                    extractedText = extractedText.trim();
                    if (extractedText.startsWith('```json')) {
                        extractedText = extractedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
                    } else if (extractedText.startsWith('```')) {
                        extractedText = extractedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
                    }

                    // Parse the JSON
                    parsed = JSON.parse(extractedText);
                } catch (parseError) {
                    // Fallback to Sun Tzu if JSON parsing fails or vscode.lm is unavailable
                    parsed = {
                        member: 'sun_tzu',
                        topic: request.prompt
                    };
                }

                // Validate member is one of the allowed values
                const validMembers = ['sun_tzu', 'marcus_aurelius', 'machiavelli', 'plato', 'aristotle', 'carl_jung', 'hypatia', 'ada_lovelace', 'marie_curie', 'benjamin_franklin', 'paulo_freire', 'dame_whina_cooper', 'ibn_rushd'];
                if (!validMembers.includes(parsed.member)) {
                    parsed.member = 'sun_tzu';
                }

                // Ensure topic exists
                if (!parsed.topic || parsed.topic.trim() === '') {
                    parsed.topic = request.prompt;
                }

                // Call the engine directly via HTTP
                const response = await httpRequest(`${ENGINE_URL}/consult`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        topic: parsed.topic,
                        member: parsed.member
                    })
                });

                if (response.status !== 200) {
                    throw new Error(`Engine responded with status ${response.status}: ${response.statusText}`);
                }

                const data = response.data;
                
                // Format the response nicely
                const advice = data.advice || 'No advice received';
                const member = data.member || parsed.member;
                
                return new vscode.ChatResponse(advice);
            } catch (error: any) {
                // Log error for debugging
                console.error('[HUMMBL Extension] Error:', error);
                vscode.window.showErrorMessage(`HUMMBL Extension Error: ${error?.message || error}`);
                
                // Fallback: try direct call with Sun Tzu
                try {
                    const response = await httpRequest(`${ENGINE_URL}/consult`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            topic: request.prompt,
                            member: 'sun_tzu'
                        })
                    });

                    if (response.status === 200) {
                        return new vscode.ChatResponse(response.data.advice || 'No advice received');
                    } else {
                        return new vscode.ChatResponse(`Error: Engine returned status ${response.status}. Make sure the engine is running at ${ENGINE_URL}. Original error: ${error?.message || error}`);
                    }
                } catch (fallbackError: any) {
                    console.error('[HUMMBL Extension] Fallback error:', fallbackError);
                    return new vscode.ChatResponse(`Error consulting council: ${error?.message || error}. Make sure the engine is running at ${ENGINE_URL}. Connection error: ${fallbackError?.message || fallbackError}`);
                }
            }
        }
    });

    context.subscriptions.push(participant);
}
