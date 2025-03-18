import { fetchLgzsjKnowledgeList } from './api.js';
import { modeConfig } from './config.js';
import { getCurrentMode } from './modes.js';

let selectedCategory = null;
const categoryTreeElement = document.getElementById('knowledge-category-tree');
const selectedCategoryElement = document.getElementById('selected-category');
const selectedCategoryTextElement = document.getElementById('selected-category-text');
const clearCategoryButton = document.getElementById('clear-category');
const clearCategoryTopButton = document.getElementById('clear-category-top');
const breadcrumbSeparator = document.getElementById('breadcrumb-separator');
const selectedCategoryBreadcrumb = document.getElementById('selected-category-breadcrumb');

// 初始化知识分类树
export async function initKnowledgeCategory() {
    try {
        // 获取当前模式
        const currentMode = getCurrentMode();
        const department = modeConfig[currentMode]?.department || "龙岗政数局";
        
        // 显示加载状态
        categoryTreeElement.innerHTML = `<div class="text-sm text-gray-500 animate-pulse">正在加载${department}知识库分类...</div>`;
        
        // 初始状态下隐藏叉号按钮和面包屑分隔符
        clearCategoryButton.style.display = 'none';
        clearCategoryTopButton.style.display = 'none';
        breadcrumbSeparator.style.display = 'none';
        selectedCategoryBreadcrumb.style.display = 'none';
        
        // 获取知识分类数据，传入当前模式
        const data = await fetchLgzsjKnowledgeList(currentMode);
        console.log(`${currentMode}知识库列表`, data);
        
        if (data && Array.isArray(data) && data.length > 0) {
            // 对数据进行排序
            const sortedData = sortCategoryData(data);
            renderCategoryTree(sortedData);
            
            // 检查当前模式是否有选中的分类
            if (modeConfig[currentMode] && modeConfig[currentMode].kb_category) {
                // 检查选中的分类是否为子分类
                const categoryName = modeConfig[currentMode].kb_category;
                let isSubcategory = false;
                
                // 遍历所有分类，检查是否为子分类
                sortedData.forEach(item => {
                    const mainCategory = Object.keys(item)[0];
                    const categories = item[mainCategory];
                    
                    categories.forEach(category => {
                        if (category.category3 && Array.isArray(category.category3)) {
                            category.category3.forEach(subcat => {
                                if (subcat === categoryName) {
                                    isSubcategory = true;
                                }
                            });
                        }
                    });
                });
                
                // 只有是子分类时才设置为选中状态
                if (isSubcategory) {
                    selectCategory(categoryName);
                } else {
                    // 如果不是子分类，清除选中状态
                    selectedCategory = null;
                    selectedCategoryElement.textContent = '无';
                    selectedCategoryTextElement.textContent = '';
                    modeConfig[currentMode].kb_category = '';
                    
                    // 隐藏叉号按钮和面包屑分隔符
                    clearCategoryButton.style.display = 'none';
                    clearCategoryTopButton.style.display = 'none';
                    breadcrumbSeparator.style.display = 'none';
                    selectedCategoryBreadcrumb.style.display = 'none';
                }
            } else {
                // 如果没有选中分类，隐藏叉号按钮和面包屑分隔符
                clearCategoryButton.style.display = 'none';
                clearCategoryTopButton.style.display = 'none';
                breadcrumbSeparator.style.display = 'none';
                selectedCategoryBreadcrumb.style.display = 'none';
            }
        } else {
            categoryTreeElement.innerHTML = '<div class="text-sm text-gray-500">暂无分类数据</div>';
        }
    } catch (error) {
        console.error('初始化知识分类失败:', error);
        categoryTreeElement.innerHTML = '<div class="text-sm text-red-500">加载失败，请刷新重试</div>';
    }
    
    // 添加清除分类按钮点击事件
    clearCategoryButton.addEventListener('click', clearSelectedCategory);
    clearCategoryTopButton.addEventListener('click', clearSelectedCategory);
}

// 清除选中的分类
function clearSelectedCategory(e) {
    e.stopPropagation();
    
    // 移除所有已选中的样式
    document.querySelectorAll('.subcategory-item.active').forEach(el => {
        el.classList.remove('active');
    });
    
    // 清空选中状态
    selectedCategory = null;
    
    // 更新UI
    selectedCategoryElement.textContent = '无';
    selectedCategoryTextElement.textContent = '';
    
    // 隐藏叉号按钮和面包屑分隔符
    clearCategoryButton.style.display = 'none';
    clearCategoryTopButton.style.display = 'none';
    breadcrumbSeparator.style.display = 'none';
    selectedCategoryBreadcrumb.style.display = 'none';
    
    // 更新模式配置中的kb_category为空
    updateKbCategory('');
}

// 排序分类数据
function sortCategoryData(data) {
    // 深拷贝数据，避免修改原始数据
    const clonedData = JSON.parse(JSON.stringify(data));
    
    // 汉字数字映射表
    const chineseNumMap = {
        '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
        '六': 6, '七': 7, '八': 8, '九': 9, '十': 10
    };
    
    // 提取汉字数字的函数
    function extractChineseNum(str) {
        if (!str) return 999; // 对于空字符串，给一个较大的值
        
        // 尝试从字符串中提取"一、"、"二、"等格式
        const match = str.match(/^([一二三四五六七八九十]+)、/);
        if (match && match[1] && chineseNumMap[match[1]]) {
            return chineseNumMap[match[1]];
        }
        
        return 999; // 如果没有匹配到，给一个较大的值
    }
    
    // 对每个主分类下的二级分类进行排序
    clonedData.forEach(item => {
        const mainCategory = Object.keys(item)[0];
        if (item[mainCategory] && Array.isArray(item[mainCategory])) {
            // 对二级分类进行排序
            item[mainCategory].sort((a, b) => {
                const numA = extractChineseNum(a.category2);
                const numB = extractChineseNum(b.category2);
                return numA - numB;
            });
            
            // 对每个二级分类下的三级分类进行排序
            item[mainCategory].forEach(category => {
                if (category.category3 && Array.isArray(category.category3)) {
                    // 过滤掉空字符串
                    category.category3 = category.category3.filter(subcat => subcat);
                    
                    // 对三级分类进行排序（如果有数字前缀如"1.1"）
                    category.category3.sort((a, b) => {
                        // 尝试提取数字前缀
                        const numA = a.match(/^(\d+\.\d+)/);
                        const numB = b.match(/^(\d+\.\d+)/);
                        
                        if (numA && numB) {
                            return parseFloat(numA[1]) - parseFloat(numB[1]);
                        } else if (numA) {
                            return -1; // 有数字的排前面
                        } else if (numB) {
                            return 1;
                        }
                        
                        // 如果都没有数字前缀，按字母顺序排序
                        return a.localeCompare(b, 'zh-CN');
                    });
                }
            });
        }
    });
    
    return clonedData;
}

// 渲染知识分类树
function renderCategoryTree(treeData) {
    // 清空现有内容
    categoryTreeElement.innerHTML = '';
    
    // 遍历数据
    treeData.forEach(item => {
        // 获取主分类名称（如"龙岗政数局"）
        const mainCategory = Object.keys(item)[0];
        const categories = item[mainCategory];
        
        // 直接遍历二级分类，跳过主分类的显示
        categories.forEach(category => {
            const categoryElement = document.createElement('div');
            categoryElement.className = 'category-item';
            
            // 创建分类标题
            const hasChildren = category.category3 && category.category3.length > 0;
            
            if (hasChildren) {
                categoryElement.innerHTML = `
                    <div class="flex items-center">
                        <span class="category-toggle">▶</span>
                        <span>${category.category2}</span>
                    </div>
                `;
            } else {
                categoryElement.innerHTML = `
                    <div class="flex items-center">
                        <span class="ml-5">${category.category2}</span>
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
                
                // 默认隐藏子分类
                subcategoryContainer.style.display = 'none';
                
                // 渲染子分类
                category.category3.forEach(subcategory => {
                    // 跳过空字符串
                    if (!subcategory) return;
                    
                    const subcategoryElement = document.createElement('div');
                    subcategoryElement.className = 'subcategory-item';
                    subcategoryElement.textContent = subcategory;
                    
                    // 添加点击事件
                    subcategoryElement.addEventListener('click', (e) => {
                        e.stopPropagation();
                        selectCategory(subcategory);
                    });
                    
                    subcategoryContainer.appendChild(subcategoryElement);
                });
                
                categoryTreeElement.appendChild(subcategoryContainer);
            }
        });
    });
}

// 选中分类
function selectCategory(categoryName) {
    // 移除所有已选中的样式
    document.querySelectorAll('.subcategory-item.active').forEach(el => {
        el.classList.remove('active');
    });
    
    // 如果点击的是当前已选中的分类，则取消选中
    if (selectedCategory === categoryName) {
        selectedCategory = null;
        selectedCategoryElement.textContent = '无';
        selectedCategoryTextElement.textContent = '';
        
        // 隐藏叉号按钮和面包屑分隔符
        clearCategoryButton.style.display = 'none';
        clearCategoryTopButton.style.display = 'none';
        breadcrumbSeparator.style.display = 'none';
        selectedCategoryBreadcrumb.style.display = 'none';
        
        // 更新模式配置中的kb_category为空
        updateKbCategory('');
        return;
    }
    
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
        
        // 更新UI显示
        selectedCategoryElement.textContent = categoryName;
        selectedCategoryTextElement.textContent = categoryName;
        
        // 显示叉号按钮和面包屑分隔符
        clearCategoryButton.style.display = 'inline-block';
        clearCategoryTopButton.style.display = 'inline-block';
        breadcrumbSeparator.style.display = 'inline-block';
        selectedCategoryBreadcrumb.style.display = 'flex';
        
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