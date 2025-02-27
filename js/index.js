document.addEventListener('DOMContentLoaded', function () {
    // 当前状态变量
    let currentMode = 'dataresource';
    let currentConversationId = null; // 初始化为null，会在loadChatHistory中设置
    let isWaitingForResponse = false;
    let conversations = [];
    let feedbackMessageId = null;
    let newmessages = [];
    let BASE_URL = 'https://lgdev.baicc.cc';

    // DOM 元素
    const chatContainer = document.getElementById('chat-container');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const chatForm = document.getElementById('chat-form');
    const conversationList = document.getElementById('conversation-list');
    const feedbackModal = document.getElementById('feedback-modal');
    const feedbackForm = document.getElementById('feedback-form');
    const cancelFeedback = document.getElementById('cancel-feedback');
    const newChatButton = document.getElementById('new-chat');
    const currentModeTitle = document.getElementById('current-mode-title');
    const questionButton = document.getElementById('question');
    const settingButton = document.getElementById('setting');
    const uploadButton = document.getElementById('Uploadfile');

    // 模式按钮
    const modeButtons = {
        'dataresource': document.getElementById('dataresource'),
        'datatrading': document.getElementById('datatrading'),
        'knowledgemap': document.getElementById('knowledgemap'),
        'loweconomy': document.getElementById('loweconomy'),
        'deepseek': document.getElementById('deepseek')
    };

    // 模式配置
    const modeConfig = {
        'dataresource': {
            title: '数据资源',
            systemMessage: '你是一个专业的医保顾问，帮助用户解答医保相关问题。'
        },
        'datatrading': {
            title: '数据交易',
            systemMessage: '你是一个专业的医保政策解读专家，帮助用户理解复杂的医保政策，回答必须引用具体的政策条款。'
        },
        'knowledgemap': {
            title: '知识图谱',
            systemMessage: '你是一个专业的医保报销顾问，帮助用户了解医疗费用报销流程、比例及相关问题。'
        },
        'loweconomy': {
            title: '低空经济',
            systemMessage: '你是一个专业的医保政策解读专家，帮助用户理解复杂的医保政策，回答必须引用具体的政策条款。'
        },
        'deepseek': {
            title: 'deepseek',
            systemMessage: '你是一个专业的医保报销顾问，帮助用户了解医疗费用报销流程、比例及相关问题。'
        }
    };

    // 初始化应用
    initializeApp();

    // 事件监听器
    messageInput.addEventListener('input', function () {
        adjustTextareaHeight();
        sendButton.disabled = !messageInput.value.trim();
    });

    // 提交问答
    chatForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const message = messageInput.value.trim();
        if (message && !isWaitingForResponse) {
            sendMessage(message);
        }
    });

    // 新对话按钮
    newChatButton.addEventListener('click', async function () {
        const newId = await generateId();
        startNewConversation(newId);
    });

    // 取消反馈
    cancelFeedback.addEventListener('click', function () {
        closeFeedbackModal();
    });

    // 反馈表单提交
    feedbackForm.addEventListener('submit', function (e) {
        e.preventDefault();
        submitFeedback();
    });

    // 右上角的问号按钮
    questionButton.addEventListener('click', function () {
        alert("待开发...");
    });

    // 右上角的设置按钮
    settingButton.addEventListener('click', function () {
        alert("待开发...");
    });

    // 文件上传按钮
    uploadButton.addEventListener('click', function () {
        alert("待开发...");
    });

    // 应用初始化函数
    async function initializeApp() {
        try {
            // 加载对话历史
            await loadChatHistory();
            // 调整文本框高度
            adjustTextareaHeight();

            // 确保切换到最近的会话
            if (conversations.length > 0) {
                // 将 currentConversationId 设置为最近的会话ID（即第一个会话）
                currentConversationId = conversations[0].id;
                // console.log('当前会话ID：', currentConversationId);
                // 切换到最近的会话并显示其历史消息
                switchConversation(currentConversationId);
            } else {
                console.log('没有会话可用');
            }
        } catch (error) {
            console.error('初始化应用失败:', error);
            alert('初始化应用失败，请刷新页面重试');
        }
    }

    // 获取会话id
    async function generateId() {
        try {
            const response = await axios.get(`${BASE_URL}/api/chatid`, {
                params: {
                    'user_id': '测试用户1'
                },
                headers: {
                    'Authorization': 'Bearer lg-evduwtdszwhdqzgqkwvdtmjgpmffipkwoogudnnqemjtvgcv'
                },
            });
            return response.data.chat_id; // 返回 chat_id
        } catch (error) {
            console.error('获取会话ID失败:', error);
            // 如果API调用失败，使用本地生成的ID
            return 'local-' + Date.now().toString(36) + Math.random().toString(36).substring(2);
        }
    }

    // 获取所有的会话历史记录
    async function loadChatHistory() {
        try {
            const response = await axios.get(`${BASE_URL}/api/chat_id_title_list`, {
                params: {
                    'user_id': '测试用户1'
                },
                headers: {
                    'Authorization': 'Bearer lg-evduwtdszwhdqzgqkwvdtmjgpmffipkwoogudnnqemjtvgcv'
                }
            });
            // console.log('获取对话列表成功:', response);

            if (response && response.data.chat_id_list) {
                // 清空当前对话列表
                conversations = [];

                // 处理对话ID列表
                if (response.data.chat_id_list.length > 0) {
                    // 添加已有的对话到列表
                    for (const chatInfo of response.data.chat_id_list) {
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
                        mode: currentMode,
                        messages: []
                    });
                    currentConversationId = newChatId;
                } else {
                    // 使用第一个对话作为当前对话
                    currentConversationId = conversations[0].id;
                }

                // 渲染对话列表
                renderConversationList();
                // console.log('当前会话ID:', currentConversationId);
                console.log('所有会话:', conversations);
            } else {
                throw new Error('获取对话列表失败');
            }
        } catch (error) {
            console.error('加载对话历史失败:', error);
            // 如果加载失败，创建一个新对话
            const newChatId = await generateId();
            conversations = [{
                id: newChatId,
                title: '新对话',
                mode: currentMode,
                messages: []
            }];
            currentConversationId = newChatId;
            renderConversationList();
        }
    }

    // 功能函数 - 发送消息
    function sendMessage(message) {
        // 添加用户消息到UI
        appendMessage('user', message);

        // 记录消息到对话历史
        const currentConversation = getConversationById(currentConversationId);
        currentConversation.messages.push({
            role: 'user',
            content: message
        });

        // 更新对话标题（如果是第一条用户消息）
        if (currentConversation.messages.filter(m => m.role === 'user').length === 1) {
            currentConversation.title = message.length > 20
                ? message.substring(0, 20) + '...'
                : message;
            renderConversationList();
        }

        // 清空输入框并禁用发送按钮
        messageInput.value = '';
        messageInput.style.height = 'auto';
        sendButton.disabled = true;
        isWaitingForResponse = true;

        // 显示加载指示器
        appendTypingIndicator();

        // 调用API
        setTimeout(() => {
            fetchAIResponse(message);
        }, 300);
    }

    // 发送API请求获取AI回复
    async function fetchAIResponse(userMessage) {
        // 将用户消息添加到 messages 列表中
        newmessages.push({
            role: 'user',
            content: userMessage
        });

        try {
            // 发送POST请求
            const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer lg-evduwtdszwhdqzgqkwvdtmjgpmffipkwoogudnnqemjtvgcv',
                },
                body: JSON.stringify({
                    model: "deepseek-32b-r1",
                    messages: newmessages,
                    max_tokens: 2048,
                    temperature: 0.6,
                    stream: true,
                    chat_id: currentConversationId,
                    department: currentMode in modeConfig ? modeConfig[currentMode].title : '数据资源',
                    kb_category: ""
                })
            });

            // 初始化 AI 响应变量
            let aiResponse = '';
            const messageId = 'msg-' + Date.now();
            let messageCreated = false;

            // 处理流式响应
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let isDone = false;

            while (!isDone) {
                const { done, value } = await reader.read();
                if (done) {
                    isDone = true;
                    break;
                }

                // 解码数据块
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(line => line.trim() !== '');

                for (const line of lines) {
                    if (line.startsWith('data:')) {
                        const data = line.slice(5).trim();
                        if (data === '[DONE]') {
                            isDone = true;
                            break;
                        }

                        try {
                            const json = JSON.parse(data);
                            const deltaContent = json.choices?.[0]?.delta?.content || '';

                            // 累加内容到 aiResponse
                            aiResponse += deltaContent;
                                   // 处理 <think> 标签
                if (deltaContent.includes('<think>') || deltaContent.includes('</think>')) {
                    aiResponse += deltaContent; // 直接累加内容
                }

                            // 确保 <think> 标签及其内容作为纯文本处理
                            if (aiResponse.trim()) {
                                if (!messageCreated) {
                                    // 移除加载指示器
                                    removeTypingIndicator();

                                    // 创建新消息，确保内容作为纯文本插入
                                    appendMessage('assistant', aiResponse, messageId);
                                    messageCreated = true;
                                } else {
                                    // 更新现有消息内容，确保内容作为纯文本插入
                                    updateMessageContent(messageId, aiResponse);
                                }
                            }
                        } catch (error) {
                            console.warn('Failed to parse chunk:', error);
                        }
                    }
                }
            }

            // 移除加载指示器
            removeTypingIndicator();

            // 如果到这里还没有创建消息（比如API返回空内容），则创建一个
            if (!messageCreated && aiResponse.trim()) {
                appendMessage('assistant', aiResponse, messageId);
            }

            // 记录消息到对话历史
            const currentConversation = getConversationById(currentConversationId);
            currentConversation.messages.push({
                role: 'assistant',
                content: aiResponse,
                id: messageId
            });

            // 更新 newmessages 数组
            newmessages.push({
                role: 'assistant',
                content: aiResponse
            });

            // 重置状态
            isWaitingForResponse = false;
        } catch (error) {
            console.error('Error fetching AI response:', error);
            removeTypingIndicator();
            appendMessage('system', '抱歉，发生了错误，请稍后再试。');
            isWaitingForResponse = false;
        }
    }

    // 新建对话
    async function startNewConversation(newId) {
        if (!newId) {
            newId = await generateId();
        }

        // 创建欢迎消息
        const welcomeMessage = getWelcomeMessage();

        // 创建新对话，并添加欢迎消息
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
        appendMessage('assistant', welcomeMessage);

        // 重置 newmessages 数组
        newmessages = [];
    }


        // 模式切换按钮
        Object.keys(modeButtons).forEach(mode => {
            modeButtons[mode].addEventListener('click', function() {
                // console.log('Switching to mode:', mode);
                switchMode(mode);
            });
        });
    function switchMode(mode) {
        if (mode === currentMode) return;
        
        // 更新UI
        Object.keys(modeButtons).forEach(m => {
            if (m === mode) {
                modeButtons[m].classList.add('bg-blue-100', 'text-blue-700');
                modeButtons[m].classList.remove('text-gray-700', 'hover:bg-gray-100');
            } else {
                modeButtons[m].classList.remove('bg-blue-100', 'text-blue-700');
                modeButtons[m].classList.add('text-gray-700', 'hover:bg-gray-100');
            }
        });
        
        // 更新当前模式和标题
        currentMode = mode;
        currentModeTitle.textContent = modeConfig[mode].title;
        
        // 如果当前对话没有消息，就直接更新模式
        const currentConversation = getConversationById(currentConversationId);
        if (currentConversation && currentConversation.messages.length === 0) {
            currentConversation.mode = mode;
            clearChatContainer();
            appendMessage('assistant', getWelcomeMessage());
        } else {
            // 否则创建新对话
            startNewConversation();
        }
    }

    // 切换会话
    function switchConversation(id) {
        // console.log('切换会话:', id);

        // 更新当前会话ID
        currentConversationId = id;
        renderConversationList();

        // 清空聊天容器
        clearChatContainer();

        // 重置 newmessages 数组
        newmessages = [];

               // 获取对话
               const conversation = getConversationById(id);

        // // 更新当前模式
        // currentMode = conversation.mode || 'dataresource';
        // currentModeTitle.textContent = modeConfig[currentMode].title;
        
        // 更新模式按钮UI
        Object.keys(modeButtons).forEach(mode => {
            if (mode === currentMode) {
                modeButtons[mode].classList.add('bg-blue-100', 'text-blue-700');
                modeButtons[mode].classList.remove('text-gray-700', 'hover:bg-gray-100');
            } else {
                modeButtons[mode].classList.remove('bg-blue-100', 'text-blue-700');
                modeButtons[mode].classList.add('text-gray-700', 'hover:bg-gray-100');
            }
        });

        // 输出日志，确认是否进入fetch部分
        // console.log(`开始请求会话历史，当前会话ID: ${id}`);

        // 发起API请求获取会话历史（无论是否是当前会话ID，始终请求）
        fetch(`${BASE_URL}/api/chat_byid?chat_id=${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer lg-evduwtdszwhdqzgqkwvdtmjgpmffipkwoogudnnqemjtvgcv',
            }
        })
            .then(response => response.json())
            .then(data => {
                // console.log('API响应数据:', data);

                const messagesHistory = data.messages.history || [];

                if (messagesHistory.length === 0) {
                    // console.log('没有历史消息，发送欢迎信息');
                    const welcomeMessage = getWelcomeMessage();
                    appendMessage('assistant', welcomeMessage);
                } else {
                    // 如果有历史消息，则显示
                    messagesHistory.forEach(msg => {
                        const messageId = msg.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                        appendMessage(msg.role, msg.content, messageId);
                        newmessages.push({
                            role: msg.role,
                            content: msg.content
                        });
                    });

                    // 如果返回数据有标题，则更新会话标题
                    if (data.messages.title) {
                        updateConversationTitle(id, data.messages.title);
                    }
                }
            })
            .catch(error => {
                console.error('获取会话历史失败:', error);
                appendMessage('assistant', '获取会话历史失败，请稍后再试。');
            });
    }

    // 保存消息到会话的辅助函数
    function saveMessageToConversation(conversationId, message) {
        const conversation = getConversationById(conversationId);
        if (!conversation.messages) {
            conversation.messages = [];
        }
        conversation.messages.push(message);
    }

    // 更新会话标题的辅助函数
    function updateConversationTitle(conversationId, title) {
        const conversation = getConversationById(conversationId);
        if (conversation) {
            conversation.title = title;
            // 更新UI中的标题显示
            const titleElement = document.querySelector(`[data-conversation-id="${conversationId}"] .conversation-title`);
            if (titleElement) {
                titleElement.textContent = title;
            }
        }
    }


    // 删除会话
    async function deleteConversation(id) {
        // 不能删除最新会话
        if (conversations[0].id === id) {
            alert('最新的会话不可删除');
            return;
        }

        // 检查最小会话数
        if (conversations.length === 1) {
            alert('至少需要保留一个对话');
            return;
        }

        try {
            // 调用删除API
            const response = await axios.delete(`${BASE_URL}/api/del_history_by_chatid`, {
                params: {
                    // 'user_id': '测试用户1',
                    'chat_id': id
                },
                headers: {
                    'Authorization': 'Bearer lg-evduwtdszwhdqzgqkwvdtmjgpmffipkwoogudnnqemjtvgcv'
                }
            });

            // 检查API响应
            if (response.data.success || response.status === 200) {
                console.log('成功删除会话:', id);

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
            } else {
                throw new Error('删除会话失败: ' + (response.data.message || '未知错误'));
            }
        } catch (error) {
            console.error('删除会话失败:', error);
            alert('删除会话失败: ' + (error.response?.data?.message || error.message || '未知错误'));

            // 即使API调用失败，也可以选择从本地删除
            // 取消下面的注释，如果你希望即使API失败也从本地删除
            /*
            const index = conversations.findIndex(c => c.id === id);
            if (index !== -1) {
                conversations.splice(index, 1);
                if (id === currentConversationId) {
                    currentConversationId = conversations[0].id;
                    switchConversation(currentConversationId);
                } else {
                    renderConversationList();
                }
            }
            */
        }
    }

    // 更新消息内容函数
    function updateMessageContent(messageId, content) {
        const messageDiv = chatContainer.querySelector(`[data-message-id="${messageId}"]`);
        if (messageDiv) {
            const markdownContent = messageDiv.querySelector('.markdown-content');
            // 更新Markdown内容
            renderMarkdown(markdownContent, content);
        }
    }

    // 添加消息到UI
    function appendMessage(role, content, messageId = null) {
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

        // 只有AI消息才有反馈按钮
        if (!isUser && role !== 'system') {
            messageContent += `
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
        `;
        }

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

    // 其他函数保持不变
    function appendTypingIndicator() {
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

    function removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    function renderMarkdown(element, content) {
        // 使用marked库渲染Markdown内容
        const rendered = marked.parse(content);
        // 使用DOMPurify清理HTML以防止XSS攻击
        element.innerHTML = DOMPurify.sanitize(rendered);
    }

    function handleFeedback(messageId, type) {
        if (type === 'like') {
            // 简单处理点赞
            alert('感谢您的反馈！');
        } else if (type === 'dislike') {
            // 显示反馈弹窗
            feedbackMessageId = messageId;
            feedbackForm.reset();
            feedbackModal.classList.remove('hidden');
        }
    }

    function submitFeedback() {
        // 获取选中的反馈类型
        const feedbackType = document.querySelector('input[name="feedback-type"]:checked')?.value;
        const feedbackDetail = document.getElementById('feedback-detail').value;
        if (!feedbackType) {
            alert('请选择反馈类型');
            return;
        }
        // 这里应该调用API提交反馈
        console.log('提交反馈:', {
            messageId: feedbackMessageId,
            type: feedbackType,
            detail: feedbackDetail
        });
        // 关闭弹窗
        alert('感谢您的反馈！我们会不断改进。');
        closeFeedbackModal();
    }

    function closeFeedbackModal() {
        feedbackModal.classList.add('hidden');
        feedbackMessageId = null;
    }

    function adjustTextareaHeight() {
        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(messageInput.scrollHeight, 200) + 'px';
    }

    function clearChatContainer() {
        while (chatContainer.firstChild) {
            chatContainer.removeChild(chatContainer.firstChild);
        }
    }

    function renderConversationList() {
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

    function getConversationById(id) {
        return conversations.find(c => c.id === id);
    }

    function getMessagesForAPI() {
        const conversation = getConversationById(currentConversationId);
        if (!conversation) return [];

        const systemMessage = {
            role: 'system',
            content: modeConfig[conversation.mode || 'dataresource'].systemMessage
        };

        return [systemMessage, ...conversation.messages];
    }

    function getWelcomeMessage() {
        const baseMessage = `👋 您好！我是您的医保智能助手，可以为您解答医保相关问题。\n\n您可以咨询以下内容：\n- 医保政策解读\n- 医疗费用报销流程\n- 医保卡使用问题\n- 定点医院和药店查询\n- 其他医保相关问题\n\n请问有什么可以帮助您的？`;
        const modeMessages = {
            'policy': `👋 您好！我是您的医保政策解读专家。\n\n我可以帮您解读以下政策内容：\n- 医保政策条款详解\n- 政策变更解读\n- 医保覆盖范围说明\n- 特殊医疗政策\n- 地方医保政策差异\n\n请问您需要了解哪方面的医保政策？`,
            'reimbursement': `👋 您好！我是您的医保报销顾问。\n\n我可以为您提供以下帮助：\n- 门诊/住院报销流程\n- 报销比例和限额计算\n- 特殊病种报销政策\n- 异地就医报销事项\n- 报销所需材料清单\n\n请问您有什么报销相关的问题？`
        };
        return modeMessages[currentMode] || baseMessage;
    }
});
{/* </script> */ }