import { getRandomIdFromCookie } from './conversations.js'

// 基础配置
export const API_BASE_URL = 'https://lgdev.baicc.cc/';
export const API_AUTH_TOKEN = 'Bearer lg-evduwtdszwhdqzgqkwvdtmjgpmffipkwoogudnnqemjtvgcv';
export const USER_ID = getRandomIdFromCookie();
// export const USER_ID = 'medical_insurance_user';

// 模式配置
export const modeConfig = {
    'crawl_data': {
        icon: '🔍',
        title: '爬虫资源',
        welcomeMessage: '👋 欢迎使用爬虫资源模式！我可以帮助您查询和分析现在数据库中的各种爬虫资源。'
    },
    'default': {
        icon: '🏥',
        title: '医保咨询',
        welcomeMessage: '👋 您好！我是您的**医疗智能助手**，可以为您解答您想要问的问题。\n\n您可以咨询以下内容：\n\n- 医保政策解读\n- 医疗费用报销流程\n- 医保卡使用问题\n- 定点医院和药店查询\n- 其他医保相关问题',
        department: '医疗',
        kb_category: ''
    }
};

