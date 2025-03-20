import { getRandomIdFromCookie } from './conversations.js'
import { fetchDepartmentCategory } from './api.js'

// 基础配置
// export const API_BASE_URL = 'http://172.16.99.32:1032/api/docs#/Feedback/feed_back_endpoint_api_feedback_post';
// export const API_BASE_URL = 'http://172.16.99.32:1035';
export const API_BASE_URL = 'https://lgdev.baicc.cc/';
// export const API_BASE_URL = '/nlprag/';
export const BASE_URL_VOICE = 'http://172.16.99.32:1034';
export const API_AUTH_TOKEN = 'Bearer lg-evduwtdszwhdqzgqkwvdtmjgpmffipkwoogudnnqemjtvgcv';
export const USER_ID = getRandomIdFromCookie();
// export const USER_ID = 'medical_insurance_user';
export const R1_MODEL = 'deepseek-32b-r1'
export const QW_MODEL = 'qwen2.5-72b'

// 获取部门分类数据
export const departmentCategory = fetchDepartmentCategory();

// 基础配置对象
const baseConfig = {
    'default': {
        icon: '📚',
        title: '市监局知识库',
        welcomeMessage: '👋 您好！我是您的**市监局知识库助手**，可以为您解答您想要问的问题。\n\n您可以咨询以下内容：\n\n- 市场监督管理政策法规\n- 企业注册、变更及注销流程\n- 食品安全、产品质量监督\n- 消费者权益保护及投诉举报\n- 其他市场监管相关问题',
        department: '市监知识库',
        kb_category: ''
    },
    'borrowing': {
        icon: '📖',
        title: '市医保中心知识库',
        welcomeMessage: '👋 您好！我是您的**医保助手**，可以为您解答您想要问的问题。\n\n您可以咨询以下内容：\n\n- 医保政策解读\n- 医疗费用报销流程\n- 医保卡使用问题\n- 定点医院和药店查询\n- 其他医保相关问题',
        department: '市医保中心',
        kb_category: ''
    },
    'zhengwu': {
        icon: '📖',
        title: '政务中心业务知识库',
        welcomeMessage: '👋 您好！我是您的**政务中心业务助手**，可以为您解答您想要问的问题。\n\n您可以咨询以下内容：\n\n- 政务服务事项 ：办事流程、材料准备、窗口指引\n- 户籍与身份证 ：办理条件、手续及注意事项\n- 其他政务相关问题 ：只要您有疑问，都可以随时向我提问！',
        department: '政务中心业务',
        kb_category: ''
    },
};

// 动态更新modeConfig中的department属性
export const modeConfig = { ...baseConfig };

// 根据API获取的部门数据更新modeConfig
departmentCategory.then(response => {
    if (response && response.data && response.data.departments) {
        const departments = response.data.departments;
        // 遍历部门数据
        departments.forEach(dept => {
            // 更新default模式
            if (dept.department_name === '市监知识库' && modeConfig['default']) {
                modeConfig['default'].department = dept.department_name;
            }
            // 更新borrowing模式
            if (dept.department_name === '市医保中心' && modeConfig['borrowing']) {
                modeConfig['borrowing'].department = dept.department_name;
            }
            // 更新borrowing模式
            if (dept.department_name === '政务中心业务' && modeConfig['zhengwu']) {
                modeConfig['zhengwu'].department = dept.department_name;
            }
        });
    }
}).catch(error => {
    console.error('更新部门数据失败:', error);
});

