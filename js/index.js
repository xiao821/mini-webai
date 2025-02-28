import { elements, initializeElements, adjustTextareaHeight, setWelcomeMessage } from './ui.js';
import { sendMessage } from './messaging.js';
import { initializeConversations, startNewConversation, switchConversation, getCurrentConversationId, setRandomIdInCookie } from './conversations.js';
import { getCurrentMode, initModeButtons, renderModeButtons } from './modes.js';
import { submitFeedback, closeFeedbackModal } from './feedback.js';
import { modeConfig } from './config.js';

// 全局状态
let isWaitingForResponse = false;

// 当DOM加载完成后
document.addEventListener('DOMContentLoaded', function () {
    // 初始化DOM元素引用
    initializeElements(elements);

    // 初始化应用
    initializeApp();

    // 获取userid，存入cookie中
    setRandomIdInCookie()

    renderModeButtons();
    // 添加事件监听
    setupEventListeners();



    // 初始加载默认模式欢迎信息
    // setWelcomeMessage('default');
});

// 初始化应用
async function initializeApp() {
    try {
        // 初始化会话列表
        const currentId = await initializeConversations();

        // 调整文本框高度
        adjustTextareaHeight();

        // 切换到当前会话
        if (currentId) {
            switchConversation(currentId);
        } else {
            console.log('没有会话可用');
        }
    } catch (error) {
        console.error('初始化应用失败:', error);
        alert('初始化应用失败，请刷新页面重试');
    }
}

// 设置事件监听器
function setupEventListeners() {

    // 消息输入事件
    elements.messageInput.addEventListener('input', function () {
        adjustTextareaHeight();
        elements.sendButton.disabled = !elements.messageInput.value.trim();
    });

    // 表单提交事件
    elements.chatForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const message = elements.messageInput.value.trim();
        if (message && !isWaitingForResponse) {
            isWaitingForResponse = false;
            // console.log('Sending message:', message);
            const ifsuccess = await sendMessage(message, getCurrentConversationId(), getCurrentMode(), isWaitingForResponse);
            isWaitingForResponse = !ifsuccess;
            // console.log('Message sent:', success);
        }
    });

    // 新对话按钮
    elements.newChatButton.addEventListener('click', async function () {
        await startNewConversation(getCurrentMode());
    });

    // 取消反馈
    elements.cancelFeedback.addEventListener('click', function () {
        closeFeedbackModal();
    });

    // 反馈表单提交
    elements.feedbackForm.addEventListener('submit', function (e) {
        e.preventDefault();
        submitFeedback();
    });

    // 右上角的问号按钮
    elements.questionButton.addEventListener('click', function () {
        // 使用 SweetAlert2 显示暂未开发，敬请期待
        Swal.fire({
            icon: 'info',
            title: '暂未开发',
            text: '敬请期待',
            showConfirmButton: false,
            timer: 1000
        });
    });

    // 右上角的设置按钮
    elements.settingButton.addEventListener('click', function () {
        // 使用 SweetAlert2 显示暂未开发，敬请期待
        Swal.fire({
            icon: 'info',
            title: '暂未开发',
            text: '敬请期待',
            showConfirmButton: false,
            timer: 1000,
        });
    });

    // 文件上传按钮
    elements.uploadButton.addEventListener('click', function () {
        // 使用 SweetAlert2 显示暂未开发，敬请期待
        Swal.fire({
            icon: 'info',
            title: '暂未开发',
            text: '敬请期待',
            showConfirmButton: false,
            timer: 1000
        });
    });
    // 初始化模式按钮
    initModeButtons();

}

