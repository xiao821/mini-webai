import { elements, setWelcomeMessage, clearChatContainer } from './ui.js';
import { modeConfig } from './config.js';
import { startNewConversation, getConversationById, getCurrentConversationId } from './conversations.js';
import { appendMessage } from './messaging.js';
import { initKnowledgeCategory, clearSelectedCategory } from './knowledge_category.js';

// 当前选中的模式
let currentMode = 'default';

// 获取当前模式
export function getCurrentMode() {
    return currentMode;
}

// 设置当前模式
export function setCurrentMode(mode) {
    currentMode = mode;
}

// 切换模式
export async function switchMode(mode, shouldCreateNewConversation = true) {
    if (modeConfig[mode]) {
        clearChatContainer();
        // 更新当前模式标题
        document.getElementById('current-mode-title').textContent = modeConfig[mode].title;
        
        // 清除当前选中的知识分类
        clearSelectedCategory();
        
        // 更新当前模式
        currentMode = mode;
        
        // 重新初始化知识分类树，以便根据新模式加载相应的分类
        await initKnowledgeCategory();
        
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

        // 如果当前对话没有消息，就直接更新模式
        const currentConversation = getConversationById(getCurrentConversationId());
        if (currentConversation && currentConversation.messages.length === 0) {
            const welcomeMessage = modeConfig[mode].welcomeMessage;
            // 显示欢迎消息
            appendMessage('assistant', welcomeMessage, 'first-message');
        } else if (shouldCreateNewConversation) {
            console.log('create new conversation');
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
export async function renderModeButtons() {
    const container = document.querySelector('.mode-buttons-container');
    container.innerHTML = ''; // 清空现有内容

    let isFirst = true;
    Object.keys(modeConfig).forEach(mode => {
        const button = document.createElement('button');
        button.id = mode;
        button.classList.add('mode-button', 'text-left', 'px-3', 'py-2', 'rounded-lg', 'font-medium', 'text-sm', 'flex', 'items-center', 'w-full', 'transition-colors', 'duration-200');
        
        // 为第一个按钮添加选中样式
        if (isFirst) {
            button.classList.add('bg-blue-100', 'text-blue-700');
            currentMode = mode; // 设置当前模式为第一个模式
            isFirst = false;
        } else {
            button.classList.add('text-gray-700', 'hover:bg-gray-100');
        }
        
        button.innerHTML = `
            ${modeConfig[mode].icon} <span class="ml-2">${modeConfig[mode].title}</span>
        `;

        // 添加点击事件
        button.addEventListener('click', () => {
            // 移除所有按钮的选中样式
            document.querySelectorAll('.mode-button').forEach(btn => {
                btn.classList.remove('bg-blue-100', 'text-blue-700');
                btn.classList.add('text-gray-700', 'hover:bg-gray-100');
            });
            
            // 添加当前按钮的选中样式
            button.classList.remove('text-gray-700', 'hover:bg-gray-100');
            button.classList.add('bg-blue-100', 'text-blue-700');
            
            // 切换模式
            switchMode(mode, false);
        });
        
        container.appendChild(button);
    });
    
    // 默认选中第一个模式
    if (container.firstChild) {
        // 更新标题
        document.getElementById('current-mode-title').textContent = modeConfig[currentMode].title;
    }
}