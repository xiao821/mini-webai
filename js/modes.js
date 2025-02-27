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
    if (mode === currentMode) return;

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
    elements.currentModeTitle.textContent = modeConfig[mode].title;

    // 如果当前对话没有消息，就直接更新模式
    const currentConversation = getConversationById(getCurrentConversationId());
    if (currentConversation && currentConversation.messages.length === 0) {
        currentConversation.mode = mode;
        setWelcomeMessage(mode);
    } else {
        // 否则创建新对话
        await startNewConversation(mode);
    }
}

// 初始化模式按钮
export function initModeButtons() {
    elements.modeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const mode = button.id;
            switchMode(mode);
            setWelcomeMessage(mode);
        });
    });
} 