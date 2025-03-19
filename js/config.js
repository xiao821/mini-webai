import { getRandomIdFromCookie } from './conversations.js'

// 基础配置
// export const API_BASE_URL = 'http://172.16.99.32:1032/api/docs#/Feedback/feed_back_endpoint_api_feedback_post';
// export const API_BASE_URL = 'http://172.16.99.32:1034';
export const API_BASE_URL = 'https://lgdev.baicc.cc/';
export const BASE_URL_VOICE = 'https://nlp-demo.szmckj.cn/';
export const API_AUTH_TOKEN = 'Bearer lg-evduwtdszwhdqzgqkwvdtmjgpmffipkwoogudnnqemjtvgcv';
export const USER_ID = getRandomIdFromCookie();
// export const USER_ID = 'medical_insurance_user';
export const R1_MODEL = 'deepseek-32b-r1'
export const QW_MODEL = 'qwen2.5-72b'

// 模式配置
export const modeConfig = {
    'default': {
        icon: '📚',
        title: '市监局知识库',
        welcomeMessage: '👋 您好！我是您的**市监局知识库助手**，可以为您解答您想要问的问题。\n\n您可以咨询以下内容：\n\n- 市场监督管理政策法规\n- 企业注册、变更及注销流程\n- 食品安全、产品质量监督\n- 消费者权益保护及投诉举报\n- 其他市场监管相关问题',
        department: '龙岗政数局',
        kb_category: ''
    },
    'borrowing': {
        icon: '📖',
        title: '医保知识库',
        welcomeMessage: '👋 您好！我是您的**医保助手**，可以为您解答您想要问的问题。\n\n您可以咨询以下内容：\n\n- 医保政策解读\n- 医疗费用报销流程\n- 医保卡使用问题\n- 定点医院和药店查询\n- 其他医保相关问题',
        department: '市医保中心',
        kb_category: ''
    },
};

