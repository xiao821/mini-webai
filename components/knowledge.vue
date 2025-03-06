<!--
 * @Author: Ray
 * @Date: 2025-03-04
 * @Description: 知识库管理页面
-->

<template>
    <div class="knowledge-container">
        <!-- 顶部操作栏 -->
        <div class="knowledge-header">
            <el-button type="primary" @click="createNewNode">
                <i class="el-icon-plus"></i> 新建条目
            </el-button>
            <el-button type="success" @click="fetchKnowledgeCategories">
                <i class="el-icon-refresh"></i> 刷新数据
            </el-button>
        </div>

        <!-- 主体内容区 -->
        <div class="knowledge-main">
            <!-- 左侧目录树 -->
            <div class="knowledge-sidebar">
                <div class="search-box">
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
                                    <span class="node-label">{{ node.label }}</span>
                                </span>
                                <span class="node-actions">
                                    <el-button type="text" size="mini" @click.stop="() => appendNode(data)">
                                        <i class="el-icon-plus"></i>
                                    </el-button>
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
                <div v-else-if="currentNode && currentNode.type === 'category'" class="category-items">
                    <h2>{{ currentNode.label }}</h2>
                    <el-divider></el-divider>
                    
                    <div v-if="knowledgeItems.length === 0" class="empty-items">
                        正在加载，请稍等...
                    </div>
                    
                    <el-card 
                        v-for="item in knowledgeItems" 
                        :key="item.kgid" 
                        class="knowledge-item-card" 
                        shadow="hover"
                        :class="{'active-card': currentNode && currentNode.id === item.kgid}">
                        <template #header>
                            <div class="clearfix">
                                <span>{{ item.title }}</span>
                                <el-button style="float: right; padding: 3px 0" type="text" @click="editKnowledgeItem(item)">编辑</el-button>
                            </div>
                        </template>
                        <div class="item-content">{{ item.content }}</div>
                    </el-card>
                </div>

                <!-- 未选中节点时显示空状态 -->
                <div v-else class="empty-state">
                    <i class="el-icon-document"></i>
                    <p>请选择或创建一个知识库条目</p>
                    <el-button type="primary" @click="createNewNode">创建新条目</el-button>
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
                baseUrl: 'https://lgdev.baicc.cc/',
                token: 'Bearer lg-evduwtdszwhdqzgqkwvdtmjgpmffipkwoogudnnqemjtvgcv'
            },
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
            expandedKeys: []
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
        // 获取知识点分类
        async fetchKnowledgeCategories() {
            this.loading = true;
            try {
                const response = await fetch(`${this.apiConfig.baseUrl}api/feedback/getKnowleCate/`, {
                    method: 'GET',
                    headers: {
                        'Authorization': this.apiConfig.token,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error('获取分类失败');
                }
                
                const data = await response.json();
                
                if (data && data.knowledge_list && data.knowledge_list.length > 0) {
                    const treeJson = JSON.parse(data.knowledge_list[0].tree_json);
                    this.knowledgeTree = this.transformCategoryTree(treeJson);
                    
                    // 不再默认展开节点
                    this.expandedKeys = [];
                }
                
            } catch (error) {
                console.error('获取知识点分类失败:', error);
                this.$message.error('获取知识点分类失败: ' + error.message);
            } finally {
                this.loading = false;
            }
        },
        
        // 转换分类树结构
        transformCategoryTree(treeJson) {
            return treeJson.map((category, index) => {
                const result = {
                    id: `category-${index}`,
                    label: category.name,
                    name: category.name,
                    type: 'category',
                };
                
                if (category.children && category.children.length > 0) {
                    result.children = category.children.map((subCategory, subIndex) => {
                        return {
                            id: `category-${index}-${subIndex}`,
                            label: subCategory.name,
                            name: subCategory.name,
                            type: 'category',
                            parentId: `category-${index}`
                        };
                    });
                }
                
                return result;
            });
        },
        
        // 根据分类获取知识点列表
        async fetchKnowledgeByCategory(category) {
            this.knowledgeItems = [];
            this.loading = true;
            
            try {
                const response = await fetch(`${this.apiConfig.baseUrl}api/feedback/getKnowle/${encodeURIComponent(category)}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': this.apiConfig.token,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error('获取知识点失败');
                }
                
                const data = await response.json();
                
                if (data && data.knowledge_list) {
                    this.knowledgeItems = data.knowledge_list;
                }
                
            } catch (error) {
                console.error('获取知识点失败:', error);
                this.$message.error('获取知识点失败: ' + error.message);
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
            
            // 如果点击的是分类节点，获取该分类下的知识点
            if (data.type === 'category') {
                this.fetchKnowledgeByCategory(data.name);
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
                label: item.title,
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
            const newChild = {
                id: Date.now().toString(),
                label: '新建子条目',
                type: 'item',
                content: ''
            };
            if (!data.children) {
                this.$set(data, 'children', []);
            }
            data.children.push(newChild);
        },
        
        // 保存节点
        saveNode() {
            // 这里实现保存逻辑
            this.$message({
                type: 'success',
                message: '保存成功'
            });
        },
        
        // 删除节点
        deleteNode() {
            this.$confirm('确认删除该条目?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                // 这里实现删除逻辑
                this.$message({
                    type: 'success',
                    message: '删除成功'
                });
                this.currentNode = null;
            }).catch(() => {});
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
        }
    }
}
</script>

<style>
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

.node-actions {
    opacity: 0;
    transition: opacity 0.2s;
}

.custom-tree-node:hover .node-actions {
    opacity: 1;
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
</style> 