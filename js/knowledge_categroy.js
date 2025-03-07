import { fetchKnowledgeCategory } from './api.js';

// 获取知识分类
export async function getKnowledgeCategory() {
    const response = await fetchKnowledgeCategory();
    return response.data;
}
