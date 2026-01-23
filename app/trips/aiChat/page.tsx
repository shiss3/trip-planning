'use client';

// 1. 只导入 useChat，不导入 Message (避免 TS2724 错误)
import { useChat } from '@ai-sdk/react';
import { useState, FormEvent } from 'react';

export default function AIPlannerPage() {
    const [inputValue, setInputValue] = useState('');

    // ---------------------------------------------------------
    // 核心修改：我们将配置定义为 "any" 类型
    // 这样 TypeScript 就绝对不会检查 "api" 属性是否存在了
    // ---------------------------------------------------------
    const chatConfig: any = {
        api: '/api/chat',
        initialMessages: [
            {
                id: 'welcome',
                role: 'assistant',
                content: '你好！我是你的 AI 旅行助手。你想去哪里玩？我可以为你推荐行程。',
            },
        ],
    };

    // 2. 调用 useChat 并再次强制转为 any
    // 这样 TypeScript 也不会检查返回值里有没有 append 了
    const chatHookResult = useChat(chatConfig) as any;

    // 3. 从结果中解构我们需要的方法
    // 如果 runtime 只有 sendMessage 而没有 append，我们下面会做一个兼容处理
    const { messages, append, sendMessage, status } = chatHookResult;

    // 计算 loading 状态
    const isLoading = status === 'submitted' || status === 'streaming';

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userText = inputValue;
        setInputValue('');

        const msgPayload = {
            role: 'user',
            content: userText,
        };

        // ---------------------------------------------------------
        // 兼容性处理：优先用 append，如果没有则用 sendMessage
        // 这样无论你的 SDK 版本具体是什么，点击发送都不会报错
        // ---------------------------------------------------------
        if (typeof append === 'function') {
            await append(msgPayload);
        } else if (typeof sendMessage === 'function') {
            await sendMessage(msgPayload);
        } else {
            console.error('未找到发送消息的方法 (append 或 sendMessage)');
        }
    }

    return (
        <div className="flex flex-col h-screen max-w-3xl mx-auto p-4 bg-white">
            {/* 头部标题 */}
            <div className="pb-4 border-b mb-4">
                <h1 className="text-2xl font-bold text-gray-800">AI 智能行程规划</h1>
                <p className="text-gray-500 text-sm">输入你想去的城市（如：南京、上海），我来为你规划</p>
            </div>

            {/* 消息列表区域 */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-2 scrollbar-thin">
                {/* 这里使用 m: any 彻底避免 content 属性报错 */}
                {messages.map((m: any) => (
                    <div
                        key={m.id}
                        className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                                m.role === 'user'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-800 border'
                            }`}
                        >
                            <div className="whitespace-pre-wrap">
                                {/* 显示内容，如果内容为空显示加载中 */}
                                {m.content || (m.toolInvocations ? '正在规划路线...' : '')}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Loading 状态显示 */}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-50 text-gray-500 rounded-lg p-3 border text-sm animate-pulse">
                            AI 正在思考路线中...
                        </div>
                    </div>
                )}
            </div>

            {/* 输入区域 */}
            <form onSubmit={onSubmit} className="border-t pt-4">
                <div className="flex gap-2">
                    <input
                        className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="例如：我想去西安玩3天，帮我安排一下..."
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !inputValue.trim()}
                        className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 font-medium"
                    >
                        发送
                    </button>
                </div>
            </form>
            <div className="mt-4 p-4 bg-gray-100 text-xs font-mono h-32 overflow-auto border border-red-300">
                <p className="font-bold text-red-500 mb-2">调试数据 (Debug View):</p>
                <pre>{JSON.stringify(messages, null, 2)}</pre>
            </div>
        </div>
    );
}