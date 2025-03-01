import { modeConfig } from './config.js';
import { handleFeedback } from './feedback.js';

// DOM元素引用存储
export const elements = {};

// 初始化DOM元素引用
export function initializeElements(elements) {
    elements.chatContainer = document.getElementById('chat-container');
    elements.messageInput = document.getElementById('message-input');
    elements.sendButton = document.getElementById('send-button');
    elements.chatForm = document.getElementById('chat-form');
    elements.conversationList = document.getElementById('conversation-list');
    elements.feedbackModal = document.getElementById('feedback-modal');
    elements.feedbackForm = document.getElementById('feedback-form');
    elements.cancelFeedback = document.getElementById('cancel-feedback');
    elements.newChatButton = document.getElementById('new-chat');
    elements.currentModeTitle = document.getElementById('current-mode-title');
    elements.questionButton = document.getElementById('question');
    elements.settingButton = document.getElementById('setting');
    elements.uploadButton = document.getElementById('Uploadfile');
    elements.welcomeMessageContainer = document.getElementById('welcome-message-container');
    elements.modeButtons = document.querySelectorAll('.mode-button');
}

// 调整文本输入框高度
export function adjustTextareaHeight() {
    const { messageInput } = elements;
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 200) + 'px';
}

// 设置欢迎消息
export function setWelcomeMessage(mode) {
    const { currentModeTitle, welcomeMessageContainer } = elements;
    const selectedMode = modeConfig[mode] || modeConfig['default'];
    console.log(selectedMode);
    currentModeTitle.textContent = selectedMode.title;
    welcomeMessageContainer.innerHTML = `
        <div class="flex items-start">
            <div class="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold mr-3 flex-shrink-0">
                AI
            </div>
            <div class="message-container bg-white p-4 rounded-lg shadow-sm border border-gray-200 max-w-3xl">
                <div class="markdown-body" id="welcome-message-content">
                    ${marked.parse(DOMPurify.sanitize(selectedMode.welcomeMessage))}
                </div>
            </div>
        </div>
    `;
}

// 显示输入中指示器
export function appendTypingIndicator() {
    const { chatContainer } = elements;
    const indicatorDiv = document.createElement('div');
    indicatorDiv.id = 'typing-indicator';
    indicatorDiv.className = 'flex items-start';
    indicatorDiv.innerHTML = `
        <div class="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold mr-3 flex-shrink-0">
            AI
        </div>
        <div class="message-container bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div class="typing-indicator flex space-x-1">
                <span class="w-2 h-2 rounded-full bg-gray-400"></span>
                <span class="w-2 h-2 rounded-full bg-gray-400"></span>
                <span class="w-2 h-2 rounded-full bg-gray-400"></span>
            </div>
        </div>
    `;
    chatContainer.appendChild(indicatorDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// 移除输入中指示器
export function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

// 渲染Markdown内容
export function renderMarkdown(element, content) {
    const rendered = marked.parse(content);
    element.innerHTML = DOMPurify.sanitize(rendered);
}

// 清空聊天容器
export function clearChatContainer() {
    const { chatContainer } = elements;
    while (chatContainer.firstChild) {
        chatContainer.removeChild(chatContainer.firstChild);
    }
}

// 创建空的AI消息元素
export function createEmptyAssistantMessage(messageId) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex items-start';
    // 如果这是第一个消息，则设置为欢迎消息
    console.log('messageId', messageId);
        messageDiv.innerHTML = `
            <div class="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold mr-3 flex-shrink-0">
                AI
            </div>
        <div class="message-container bg-white p-4 rounded-lg shadow-sm border border-gray-200 max-w-3xl">
            <div ${messageId=='' ? 'id="welcome-message-content" class="markdown-content"' : 'class="markdown-content"'}>
            </div>
            <div class="flex items-center mt-4 space-x-2 text-gray-400">
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
        </div>
    `;

    
    // 为AI消息添加反馈按钮事件
    if (messageId) {
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

    return messageDiv;
} 