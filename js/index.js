import { elements, initializeElements, adjustTextareaHeight, setWelcomeMessage } from './ui.js';
import { sendMessage } from './messaging.js';
import { initializeConversations, startNewConversation, switchConversation, getCurrentConversationId, setRandomIdInCookie } from './conversations.js';
import { getCurrentMode, initModeButtons, renderModeButtons, setCurrentMode } from './modes.js';
import { submitFeedback, closeFeedbackModal } from './feedback.js';
import { modeConfig, QW_MODEL, R1_MODEL } from './config.js';
import { record_voice } from './api.js';

// 全局状态
let isWaitingForResponse = false;
let mediaRecorder;
let audioChunks = [];
let isRecording = false;

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

let currentModel = R1_MODEL
// 切换模型
const toggle = document.getElementById('model-toggle');
toggle.addEventListener('change', function () {
    if (this.checked) {
        currentModel = R1_MODEL; // R1_MODEL
        console.log('选择的模型是: R1_MODEL');
    } else {
        currentModel = QW_MODEL; // QW_MODEL
        console.log('选择的模型是: QW_MODEL');
    }
});
export { currentModel }


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
    console.log('设置事件监听器');

    // 当按下回车键且没有按shift时，发送消息
    elements.messageInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            elements.chatForm.dispatchEvent(new Event('submit', { cancelable: true }));
        }
    });

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

    // 获取用户麦克风权限并开始录音
    elements.recordButton.addEventListener('click', async () => {
        const button = document.getElementById('record-button');
        const micOff = document.getElementById('mic-off');
        const micOn = document.getElementById('mic-on');

        if (!isRecording) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.ondataavailable = (event) => {
                    audioChunks.push(event.data);
                };
                mediaRecorder.onstop = async () => {
                    if (audioChunks.length > 0) { // 确保有录音数据
                        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                        await record_voice(audioBlob);
                        audioChunks = []; // 清空录音数据
                    } else {
                        console.error("没有录音数据");
                    }
                };
                mediaRecorder.start();

                micOff.style.display = "none"; // 隐藏未录音图标
                micOn.style.display = "block"; // 显示录音图标
                isRecording = true;
            } catch (error) {
                console.error("无法访问麦克风:", error);
                // document.getElementById('result').innerText = "";
                alert("无法访问麦克风，请检查权限。");
            }
        } else {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
                isRecording = false;
                micOff.style.display = "block"; // 显示未录音图标
                micOn.style.display = "none"; // 隐藏录音图标
                // button.innerText = "录";
            }
        }
    });

    // 初始化模式按钮
    initModeButtons();

}

