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
                        ref="tree">
                        <template v-slot="{ node, data }">
                            <span class="custom-tree-node">
                                <span>{{ node.label }}</span>
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
                <div v-if="currentNode" class="edit-form">
                    <el-form :model="currentNode" label-width="80px" size="small">
                        <el-form-item label="标题">
                            <el-input v-model="currentNode.label" placeholder="请输入标题"></el-input>
                        </el-form-item>
                        <el-form-item label="分类">
                            <el-select v-model="currentNode.category" placeholder="请选择分类">
                                <el-option label="常见问题" value="faq"></el-option>
                                <el-option label="使用教程" value="tutorial"></el-option>
                                <el-option label="错误处理" value="error"></el-option>
                            </el-select>
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
            // 搜索过滤文本
            filterText: '',
            // 知识库树形数据
            knowledgeTree: [{
                id: '1',
                label: '常见问题',
                category: 'faq',
                children: [{
                    id: '1-1',
                    label: '如何使用系统',
                    category: 'faq',
                    content: '这是系统使用说明...'
                }]
            }, {
                id: '2',
                label: '错误处理',
                category: 'error',
                children: [{
                    id: '2-1',
                    label: '常见错误解决方案',
                    category: 'error',
                    content: '这是错误处理指南...'
                }]
            }],
            // 树形配置
            defaultProps: {
                children: 'children',
                label: 'label'
            },
            // 当前选中的节点
            currentNode: null
        }
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
        // 节点过滤方法
        filterNode(value, data) {
            if (!value) return true;
            return data.label.toLowerCase().includes(value.toLowerCase());
        },
        // 点击节点
        handleNodeClick(data) {
            this.currentNode = JSON.parse(JSON.stringify(data));
        },
        // 创建新节点
        createNewNode() {
            this.currentNode = {
                label: '新建条目',
                category: 'faq',
                content: ''
            };
        },
        // 在指定节点下添加子节点
        appendNode(data) {
            const newChild = {
                id: Date.now().toString(),
                label: '新建子条目',
                category: data.category,
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
}

.knowledge-main {
    flex: 1;
    display: flex;
    overflow: hidden;
}

.knowledge-sidebar {
    width: 280px;
    border-right: 1px solid #e6e6e6;
    display: flex;
    flex-direction: column;
}

.search-box {
    padding: 16px;
    border-bottom: 1px solid #e6e6e6;
}

.tree-container {
    flex: 1;
    overflow: auto;
    padding: 16px;
}

.knowledge-content {
    flex: 1;
    padding: 20px;
    overflow: auto;
}

.custom-tree-node {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-right: 8px;
}

.node-actions {
    opacity: 0;
    transition: opacity 0.2s;
}

.custom-tree-node:hover .node-actions {
    opacity: 1;
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
</style> 