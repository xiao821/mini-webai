import { elements, renderMarkdown, appendTypingIndicator, removeTypingIndicator, createEmptyAssistantMessage } from './ui.js';
import { sendChatCompletion } from './api.js';
import { getConversationById, updateConversation } from './conversations.js';
import { handleFeedback } from './feedback.js';

// 添加消息到UI
export function appendMessage(role, content, messageId = null, lazyLoad = false) {
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
            <div class="message-container bg-white p-4 rounded-lg shadow-sm border border-gray-200 max-w-3xl flex flex-col">
                <div class="markdown-content ${lazyLoad ? 'lazy-content' : ''}"></div>
                ${isUser ? `
                    <div class="flex items-center justify-end mt-2 text-gray-400">
                        <button class="copy-message-btn hover:text-blue-500 p-1 rounded" data-message="${content}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                        </button>
                    </div>
                ` : ''}
                ${!isUser && role !== 'system' ? `
                    <div class="flex items-center mt-2 space-x-2 text-gray-400">
                        <button class="feedback-btn like-btn hover:text-green-500 p-1 rounded" data-message-id="${messageId}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                            </svg>
                        </button>
                        <button class="feedback-btn dislike-btn hover:text-red-500 p-1 rounded" data-message-id="${messageId}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                            </svg>
                        </button>
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    messageContent += `</div>`;
    messageDiv.innerHTML = messageContent;
    chatContainer.appendChild(messageDiv);

    const markdownContent = messageDiv.querySelector('.markdown-content');
    
    // 如果是延迟加载的消息，则存储内容但不立即渲染
    if (lazyLoad) {
        markdownContent.setAttribute('data-content', content);
        // 添加占位符
        markdownContent.innerHTML = '<div class="h-4 w-full bg-gray-100 animate-pulse rounded"></div>';
        
        // 使用Intersection Observer监听元素是否进入视口
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const content = element.getAttribute('data-content');
                    renderMarkdown(element, content);
                    element.classList.remove('lazy-content');
                    observer.unobserve(element);
                }
            });
        }, { rootMargin: '100px' });
        
        observer.observe(markdownContent);
    } else {
        // 立即渲染Markdown内容
        renderMarkdown(markdownContent, content);
    }

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

    // 为用户消息添加复制按钮事件
    if (isUser) {
        const copyBtn = messageDiv.querySelector('.copy-message-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', function() {
                const messageContent = this.getAttribute('data-message');
                const messageInput = document.getElementById('message-input');
                messageInput.value = messageContent; // 使用 value 属性
        
                // 手动触发 input 事件
                const event = new Event('input', {
                    bubbles: true,
                    cancelable: true,
                });
                messageInput.dispatchEvent(event);
                elements.messageInput.focus();
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

    // 获取当前会话
    const currentConversation = await getConversationById(currentConversationId);

    // 为用户消息创建ID
    const userMessageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // 添加用户消息到UI - 新消息不使用延迟加载
    appendMessage('user', message, userMessageId, false);

    // 添加用户消息到会话
    currentConversation.messages.push({
        role: 'user',
        content: message,
        id: userMessageId
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
    let fullContent = "";
    let messageElement = null;
    let contentElement = null;

    try {
        // 处理消息历史，只保留content和role字段
        const simplifiedMessages = currentConversation.messages.map(msg => ({
            content: msg.content,
            role: msg.role
        }));
        // 处理 assistant 的 content
        const updatedMessages = simplifiedMessages.map(msg => {
            if (msg.role === 'assistant') {
                // 替换第一个 ``` 为 <a>，第二个 ``` 为 </a>
                msg.content = msg.content.replace(/```/, '<think>').replace(/```/, '</think>');
            }
            return msg;
        });
        // 调用API获取响应
        const response = await sendChatCompletion(
            currentConversationId,
            updatedMessages,
            currentMode
        );

        if (response.body) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");

            // 为AI回复创建ID
            const aiMessageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

            let accumulatedContent = "";
            let think_status = 0;
            let firstCharacterRendered = false;
            let currentEvent = null;
            let knowledgeData = [];  // 修改为数组，用于存储多个knowledge事件的数据
            let jsonBuffer = ""; // 添加JSON缓冲区

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
                    if (line.startsWith("event:")) {
                        currentEvent = line.substring(6).trim();
                        continue;
                    }
                    if (line.startsWith("data:")) {
                        let jsonStr = line.substring(5).trim();
                        if (!jsonStr) continue;
                        if (jsonStr.includes("DONE")) continue;

                        // 处理knowledge事件数据
                        if (currentEvent === "knowledge" && jsonStr.includes("kb_title")) {
                            console.log("收到 knowledge 数据块:", jsonStr);
                            try {
                                // 尝试解析JSON字符串
                                const knowledgeItem = JSON.parse(jsonStr);
                                // 如果 knowledgeItem 是数组，展开它；如果是单个对象，直接添加
                                if (Array.isArray(knowledgeItem)) {
                                    knowledgeData.push(...knowledgeItem);
                                } else {
                                    knowledgeData.push(knowledgeItem);
                                }
                            } catch (e) {
                                console.error("解析knowledge数据失败:", e, "数据:", jsonStr);
                            }
                            continue;
                        }

                        // 处理可能被分割的JSON
                        if (!jsonStr.startsWith("{") && jsonBuffer) {
                            // 这可能是前一个JSON的继续
                            jsonBuffer += jsonStr;
                            jsonStr = jsonBuffer;
                        } else if (jsonStr.startsWith("{") && !jsonStr.endsWith("}")) {
                            // 这是一个新的不完整JSON
                            jsonBuffer = jsonStr;
                            continue;
                        } else if (jsonStr.startsWith("{") && jsonStr.endsWith("}")) {
                            // 完整的JSON，重置缓冲区
                            jsonBuffer = "";
                        }

                        try {
                            // 检查JSON字符串是否完整
                            if (jsonStr.endsWith('}') || jsonStr.endsWith(']')) {
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

                                        // 在收到第一个有效内容时创建消息元素
                                        if (!messageElement) {
                                            removeTypingIndicator();
                                            messageElement = createEmptyAssistantMessage(aiMessageId);
                                            elements.chatContainer.appendChild(messageElement);
                                            contentElement = messageElement.querySelector('.markdown-content');
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
                            } else {
                                // 如果JSON不完整，记录但不抛出错误
                                console.warn("收到不完整的JSON数据，跳过此块:", jsonStr);
                            }
                        } catch (e) {
                            console.error("解析流式数据失败:", e, "数据:", jsonStr);
                            // 不中断流程，继续处理下一块数据
                        }
                    }
                }
            }

            // 确保解码器刷新所有剩余内容
            decoder.decode();
            
            // 处理可能剩余在缓冲区的JSON数据
            if (jsonBuffer && jsonBuffer.endsWith('}')) {
                try {
                    const data = JSON.parse(jsonBuffer);
                    if (data.choices && data.choices.length > 0 && data.choices[0].delta && data.choices[0].delta.content) {
                        const content = data.choices[0].delta.content;
                        fullContent += content;
                        if (contentElement) {
                            renderMarkdown(contentElement, fullContent);
                            elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
                        }
                    }
                } catch (e) {
                    console.warn("处理剩余缓冲区数据失败:", e);
                }
                jsonBuffer = "";
            }

            // 确保最后的内容被渲染
            if (accumulatedContent.length > 0 && contentElement) {
                renderMarkdown(contentElement, fullContent);
                elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
            }

            // 记录消息到对话历史
            const newMessage = {
                role: 'assistant',
                content: fullContent,
                id: aiMessageId
            };

            // 如果有knowledge数据，添加到消息中
            if (knowledgeData.length > 0) {
                // 直接将数组赋值，不进行JSON.stringify
                newMessage.knowledge_data = knowledgeData;
                // 使用JSON.stringify仅用于日志输出
                console.log('获取knowledge_data: ', JSON.stringify(knowledgeData, null, 2), newMessage);
            }

            currentConversation.messages.push(newMessage);

            // 更新会话
            updateConversation(currentConversation);
            console.log('currentConversation', currentConversation);

            return true;
        } else {
            throw new Error("API响应格式错误");
        }
    } catch (error) {
        console.error('获取AI响应失败:', error);
        
        // 如果是AbortError且已经收到了响应，可以忽略这个错误
        if (error.name === 'AbortError' && fullContent && fullContent.length > 0) {
            console.log('流式响应已完成但连接被中断，这是预期行为');
            return true;
        }
        
        removeTypingIndicator();
        appendMessage('system', '抱歉，发生了错误，请稍后再试。');
        return false;
    }
}
