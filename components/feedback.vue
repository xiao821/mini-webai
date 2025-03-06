<!--
 * @Author: Ray
 * @Date: 2025-03-04
 * @Description: 反馈管理页面组件
-->

<template>
    <div class="feedback-container">
        <!-- 顶部筛选区 -->
        <div class="feedback-header">
            <el-form :inline="true" :model="filterForm" class="filter-form" size="small">
                <el-form-item label="日期范围">
                    <el-date-picker
                        v-model="filterForm.dateRange"
                        type="daterange"
                        range-separator="至"
                        start-placeholder="开始日期"
                        end-placeholder="结束日期"
                        value-format="yyyy-MM-dd">
                    </el-date-picker>
                </el-form-item>
                <el-form-item label="关键词">
                    <el-input 
                        v-model="filterForm.keyword" 
                        placeholder="请输入关键词"
                        prefix-icon="el-icon-search"
                        clearable>
                    </el-input>
                </el-form-item>
                <el-form-item label="类型">
                    <el-select v-model="filterForm.category" placeholder="请选择类型" clearable>
                        <el-option label="信息不准确" value="信息不准确"></el-option>
                        <el-option label="信息不完整" value="信息不完整"></el-option>
                        <el-option label="回答不相关" value="回答不相关"></el-option>
                        <el-option label="其他问题" value="其他问题"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="处理状态">
                    <el-select v-model="filterForm.status" placeholder="未筛选" clearable>
                        <el-option label="已处理" value="已处理"></el-option>
                        <el-option label="未处理" value="待处理"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleFilter">筛选</el-button>
                    <el-button @click="resetFilter">重置</el-button>
                </el-form-item>
            </el-form>
        </div>

        <!-- 数据统计区 -->
        <div class="feedback-stats">
            <el-row :gutter="20">
                <el-col :span="6">
                    <el-card shadow="hover">
                        <div class="stat-item">
                            <div class="stat-title">今日反馈</div>
                            <div class="stat-value">{{ stats.today }}</div>
                        </div>
                    </el-card>
                </el-col>
                <el-col :span="6">
                    <el-card shadow="hover">
                        <div class="stat-item">
                            <div class="stat-title">本周反馈</div>
                            <div class="stat-value">{{ stats.week }}</div>
                        </div>
                    </el-card>
                </el-col>
                <el-col :span="6">
                    <el-card shadow="hover">
                        <div class="stat-item">
                            <div class="stat-title">本月反馈</div>
                            <div class="stat-value">{{ stats.month }}</div>
                        </div>
                    </el-card>
                </el-col>
                <el-col :span="6">
                    <el-card shadow="hover">
                        <div class="stat-item">
                            <div class="stat-title">待处理</div>
                            <div class="stat-value">{{ stats.pending }}</div>
                        </div>
                    </el-card>
                </el-col>
            </el-row>
        </div>

        <!-- 表格区域 -->
        <div class="feedback-table">
            <el-table 
                :data="tableData" 
                style="width: 100%"
                v-loading="loading"
                border
                ref="feedbackTable"
                row-key="md_id">
                <el-table-column 
                    type="expand" 
                    width="0" 
                    class-name="hidden-expand-column">
                    <template #default="props">
                        <el-table
                            :data="props.row.kb_reference"
                            style="width: 100%"
                            row-key="kb_id">
                            <el-table-column prop="kb_id" label="知识点ID" width="100"></el-table-column>
                            <el-table-column prop="kb_title" label="知识库标题"></el-table-column>
                            <el-table-column prop="kb_content" label="知识库内容" show-overflow-tooltip></el-table-column>
                            <el-table-column prop="kb_simil" label="相似度" width="100">
                                <template #default="scope">
                                    {{ scope.row.kb_simil}}%
                                </template>
                            </el-table-column>
                        </el-table>
                    </template>
                </el-table-column>
                <el-table-column prop="date" label="日期" width="180" sortable></el-table-column>
                <el-table-column prop="feedback_type" label="类型" width="120">
                    <template #default="scope">
                        <el-tag 
                            :type="getCategoryTag(scope.row.feedback_type)"
                            size="small">
                            {{ scope.row.feedback_type }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="user_question" label="用户问题" show-overflow-tooltip></el-table-column>
                <el-table-column prop="ai_answer" label="AI回答" show-overflow-tooltip>
                    <template #default="scope">
                        <div class="table-cell-content">{{ scope.row.ai_answer }}</div>
                        <el-tooltip placement="top" :content="renderMarkdown(scope.row.ai_answer)" :open-delay="500">
                            <template v-slot:content>
                                <div v-html="renderMarkdown(scope.row.ai_answer)" class="markdown-tooltip"></div>
                            </template>
                        </el-tooltip>
                    </template>
                </el-table-column>
                <el-table-column prop="detail" label="反馈内容" show-overflow-tooltip></el-table-column>
                <el-table-column prop="status" label="状态" width="100">
                    <template #default="scope">
                        <el-tag 
                            :type="getStatusTag(scope.row.status)"
                            size="small">
                            {{ scope.row.status }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="kb_reference" label="知识点ID" width="120">
                    <template #default="scope">
                        <span 
                            class="clickable-text"
                            @click="$refs.feedbackTable.toggleRowExpansion(scope.row)">
                            {{ scope.row.kb_reference && scope.row.kb_reference.length > 0 
                                ? scope.row.kb_reference.map(item => item.kb_id).join(', ') 
                                : '无' }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="200" fixed="right">
                    <template #default="scope">
                        <el-button 
                            type="text" 
                            size="small" 
                            @click="viewDetail(scope.row)">
                            详情
                        </el-button>
                        <el-button 
                            type="text" 
                            size="small" 
                            @click="viewKnowledge(scope.row)">
                            知识库
                        </el-button>
                        <el-button 
                            type="text" 
                            size="small" 
                            @click="handleStatus(scope.row)"
                            :class="{ 'danger-text': scope.row.status === '待处理' }">
                            {{ scope.row.status === '待处理' ? '已处理' : '待处理' }}
                        </el-button>
                        <el-button 
                            style="color: #F77F6C;"
                            type="text" 
                            size="small" 
                            @click="deletefeedback(scope.row)">
                            删除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 分页器 -->
            <div class="pagination-container">
                <el-pagination
                    @size-change="handleSizeChange"
                    @current-change="handleCurrentChange"
                    :current-page="currentPage"
                    :page-sizes="[10, 20, 50, 100]"
                    :page-size="pageSize"
                    layout="total, sizes, prev, pager, next, jumper"
                    :total="total">
                </el-pagination>
            </div>
        </div>

        <!-- 详情对话框 -->
        <el-dialog 
            title="反馈详情" 
            :visible="dialogVisible"
            width="70%"
            @close="handleDialogClose">
            <div v-if="currentFeedback" class="feedback-detail">
                <div class="detail-item">
                    <label>提交时间：</label>
                    <span>{{ currentFeedback.date }}</span>
                </div>
                <div class="detail-item">
                    <label>反馈分类：</label>
                    <el-tag size="small" :type="getCategoryTag(currentFeedback.feedback_type)">
                        {{ currentFeedback.feedback_type }}
                    </el-tag>
                </div>
                <div class="detail-item">
                    <label>用户问题：</label>
                    <div class="detail-content">{{ currentFeedback.user_question }}</div>
                </div>
                <div class="detail-item">
                    <label>AI回答：</label>
                    <div class="detail-content" v-html="renderedAIAnswer"></div>
                </div>
                <div class="detail-item">
                    <label>反馈内容：</label>
                    <div class="detail-content">{{ currentFeedback.detail }}</div>
                </div>
                <div class="detail-item">
                    <label>处理状态：</label>
                    <el-tag size="small" :type="getStatusTag(currentFeedback.status)">
                        {{ currentFeedback.status }}
                    </el-tag>
                </div>
            </div>
        </el-dialog>

        <!-- 知识库弹窗 -->
        <el-dialog 
            title="选择正确的知识点" 
            :visible="knowledgeDialogVisible"
            width="80%"
            @close="handleKnowledgeDialogClose">
            <div class="knowledge-dialog-container">
                <!-- 左侧知识树 -->
                <div class="knowledge-tree-panel">
                    <div class="search-box">
                        <el-input
                            v-model="knowledgeFilterText"
                            placeholder="搜索知识库"
                            prefix-icon="el-icon-search"
                            clearable>
                        </el-input>
                    </div>
                    
                    <div class="tree-container">
                        <el-tree
                            :data="knowledgeTree"
                            :props="knowledgeTreeProps"
                            :filter-node-method="filterKnowledgeNode"
                            node-key="id"
                            :expand-on-click-node="false"
                            @node-click="handleKnowledgeNodeClick"
                            highlight-current
                            default-expand-all
                            ref="knowledgeTree">
                            <template v-slot="{ node, data }">
                                <span class="custom-tree-node">
                                    <span class="node-icon-label">
                                        <i :class="getKnowledgeNodeIcon(data)"></i>
                                        <span class="node-label">{{ node.label }}</span>
                                    </span>
                                </span>
                            </template>
                        </el-tree>
                    </div>
                </div>
                
                <!-- 右侧知识点预览 -->
                <div class="knowledge-preview-panel">
                    <h3>知识点内容预览</h3>
                    <div v-if="currentPreviewNode && currentPreviewNode.type === 'item'" class="preview-content">
                        <el-card class="knowledge-item-card" shadow="hover">
                            <template #header>
                                <div class="clearfix">
                                    <el-checkbox 
                                        v-model="currentPreviewNode.isSelected" 
                                        @change="handlePreviewNodeCheckChange(currentPreviewNode)">
                                        {{ currentPreviewNode.label }}
                                    </el-checkbox>
                                </div>
                            </template>
                            <div class="item-content">{{ currentPreviewNode.content || '暂无内容' }}</div>
                        </el-card>
                    </div>
                    <div v-else-if="currentPreviewNode && currentPreviewNode.type === 'category'" class="preview-content">
                        <div class="category-preview">
                            <h4>{{ currentPreviewNode.label }} 分类</h4>
                            <p>请点击具体的知识点查看内容</p>
                        </div>
                    </div>
                    <div v-else class="empty-knowledge-state">
                        <i class="el-icon-document"></i>
                        <p>请从左侧选择知识点查看详情</p>
                    </div>
                    
                    <el-divider>已选择的知识点</el-divider>
                    
                    <div v-if="selectedKnowledgeNodes.length > 0" class="selected-nodes">
                        <el-tag
                            v-for="item in selectedKnowledgeNodes"
                            :key="item.id"
                            closable
                            @close="removeSelectedKnowledge(item)"
                            class="selected-tag">
                            {{ item.label }}
                        </el-tag>
                    </div>
                    <div v-else class="no-selected-nodes">
                        <p>尚未选择任何知识点</p>
                    </div>
                </div>
            </div>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="knowledgeDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="submitSelectedKnowledge">确认提交</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script type="module">
const baseUrl = 'https://lgdev.baicc.cc/';
const API_AUTH_TOKEN = 'Bearer lg-evduwtdszwhdqzgqkwvdtmjgpmffipkwoogudnnqemjtvgcv';

module.exports = {
    name: 'Feedback',
    data() {
        return {
            // 筛选表单
            filterForm: {
                keyword: '',
                category: '',
                dateRange: [],
                status: ''
            },
            // 统计数据
            stats: {
                today: 12,
                week: 85,
                month: 346,
                pending: 24
            },
            // 表格数据
            tableData: [],
            // 分页
            currentPage: 1,
            pageSize: 10,
            total: 0,
            // 加载状态
            loading: false,
            // 详情弹窗
            dialogVisible: false,
            // 当前反馈状态
            currentFeedback: null,
            // 渲染后的AI回答
            renderedAIAnswer: '',
            // markdown解析器
            md: null,
            // 知识库弹窗
            knowledgeDialogVisible: false,
            // 知识库树形数据
            knowledgeTree: [],
            // 知识库树形配置
            knowledgeTreeProps: {
                children: 'children',
                label: 'label'
            },
            // 知识库搜索过滤文本
            knowledgeFilterText: '',
            // 已选择的知识点
            selectedKnowledgeNodes: [],
            // 当前操作的反馈项
            currentFeedbackForKnowledge: null,
            // 当前预览节点
            currentPreviewNode: null,
            // 展开的行
            expandedRows: []
        }
    },
    watch: {
        // 监听知识库搜索文本变化
        knowledgeFilterText(val) {
            this.$refs.knowledgeTree && this.$refs.knowledgeTree.filter(val);
        }
    },
    methods: {
        // 获取表格数据
        async getFeedbackTableData() {
            this.loading = true;
            try {
                const response = await axios.get(`${baseUrl}/api/feedback`,{
                    headers: {
                        'Authorization': API_AUTH_TOKEN
                    },
                    // Parameters: {
                    //     pagesize: this.pageSize,
                    //     pagenum: this.currentPage
                    // }
                });
                
                console.log('response',response.data.feedback_list)
                // this.total = response.data.total
                // 处理数据，获取用户问题和AI回答
                this.tableData = response.data.feedback_list.map(feedback => {
                    const aiAnswerIndex = feedback.current_message || [];
                    
                    // 过滤掉```之间的内容
                    let filteredAnswer = aiAnswerIndex;
                    if (Array.isArray(aiAnswerIndex)) {
                        filteredAnswer = aiAnswerIndex;
                    } else if (typeof aiAnswerIndex === 'string') {
                        // 使用正则表达式过滤掉```之间的内容
                        filteredAnswer = aiAnswerIndex.replace(/```[\s\S]*?```/g, '');
                    }
                    
                    // 从conversation_messages找到用户的问题
                    let userQuestion = '';
                    if (feedback.conversation_messages && Array.isArray(feedback.conversation_messages)) {
                        // 查找current_message在conversation_messages中的位置
                        const messageIndex = feedback.conversation_messages.findIndex(msg => 
                            msg.role === 'assistant' && msg.content === feedback.current_message
                        );
                        
                        // 如果找到了匹配的消息，并且它前面有用户消息，则获取用户问题
                        if (messageIndex > 0 && feedback.conversation_messages[messageIndex - 1].role === 'user') {
                            userQuestion = feedback.conversation_messages[messageIndex - 1].content;
                        }
                    }
                    
                    return {
                        ...feedback,
                        user_question: userQuestion,
                        ai_answer: filteredAnswer,
                        // kb_reference: Array.isArray(feedback.kb_reference) ? feedback.kb_reference : []
                    };
                });
                
                this.loading = false;
            } catch (error) {
                console.error('获取表格数据失败:', error);
                this.loading = false;
            }
        },
        // 处理对话框关闭
        handleDialogClose() {
            this.dialogVisible = false;
            this.currentFeedback = null;
            this.renderedAIAnswer = '';
        },
        // 筛选处理
        handleFilter() {
            this.currentPage = 1;
            this.getFeedbackTableData();
        },
        // 重置筛选
        resetFilter() {
            this.filterForm = {
                keyword: '',
                category: '',
                dateRange: [],
                status: ''
            };
            this.getFeedbackTableData();
        },
        // 分页处理-每页条数
        handleSizeChange(val) {
            this.pageSize = val;
            this.getFeedbackTableData();
        },
        // 分页处理-当前页
        handleCurrentChange(val) {
            this.currentPage = val;
            this.getFeedbackTableData();
        },
        // 查看详情
        viewDetail(row) {
            this.currentFeedback = row;
            this.dialogVisible = true;
            console.log('row',row);
            
            // 使用markdown-it渲染AI回答中的markdown内容
            if (row.ai_answer && this.md) {
                try {
                    this.renderedAIAnswer = this.md.render(row.ai_answer);
                } catch (error) {
                    console.error('Markdown渲染失败:', error);
                    this.renderedAIAnswer = row.ai_answer;
                }
            } else {
                this.renderedAIAnswer = row.ai_answer;
            }
        },
        // 查看知识库
        viewKnowledge(row) {
            // 打开知识库弹窗
            this.currentFeedbackForKnowledge = row;
            this.knowledgeDialogVisible = true;
            this.selectedKnowledgeNodes = [];
            
            // 获取知识库分类树
            this.fetchKnowledgeCategories();
        },
        // 获取知识库分类
        async fetchKnowledgeCategories() {
            this.loading = true;
            try {
                const response = await axios.get(`${baseUrl}/api/feedback/getKnowleCate/`, {
                    headers: {
                        'Authorization': API_AUTH_TOKEN
                    }
                });
                
                if (response.data && response.data.knowledge_list && response.data.knowledge_list.length > 0) {
                    const treeJson = JSON.parse(response.data.knowledge_list[0].tree_json);
                    this.knowledgeTree = this.transformCategoryTree(treeJson);
                    
                    // 确保树节点默认展开
                    this.$nextTick(() => {
                        if (this.$refs.knowledgeTree) {
                            // 使用 Element UI Tree 的正确方法展开节点
                            const expandAllNodes = (data) => {
                                data.forEach(node => {
                                    if (node.children && node.children.length > 0) {
                                        this.$refs.knowledgeTree.store.nodesMap[node.id].expanded = true;
                                        expandAllNodes(node.children);
                                    }
                                });
                            };
                            
                            expandAllNodes(this.knowledgeTree);
                        }
                    });
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
            try {
                const response = await axios.get(`${baseUrl}/api/feedback/getKnowle/${encodeURIComponent(category)}`, {
                    headers: {
                        'Authorization': API_AUTH_TOKEN
                    }
                });
                
                if (response.data && response.data.knowledge_list) {
                    // 将知识点添加到对应的分类节点下
                    this.addKnowledgeItemsToTree(category, response.data.knowledge_list);
                }
                
            } catch (error) {
                console.error('获取知识点失败:', error);
                this.$message.error('获取知识点失败: ' + error.message);
            }
        },
        
        // 将知识点添加到树中
        addKnowledgeItemsToTree(category, items) {
            // 查找对应的分类节点
            const findCategoryNode = (tree, categoryName) => {
                for (let node of tree) {
                    if (node.name === categoryName) {
                        return node;
                    }
                    if (node.children) {
                        const found = findCategoryNode(node.children, categoryName);
                        if (found) return found;
                    }
                }
                return null;
            };
            
            const categoryNode = findCategoryNode(this.knowledgeTree, category);
            if (!categoryNode) return;
            
            // 添加知识点作为子节点
            if (!categoryNode.children) {
                this.$set(categoryNode, 'children', []);
            }
            
            // 转换知识点为树节点格式
            const knowledgeNodes = items.map(item => ({
                id: item.kgid,
                label: item.title,
                content: item.content,
                type: 'item',
                parentId: categoryNode.id,
                kgid: item.kgid,
                isLeaf: true
            }));
            
            // 添加到分类节点下
            categoryNode.children = knowledgeNodes;
            
            // 强制更新树，但保持展开状态
            this.$nextTick(() => {
                // 确保树节点保持展开状态
                if (this.$refs.knowledgeTree) {
                    // 展开当前节点
                    this.$refs.knowledgeTree.store.nodesMap[categoryNode.id].expanded = true;
                }
            });
        },
        
        // 知识库节点过滤方法
        filterKnowledgeNode(value, data) {
            if (!value) return true;
            return data.label.toLowerCase().includes(value.toLowerCase());
        },
        
        // 点击知识库节点
        handleKnowledgeNodeClick(data) {
            // 设置当前预览节点
            this.currentPreviewNode = JSON.parse(JSON.stringify(data));
            
            // 检查节点是否已被选中
            if (data.type === 'item') {
                const isSelected = this.selectedKnowledgeNodes.some(node => node.id === data.id);
                this.currentPreviewNode.isSelected = isSelected;
            }
            
            // 如果点击的是分类节点，获取该分类下的知识点
            if (data.type === 'category' && (!data.children || data.children.length === 0)) {
                this.fetchKnowledgeByCategory(data.name);
            }
        },
        
        // 处理知识库节点选中状态变化（已移除勾选框，此方法保留但不再通过树的勾选调用）
        handleKnowledgeNodeCheck(data, checked) {
            // 只处理知识点类型的节点
            if (data.type === 'item') {
                if (checked) {
                    // 如果是选中，添加到已选择列表
                    const exists = this.selectedKnowledgeNodes.some(node => node.id === data.id);
                    if (!exists) {
                        this.selectedKnowledgeNodes.push(data);
                    }
                    
                    // 如果当前预览的就是这个节点，更新其选中状态
                    if (this.currentPreviewNode && this.currentPreviewNode.id === data.id) {
                        this.currentPreviewNode.isSelected = true;
                    }
                } else {
                    // 如果是取消选中，从已选择列表中移除
                    const index = this.selectedKnowledgeNodes.findIndex(node => node.id === data.id);
                    if (index !== -1) {
                        this.selectedKnowledgeNodes.splice(index, 1);
                    }
                    
                    // 如果当前预览的就是这个节点，更新其选中状态
                    if (this.currentPreviewNode && this.currentPreviewNode.id === data.id) {
                        this.currentPreviewNode.isSelected = false;
                    }
                }
            }
        },
        
        // 获取知识库节点图标
        getKnowledgeNodeIcon(data) {
            if (data.type === 'category') {
                return 'el-icon-folder';
            } else if (data.type === 'item') {
                return 'el-icon-document';
            }
            return '';
        },
        
        // 处理知识库弹窗关闭
        handleKnowledgeDialogClose() {
            this.knowledgeDialogVisible = false;
            this.currentFeedbackForKnowledge = null;
            this.selectedKnowledgeNodes = [];
            this.knowledgeTree = [];
            this.currentPreviewNode = null;
        },
        
        // 移除已选择的知识点
        removeSelectedKnowledge(item) {
            const index = this.selectedKnowledgeNodes.findIndex(node => node.id === item.id);
            if (index !== -1) {
                this.selectedKnowledgeNodes.splice(index, 1);
                
                // 如果当前预览的就是这个节点，更新其选中状态
                if (this.currentPreviewNode && this.currentPreviewNode.id === item.id) {
                    this.currentPreviewNode.isSelected = false;
                }
            }
        },
        
        // 提交选择的知识点
        async submitSelectedKnowledge() {
            if (!this.currentFeedbackForKnowledge) {
                this.$message.warning('未选择反馈项');
                return;
            }
            
            if (this.selectedKnowledgeNodes.length === 0) {
                this.$message.warning('请至少选择一个知识点');
                return;
            }
            
            try {
                // 构建提交选中的知识库数据
                const knowledgeItems = this.selectedKnowledgeNodes.map(item => ({
                    kgid: item.kgid,
                    title: item.label,
                    content: item.content
                }));
                
                // 构建提交改行数据和需要提交的知识库数据
                const submitData = {
                    feedback_id: this.currentFeedbackForKnowledge.md_id,
                    knowledge_ids: this.selectedKnowledgeNodes.map(item => item.kgid),
                    knowledge_items: knowledgeItems
                };
                
                // 在控制台打印JSON结构
                console.log('提交的知识点数据:', knowledgeItems,submitData);
                
                // 发送请求
                await axios.post(`${baseUrl}/api/feedback/updateKnowledge`, submitData, {
                    headers: {
                        'Authorization': API_AUTH_TOKEN,
                        'Content-Type': 'application/json'
                    }
                });
                
                this.$message.success('知识点提交成功');
                this.knowledgeDialogVisible = false;
                
                // 刷新表格数据
                this.getFeedbackTableData();
                
            } catch (error) {
                console.error('提交知识点失败:', error);
                this.$message.error('提交知识点失败: ' + error.message);
            }
        },
        // 删除单条反馈
        deletefeedback(row) {
            console.log('row',row)
            this.$confirm('确认删除该反馈吗？', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(async () => {
                await axios.delete(`${baseUrl}/api/feedback/${row.md_id}`, {
                    headers: {
                        'Authorization': API_AUTH_TOKEN
                    }
                });
                this.$message.success('删除成功');
                this.getFeedbackTableData();
            }).catch(() => {
                this.$message.info('已取消删除');
            });
        },
        // 处理状态变更
        handleStatus(row) {
            const newStatus = row.status === '待处理' ? '已处理' : '待处理';
            this.$confirm(`确认将该反馈标记为${newStatus}?`, '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                row.status = newStatus;
                this.$message.success('状态更新成功');
                this.getFeedbackTableData();
            }).catch(() => {});
        },
        // 获取分类标签类型
        getCategoryTag(category) {
            const map = {
                '信息不准确': 'danger',
                '信息不完整': 'warning',
                '回答不相关': 'danger',
                '其他问题': 'info'
            };
            return map[category] || '';
        },
        // 获取状态标签类型
        getStatusTag(status) {
            return status === '待处理' ? 'danger' : 'success';
        },
        // 处理预览节点变化
        handlePreviewNodeCheckChange(node) {
            if (node.isSelected) {
                // 添加到已选择列表
                const exists = this.selectedKnowledgeNodes.some(item => item.id === node.id);
                if (!exists) {
                    // 确保添加的节点包含所有必要的属性
                    this.selectedKnowledgeNodes.push({
                        id: node.id,
                        label: node.label,
                        content: node.content,
                        kgid: node.kgid,
                        type: node.type
                    });
                }
            } else {
                // 从已选择列表中移除
                const index = this.selectedKnowledgeNodes.findIndex(item => item.id === node.id);
                if (index !== -1) {
                    this.selectedKnowledgeNodes.splice(index, 1);
                }
            }
        },
        // 渲染Markdown内容
        renderMarkdown(content) {
            if (!content) return '';
            if (!this.md) return content;
            
            try {
                return this.md.render(content);
            } catch (error) {
                console.error('Markdown渲染失败:', error);
                return content;
            }
        },
        // 处理行展开
        handleRowExpand(row) {
        console.log('row',row)
            if (this.expandedRows.includes(row.md_id)) {
                this.expandedRows = this.expandedRows.filter(id => id !== row.md_id);
            } else {
                this.expandedRows.push(row.md_id);
            }
        }
    },
    mounted() {
        this.getFeedbackTableData();
        
        // 使用CDN加载markdown-it
        if (window.markdownit) {
            this.md = window.markdownit({
                html: true,
                linkify: true,
                typographer: true,
                breaks: true
            });
        } else {
            // 如果markdownit不存在，动态加载脚本
            const script = document.createElement('script');
            script.src = '../external_js/markdown-it.js';
            script.onload = () => {
                this.md = window.markdownit({
                    html: true,
                    linkify: true,
                    typographer: true,
                    breaks: true
                });
                
                // 如果当前有打开的详情，重新渲染
                if (this.currentFeedback && this.currentFeedback.ai_answer) {
                    this.renderedAIAnswer = this.md.render(this.currentFeedback.ai_answer);
                }
            };
            document.head.appendChild(script);
        }
    }
}
</script>

<style>
.feedback-container {
    padding: 20px;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.feedback-header {
    background: #fff;
    padding: 20px;
    border-radius: 4px;
    margin-bottom: 20px;
    box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.feedback-stats {
    margin-bottom: 20px;
}

.stat-item {
    text-align: center;
    padding: 20px 0;
}

.stat-title {
    font-size: 14px;
    color: #909399;
    margin-bottom: 10px;
}

.stat-value {
    font-size: 24px;
    font-weight: bold;
    color: #303133;
}

.feedback-table {
    flex: 1;
    background: #fff;
    padding: 20px;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

/* 设置表格悬浮框的最大宽度为页面的50% */
.el-tooltip__popper {
    max-width: 50vw !important;
    word-break: break-all;
}

/* 设置表格单元格内容的悬浮样式 */
.el-table .cell {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.pagination-container {
    margin-top: 20px;
    text-align: right;
}

.danger-text {
    color: #F56C6C;
}

.feedback-detail {
    padding: 20px;
}

.detail-item {
    margin-bottom: 15px;
}

.detail-item label {
    font-weight: bold;
    margin-right: 10px;
    color: #606266;
}

.detail-content {
    margin-top: 10px;
    padding: 10px;
    background: #f5f7fa;
    border-radius: 4px;
    line-height: 1.5;
}

.markdown-content {
    white-space: pre-wrap;
}

/* Markdown内容样式优化 */
.markdown-content img {
    max-width: 100%;
}

.markdown-content pre {
    background-color: #f0f0f0;
    padding: 10px;
    border-radius: 4px;
    overflow-x: auto;
}

.markdown-content code {
    background-color: #f0f0f0;
    padding: 2px 4px;
    border-radius: 3px;
}

.table-cell-content {
    display: inline-block;
    vertical-align: middle;
}

.clickable-text {
    color: #409EFF;
    cursor: pointer;
    transition: color 0.3s;
}

.clickable-text:hover {
    color: #66b1ff;
    text-decoration: underline;
}

/* 知识库弹窗样式 */
.knowledge-dialog-container {
    display: flex;
    height: 600px;
    overflow: hidden;
}

.knowledge-tree-panel {
    width: 320px;
    border-right: 1px solid #e6e6e6;
    display: flex;
    flex-direction: column;
    background-color: #fff;
    margin-right: 20px;
}

.knowledge-tree-panel .search-box {
    padding: 16px;
    border-bottom: 1px solid #e6e6e6;
    background-color: #fbfbfb;
}

.knowledge-tree-panel .tree-container {
    flex: 1;
    overflow: auto;
    padding: 12px;
    background-color: #fff;
}

.knowledge-preview-panel {
    flex: 1;
    overflow: auto;
    padding: 0 10px;
}

.knowledge-preview-panel h3 {
    margin-top: 0;
    padding-bottom: 10px;
    border-bottom: 1px solid #ebeef5;
}

.knowledge-item-card {
    margin-bottom: 15px;
}

.empty-knowledge-state {
    text-align: center;
    padding: 60px 0;
    color: #909399;
}

.empty-knowledge-state i {
    font-size: 48px;
    margin-bottom: 20px;
}

.empty-knowledge-state p {
    margin: 20px 0;
    font-size: 14px;
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

.node-label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.dialog-footer {
    text-align: right;
    display: block;
}

.preview-content {
    padding: 10px;
}

.category-preview {
    text-align: center;
    padding: 60px 0;
    color: #909399;
}

.category-preview h4 {
    margin-bottom: 10px;
}

.selected-nodes {
    margin-top: 10px;
}

.selected-tag {
    margin-right: 5px;
}

.no-selected-nodes {
    text-align: center;
    padding: 60px 0;
    color: #909399;
}

/* Markdown悬浮提示样式 */
.markdown-tooltip {
    max-width: 500px;
    max-height: 300px;
    overflow-y: auto;
    padding: 10px;
    line-height: 1.5;
}

.markdown-tooltip p {
    margin: 8px 0;
}

.markdown-tooltip pre {
    background-color: #f5f5f5;
    padding: 8px;
    border-radius: 4px;
    overflow-x: auto;
}

.markdown-tooltip code {
    background-color: #f5f5f5;
    padding: 2px 4px;
    border-radius: 3px;
    font-family: monospace;
}

.tooltip-icon {
    margin-left: 5px;
    color: #909399;
    cursor: pointer;
}
</style>
