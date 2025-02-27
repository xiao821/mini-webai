import { elements, setWelcomeMessage } from './ui.js';
import { modeConfig } from './config.js';
import { startNewConversation, getConversationById, getCurrentConversationId } from './conversations.js';

// 当前选中的模式
let currentMode = 'dataresource';

// 获取当前模式
export function getCurrentMode() {
    return currentMode;
}

// 设置当前模式
export function setCurrentMode(mode) {
    currentMode = mode;
}

// 切换模式
export async function switchMode(mode) {
    if (modeConfig[mode]) {
        // 更新当前模式标题
        document.getElementById('current-mode-title').textContent = modeConfig[mode].title;
    // 设置欢迎信息
    setWelcomeMessage(mode);
    // 更新UI
    elements.modeButtons.forEach(m => {
        if (m.id === mode) {
            m.classList.add('bg-blue-100', 'text-blue-700');
            m.classList.remove('text-gray-700', 'hover:bg-gray-100');
        } else {
            m.classList.remove('bg-blue-100', 'text-blue-700');
            m.classList.add('text-gray-700', 'hover:bg-gray-100');
        }
    });

    // 更新当前模式和标题
    currentMode = mode;


    // 如果当前对话没有消息，就直接更新模式
    const currentConversation = getConversationById(getCurrentConversationId());
    if (currentConversation && currentConversation.messages.length === 0) {
        currentConversation.mode = mode;
        setWelcomeMessage(mode);
    } else {
        // 否则创建新对话
        await startNewConversation(mode);
    }
 } else {
    console.error(`Mode ${mode} not found in configuration.`);
}
}

// 初始化模式按钮
export function initModeButtons() {
    const modeButtons = document.querySelectorAll('.mode-button');
    modeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const mode = button.id;
            switchMode(mode);
        });
    });
}

// 动态生成模式按钮
export function renderModeButtons() {
    const container = document.querySelector('.mode-buttons-container');
    container.innerHTML = ''; // 清空现有内容

    Object.keys(modeConfig).forEach(mode => {
        const button = document.createElement('button');
        button.id = mode;
        button.className = 'mode-button text-left px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 font-medium text-sm flex items-center';
        button.innerHTML = `
            ${modeConfig[mode].icon} ${modeConfig[mode].title}
        `;
        container.appendChild(button);
    });
}