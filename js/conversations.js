import { elements, clearChatContainer, setWelcomeMessage } from './ui.js';
import { appendMessage } from './messaging.js';
import { fetchChatHistory, deleteChatById, generateId, fetchChatList } from './api.js';
import { modeConfig } from './config.js';
import { getCurrentMode } from './modes.js';

// 会话数据存储
let conversations = [];
let currentConversationId = null;
let newmessages = [];

// 获取特定ID的会话
export function getConversationById(id) {
    console.log('Getting conversation by ID:', id);
    return conversations.find(c => c.id === id);
}

// 更新会话
export function updateConversation(conversation) {
    const index = conversations.findIndex(c => c.id === conversation.id);
    if (index !== -1) {
        conversations[index] = conversation;
        renderConversationList();
    }
}

// 获取当前会话ID
export function getCurrentConversationId() {
    return currentConversationId;
}

// 设置当前会话ID
export function setCurrentConversationId(id) {
    currentConversationId = id;
}

// 获取所有会话
export function getAllConversations() {
    return conversations;
}

// 设置会话列表
export function setConversations(convList) {
    conversations = convList;
}

// 渲染会话列表
export function renderConversationList() {
    const { conversationList } = elements;
    
    conversationList.innerHTML = '';
    conversations.forEach(conv => {
        const isActive = conv.id === currentConversationId;
        const div = document.createElement('div');
        div.className = `conversation-item p-2 rounded-lg cursor-pointer flex justify-between items-center ${isActive ? 'bg-blue-100' : 'hover:bg-gray-100'}`;
        div.dataset.id = conv.id;
        div.innerHTML = `
            <div class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span class="text-sm truncate max-w-[150px]">${conv.title || '新对话'}</span>
            </div>
            <button class="delete-conversation text-gray-400 hover:text-red-500 p-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        `;
        conversationList.appendChild(div);

        // 添加点击事件
        div.addEventListener('click', function (e) {
            if (!e.target.closest('.delete-conversation')) {
                switchConversation(conv.id);
            }
        });

        // 添加删除事件
        const deleteBtn = div.querySelector('.delete-conversation');
        deleteBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            deleteConversation(conv.id);
        });
    });
}

// 切换会话
export async function switchConversation(id) {
    // 更新当前会话ID
    currentConversationId = id;
    renderConversationList();

    // 清空聊天容器
    clearChatContainer();

    // 重置 newmessages 数组
    newmessages = [];

    try {
        // 发起API请求获取会话历史
        const data = await fetchChatHistory(id);

        const messagesHistory = data.messages.history || [];

        if (messagesHistory.length === 0) {
            // 没有历史消息，发送欢迎信息
            console.log('No history messages, sending welcome message');
            // 获取欢迎消息 currentMode未定义
            const currentMode = getCurrentMode();
            const selectedMode = modeConfig[currentMode] || modeConfig['default'];
            const welcomeMessage = selectedMode.welcomeMessage;
            // 显示欢迎消息
            appendMessage('assistant', welcomeMessage, 'first-message');
            console.log('Welcome message appended:', welcomeMessage);
            //TODO
        } else {
            // 如果有历史消息，则显示
            messagesHistory.forEach(msg => {
                const messageId = msg.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                appendMessage(msg.role, msg.content, messageId);
            });

            // 如果返回数据有标题，则更新会话标题
            if (data.messages.title) {
                updateConversationTitle(id, data.messages.title);
            }
        }
    } catch (error) {
        console.error('获取会话历史失败:', error);
        appendMessage('assistant', '获取会话历史失败，请稍后再试。');
    }
}

// 更新会话标题
export function updateConversationTitle(conversationId, title) {
    const conversation = getConversationById(conversationId);
    if (conversation) {
        conversation.title = title;
        renderConversationList();
    }
}

// 删除会话
export async function deleteConversation(id) {
    // 不能删除最新会话
    if (conversations[0]?.id === id) {
        alert('最新的会话不可删除');
        return;
    }

    // 检查最小会话数
    if (conversations.length <= 1) {
        alert('至少需要保留一个对话');
        return;
    }

    try {
        // 调用删除API
        await deleteChatById(id);
        
        // 从本地数组中移除会话
        const index = conversations.findIndex(c => c.id === id);
        if (index !== -1) {
            conversations.splice(index, 1);

            // 如果删除的是当前对话，切换到第一个对话
            if (id === currentConversationId) {
                currentConversationId = conversations[0].id;
                switchConversation(currentConversationId);
            } else {
                renderConversationList();
            }
        }
        // 使用 SweetAlert2 显示删除成功提示
        // 小一点
        Swal.fire({
            icon: 'success',
            title: '删除成功',
            text: '会话已成功删除',
            showConfirmButton: false,
            timer: 1000,
            width: 300,
            padding: 10
        });
        console.log('Conversation deleted successfully');
    } catch (error) {
        console.error('删除会话失败:', error);
        alert('删除会话失败: ' + (error.message || '未知错误'));
    }
}

// 创建新会话
export async function startNewConversation(currentMode) {
    console.log('Starting new conversation in mode:', currentMode);
    // 生成新ID
    const newId = await generateId();
    
    // 获取欢迎消息
    const selectedMode = modeConfig[currentMode] || modeConfig['default'];
    const welcomeMessage = selectedMode.welcomeMessage;

    // 创建新对话
    conversations.unshift({
        id: newId,
        title: '新对话',
        mode: currentMode,
        messages: []
    });

    currentConversationId = newId;
    renderConversationList();
    clearChatContainer();

    // 显示欢迎消息
    appendMessage('assistant', welcomeMessage, 'first-message');
    console.log('Welcome message appended:', welcomeMessage);

    // 重置 newmessages 数组
    newmessages = [];
    
    return newId;
}

// 初始化会话列表
export async function initializeConversations() {
    try {
        // 从API加载会话列表
        const chatList = await fetchChatList();
        
        // 清空当前对话列表
        conversations = [];

        // 处理对话ID列表
        if (chatList.length > 0) {
            // 添加已有的对话到列表
            for (const chatInfo of chatList) {
                conversations.push({
                    id: chatInfo.chat_id,
                    title: chatInfo.title || '未命名对话',
                    mode: 'general', // 默认设置为通用模式
                    messages: []
                });
            }
        }

        // 确保至少有一个对话
        if (conversations.length === 0) {
            const newChatId = await generateId();
            conversations.push({
                id: newChatId,
                title: '新对话',
                mode: 'dataresource',
                messages: []
            });
            currentConversationId = newChatId;
        } else {
            // 使用第一个对话作为当前对话
            currentConversationId = conversations[0].id;
        }

        // 渲染对话列表
        renderConversationList();
        
        return currentConversationId;
    } catch (error) {
        console.error('加载对话历史失败:', error);
        // 如果加载失败，创建一个新对话
        const newChatId = await generateId();
        conversations = [{
            id: newChatId,
            title: '新对话',
            mode: 'dataresource',
            messages: []
        }];
        currentConversationId = newChatId;
        renderConversationList();
        
        return currentConversationId;
    }
} 