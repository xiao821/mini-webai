import { elements } from './ui.js';
import { getCurrentConversationId, getConversationById } from './conversations.js';
import { dislikefeedback } from './api.js';
import { modeConfig } from './config.js';
import { getCurrentMode } from './modes.js';
import { currentModel } from './index.js';

let feedbackMessageId = null;
let currentConversation = null;
let messageContent = null;
let kb_reference = null;
let re_kb_reference = null;

// 处理反馈点击
export async function handleFeedback(messageId, type) {
    const current_id = getCurrentConversationId();
    // 获取当前会话
    currentConversation = await getConversationById(current_id);
    
    // 从会话历史中获取消息内容
    messageContent = currentConversation.messages.find(msg => msg.id === messageId)?.content;
    let kb_reference = currentConversation.messages.find(msg => msg.id === messageId)?.knowledge_data;
    console.log('字符串 kb_reference', kb_reference, currentConversation);
    
    // 检查 kb_reference 是否是字符串，并尝试解析为数组
    if (typeof kb_reference === 'string') {
      try {
        re_kb_reference = JSON.parse(kb_reference); // 将字符串解析为数组
        console.log('re_kb_reference', re_kb_reference);    
      } catch (error) {
        console.error('Failed to parse kb_reference:', error);
        // re_kb_reference = null; // 解析失败时设置为null
      }
    } else {
      re_kb_reference = kb_reference; // 如果不是字符串，直接使用
    }
    
    if (type === 'like') {
        // 简单处理点赞
        Swal.fire({
            icon: 'success',
            title: '点赞成功',
            text: '感谢您的反馈',
            showConfirmButton: false,
            timer: 1500
        });
    } else if (type === 'dislike') {
        console.log('点踩 re_kb_reference', messageId, re_kb_reference);    

        // 显示反馈弹窗
        feedbackMessageId = messageId;
        elements.feedbackForm.reset();
        
        // 在反馈弹窗中显示被点击的消息内容
        const messagePreviewElement = document.getElementById('message-preview');
        if (messagePreviewElement && messageContent) {
            messagePreviewElement.textContent = messageContent;
            messagePreviewElement.classList.remove('hidden');
        }
        
        elements.feedbackModal.classList.remove('hidden');
    }
}

// 提交反馈
export async function submitFeedback() {
    // 获取选中的反馈类型
    const feedbackType = document.querySelector('input[name="feedback-type"]:checked')?.value;
    const feedbackDetail = document.getElementById('feedback-detail').value;

    if (!feedbackType) {
        alert('请选择反馈类型');
        return;
    }

    try {
        // 处理消息历史，只保留content和role字段
        const simplifiedMessages = currentConversation.messages.map(msg => ({
            content: msg.content,
            role: msg.role
        }));

        // 获取当前模式和对应的 kb_category
        const currentMode = getCurrentMode();
        const kb_category = modeConfig[currentMode]?.kb_category || '';
        // 获取当前模式的department
        const department = modeConfig[currentMode]?.department || '市监知识库';
        console.log('接口调用前的re_kb_reference', re_kb_reference);
        // 等待 API 调用完成
        await dislikefeedback(
            re_kb_reference, 
            simplifiedMessages, 
            messageContent, 
            feedbackType, 
            feedbackDetail,
            kb_category,
            currentModel,
            department
        );

        // API 调用成功后显示成功提示
        Swal.fire({
            icon: 'success',
            title: '感谢您的反馈',
            text: '我们会不断改进',
            showConfirmButton: false,
            timer: 1000
        });
        
        closeFeedbackModal();
    } catch (error) {
        console.error('提交反馈失败:', error);
        Swal.fire({
            icon: 'error',
            title: '提交失败',
            text: '抱歉，提交反馈时出现错误，请稍后重试',
            confirmButtonText: '确定'
        });
    }
}

// 关闭反馈弹窗
export function closeFeedbackModal() {
    elements.feedbackModal.classList.add('hidden');
    feedbackMessageId = null;
} 