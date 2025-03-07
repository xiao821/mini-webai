import { fetchKnowledgeCategory } from './api.js';
import { modeConfig } from './config.js';
import { getCurrentMode } from './modes.js';

let selectedCategory = null;
const categoryTreeElement = document.getElementById('knowledge-category-tree');
const selectedCategoryElement = document.getElementById('selected-category');

// 初始化知识分类树
export async function initKnowledgeCategory() {
    try {
        // 显示加载状态
        categoryTreeElement.innerHTML = '<div class="text-sm text-gray-500 animate-pulse">加载中...</div>';
        
        // 获取知识分类数据
        const data = await fetchKnowledgeCategory();
        
        if (data && data.knowledge_list && data.knowledge_list.length > 0) {
            const treeJson = JSON.parse(data.knowledge_list[0].tree_json);
            renderCategoryTree(treeJson);
            
            // 检查当前模式是否有选中的分类
            const currentMode = getCurrentMode();
            if (modeConfig[currentMode] && modeConfig[currentMode].kb_category) {
                // 检查选中的分类是否为子分类
                const categoryName = modeConfig[currentMode].kb_category;
                let isSubcategory = false;
                
                // 遍历所有分类，检查是否为子分类
                treeJson.forEach(category => {
                    if (category.children && category.children.length > 0) {
                        category.children.forEach(subcategory => {
                            if (subcategory.name === categoryName) {
                                isSubcategory = true;
                            }
                        });
                    }
                });
                
                // 只有是子分类时才设置为选中状态
                if (isSubcategory) {
                    selectCategory(categoryName);
                } else {
                    // 如果不是子分类，清除选中状态
                    selectedCategory = null;
                    selectedCategoryElement.textContent = '无';
                    modeConfig[currentMode].kb_category = '';
                }
            }
        } else {
            categoryTreeElement.innerHTML = '<div class="text-sm text-gray-500">暂无分类数据</div>';
        }
    } catch (error) {
        console.error('初始化知识分类失败:', error);
        categoryTreeElement.innerHTML = '<div class="text-sm text-red-500">加载失败，请刷新重试</div>';
    }
}

// 渲染知识分类树
function renderCategoryTree(treeData) {
    // 清空现有内容
    categoryTreeElement.innerHTML = '';
    
    // 遍历顶级分类
    treeData.forEach(category => {
        const categoryElement = document.createElement('div');
        categoryElement.className = 'category-item';
        
        // 创建分类标题
        const hasChildren = category.children && category.children.length > 0;
        
        if (hasChildren) {
            categoryElement.innerHTML = `
                <div class="flex items-center">
                    <span class="category-toggle">▶</span>
                    <span>${category.name}</span>
                </div>
            `;
        } else {
            categoryElement.innerHTML = `
                <div class="flex items-center">
                    <span class="ml-5">${category.name}</span>
                </div>
            `;
        }
        
        // 添加点击事件
        categoryElement.addEventListener('click', (e) => {
            // 阻止事件冒泡
            e.stopPropagation();
            
            // 只处理展开/折叠状态，不选中主分类
            if (hasChildren) {
                const toggle = categoryElement.querySelector('.category-toggle');
                toggle.classList.toggle('expanded');
                
                const subcategoryContainer = categoryElement.nextElementSibling;
                if (subcategoryContainer && subcategoryContainer.classList.contains('subcategory-container')) {
                    subcategoryContainer.style.display = toggle.classList.contains('expanded') ? 'block' : 'none';
                }
            }
        });
        
        categoryTreeElement.appendChild(categoryElement);
        
        // 如果有子分类，创建子分类容器
        if (hasChildren) {
            const subcategoryContainer = document.createElement('div');
            subcategoryContainer.className = 'subcategory-container';
            
            // 默认展开子分类
            const toggle = categoryElement.querySelector('.category-toggle');
            if (toggle) {
                toggle.classList.add('expanded');
            }
            
            // 渲染子分类
            category.children.forEach(subcategory => {
                const subcategoryElement = document.createElement('div');
                subcategoryElement.className = 'subcategory-item';
                subcategoryElement.textContent = subcategory.name;
                
                // 添加点击事件
                subcategoryElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectCategory(subcategory.name);
                });
                
                subcategoryContainer.appendChild(subcategoryElement);
            });
            
            categoryTreeElement.appendChild(subcategoryContainer);
        }
    });
}

// 选中分类
function selectCategory(categoryName) {
    // 移除所有已选中的样式
    document.querySelectorAll('.subcategory-item.active').forEach(el => {
        el.classList.remove('active');
    });
    
    // 只查找并添加子分类的选中样式
    const subcategoryElements = document.querySelectorAll('.subcategory-item');
    
    let found = false;
    
    // 检查子分类
    subcategoryElements.forEach(el => {
        if (el.textContent === categoryName) {
            el.classList.add('active');
            found = true;
        }
    });
    
    // 只有找到子分类时才更新选中状态
    if (found) {
        // 更新选中的分类
        selectedCategory = categoryName;
        selectedCategoryElement.textContent = categoryName;
        
        // 更新模式配置中的kb_category
        updateKbCategory(categoryName);
    }
}

// 更新kb_category
function updateKbCategory(categoryName) {
    // 获取当前模式
    const currentMode = getCurrentMode();
    
    // 更新kb_category
    if (modeConfig[currentMode]) {
        modeConfig[currentMode].kb_category = categoryName;
        console.log(`已更新知识分类: ${categoryName}`);
    }
}

// 获取当前选中的分类
export function getSelectedCategory() {
    return selectedCategory;
} 