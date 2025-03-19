<!--
 * @Author: Ray
 * @Date: 2025-03-04
 * @Description: 知识库管理页面
-->

<template>
    <div class="knowledge-container">
        <!-- 顶部操作栏 -->
        <!-- <div class="knowledge-header">
            <el-button type="primary" @click="createNewNode">
                <i class="el-icon-plus"></i> 新建条目
            </el-button>
            <el-button type="success" @click="fetchKnowledgeCategories">
                <i class="el-icon-refresh"></i> 刷新数据
            </el-button>
        </div> -->

        <!-- 主体内容区 -->
        <div class="knowledge-main">
            <!-- 左侧目录树 -->
            <div class="knowledge-sidebar">
                <div class="search-box">
                    <el-select 
                        v-model="selectedDepartment" 
                        placeholder="请选择单位" 
                        size="small"
                        style="width: 100%; margin-bottom: 10px;"
                        @change="handleDepartmentChange">
                        <el-option
                            v-for="item in departmentOptions"
                            :key="item.value"
                            :label="item.label"
                            :value="item.value">
                        </el-option>
                    </el-select>
                    <el-input
                        v-model="filterText"
                        placeholder="搜索知识库"
                        prefix-icon="el-icon-search"
                        clearable>
                    </el-input>
                </div>
                
                <div class="tree-container">
                    <el-tree
                        :data="knowledgeTree"
                        :props="defaultProps"
                        :filter-node-method="filterNode"
                        node-key="id"
                        :expand-on-click-node="false"
                        @node-click="handleNodeClick"
                        :current-node-key="currentNodeId"
                        highlight-current
                        :check-on-click-node="true"
                        ref="tree">
                        <template v-slot="{ node, data }">
                            <span class="custom-tree-node">
                                <span class="node-icon-label">
                                    <i :class="getNodeIcon(data)"></i>
                                    <span class="node-label">{{ stripHtmlTags(node.label) }}</span>
                                </span>
                            </span>
                        </template>
                    </el-tree>
                </div>
            </div>

            <!-- 右侧内容区 -->
            <div class="knowledge-content">
                <!-- 有选中节点时显示编辑表单 -->
                <div v-if="currentNode && currentNode.type === 'item'" class="edit-form">
                    <el-form :model="currentNode" label-width="80px" size="small">
                        <el-form-item label="标题">
                            <el-input v-model="currentNode.label" placeholder="请输入标题"></el-input>
                        </el-form-item>
                        <el-form-item label="所属分类">
                            <div class="category-display">
                                <el-tag type="primary" v-if="currentNode.parentCategory">{{ currentNode.parentCategory }}</el-tag>
                                <el-tag type="success" v-if="currentNode.category">{{ currentNode.category }}</el-tag>
                                <span v-if="!currentNode.category && !currentNode.parentCategory" class="no-category">未分类</span>
                            </div>
                        </el-form-item>
                        <el-form-item label="内容">
                            <el-input 
                                type="textarea" 
                                v-model="currentNode.content" 
                                :rows="15"
                                placeholder="请输入内容">
                            </el-input>
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" @click="saveNode">保存</el-button>
                            <el-button type="danger" @click="deleteNode">删除</el-button>
                        </el-form-item>
                    </el-form>
                </div>
                
                <!-- 如果选中的是分类节点，显示知识点列表 -->
                <div v-else-if="currentNode && (currentNode.type === 'category' || currentNode.type === 'subcategory')" class="category-items">
                    <div class="category-header">
                        <h2>{{ stripHtmlTags(currentNode.label) }}</h2>
                        <el-button type="primary" size="small" @click="showKnowledgeGraph(currentNode, $event)">
                            <i class="el-icon-share"></i> 知识图谱
                        </el-button>
                    </div>
                    <el-divider></el-divider>
                    
                    <div v-if="knowledgeItems.length === 0" class="empty-items">
                        正在加载，请稍等...
                    </div>
                    
                    <el-card 
                        v-for="item in knowledgeItems" 
                        :key="item.kgid" 
                        class="knowledge-item-card" 
                        shadow="hover"
                        :class="{'active-card': currentNode && currentNode.id === item.kgid}"
                        @click="viewKnowledgeDetail(item)">
                        <template #header>
                            <div class="clearfix">
                                <span>{{ item.title }}</span>
                            </div>
                        </template>
                        <div class="item-content">{{ item.content }}</div>
                    </el-card>
                </div>

                <!-- 未选中节点时显示空状态 -->
                <div v-else class="empty-state">
                    <i class="el-icon-document"></i>
                    <p>请选择查看一个知识库条目</p>
                    <!-- <el-button type="primary" @click="createNewNode">创建新条目</el-button> -->
                </div>
            </div>
        </div>
    </div>
</template>

<script>
module.exports =  {
    name: 'Knowledge',
    data() {
        return {
            // API 配置
            apiConfig: {
                baseUrl: 'http://172.16.99.32:1034',
                // baseUrl: 'https://lgdev.baicc.cc/',
                // baseUrl: 'http://172.16.99.32:1032',
                token: 'Bearer lg-evduwtdszwhdqzgqkwvdtmjgpmffipkwoogudnnqemjtvgcv'
            },
            // 新增的部门选项
            departmentOptions: [
                { value: '龙岗政数局', label: '市监局知识库' },
                { value: '市医保中心', label: '医保知识库' },
            ],
            // 当前选中的部门
            selectedDepartment: '龙岗政数局',
            // 搜索过滤文本
            filterText: '',
            // 知识库树形数据
            knowledgeTree: [],
            // 当前选中分类下的知识点列表
            knowledgeItems: [],
            // 树形配置
            defaultProps: {
                children: 'children',
                label: 'label'
            },
            // 当前选中的节点
            currentNode: null,
            // 加载状态
            loading: false,
            // 当前选中的节点ID
            currentNodeId: null,
            // 展开的节点
            expandedKeys: [],
        }
    },
    created() {
        // 组件创建时获取知识点分类
        this.fetchKnowledgeCategories();
    },
    watch: {
        // 监听搜索文本变化
        filterText(val) {
            this.$refs.tree.filter(val);
        },
        // 监听路由参数变化
        '$route.query.id': {
            handler(id) {
                if (id) {
                    this.loadNodeById(id);
                }
            },
            immediate: true
        }
    },
    methods: {
        // 单位变化处理
        handleDepartmentChange() {
            console.log(`部门切换为: ${this.selectedDepartment}`);
            
            // 清空当前数据
            this.knowledgeTree = [];
            this.knowledgeItems = [];
            this.currentNode = null;
            this.currentNodeId = null;
            this.filterText = '';
            
            // 重新获取分类数据
            this.fetchKnowledgeCategories();
            
            // 提示用户
            this.$message({
                type: 'info',
                message: `已切换到${this.selectedDepartment}知识库`
            });
        },
        
        // 获取知识点分类
        async fetchKnowledgeCategories() {
            this.loading = true;
            this.knowledgeTree = []; // 清空现有树数据
            
            try {
                console.log(`开始获取 ${this.selectedDepartment} 的知识分类数据`);
                
                const params = new URLSearchParams({
                    department: this.selectedDepartment
                });
                
                const apiUrl = `${this.apiConfig.baseUrl}/api/query_kb_category?${params.toString()}`;
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': this.apiConfig.token,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('响应错误:', errorText);
                    throw new Error(`获取分类失败: ${response.status} ${response.statusText}`);
                }
                
                const data = await response.json();
                // 根据实际返回的数据格式处理
                if (data) {
                    // 直接使用返回的数组数据
                    this.knowledgeTree = this.transformCategoryTree(data);
                    console.log(`${this.selectedDepartment} 转换后的知识树:`, this.knowledgeTree);
                    
                    // 清空当前选中的节点
                    this.currentNode = null;
                    this.currentNodeId = null;
                    this.knowledgeItems = [];
                    
                    // 如果树不为空，可以默认展开第一级
                    if (this.knowledgeTree.length > 0) {
                        this.$nextTick(() => {
                            if (this.$refs.tree) {
                                // 展开第一个分类
                                this.$refs.tree.store.nodesMap[this.knowledgeTree[0].id].expanded = true;
                            }
                        });
                    } else {
                        console.warn(`${this.selectedDepartment} 转换后的知识树为空`);
                    }
                } else {
                    console.warn(`${this.selectedDepartment} 返回数据为空`);
                    this.$message.warning('获取知识点分类数据为空');
                }
                
            } catch (error) {
                console.error(`获取 ${this.selectedDepartment} 知识点分类失败:`, error);
                this.$message.error('获取知识点分类失败: ' + error.message);
            } finally {
                this.loading = false;
            }
        },
        
        // 转换分类树结构
        transformCategoryTree(categoryList) {
            // 数据有效性检查
            if (!categoryList || !Array.isArray(categoryList) || categoryList.length === 0) {
                console.log('分类数据无效或为空');
                return [];
            }
            
            console.log('开始转换知识树数据:', categoryList);
            
            try {
                // 获取数据中的第一个对象（包含部门信息）
                const departmentData = categoryList[0];
                
                // 检查部门数据是否有效
                if (!departmentData || typeof departmentData !== 'object') {
                    console.error('部门数据格式不正确:', departmentData);
                    return [];
                }
                
                // 获取部门名称（对象的键）
                const departmentKeys = Object.keys(departmentData);
                if (departmentKeys.length === 0) {
                    console.error('部门对象没有键');
                    return [];
                }
                
                const departmentName = departmentKeys[0];
                console.log('部门名称:', departmentName);
                
                // 获取该部门的分类列表
                const categories = departmentData[departmentName];
                
                if (!categories || !Array.isArray(categories) || categories.length === 0) {
                    console.log('该部门下没有分类数据');
                    return [];
                }
                
                console.log(`找到${categories.length}个分类`);
                
                // 自定义排序函数（适用于市监局知识库）
                const sortCategories = (categories) => {
                    if (this.selectedDepartment === '龙岗政数局') {
                        // 为市监局知识库分类添加权重
                        const categoryWeightMap = {};
                        const chineseNums = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', 
                            '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十'];
                        
                        // 创建中文数字到权重的映射
                        chineseNums.forEach((num, index) => {
                            categoryWeightMap[num] = index;
                        });
                        
                        // 对分类进行排序
                        return [...categories].sort((a, b) => {
                            // 从分类名中提取中文数字
                            const getChineseNum = (str) => {
                                if (!str) return null;
                                const match = str.match(/^([\u4e00-\u9fa5]+)[、]/);
                                return match ? match[1] : null;
                            };
                            
                            const numA = getChineseNum(a.category2);
                            const numB = getChineseNum(b.category2);
                            
                            // 根据中文数字权重排序
                            if (numA && numB) {
                                return categoryWeightMap[numA] - categoryWeightMap[numB];
                            } else if (numA) {
                                return -1; // 有数字的排前面
                            } else if (numB) {
                                return 1;
                            }
                            
                            // 如果没有提取到中文数字，按原始字符串排序
                            return a.category2.localeCompare(b.category2, 'zh-CN');
                        });
                    }
                    
                    // 其他知识库保持原排序
                    return categories;
                };
                
                // 排序分类
                const sortedCategories = sortCategories(categories);
                
                // 转换为树形结构
                return sortedCategories.map((category, index) => {
                    // 检查分类对象结构
                    if (!category || !category.category2) {
                        console.warn('无效的分类项:', category);
                        return null;
                    }
                    
                    return {
                        id: `category-${index}`,
                        label: this.stripHtmlTags(category.category2),
                        name: category.category2,
                        type: 'category',
                        children: Array.isArray(category.category3) ? category.category3
                            .filter(subCategory => subCategory) // 过滤掉空字符串
                            .map((subCategory, subIndex) => ({
                                id: `subcategory-${index}-${subIndex}`,
                                label: this.stripHtmlTags(subCategory),
                                name: subCategory,
                                type: 'subcategory',
                                parentCategory: category.category2
                            })) : []
                    };
                }).filter(item => item !== null); // 过滤掉无效的项
            } catch (error) {
                console.error('转换知识树数据时出错:', error);
                return [];
            }
        },
        
        // 根据分类获取知识点列表
        async fetchKnowledgeByCategory(category) {
            this.knowledgeItems = [];
            this.loading = true;
            
            try {
                console.log(`获取 ${this.selectedDepartment} 下 ${category} 分类的知识点`);
                
                const params = {
                    // department: this.selectedDepartment,
                    category: category
                };
                
                const queryString = new URLSearchParams(params).toString();
                
                // 根据不同部门选择不同的API接口
                let apiUrl;
                if (this.selectedDepartment === '市医保中心') {
                    // 医保知识库使用 getKnowle 接口
                    apiUrl = `${this.apiConfig.baseUrl}/api/feedback/getKnowle/${category}`;
                } else if (this.selectedDepartment === '龙岗政数局') {
                    // 市监局知识库使用 getLGKnowle 接口
                    apiUrl = `${this.apiConfig.baseUrl}/api/feedback/getLGKnowle/${category}?`;
                }
                
                console.log('知识点请求URL:', apiUrl);
                
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': this.apiConfig.token,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`获取知识点失败: ${response.status} ${response.statusText}`);
                }
                
                const data = await response.json();
                console.log(`${category} 知识点数据:`, data);
                
                if (data && data.feedback_list) {
                    this.knowledgeItems = data.feedback_list;
                    console.log(`获取到 ${this.knowledgeItems.length} 条知识点`);
                } else {
                    console.warn(`${category} 知识点数据格式不符合预期:`, data);
                    this.$message.warning('获取知识点数据格式不正确');
                    this.knowledgeItems = [];
                }
                
            } catch (error) {
                console.error(`获取 ${category} 知识点失败:`, error);
                this.$message.error('获取知识点失败: ' + error.message);
                this.knowledgeItems = [];
            } finally {
                this.loading = false;
            }
        },
        
        // 节点过滤方法
        filterNode(value, data) {
            if (!value) return true;
            return data.label.toLowerCase().includes(value.toLowerCase());
        },
        
        // 点击节点
        handleNodeClick(data) {
            this.currentNode = JSON.parse(JSON.stringify(data));
            this.currentNodeId = data.id;
            
            // 如果点击的是二级分类节点，获取该分类下的知识点
            if (data.type === 'subcategory') {
                this.fetchKnowledgeByCategory(data.name);
            } else if (data.type === 'category') {
                // 如果点击的是一级分类，清空知识点列表
                this.knowledgeItems = [];
            }
        },
        
        // 编辑知识点项
        editKnowledgeItem(item) {
            // 确定所属分类信息
            let currentCategory = this.currentNode.name;
            let parentCategory = '';
            
            // 查找当前分类的父级
            for (let category of this.knowledgeTree) {
                if (category.children) {
                    for (let subcategory of category.children) {
                        if (subcategory.name === currentCategory) {
                            parentCategory = category.name;
                            break;
                        }
                    }
                }
            }
            
            // 如果没有找到父分类，说明当前分类是一级分类
            if (!parentCategory) {
                parentCategory = currentCategory;
                currentCategory = '';
            }
            
            this.currentNode = {
                id: item.kgid,
                label: this.stripHtmlTags(item.title),
                content: item.content,
                category: currentCategory,
                parentCategory: parentCategory,
                type: 'item'
            };
            
            // 将树的当前选中节点重置为空，因为我们现在在编辑知识点
            this.currentNodeId = null;
        },
        
        // 创建新节点
        createNewNode() {
            // 如果当前选中了分类，确定是一级还是二级分类
            let currentCategory = '';
            let parentCategory = '';
            
            if (this.currentNode && this.currentNode.type === 'category') {
                let isSubcategory = false;
                
                // 检查是否是二级分类
                for (let category of this.knowledgeTree) {
                    if (category.children) {
                        for (let subcategory of category.children) {
                            if (subcategory.id === this.currentNode.id) {
                                currentCategory = subcategory.name;
                                parentCategory = category.name;
                                isSubcategory = true;
                                break;
                            }
                        }
                        if (isSubcategory) break;
                    }
                }
                
                // 如果不是二级分类，那就是一级分类
                if (!isSubcategory) {
                    parentCategory = this.currentNode.name;
                }
            } else if (this.knowledgeTree.length > 0) {
                // 默认使用第一个分类
                parentCategory = this.knowledgeTree[0].name;
            }
            
            this.currentNode = {
                label: '新建条目',
                content: '',
                category: currentCategory,
                parentCategory: parentCategory,
                type: 'item'
            };
            
            // 重置树的当前选中节点
            this.currentNodeId = null;
        },
        
        // 在指定节点下添加子节点
        appendNode(data) {
            // 由于不需要编辑功能，此处禁用添加节点
            this.$message({
                type: 'info',
                message: '当前不支持编辑功能'
            });
        },
        
        // 保存节点
        saveNode() {
            // 暂时不需要编辑知识点
            this.$message({
                type: 'info',
                message: '当前不支持编辑功能'
            });
        },
        
        // 删除节点
        deleteNode() {
            // 暂时不需要编辑知识点
            this.$message({
                type: 'info',
                message: '当前不支持编辑功能'
            });
        },
        
        // 根据ID加载节点
        loadNodeById(id) {
            // 这里实现根据ID加载节点的逻辑
            console.log('加载节点:', id);
        },
        
        // 获取节点图标
        getNodeIcon(data) {
            if (data.type === 'category') {
                return 'el-icon-folder';
            } else if (data.type === 'item') {
                return 'el-icon-document';
            }
            return '';
        },
        
        // 移除HTML标签
        stripHtmlTags(text) {
            if (!text) return '';
            return text.replace(/<\/?[^>]+(>|$)/g, '');
        },
        
        // 查看知识点详情
        viewKnowledgeDetail(item) {
            // 在这里实现查看知识点详情的逻辑
            console.log('查看知识点详情:', item);
            this.editKnowledgeItem(item);
        }
    }
}
</script>

<style scoped>
.knowledge-container {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.knowledge-header {
    padding: 16px;
    border-bottom: 1px solid #e6e6e6;
    display: flex;
    gap: 10px;
}

.knowledge-main {
    flex: 1;
    display: flex;
    overflow: hidden;
}

.knowledge-sidebar {
    width: 320px;
    border-right: 1px solid #e6e6e6;
    display: flex;
    flex-direction: column;
    background-color: #fff;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.search-box {
    padding: 16px;
    border-bottom: 1px solid #e6e6e6;
    background-color: #fbfbfb;
}

.tree-container {
    flex: 1;
    overflow: auto;
    padding: 12px;
    background-color: #fff;
}

.el-tree {
    background-color: transparent;
}

.el-tree-node {
    position: relative;
}

.el-tree-node__content {
    height: 36px;
    border-radius: 4px;
    margin-bottom: 4px;
    transition: all 0.3s;
}

.el-tree-node__content:hover {
    background-color: #edf6ff;
}

.el-tree-node.is-current > .el-tree-node__content {
    background-color: #ecf5ff;
    color: #409EFF;
    font-weight: bold;
    box-shadow: 0 2px 8px 0 rgba(64, 158, 255, 0.15);
}

.el-tree-node__children {
    padding-left: 4px;
}

.custom-tree-node {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-right: 8px;
    font-size: 14px;
}

.node-icon-label {
    display: flex;
    align-items: center;
}

.node-icon-label i {
    margin-right: 8px;
    font-size: 16px;
    color: #909399;
}

.el-tree-node.is-current > .el-tree-node__content .node-icon-label i {
    color: #409EFF;
}

.node-label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.knowledge-content {
    flex: 1;
    padding: 20px;
    overflow: auto;
}

.empty-state {
    text-align: center;
    padding: 60px 0;
    color: #909399;
}

.empty-state i {
    font-size: 48px;
    margin-bottom: 20px;
}

.empty-state p {
    margin: 20px 0;
    font-size: 14px;
}

.edit-form {
    max-width: 800px;
    margin: 0 auto;
}

.category-items {
    padding: 10px;
}

.knowledge-item-card {
    margin-bottom: 15px;
}

.item-content {
    white-space: pre-line;
    line-height: 1.6;
    padding: 0 20px;
    font-size: 14px;
    color: #606266;
}

.empty-items {
    text-align: center;
    padding: 30px;
    color: #909399;
}

.active-card {
    border: 2px solid #409EFF;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.category-display {
    line-height: 32px;
}

.category-display .el-tag {
    margin-right: 10px;
}

.no-category {
    color: #909399;
    font-style: italic;
}

/* 自定义展开按钮样式 - 横向三角形 */
.el-tree-node__expand-icon {
    font-size: 12px;
}

.el-tree-node__expand-icon.expanded {
    transform: rotate(90deg);
}

.el-tree-node__expand-icon.is-leaf {
    color: transparent;
}

.el-card__header {
    padding: 15px 20px;
    font-weight: bold;
    font-size: 16px;
    background-color: #f5f7fa;
    border-bottom: 1px solid #e6e6e6;
}

.el-card__body {
    padding: 15px 0;
}

.knowledge-item-card .clearfix {
    display: flex;
    align-items: center;
}

.knowledge-item-card .clearfix span {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.category-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.category-header h2 {
    margin: 0;
}
</style> 