import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const maxDuration = 60;

const deepseek = createOpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY,
});

export async function POST(req: Request) {
    const { messages } = await req.json();

    try {
        const result = await streamText({
            model: deepseek('deepseek-chat'),
            messages,
            system: `你是一个专业的旅行规划助手。`,
        });

        // 修改点：使用编辑器提示你存在的这个方法
        // 这会返回 text/plain 格式的流，useChat 也能识别
        return result.toTextStreamResponse();

    } catch (error) {
        console.error('DeepSeek Error:', error);
        return new Response('Error', { status: 500 });
    }
}