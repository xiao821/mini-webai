import { API_BASE_URL, API_AUTH_TOKEN, USER_ID, R1_MODEL, QW_MODEL, BASE_URL_VOICE } from './config.js';
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
        alert('获取会话ID失败:' + error);
        // return 'local-' + Date.now().toString(36) + Math.random().toString(36).substring(2);
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

// 语言识别输入
export function record_voice(audioBlob) {
    console.log("开始识别", audioBlob);

    // 创建 FormData 对象
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.wav"); // 添加 Blob 到 FormData
    formData.append('model', 'FunAudioLLM/SenseVoiceSmall');

    // 发送请求
    axios.post(`${BASE_URL_VOICE}/api/asr`, formData, {
        headers: {
            "Content-Type": "multipart/form-data", // 设置请求头
        },
    }).then(response => {
        console.log("识别结果:", response.data);
        const messageInput = document.getElementById('message-input');
        messageInput.value = response.data.text; // 使用 value 属性

        // 手动触发 input 事件
        const event = new Event('input', {
            bubbles: true,
            cancelable: true,
        });
        messageInput.dispatchEvent(event);
    }).catch(error => {
        console.error("识别失败:", error);
    });
}

// post点踩进行反馈
export async function dislikefeedback(currentMessageRAG, MessageHistory, messageContent, type, detail) {
    console.log('dislikefeedback', USER_ID);
    try {
        // 准备请求数据
        const requestData = {
            kb_reference: currentMessageRAG, // 参考知识点
            conversation_messages: MessageHistory, // 对话历史
            current_message: messageContent, // 当前消息
            feedback_type: type, // 反馈类型
            detail: detail, // 反馈详情
            user_id: USER_ID // 用户ID
        };

        // 发送请求
        const response = await fetch(`${API_BASE_URL}/api/feedback`, {
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

// 获取全部反馈信息列表
export async function fetchFeedbackList() {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/feedback`, {
            headers: { 'Authorization': API_AUTH_TOKEN }
        });
        return response || [];
    } catch (error) {
        console.error('获取反馈列表失败:', error);
        throw error;
    }
}
// 修改为 CommonJS 导出
// module.exports = {
//     fetchFeedbackList: async function() {
//         const response = await axios.get(`${API_BASE_URL}/api/feedback`, {
//             headers: { 'Authorization': API_AUTH_TOKEN }
//         });
//         return response || [];
//     },
// };

// // 获取录音文件
// export function getAudioFile(text) {
//     const response = axios.post(`${BASE_URL}/api/tts`, { tts_text: text }, { responseType: 'blob' })
//     .then(function (response) {
//         const blob = new Blob([response.data], { type: 'audio/mpeg' }); // 确保类型正确
//         const url = URL.createObjectURL(blob);
//         audioElement.src = url;

//         // 监听音频播放结束事件
//         audioElement.onended = function () {
//             playButton.style.display = 'block';
//             pauseButton.style.display = 'none';
//         };

//         // 播放音频
//         audioElement.play();
//     })
//     .catch(function (err) {
//         console.log(err);
//     });
//     return response;
// }
