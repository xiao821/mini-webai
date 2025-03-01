import { API_BASE_URL, API_AUTH_TOKEN, USER_ID, R1_MODEL, QW_MODEL } from './config.js';
import { modeConfig } from './config.js';
import { currentModel } from './index.js';

// 获取新会话ID
export async function generateId() {
    console.log('generateId', USER_ID);
    try {
        const response = await axios.get(`${API_BASE_URL}/api/chatid`, {
            params: { 'user_id': USER_ID },
            headers: { 'Authorization': API_AUTH_TOKEN }
        });
        return response.data.chat_id;
    } catch (error) {
        console.error('获取会话ID失败:', error);
        return 'local-' + Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
}

// 获取会话历史列表
export async function fetchChatList() {
    console.log('fetchChatList', USER_ID);
    try {
        const response = await axios.get(`${API_BASE_URL}/api/chat_id_title_list`, {
            params: { 'user_id': USER_ID },
            headers: { 'Authorization': API_AUTH_TOKEN }
        });
        return response.data.chat_id_list || [];
    } catch (error) {
        console.error('获取会话列表失败:', error);
        throw error;
    }
}

// 获取特定会话的历史消息
export async function fetchChatHistory(chatId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/chat_byid?chat_id=${chatId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': API_AUTH_TOKEN
            }
        });
        return await response.json();
    } catch (error) {
        console.error('获取会话历史失败:', error);
        throw error;
    }
}

// 删除会话
export async function deleteChatById(chatId) {
    try {
        const response = await axios.delete(`${API_BASE_URL}/api/del_history_by_chatid`, {
            params: { 'chat_id': chatId },
            headers: { 'Authorization': API_AUTH_TOKEN }
        });
        return response.detail;
    } catch (error) {
        console.error('删除会话失败:', error);
        throw error;
    }
}

// 发送消息到API
export async function sendChatCompletion(currentConversationId, messages, currentMode) {

    try {
        // 准备请求数据
        const requestData = {
            model: currentModel,
            messages: messages,
            max_tokens: 2048,
            temperature: 0.6,
            stream: true,
            chat_id: currentConversationId,
            department: modeConfig[currentMode]?.department,
            kb_category: modeConfig[currentMode]?.kb_category
        };

        // 发送请求
        const response = await fetch(`${API_BASE_URL}v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': API_AUTH_TOKEN,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API 请求失败: ${response.status} ${response.statusText} - ${errorText}`);
        }

        return response;
    } catch (error) {
        console.error('发送聊天请求失败:', error);
        throw error;
    }
} 