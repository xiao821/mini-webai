import { elements } from './ui.js';

let feedbackMessageId = null;

// 处理反馈点击
export function handleFeedback(messageId, type) {
    if (type === 'like') {
        // 简单处理点赞
        alert('感谢您的反馈！');
    } else if (type === 'dislike') {
        // 显示反馈弹窗
        feedbackMessageId = messageId;
        elements.feedbackForm.reset();
        elements.feedbackModal.classList.remove('hidden');
    }
}

// 提交反馈
export function submitFeedback() {
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

// 关闭反馈弹窗
export function closeFeedbackModal() {
    elements.feedbackModal.classList.add('hidden');
    feedbackMessageId = null;
} 