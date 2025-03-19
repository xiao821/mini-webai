import { API_BASE_URL, API_AUTH_TOKEN, USER_ID, R1_MODEL, QW_MODEL, BASE_URL_VOICE } from './config.js';
import { modeConfig } from './config.js';
import { currentModel } from './index.js';

// 获取知识分类
export async function fetchKnowledgeCategory(department = '') {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/feedback/getKnowleCate/`, {
            headers: { 'Authorization': API_AUTH_TOKEN },
            params: { answer_type:department }
        });
        // console.log('知识分类数据:', response);
        return response.data.knowledge_list;
    } catch (error) {
        console.error('获取知识分类失败:', error);
        throw error;
    }
}

// 获取lgzsj知识库列表
export async function fetchLgzsjKnowledgeList(mode = 'default') {
    try {
        // 从modeConfig中获取对应mode的department
        const { modeConfig } = await import('./config.js');
        const department = modeConfig[mode]?.department || "龙岗政数局";
        
        const response = await axios.get(`${API_BASE_URL}/api/query_kb_category`, {
            params: { 'department': department },
            headers: { 'Authorization': API_AUTH_TOKEN }    
        });
        return response.data || [];
    } catch (error) {
        console.error('获取知识库列表失败:', error);
        throw error;
    }
}

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
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
        try {
            // 准备请求数据
            const requestData = {
                model: currentModel,
                messages: messages,
                max_tokens: 10240,
                temperature: 0,
                stream: true,
                chat_id: currentConversationId,
                department: modeConfig[currentMode]?.department,
                kb_category: modeConfig[currentMode]?.kb_category
            };

            // 发送请求
            const response = await fetch(`${API_BASE_URL}/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': API_AUTH_TOKEN,
                    'Content-Type': 'application/json',
                    'Connection': 'keep-alive',
                    'Accept': 'text/event-stream'
                },
                body: JSON.stringify(requestData),
                // 添加额外的fetch选项
                keepalive: true,
                timeout: 30000, // 30秒超时
                signal: AbortSignal.timeout(30000) // 30秒后自动中断
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API 请求失败: ${response.status} ${response.statusText} - ${errorText}`);
            }

            // 检查响应头中是否包含正确的内容类型
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('text/event-stream')) {
                console.warn('警告：服务器响应的内容类型不是 text/event-stream');
            }

            return response;

        } catch (error) {
            retryCount++;
            console.error(`发送聊天请求失败 (尝试 ${retryCount}/${maxRetries}):`, error);
            
            if (error.name === 'AbortError') {
                console.log('请求超时，准备重试...');
            }
            
            if (retryCount === maxRetries) {
                throw new Error(`在 ${maxRetries} 次尝试后仍然失败: ${error.message}`);
            }
            
            // 等待一段时间后重试
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
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
export async function dislikefeedback(currentMessageRAG, MessageHistory, messageContent, type, detail, kb_category, model, department) {
    console.log('传入接口中的kb_reference' ,currentMessageRAG);
    try {
        // 获取department参数，如果没有传入则从配置中获取默认值
        const { modeConfig } = await import('./config.js');
        const useDepartment = department || modeConfig[model]?.department || "龙岗政数局";
        
        // 准备请求数据
        const requestData = {
            kb_reference: currentMessageRAG || [], // 参考知识点
            conversation_messages: MessageHistory || [], // 对话历史
            current_message: messageContent || '', // 当前消息
            feedback_type: type || '', // 反馈类型
            detail: detail || '', // 反馈详情
            user_id: USER_ID, // 用户ID
            category: kb_category || '', // 知识分类
            model_name: model, // 模型
            department: useDepartment // 知识库类别
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
