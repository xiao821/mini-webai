import { elements, renderMarkdown, appendTypingIndicator, removeTypingIndicator, createEmptyAssistantMessage } from './ui.js';
import { sendChatCompletion } from './api.js';
import { getConversationById, updateConversation } from './conversations.js';
import { handleFeedback } from './feedback.js';

// 添加消息到UI
export function appendMessage(role, content, messageId = null) {
    const { chatContainer } = elements;
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex items-start';

    // 添加消息ID属性
    if (messageId) {
        messageDiv.setAttribute('data-message-id', messageId);
    }

    const isUser = role === 'user';
    const avatarClass = isUser ? 'bg-green-500' : 'bg-blue-500';
    const avatarText = isUser ? '用' : 'AI';

    // 为用户消息添加右对齐样式
    const containerClass = isUser
        ? 'flex flex-row-reverse justify-start ml-auto'
        : 'flex flex-row justify-start';

    // 为用户头像调整margin方向
    const avatarMargin = isUser ? 'ml-3' : 'mr-3';

    let messageContent = `
        <div class="${containerClass}">
            <div class="h-8 w-8 rounded-full ${avatarClass} flex items-center justify-center text-white font-semibold ${avatarMargin} flex-shrink-0">
                ${avatarText}
            </div>
            <div class="message-container bg-white p-4 rounded-lg shadow-sm border border-gray-200 max-w-3xl">
                <div class="markdown-content"></div>
            </div>
        </div>
    `;

    messageContent += `</div>`;
    messageDiv.innerHTML = messageContent;
    chatContainer.appendChild(messageDiv);

    // 渲染Markdown内容
    const markdownContent = messageDiv.querySelector('.markdown-content');
    renderMarkdown(markdownContent, content);

    // 为AI消息添加反馈按钮事件
    if (!isUser && role !== 'system' && messageId) {
        const likeBtn = messageDiv.querySelector('.like-btn');
        const dislikeBtn = messageDiv.querySelector('.dislike-btn');
        if (likeBtn && dislikeBtn) {
            likeBtn.addEventListener('click', function () {
                handleFeedback(messageId, 'like');
            });
            dislikeBtn.addEventListener('click', function () {
                handleFeedback(messageId, 'dislike');
            });
        }
    }

    // 滚动到底部
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// 更新消息内容
export function updateMessageContent(messageId, content) {
    const { chatContainer } = elements;
    const messageDiv = chatContainer.querySelector(`[data-message-id="${messageId}"]`);
    if (messageDiv) {
        const markdownContent = messageDiv.querySelector('.markdown-content');
        // 更新Markdown内容
        renderMarkdown(markdownContent, content);
    }
}

// 发送消息
export async function sendMessage(message, currentConversationId, currentMode, isWaitingForResponse) {
    if (isWaitingForResponse) return false;
    
    // 添加用户消息到UI
    appendMessage('user', message);

    // 获取当前会话
    const currentConversation = getConversationById(currentConversationId);
    
    // 添加用户消息到会话
    currentConversation.messages.push({
        role: 'user',
        content: message
    });

    // 更新对话标题（如果是第一条用户消息） TODO 后面从后端获取
    if (currentConversation.messages.filter(m => m.role === 'user').length === 1) {
        currentConversation.title = message.length > 20
            ? message.substring(0, 20) + '...'
            : message;
        updateConversation(currentConversation);
    }

    // 清空输入框并禁用发送按钮
    elements.messageInput.value = '';
    elements.messageInput.style.height = 'auto';
    elements.sendButton.disabled = true;
    
    // 显示加载指示器
    appendTypingIndicator();
    
    try {
        // 调用API获取响应
        const response = await sendChatCompletion(
            currentConversationId, 
            currentConversation.messages.slice(-10), 
            currentMode
        );

        if (response.body) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");

            // 为新消息创建ID
            const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            
            // 创建消息容器，但先不添加内容
            const messageElement = createEmptyAssistantMessage(messageId);
            removeTypingIndicator();
            elements.chatContainer.appendChild(messageElement);

            // 获取消息内容容器，用于添加流式内容
            const contentElement = messageElement.querySelector('.markdown-content');

            let fullContent = "";
            let accumulatedContent = "";
            let think_status = 0;

            // 通过reader.read()处理流式响应
            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    break;
                }

                // 解码二进制数据为文本
                const chunk = decoder.decode(value, { stream: true });

                // 处理包含"data:"前缀的流式数据
                const lines = chunk.split("\n");
                for (const line of lines) {
                    if (line.startsWith("data:")) {
                        // 提取JSON数据部分
                        try {
                            const jsonStr = line.substring(5).trim();
                            if (!jsonStr) continue;
                            // data: [DONE] 的处理
                            if (jsonStr.includes("DONE")) {
                                continue;
                            }
                            const data = JSON.parse(jsonStr);

                            // 从流中提取内容
                            if (data.choices && data.choices.length > 0 && data.choices[0].delta) {
                                const delta = data.choices[0].delta;

                                // 如果有内容，添加到累积内容中
                                if (delta.content) {
                                    const content = delta.content;

                                    if (content === "" || content.includes("<think>")) {
                                        fullContent += "```思考过程";
                                        think_status = 1;
                                        continue;
                                    } else if (content.includes("</think>")) {
                                        fullContent += "```\n";
                                        think_status = 2;
                                        continue;
                                    }

                                    fullContent += content;
                                    accumulatedContent += content;

                                    // 积累一定量的内容后再更新UI，以提高性能
                                    if (accumulatedContent.length > 10 || content.includes("\n")) {
                                        renderMarkdown(contentElement, fullContent);
                                        accumulatedContent = "";
                                        // 滚动到底部
                                        elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
                                    }
                                }
                            }
                        } catch (e) {
                            console.error("解析流式数据失败:", e, line);
                        }
                    }
                }
            }

            // 确保最后的内容被渲染
            if (accumulatedContent.length > 0) {
                renderMarkdown(contentElement, fullContent);
                elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
            }

            // 记录消息到对话历史
            currentConversation.messages.push({
                role: 'assistant',
                content: fullContent,
                id: messageId
            });
            
            // 更新会话
            updateConversation(currentConversation);

            return true;
        } else {
            throw new Error("API响应格式错误");
        }
    } catch (error) {
        console.error('获取AI响应失败:', error);
        removeTypingIndicator();
        appendMessage('system', '抱歉，发生了错误，请稍后再试。');
        return false;
    }
}
