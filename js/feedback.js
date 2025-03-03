import { elements } from './ui.js';
import { getCurrentConversationId, getConversationById } from './conversations.js';
import { dislikefeedback } from './api.js';

let feedbackMessageId = null;
let currentConversation = null;
let messageContent = null;

// 处理反馈点击
export async function handleFeedback(messageId, type) {
    const current_id = getCurrentConversationId();
    // 获取当前会话
    currentConversation = await getConversationById(current_id);
    
    // 从会话历史中获取消息内容
    messageContent = currentConversation.messages.find(msg => msg.id === messageId)?.content;
    
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
        // 等待 API 调用完成
        await dislikefeedback(
            feedbackMessageId, 
            currentConversation.messages, 
            messageContent, 
            feedbackType, 
            feedbackDetail
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