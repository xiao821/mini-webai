import { elements, clearChatContainer, setWelcomeMessage, renderMarkdown, showHistoryLoadingIndicator, hideHistoryLoadingIndicator } from './ui.js';
import { appendMessage } from './messaging.js';
import { fetchChatHistory, deleteChatById, generateId, fetchChatList, sendChatCompletion } from './api.js';
import { modeConfig, QW_MODEL, R1_MODEL } from './config.js';
import { getCurrentMode } from './modes.js';

// 会话数据存储
let conversations = [];
let currentConversationId = null;
let newmessages = [];


// 生成一个随机的ID
export function generateRandomId() {
    return 'id_' + Math.random().toString(36).substr(2, 8); // 生成一个8位的随机ID
}

// 存储随机 ID 到 Cookie 中
export function setRandomIdInCookie() {
    // 判断是否存在id
    const existingId = getRandomIdFromCookie();
    if (existingId) {
        console.log(`Cookie中已存在随机ID: ${existingId}`);
        return; // 如果已经存在则不再设置
    }

    const randomId = generateRandomId();
    // 设置过期时间为 2099 年 12 月 31 日 23:59:59 GMT
    const expires = "Fri, 31 Dec 2099 23:59:59 GMT";

    // 设置 id，包含随机 ID 和过期时间
    document.cookie = `miniai_TSG_Id=${randomId}; expires=${expires}; path=/`;
    console.log(`Random ID stored in cookie: ${randomId}`);
}

// 获取 cookie中设置的 随机 ID
export function getRandomIdFromCookie() {
    const cookieArray = document.cookie.split('; ');
    for (let i = 0; i < cookieArray.length; i++) {
        const cookie = cookieArray[i].split('=');
        if (cookie[0] === 'miniai_TSG_Id') {
            return cookie[1];
        }
    }
    return null; // 如果没有随机 ID，返回 null
}

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
    // 保存当前会话状态到后端
    if (currentConversationId) {
        const currentConv = getConversationById(currentConversationId);
        if (currentConv && currentConv.messages && currentConv.messages.length > 0) {
            try {
                // 准备发送到后端的消息数据
                const simplifiedMessages = currentConv.messages.map(msg => ({
                    content: msg.content,
                    role: msg.role,
                    // 保留knowledge_data字段，如果存在的话
                    ...(msg.knowledge_data ? { knowledge_data: msg.knowledge_data } : {})
                }));
                
                // 处理 assistant 的 content
                const updatedMessages = simplifiedMessages.map(msg => {
                    if (msg.role === 'assistant') {
                        // 替换第一个 ``` 为 <think>，第二个 ``` 为 </think>
                        msg.content = msg.content.replace(/```思考过程/g, '<details><summary>思考过程</summary><div class="thinking-process">').replace(/```/g, '</div></details>');
                    }
                    return msg;
                });
                
                // 调用API保存当前会话
                await sendChatCompletion(
                    currentConversationId,
                    updatedMessages,
                    currentConv.mode || 'default'
                );
                console.log('当前会话已保存到后端');
            } catch (error) {
                console.error('保存当前会话失败:', error);
            }
        }
    }

    // 更新当前会话ID
    currentConversationId = id;
    renderConversationList();

    // 清空聊天容器
    clearChatContainer();
    
    // 显示加载指示器
    showHistoryLoadingIndicator();

    // 重置 newmessages 数组
    newmessages = [];

    // 获取当前会话对象
    const currentConversation = getConversationById(id);
    if (!currentConversation) {
        console.error('找不到会话:', id);
        hideHistoryLoadingIndicator();
        return;
    }

    // 清空当前会话的消息数组，准备重新加载
    currentConversation.messages = [];

    try {
        // 发起API请求获取会话历史
        const data = await fetchChatHistory(id);

        const messagesHistory = data.messages.history || [];

        // 隐藏加载指示器
        hideHistoryLoadingIndicator();

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
            
            // 添加欢迎消息到当前会话的消息数组
            currentConversation.messages.push({
                role: 'assistant',
                content: welcomeMessage,
                id: 'first-message'
            });
        } else {
            // 如果有历史消息，则显示并添加到当前会话的消息数组
            // 定义一次性渲染的消息数量
            const INITIAL_RENDER_COUNT = 3;
            
            messagesHistory.forEach((msg, index) => {
                const messageId = msg.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                
                // 处理 <a> 标签
                let processedContent = msg.content;
                // if (processedContent.includes("思考过程")) {
                //     processedContent = processedContent.replace(/```思考过程/g, '<details class="thinking-process-details"><summary>思考过程</summary><div class="thinking-process">');
                //     processedContent = processedContent.replace(/```/g, '</div></details>');
                // }
                if (processedContent === "" || processedContent.includes("<think>")) {
                    processedContent = processedContent.replace(/<think>/g, '<details class="thinking-process-details"><summary>思考过程</summary><div class="thinking-process">');
                    // fullContent += "<details open class='thinking-process-details'><summary>思考过程</summary><div class='thinking-process'>";
                } else if (processedContent.includes("</think>")) {
                    processedContent = processedContent.replace(/<\/think>/g, '</div></details>');
                }

                // 判断是否需要延迟加载
                // 最新的三条消息立即渲染，其余的延迟加载
                const shouldLazyLoad = messagesHistory.length > INITIAL_RENDER_COUNT && 
                                      index < messagesHistory.length - INITIAL_RENDER_COUNT;
                
                // 显示消息，根据条件决定是否延迟加载
                appendMessage(msg.role, processedContent, messageId, shouldLazyLoad);
                
                // 添加消息到当前会话的消息数组
                currentConversation.messages.push({
                    role: msg.role,
                    content: processedContent,
                    id: messageId,
                    knowledge_data: msg.knowledge_data || null
                });
            });

            // 如果返回数据有标题，则更新会话标题
            if (data.messages.title) {
                updateConversationTitle(id, data.messages.title);
            }
        }
        
        // 更新会话对象
        updateConversation(currentConversation);
        console.log('会话历史已加载并更新到当前会话对象:', currentConversation);
    } catch (error) {
        console.error('获取会话历史失败:', error);
        hideHistoryLoadingIndicator();
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

    // 如果要删除的不是当前会话，先保存当前会话状态到后端
    if (id !== currentConversationId) {
        const currentConv = getConversationById(currentConversationId);
        if (currentConv && currentConv.messages && currentConv.messages.length > 0) {
            try {
                // 准备发送到后端的消息数据
                const simplifiedMessages = currentConv.messages.map(msg => ({
                    content: msg.content,
                    role: msg.role
                }));
                
                // 处理 assistant 的 content
                const updatedMessages = simplifiedMessages.map(msg => {
                    if (msg.role === 'assistant') {
                        // 替换第一个 ``` 为 <think>，第二个 ``` 为 </think>
                        msg.content = msg.content.replace(/```思考过程/g, '<think>').replace(/```/g, '</think>');
                    }
                    return msg;
                });
                
                // 调用API保存当前会话
                await sendChatCompletion(
                    currentConversationId,
                    updatedMessages,
                    currentConv.mode || 'default'
                );
                console.log('当前会话已保存到后端');
            } catch (error) {
                console.error('保存当前会话失败:', error);
            }
        }
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
    
    // 保存当前会话状态到后端
    if (currentConversationId) {
        const currentConv = getConversationById(currentConversationId);
        if (currentConv && currentConv.messages && currentConv.messages.length > 0) {
            try {
                // 准备发送到后端的消息数据
                const simplifiedMessages = currentConv.messages.map(msg => ({
                    content: msg.content,
                    role: msg.role,
                    // 保留knowledge_data字段，如果存在的话
                    ...(msg.knowledge_data ? { knowledge_data: msg.knowledge_data } : {})
                }));
                
                // 处理 assistant 的 content
                const updatedMessages = simplifiedMessages.map(msg => {
                    if (msg.role === 'assistant') {
                        // 替换第一个 ``` 为 <think>，第二个 ``` 为 </think>
                        msg.content = msg.content.replace(/```思考过程/g, '<think>').replace(/```/g, '</think>');
                    }
                    return msg;
                });
                
                // 调用API保存当前会话
                await sendChatCompletion(
                    currentConversationId,
                    updatedMessages,
                    currentConv.mode || 'default'
                );
                console.log('当前会话已保存到后端');
            } catch (error) {
                console.error('保存当前会话失败:', error);
            }
        }
    }
    
    // 生成新ID
    const newId = await generateId();
    
    // 获取欢迎消息
    const selectedMode = modeConfig[currentMode] || modeConfig['default'];
    const welcomeMessage = selectedMode.welcomeMessage;

    // 创建欢迎消息ID
    const welcomeMessageId = 'first-message';

    // 创建新对话
    conversations.unshift({
        id: newId,
        title: '新对话',
        mode: currentMode,
        messages: [{
            role: 'assistant',
            content: welcomeMessage,
            id: welcomeMessageId
        }]
    });

    currentConversationId = newId;
    renderConversationList();
    clearChatContainer();

    // 显示欢迎消息
    appendMessage('assistant', welcomeMessage, welcomeMessageId);
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
                    mode: chatInfo.mode || 'general', // 默认设置为通用模式
                    messages: [] // 初始化为空数组，稍后会加载完整历史
                });
            }
        }

        // 确保至少有一个对话
        if (conversations.length === 0) {
            const newChatId = await generateId();
            conversations.push({
                id: newChatId,
                title: '新对话',
                mode: 'default',
                messages: []
            });
            currentConversationId = newChatId;
        } else {
            // 使用第一个对话作为当前对话
            currentConversationId = conversations[0].id;
        }

        // 渲染对话列表
        renderConversationList();
        
        // 加载当前会话的完整历史
        if (currentConversationId) {
            await switchConversation(currentConversationId);
        }
        
        return currentConversationId;
    } catch (error) {
        console.error('加载对话历史失败:', error);
        // 如果加载失败，创建一个新对话
        const newChatId = await generateId();
        conversations = [{
            id: newChatId,
            title: '新对话',
            mode: 'default',
            messages: []
        }];
        currentConversationId = newChatId;
        renderConversationList();
        
        return currentConversationId;
    }
}

// 保存当前会话状态到后端
export async function saveCurrentConversation() {
    if (!currentConversationId) return;
    
    const currentConv = getConversationById(currentConversationId);
    if (!currentConv || !currentConv.messages || currentConv.messages.length === 0) return;
    
    try {
        // 准备发送到后端的消息数据
        const simplifiedMessages = currentConv.messages.map(msg => ({
            content: msg.content,
            role: msg.role,
            // 保留knowledge_data字段，如果存在的话
            ...(msg.knowledge_data ? { knowledge_data: msg.knowledge_data } : {})
        }));
        
        // 处理 assistant 的 content
        const updatedMessages = simplifiedMessages.map(msg => {
            if (msg.role === 'assistant') {
                // 替换第一个 ``` 为 <think>，第二个 ``` 为 </think>
                msg.content = msg.content.replace(/```思考过程/g, '<think>').replace(/```/g, '</think>');
            }
            return msg;
        });
        
        // 调用API保存当前会话
        await sendChatCompletion(
            currentConversationId,
            updatedMessages,
            currentConv.mode || 'default'
        );
        console.log('当前会话已保存到后端');
        return true;
    } catch (error) {
        console.error('保存当前会话失败:', error);
        return false;
    }
}

// 在页面关闭或刷新前保存当前会话
// sendBeacon()方法设计用于在页面卸载时发送数据，它会在后台异步发送请求，不会阻塞页面卸载过程
// 浏览器会保证这些请求会被发送，即使页面已经关闭
// 它使用POST方法发送数据，适合发送较大的数据量
// 不需要等待服务器响应，非常适合"发送并忘记"的场景
window.addEventListener('beforeunload', (event) => {
    // 由于beforeunload不能等待异步操作，我们只能发送同步请求
    // 或者使用navigator.sendBeacon API
    if (currentConversationId) {
        const currentConv = getConversationById(currentConversationId);
        if (currentConv && currentConv.messages && currentConv.messages.length > 0) {
            try {
                // 准备发送到后端的消息数据
                const simplifiedMessages = currentConv.messages.map(msg => ({
                    content: msg.content,
                    role: msg.role,
                    // 保留knowledge_data字段，如果存在的话
                    ...(msg.knowledge_data ? { knowledge_data: msg.knowledge_data } : {})
                }));
                
                // 处理 assistant 的 content
                const updatedMessages = simplifiedMessages.map(msg => {
                    if (msg.role === 'assistant') {
                        // 替换第一个 ``` 为 <think>，第二个 ``` 为 </think>
                        msg.content = msg.content.replace(/```思考过程/g, '<think>').replace(/```/g, '</think>');
                    }
                    return msg;
                });
                
                // 使用navigator.sendBeacon发送数据
                const requestData = {
                    model: currentConv.mode === 'medical' ? QW_MODEL : R1_MODEL,
                    messages: updatedMessages,
                    max_tokens: 10240,
                    temperature: 0,
                    stream: true,
                    chat_id: currentConversationId,
                    department: modeConfig[currentConv.mode]?.department,
                    kb_category: modeConfig[currentConv.mode]?.kb_category
                };
                
                const API_BASE_URL = window.API_BASE_URL || '';
                const API_AUTH_TOKEN = window.API_AUTH_TOKEN || '';
                
                navigator.sendBeacon(
                    `${API_BASE_URL}v1/chat/completions`, 
                    new Blob([JSON.stringify(requestData)], {type: 'application/json'})
                );
                
                console.log('已尝试在页面关闭前保存会话');
            } catch (error) {
                console.error('页面关闭前保存会话失败:', error);
            }
        }
    }
}); 