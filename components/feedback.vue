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
                        type="datetimerange"
                        range-separator="至"
                        start-placeholder="开始日期"
                        end-placeholder="结束日期"
                        value-format="yyyy-MM-dd HH:mm:ss"
                        format="yyyy-MM-dd HH:mm:ss">
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
                <el-form-item label="反馈类型">
                    <el-select v-model="filterForm.category" placeholder="请选择类型" clearable>
                        <el-option 
                            v-for="type in feedbackTypes" 
                            :key="type.feedback_type"
                            :label="type.feedback_type" 
                            :value="type.feedback_type">
                        </el-option>
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
                    <!-- <el-button @click="handleExport">批量导出</el-button> -->
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
                <el-table-column prop="date" label="日期" width="180" sortable></el-table-column>
                <el-table-column prop="user_id" label="用户ID" width="120"></el-table-column>
                <el-table-column prop="feedback_type" label="反馈类型" width="120">
                    <template #default="scope">
                        <el-tag 
                            :type="getCategoryTag(scope.row.feedback_type)"
                            size="small">
                            {{ scope.row.feedback_type }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="detail" label="反馈内容" show-overflow-tooltip></el-table-column>
                <el-table-column prop="user_question" label="原始问题" show-overflow-tooltip></el-table-column>
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
                <el-table-column prop="model_name" label="使用模型" show-overflow-tooltip width="120"></el-table-column>
                <el-table-column prop="category" label="知识分类" show-overflow-tooltip></el-table-column>
                <el-table-column prop="kb_reference" label="引用知识点" width="100">
                    <template #default="scope">
                        <span 
                            class="clickable-text"
                            @click="viewKbReference(scope.row)">
                            {{ scope.row.kb_reference && scope.row.kb_reference.length > 0 
                                ? '详情' 
                                : '暂无知识点' }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column prop="treatment_state" label="状态" width="100">
                    <template #default="scope">
                        <el-tag 
                            :type="getStatusTag(scope.row.treatment_state)"
                            size="small">
                            {{ scope.row.treatment_state }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="反馈处理" width="200" fixed="right">
                    <template #default="scope">
                        <el-button 
                            type="text" 
                            size="small" 
                            @click="viewDetail(scope.row)">
                            对话详情
                        </el-button>
                        <el-button 
                            type="text" 
                            size="small" 
                            @click="viewKnowledge(scope.row)">
                            知识标注
                        </el-button>
                        <el-button 
                            type="text" 
                            size="small" 
                            @click="openProcessingDialog(scope.row)">
                            处理详情
                        </el-button>
                        <!-- <el-button 
                            style="color: #F77F6C;"
                            type="text" 
                            size="small" 
                            @click="deletefeedback(scope.row)">
                            删除
                        </el-button> -->
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
            @close="handleDialogClose"
            center
            custom-class="feedback-detail-dialog">
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
                    <label>用户ID：</label>
                    <span>{{ currentFeedback.user_id }}</span>
                </div>
                <div class="detail-item">
                    <label>用户问题：</label>
                    <span class="detail-content-inline">{{ currentFeedback.user_question }}</span>
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
                <div class="detail-item">
                    <label>使用模型：</label>
                    <span>{{ currentFeedback.model_name }}</span>
                </div>
                <div class="detail-item">
                    <label>知识分类：</label>
                    <span>{{ currentFeedback.category }}</span>
                </div>
                <div class="detail-item">
                    <label>处理意见：</label>
                    <el-tag 
                        size="small" 
                        :type="getAuditStatusTag(currentFeedback.audit_status)">
                        {{ currentFeedback.audit_status || '暂无' }}
                    </el-tag>
                </div>
                <div class="detail-item" v-if="currentFeedback.processing_remarks">
                    <label>处理备注：</label>
                    <div class="detail-content">{{ currentFeedback.processing_remarks }}</div>
                </div>
            </div>
        </el-dialog>

        <!-- 引用知识点详情弹框 -->
        <el-dialog 
            title="引用知识点详情" 
            :visible="kbReferenceDialogVisible"
            width="70%"
            @close="handleKbReferenceDialogClose">
            <div v-if="currentFeedback" class="kb-reference-detail">
                <el-table
                    :data="currentFeedback.kb_reference || []"
                    style="width: 100%"
                    border
                    row-key="kb_id">
                    <el-table-column prop="kb_id" label="知识点ID" width="100"></el-table-column>
                    <el-table-column prop="kb_title" label="知识库标题" show-overflow-tooltip></el-table-column>
                    <el-table-column prop="kb_content" label="知识库内容" show-overflow-tooltip>
                        <template #default="scope">
                            <div class="kb-content">{{ scope.row.kb_content }}</div>
                        </template>
                    </el-table-column>
                    <el-table-column prop="similarity" label="相似度" width="100">
                        <template #default="scope">
                            {{ scope.row.similarity }}%
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </el-dialog>

        <!-- 知识库弹窗 -->
        <el-dialog 
            title="选择正确的知识点" 
            :visible="knowledgeDialogVisible"
            width="80%"
            top="5vh"
            @close="handleKnowledgeDialogClose">
            <div class="knowledge-dialog-container">
                <!-- 左侧知识树 -->
                <div class="knowledge-tree-panel">
                    <div class="department-selector">
                        <el-select v-model="selectedDepartment" placeholder="请选择知识库">
                            <el-option label="市监局知识库" value="龙岗政数局"></el-option>
                            <el-option label="医保中心知识库" value="市医保中心"></el-option>
                        </el-select>
                    </div>
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
                    <!-- 用户问题和AI回答区域 -->
                    <div class="user-qa-section">
                        <el-collapse v-model="qaCollapseActive">
                            <el-collapse-item title="市民原始问题" name="question">
                                <div class="qa-content">{{ currentFeedbackForKnowledge ? currentFeedbackForKnowledge.user_question : '' }}</div>
                            </el-collapse-item>
                            <el-collapse-item title="AI回答" name="answer">
                                <div class="qa-content" v-html="renderedKnowledgeAIAnswer"></div>
                            </el-collapse-item>
                        </el-collapse>
                    </div>
                    
                    <!-- 添加AI生成的回答区域 -->
                    <div class="generated-answer-section" v-if="AIAnswer">
                        <el-divider>AI重新生成的回答</el-divider>
                        <div class="generated-answer-content" v-html="renderedGeneratedAnswer"></div>
                    </div>
                    
                    <el-divider>原始引用的知识点</el-divider>
                    
                    <!-- 已引用的知识点 -->
                    <div class="referenced-knowledge-section">
                        <div v-if="originalKnowledgeNodes.length > 0" class="referenced-nodes">
                            <el-tag
                                v-for="item in originalKnowledgeNodes"
                                :key="item.kb_id"
                                closable
                                type="info"
                                @close="removeOriginalKnowledge(item)"
                                class="referenced-tag">
                                {{ item.kb_title }}
                            </el-tag>
                        </div>
                        <div v-else class="no-referenced-nodes">
                            <p>暂无原始引用的知识点</p>
                        </div>
                        <div class="reset-button-container">
                            <el-button size="small" @click="resetOriginalKnowledge">召回引用知识点</el-button>
                        </div>
                    </div>
                    
                    <!-- 已选择的知识点（新增的知识点）-->
                    <div v-if="selectedKnowledgeNodes.length > 0" class="selected-nodes-section">
                        <div class="selected-nodes-title">新选择的知识点</div>
                        <div class="selected-nodes">
                            <el-tag
                                v-for="item in selectedKnowledgeNodes"
                                :key="item.id"
                                closable
                                type="success"
                                @close="removeSelectedKnowledge(item)"
                                class="selected-tag">
                                {{ item.label }}
                            </el-tag>
                        </div>
                    </div>
                    <div v-else class="no-selected-nodes">
                        <p>尚未选择任何新知识点</p>
                    </div>
                    
                    <el-divider>知识点内容预览</el-divider>
                    
                    <div v-if="currentPreviewNode && currentPreviewNode.type === 'item'" class="preview-content">
                        <el-card class="knowledge-item-card" shadow="hover">
                            <template #header>
                                <div class="clearfix">
                                    <span class="knowledge-item-title">{{ currentPreviewNode.label }}</span>
                                    <el-checkbox 
                                        v-model="currentPreviewNode.isSelected" 
                                        @change="handlePreviewNodeCheckChange(currentPreviewNode)"
                                        class="knowledge-item-checkbox">
                                        {{ currentPreviewNode.isSelected ? '已选择' : '选择' }}
                                    </el-checkbox>
                                </div>
                            </template>
                            <div class="item-content">{{ currentPreviewNode.content || '暂无内容' }}</div>
                            <div class="item-tip" v-if="currentPreviewNode.isSelected">
                                <i class="el-icon-success"></i> 该知识点已添加到上方的"已选择的知识点"区域
                            </div>
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
                </div>
            </div>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="knowledgeDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="submitSelectedKnowledge">确认提交</el-button>
                    <el-button type="success" @click="generateAIAnswer" :disabled="!canGenerateAnswer">AI生成回答</el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 处理详情弹窗 -->
        <el-dialog 
            title="处理意见" 
            :visible="processingDialogVisible"
            width="400px"
            @close="handleProcessingDialogClose">
            <div v-if="currentProcessingFeedback" class="processing-detail">
                <div class="detail-item">
                    <label>处理意见：</label>
                    <el-select 
                        v-model="currentProcessingFeedback.review_opinions" 
                        placeholder="请选择处理意见"
                        style="width: 100%">
                        <el-option label="通过" value="通过"></el-option>
                        <el-option label="不通过" value="不通过"></el-option>
                        <el-option label="待修改" value="待修改"></el-option>
                        <el-option label="暂无" value="暂无"></el-option>
                    </el-select>
                </div>
            </div>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="processingDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="saveProcessingDetails">保存</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script type="module">
// const baseUrl = 'http://172.16.99.32:1032/api/docs#/Feedback/feed_back_endpoint_api_feedback_post';
// const baseUrl = 'http://172.16.99.32:1034';
// const baseUrl = 'https://lgdev.baicc.cc/';
const baseUrl = 'http://172.16.99.32:1034';
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
            // AI回答
            AIAnswer: false,
            // 统计数据
            stats: {
                today: 4,
                week: 12,
                month: 22,
                pending: 8
            },
            // 反馈类型列表
            feedbackTypes: [],
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
            expandedRows: [],
            // 审核意见
            audit_status: '',
            // 引用知识点详情弹窗
            kbReferenceDialogVisible: false,
            // 问答折叠面板激活项
            qaCollapseActive: ['question', 'answer'],
            // 原始引用的知识点
            originalKnowledgeNodes: [],
            // 原始引用知识点备份（用于重置）
            originalKnowledgeNodesBackup: [],
            // 重新生成的AI回答
            regeneratedAnswer: '',
            // 渲染后的重新生成回答
            renderedRegeneratedAnswer: '',
            // 渲染后的知识标注AI回答
            renderedKnowledgeAIAnswer: '',
            // 处理详情弹窗
            processingDialogVisible: false,
            // 当前处理中的反馈项
            currentProcessingFeedback: null,
            // 添加新的数据属性
            isGeneratingAnswer: false,
            generatedAnswer: '',
            renderedGeneratedAnswer: '',
            // 新增知识库部门选择
            selectedDepartment: '龙岗政数局',
            // 龙岗政数局知识点树
            lgznTreeData: [],
            // 市医保中心知识点树
            yibaoTreeData: [],
            // 添加新的数据属性
            streamResponse: '', // 用于存储流式响应的数据
            isStreaming: false, // 用于标记是否正在接收流式数据
            currentStreamChunk: '', // 用于存储当前的流式数据块
        }
    },
    computed: {
        // 添加新的计算属性
        canGenerateAnswer() {
            const totalKnowledgeCount = this.originalKnowledgeNodes.length + this.selectedKnowledgeNodes.length;
            return totalKnowledgeCount > 0 && totalKnowledgeCount <= 5;
        }
    },
    watch: {
        // 监听知识库搜索文本变化
        knowledgeFilterText(val) {
            this.$refs.knowledgeTree && this.$refs.knowledgeTree.filter(val);
        },
        // 监听部门变化
        selectedDepartment(val) {
            // 当部门变化时，重新获取知识库分类
            this.fetchKnowledgeCategories();
        },
        // 监听知识标注对话框显示状态
        knowledgeDialogVisible(val) {
            if (val) {
                // 当打开对话框时，重新获取知识库分类
                this.fetchKnowledgeCategories();
            }
        }
    },
    methods: {
        // 获取反馈类型列表
        async getFeedbackTypes() {
            try {
                const response = await axios.get(`${baseUrl}/api/feedbackType`, {
                    headers: {
                        'Authorization': API_AUTH_TOKEN,
                        'Content-Type': 'application/json'
                    }
                });
                if (response.data && response.data.feedback_list) {
                    this.feedbackTypes = response.data.feedback_list;
                }
            } catch (error) {
                console.error('获取反馈类型失败:', error);
                this.$message.error('获取反馈类型失败');
            }
        },
        // 获取表格数据
        async getFeedbackTableData() {
            console.log('this.currentPage',this.currentPage,this.pageSize)
            this.loading = true;
            try {
                // 构建查询参数，只在有值时才添加参数
                const params = {
                    pagenum: this.currentPage,
                    pagesize: this.pageSize
                };

                // 只在有值时添加筛选条件
                if (this.filterForm.category) {
                    params.feedback_type = this.filterForm.category;
                }
                
                if (this.filterForm.keyword) {
                    params.detail = this.filterForm.keyword;
                }
                
                if (this.filterForm.status) {
                    params.treatment_state = this.filterForm.status;
                }
                
                if (this.filterForm.dateRange && this.filterForm.dateRange[0]) {
                    params.start_time = this.filterForm.dateRange[0];
                }
                
                if (this.filterForm.dateRange && this.filterForm.dateRange[1]) {
                    params.end_time = this.filterForm.dateRange[1];
                }

                const response = await axios.get(`${baseUrl}/api/feedback/getDataByPage/`,{
                    headers: {
                        'Authorization': API_AUTH_TOKEN,
                        'Content-Type': 'application/json'
                    },
                    params: params
                });
                // const response = await axios.get('http://172.16.99.32:1032/api/feedback/getDataByPage/?pagenum=1&pagesize=10',{
                //     headers: {
                //         'Authorization': API_AUTH_TOKEN
                //     }
                // })
                
                // console.log('response',response.data.feedback_list)
                // 获取总条数
                // if (response.data.feedback_list && response.data.feedback_list.length > 0) {
                    this.total = response.data.total;
                // }
                
                // 处理数据，获取用户问题和AI回答
                this.tableData = response.data.feedback_list.map(feedback => {
                    const aiAnswerIndex = feedback.current_message || [];
                    
                    // 将```思考过程 替换为<a>，结尾的```替换为</a>
                    let filteredAnswer = aiAnswerIndex;
                    if (Array.isArray(aiAnswerIndex)) {
                        filteredAnswer = aiAnswerIndex;
                    } else if (typeof aiAnswerIndex === 'string') {
                        // 使用正则表达式替换```思考过程为<a>和结尾```为</a>
                        filteredAnswer = aiAnswerIndex.replace(/```思考过程/g, '<think>').replace(/```/g, '</think>');
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
                    
                    // 格式化日期
                    const formatDate = (dateString) => {
                        if (!dateString) return '';
                        const date = new Date(dateString);
                        return date.toLocaleString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false
                        }).replace(/\//g, '-');
                    };
                    
                    return {
                        ...feedback,
                        user_question: userQuestion,
                        ai_answer: filteredAnswer,
                        status: feedback.treatment_state || '待处理', // 使用 treatment_state 作为状态，如果为空则显示"待处理"
                        date: formatDate(feedback.created_at), // 格式化日期
                        processing_remarks: feedback.processing_remarks || '' // 处理备注
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
                    let processedAnswer = row.ai_answer;
                    // 替换思考过程标记为HTML标签(/```思考过程/g, '<think>').replace(/```/g, '</think>')
                    if (typeof processedAnswer === 'string') {
                        processedAnswer = processedAnswer.replace(/```思考过程/g, '<a class="thinking-process">').replace(/```/g, '</a>');
                    }
                    this.renderedAIAnswer = this.md.render(processedAnswer);
                } catch (error) {
                    console.error('Markdown渲染失败:', error);
                    this.renderedAIAnswer = row.ai_answer;
                }
            } else {
                this.renderedAIAnswer = row.ai_answer;
            }
        },
        // 查看知识库
        async viewKnowledge(row) {
            // 打开知识库弹窗
            this.currentFeedbackForKnowledge = {
                ...row,
                audit_status: row.audit_status || this.audit_status,
                // 保存model_name和user_question
                model_name: row.model_name,
                user_question: row.user_question,
                conversation_messages: row.conversation_messages || []
            };
            
            console.log('当前行数据:', this.currentFeedbackForKnowledge);
            this.knowledgeDialogVisible = true;
            this.selectedKnowledgeNodes = [];
            this.regeneratedAnswer = '';
            this.renderedRegeneratedAnswer = '';
            
            // 渲染AI回答
            if (row.ai_answer && this.md) {
                try {
                    let processedAnswer = row.ai_answer;
                    // 替换思考过程标记为HTML标签
                    if (typeof processedAnswer === 'string') {
                        processedAnswer = processedAnswer.replace(/```思考过程/g, '<think class="thinking-process">').replace(/```/g, '</think>');
                    }
                    this.renderedKnowledgeAIAnswer = this.md.render(processedAnswer);
                } catch (error) {
                    console.error('Markdown渲染失败:', error);
                    this.renderedKnowledgeAIAnswer = row.ai_answer;
                }
            } else {
                this.renderedKnowledgeAIAnswer = row.ai_answer;
            }
            
            // 初始化原始引用的知识点
            this.originalKnowledgeNodes = [];
            this.originalKnowledgeNodesBackup = [];
            
            // 检查是否有引用知识点
            if (row.kb_reference && Array.isArray(row.kb_reference) && row.kb_reference.length > 0) {
                console.log('获取到原始知识点引用:', row.kb_reference);
                
                // 提取所有的 kb_id
                const kbIds = row.kb_reference.map(item => item.kb_id);
                console.log('知识点ID列表:', kbIds);
                
                try {
                    // 根据选择的部门获取知识点内容
                    let knowledgeContent = [];
                    
                    if (row.department === '市医保中心') {
                        knowledgeContent = await this.fetchKnowledgeContent(kbIds);
                    } else {
                        knowledgeContent = await this.fetchLonggangKnowledgeContent(kbIds);
                    }
                    
                    console.log('获取到的知识点内容:', knowledgeContent);
                    
                    // 转换kb_reference为知识点节点格式
                    this.originalKnowledgeNodes = row.kb_reference.map((item, index) => {
                        const content = knowledgeContent[index] || {};
                        return {
                            kb_id: item.kb_id,
                            kb_title: content.title || '未知标题',
                            kb_content: content.content || '未找到内容',
                            kb_simil: item.similarity || 0
                        };
                    });
                    
                    console.log('处理后的原始知识点:', this.originalKnowledgeNodes);
                    
                    // 备份原始知识点，用于重置
                    this.originalKnowledgeNodesBackup = JSON.parse(JSON.stringify(this.originalKnowledgeNodes));
                } catch (error) {
                    console.error('获取知识点内容失败:', error);
                    this.$message.warning('获取原始知识点内容失败，请尝试重新打开');
                }
            } else {
                console.log('该反馈没有原始知识点引用');
            }
            
            // 根据原始知识点的来源部门自动选择部门
            if (row.department) {
                this.selectedDepartment = row.department;
            }
        },
        // 获取知识库分类
        async fetchKnowledgeCategories() {
            this.loading = true;
            this.knowledgeTree = []; // 清空现有树数据
            
            try {
                // console.log(`开始获取 ${this.selectedDepartment} 的知识分类数据`);
                
                const params = new URLSearchParams({
                    department: this.selectedDepartment
                });
                
                const apiUrl = `${baseUrl}/api/query_kb_category?${params.toString()}`;
                // console.log('请求URL:', apiUrl);
                
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': API_AUTH_TOKEN,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('响应错误:', errorText);
                    throw new Error(`获取分类失败: ${response.status} ${response.statusText}`);
                }
                
                const data = await response.json();
                // console.log(`获取到的原始数据:`, data);
                
                // 验证响应数据格式
                if (!data) {
                    console.warn(`${this.selectedDepartment} 返回数据为空`);
                    this.$message.warning('获取知识点分类数据为空');
                    this.loading = false;
                    return;
                }
                
                // 将API返回的数据转换为树形结构
                this.knowledgeTree = this.transformCategoryTree(data);
                // console.log(`${this.selectedDepartment} 转换后的知识树:`, this.knowledgeTree);
                
                if (this.knowledgeTree.length === 0) {
                    this.$message.warning('未找到有效的知识分类');
                }
                
                // 清空当前选中的节点
                if (this.currentNode) this.currentNode = null;
                if (this.currentNodeId) this.currentNodeId = null;
                if (this.knowledgeItems) this.knowledgeItems = [];
                
                // 如果树不为空，可以默认展开第一级
                if (this.knowledgeTree.length > 0) {
                    this.$nextTick(() => {
                        if (this.$refs.knowledgeTree) {
                            try {
                                // 展开所有节点
                                const expandAllNodes = (data) => {
                                    data.forEach(node => {
                                        if (node.children && node.children.length > 0) {
                                            if (this.$refs.knowledgeTree.store.nodesMap[node.id]) {
                                                this.$refs.knowledgeTree.store.nodesMap[node.id].expanded = true;
                                            }
                                            expandAllNodes(node.children);
                                        }
                                    });
                                };
                                
                                expandAllNodes(this.knowledgeTree);
                            } catch (error) {
                                console.error('展开节点时出错:', error);
                            }
                        }
                    });
                } else {
                    console.warn(`${this.selectedDepartment} 转换后的知识树为空`);
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
                        label: category.category2,
                        name: category.category2,
                        type: 'category',
                        children: Array.isArray(category.category3) ? category.category3
                            .filter(subCategory => subCategory) // 过滤掉空字符串
                            .map((subCategory, subIndex) => ({
                                id: `subcategory-${index}-${subIndex}`,
                                label: subCategory,
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
        async fetchKnowledgeByCategory(category, type = 'subcategory') {
            try {
                console.log(`获取 ${this.selectedDepartment} 下 ${category} 分类的知识点，类型: ${type}`);
                
                let apiUrl;
                
                // 根据不同部门选择不同的API接口
                if (this.selectedDepartment === '市医保中心') {
                    // 医保知识库使用 getKnowle 接口
                    apiUrl = `${baseUrl}/api/feedback/getKnowle/${encodeURIComponent(category)}`;
                } else if (this.selectedDepartment === '龙岗政数局') {
                    // 市监局知识库使用 getLGKnowle 接口
                    apiUrl = `${baseUrl}/api/feedback/getLGKnowle/${encodeURIComponent(category)}`;
                }
                
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': API_AUTH_TOKEN,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`获取知识点失败: ${response.status} ${response.statusText}`);
                }
                
                const data = await response.json();
                // console.log(`${category} 知识点数据:`, data);
                
                if (data && data.feedback_list) {
                    // 过滤掉无效的知识点
                    const validItems = data.feedback_list.filter(item => item && typeof item === 'object');
                    console.log(`找到 ${validItems.length} 个有效知识点`);
                    
                    // 将知识点添加到对应的分类节点下
                    if (validItems.length > 0) {
                        this.addKnowledgeItemsToTree(category, validItems, type);
                    }
                } else {
                    console.warn(`未找到 ${category} 的知识点数据或数据格式不正确`, data);
                    this.$message.warning(`未找到 ${category} 的知识点数据`);
                }
                
            } catch (error) {
                console.error('获取知识点失败:', error);
                this.$message.error('获取知识点失败: ' + error.message);
            }
        },
        
        // 将知识点添加到树中
        addKnowledgeItemsToTree(category, items, nodeType) {
            console.log(`添加知识点到树中: 分类=${category}, 类型=${nodeType}, 知识点数量=${items ? items.length : 0}`);
            
            if (!category || !items || !Array.isArray(items)) {
                console.warn('无效的知识点数据:', { category, items });
                return;
            }
            
            // 查找对应的分类节点
            const findCategoryNode = (tree, categoryName) => {
                if (!tree || !Array.isArray(tree)) return null;
                
                for (let node of tree) {
                    if (!node) continue;
                    
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
            if (!categoryNode) {
                console.warn(`未找到分类节点: ${category}`);
                this.$message.warning(`未找到分类: ${category}`);
                return;
            }
            
            // console.log(`找到分类节点:`, categoryNode);
            
            // 添加知识点作为子节点
            if (!categoryNode.children) {
                this.$set(categoryNode, 'children', []);
            }
            
            // 过滤掉无效项并转换知识点为树节点格式
            const knowledgeNodes = items
                .filter(item => item && typeof item === 'object')
                .map(item => {
                    // 确保每个知识点都有有效的kgid
                    const kgid = item.kgid || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    const label = item.title || '未命名知识点';
                    const content = item.content || '';
                    
                    return {
                        id: `item-${kgid}`, // 确保id是字符串类型且唯一
                        label: label,
                        content: content,
                        type: 'item',
                        parentId: categoryNode.id,
                        kgid: kgid, // 确保kgid存在
                        isLeaf: true,
                        parentCategory: categoryNode.parentCategory || null,
                        category: categoryNode.name
                    };
                });
            
            // console.log(`转换后的有效知识点节点数量: ${knowledgeNodes.length}`);
            
            // 添加到分类节点下
            categoryNode.children = knowledgeNodes;
            
            // 强制更新树，但保持展开状态
            this.$nextTick(() => {
                // 确保树节点保持展开状态
                if (this.$refs.knowledgeTree && categoryNode.id) {
                    try {
                        // 展开当前节点
                        const storeNode = this.$refs.knowledgeTree.store.nodesMap[categoryNode.id];
                        if (storeNode) {
                            storeNode.expanded = true;
                            console.log(`节点 ${categoryNode.id} 已展开`);
                        } else {
                            console.warn(`未找到节点 ${categoryNode.id} 的存储信息`);
                        }
                    } catch (error) {
                        console.error('展开节点时出错:', error);
                    }
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
            console.log('点击节点:', data);
            
            // 如果点击的是一级分类节点，不显示详情，也不做任何操作
            if (data.type === 'category') {
                this.currentPreviewNode = {
                    id: data.id,
                    label: data.label,
                    type: 'category'
                };
                return;
            }
            
            // 如果点击的是二级分类节点，获取该分类下的知识点，但不显示详情
            if (data.type === 'subcategory') {
                this.currentPreviewNode = {
                    id: data.id,
                    label: data.label,
                    type: 'category' // 使用category类型，以便展示适当的预览视图
                };
                
                // 获取该分类下的知识点
                // 使用 data.name 而不是 data.label，因为我们在构建树时使用了 name 属性
                this.fetchKnowledgeByCategory(data.name || data.label, data.type);
                return;
            }
            
            // 只有点击知识点节点时才设置当前预览节点和允许勾选
            if (data.type === 'item') {
                // 设置当前预览节点
                this.currentPreviewNode = JSON.parse(JSON.stringify(data));
                
                // 检查节点是否已被选中
                const nodeId = data.id || '';
                const isSelected = this.selectedKnowledgeNodes.some(node => {
                    const selectedId = node.id || '';
                    return selectedId === nodeId;
                });
                
                this.currentPreviewNode.isSelected = isSelected;
                
                // 打印节点信息，便于调试
                console.log('点击知识点:', {
                    id: data.id,
                    kgid: data.kgid,
                    label: data.label,
                    isSelected: this.currentPreviewNode.isSelected,
                    parentCategory: data.parentCategory,
                    category: data.category
                });
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
            this.originalKnowledgeNodes = [];
            this.originalKnowledgeNodesBackup = [];
            this.regeneratedAnswer = '';
            this.renderedRegeneratedAnswer = '';
            this.renderedKnowledgeAIAnswer = '';
            this.generatedAnswer = ''; // 清空生成的回答
            this.renderedGeneratedAnswer = ''; // 清空渲染后的回答
        },
        
        // 移除已选择的知识点
        removeSelectedKnowledge(item) {
            const itemId = item.id || '';
            const index = this.selectedKnowledgeNodes.findIndex(node => {
                const nodeId = node.id || '';
                return nodeId === itemId;
            });
            
            if (index !== -1) {
                this.selectedKnowledgeNodes.splice(index, 1);
                
                // 如果当前预览的就是这个节点，更新其选中状态
                if (this.currentPreviewNode && (this.currentPreviewNode.id || '') === itemId) {
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
            
            // 检查是否至少有一个知识点（原始或新选择的）
            if (this.selectedKnowledgeNodes.length === 0 && this.originalKnowledgeNodes.length === 0) {
                this.$message.warning('请至少选择一个知识点');
                return;
            }
            
            try {
                // 构建提交选中的新知识库数据，确保每个知识点都有有效的kgid
                const newKnowledgeItems = this.selectedKnowledgeNodes.map(item => ({
                    kgid: item.kgid || `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    title: item.label || '未命名知识点',
                    content: item.content || ''
                }));
                
                // 构建保留的原始知识点数据
                const originalKnowledgeItems = this.originalKnowledgeNodes.map(item => ({
                    kgid: item.kb_id || `original-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    title: item.kb_title || '未命名知识点',
                    content: item.kb_content || '',
                    kb_simil: item.kb_simil || 0
                }));
                
                // 合并两种知识点
                const allKnowledgeItems = [...originalKnowledgeItems, ...newKnowledgeItems];
                
                // 在控制台打印JSON结构，便于调试
                console.log('提交的原始知识点数据:', originalKnowledgeItems);
                console.log('提交的新选择知识点数据:', newKnowledgeItems);
                console.log('提交的所有知识点数据:', allKnowledgeItems);
                
                // 构建提交数据
                const submitData = {
                    feedback_id: this.currentFeedbackForKnowledge.md_id,
                    treatment_state: '已处理',
                    review_opinions: this.currentFeedbackForKnowledge.review_opinions || '暂无',
                    right_kgcontent: JSON.stringify(allKnowledgeItems)
                };
                
                // 发送请求
                await axios.post(`${baseUrl}/api/feedback/updateKnowById/`, submitData, {
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
        // 获取处理意见标签类型
        getAuditStatusTag(status) {
            const map = {
                '通过': 'success',
                '不通过': 'danger',
                '待修改': 'warning',
                '暂无': 'info'
            };
            return map[status] || 'info';
        },
        // 处理预览节点变化
        handlePreviewNodeCheckChange(node) {
            const totalKnowledgeCount = this.originalKnowledgeNodes.length + this.selectedKnowledgeNodes.length;
            
            if (node.isSelected) {
                if (totalKnowledgeCount >= 5) {
                    this.$message.warning('知识点总数不能超过5个');
                    node.isSelected = false;
                    return;
                }
                
                // 添加到已选择列表
                const nodeId = node.id || '';
                const exists = this.selectedKnowledgeNodes.some(item => {
                    const itemId = item.id || '';
                    return itemId === nodeId;
                });
                
                if (!exists) {
                    this.selectedKnowledgeNodes.push({
                        id: node.id || `temp-id-${Date.now()}`,
                        label: node.label || '未命名知识点',
                        content: node.content || '',
                        kgid: node.kgid || `temp-kgid-${Date.now()}`,
                        type: node.type || 'item'
                    });
                }
            } else {
                // 从已选择列表中移除
                const nodeId = node.id || '';
                const index = this.selectedKnowledgeNodes.findIndex(item => {
                    const itemId = item.id || '';
                    return itemId === nodeId;
                });
                
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
                let processedContent = content;
                // 替换思考过程标记为HTML标签
                if (typeof processedContent === 'string') {
                    processedContent = processedContent.replace(/```思考过程/g, '<think class="thinking-process">').replace(/```/g, '</think>');
                }
                return this.md.render(processedContent);
            } catch (error) {
                console.error('Markdown渲染失败:', error);
                return content;
            }
        },
        // 处理行展开
        handleRowExpand(row) {
        // console.log('row',row)
            if (this.expandedRows.includes(row.md_id)) {
                this.expandedRows = this.expandedRows.filter(id => id !== row.md_id);
            } else {
                this.expandedRows.push(row.md_id);
            }
        },
        // 批量导出
        handleExport() {
            console.log('批量导出')
        },
        // 处理审核意见变更
        async handleAuditStatusChange(row) {
            try {
                // 更新当前行的处理意见
                row.audit_status = row.audit_status || this.audit_status;
                // console.log('审核意见已更改为:', row.audit_status, '反馈ID:', row.md_id);
            } catch (error) {
                // 如果更新失败，恢复原来的值
                this.getFeedbackTableData();
            }
        },
        // 查看引用知识点详情
        async viewKbReference(row) {
            this.currentFeedback = row;
            console.log('知识点row', row, row.department);
            
            if (row.kb_reference && Array.isArray(row.kb_reference)) {
                //TODO: 需要修改  row.department === '市医保中心'
                if (row.department === '市医保中心') {
                    // 提取所有的 kb_id
                    const kgids = row.kb_reference.map(item => item.kb_id);
                    
                    // 获取知识点内容
                    const knowledgeContent = await this.fetchKnowledgeContent(kgids);
                    
                    // 将获取到的内容与原始数据合并
                    const mergedKbReference = row.kb_reference.map((ref, index) => {
                        const content = knowledgeContent[index];
                        return {
                            kb_id: ref.kb_id,
                            similarity: ref.similarity,
                            kb_title: content ? content.title : '',
                            kb_content: content ? content.content : ''
                        };
                    });
                    
                    // 更新当前反馈的知识点引用数据
                    this.currentFeedback = {
                        ...row,
                        kb_reference: mergedKbReference
                    };
                } else {
                    // 龙岗政数局处理逻辑
                    const kbIds = row.kb_reference.map(item => item.kb_id);
                    
                    // 获取知识点内容
                    const knowledgeContent = await this.fetchLonggangKnowledgeContent(kbIds);
                    
                    // 将获取到的内容与原始数据合并
                    const mergedKbReference = row.kb_reference.map((ref, index) => {
                        const content = knowledgeContent[index];
                        return {
                            kb_id: ref.kb_id, // 保持kb_id字段一致
                            similarity: ref.similarity,
                            kb_title: content ? content.title : '',
                            kb_content: content ? content.content : ''
                        };
                    });
                    
                    // 更新当前反馈的知识点引用数据
                    this.currentFeedback = {
                        ...row,
                        kb_reference: mergedKbReference
                    };
                }
            }
            
            this.kbReferenceDialogVisible = true;
        },
        
        // 处理引用知识点弹框关闭
        handleKbReferenceDialogClose() {
            this.kbReferenceDialogVisible = false;
        },
        // 移除原始引用的知识点
        removeOriginalKnowledge(item) {
            const totalKnowledgeCount = this.originalKnowledgeNodes.length + this.selectedKnowledgeNodes.length;
            if (totalKnowledgeCount <= 1) {
                this.$message.warning('至少需要保留一个知识点');
                return;
            }
            
            const index = this.originalKnowledgeNodes.findIndex(node => node.kb_id === item.kb_id);
            if (index !== -1) {
                this.originalKnowledgeNodes.splice(index, 1);
            }
        },
        
        // 重置原始引用的知识点
        resetOriginalKnowledge() {
            this.originalKnowledgeNodes = JSON.parse(JSON.stringify(this.originalKnowledgeNodesBackup));
        },
        
        // 重新生成AI回答
        async generateAIAnswer() {
            if (!this.currentFeedbackForKnowledge || !this.currentFeedbackForKnowledge.user_question) {
                this.$message.warning('无法获取用户问题');
                return;
            }

            const totalKnowledgeCount = this.originalKnowledgeNodes.length + this.selectedKnowledgeNodes.length;
            if (totalKnowledgeCount === 0) {
                this.$message.warning('请至少选择一个知识点');
                return;
            }
            if (totalKnowledgeCount > 5) {
                this.$message.warning('知识点总数不能超过5个');
                return;
            }

            this.isGeneratingAnswer = true;
            this.isStreaming = true;
            this.streamResponse = '';
            this.currentStreamChunk = '';
            this.$message.info('正在生成回答，请稍候...');

            try {
                // 构建知识点引用数据
                const kb_reference = [
                    ...this.originalKnowledgeNodes.map(item => ({
                        kb_id: item.kb_id,
                        kb_title: item.kb_title,
                        kb_content: item.kb_content,
                        similarity: item.kb_simil || 0
                    })),
                    ...this.selectedKnowledgeNodes.map(item => ({
                        kb_id: item.kgid,
                        kb_title: item.label,
                        kb_content: item.content,
                        similarity: 0
                    }))
                ];

                // 构建消息历史
                const messages = [];
                
                // 添加用户问题
                messages.push({
                    role: "user",
                    content: this.currentFeedbackForKnowledge.user_question
                });
                
                // 如果有AI回答，添加到消息中
                if (this.currentFeedbackForKnowledge.ai_answer) {
                    messages.push({
                        role: "assistant",
                        content: this.currentFeedbackForKnowledge.ai_answer
                    });
                }

                // 生成UUID作为chat_id
                const uuid = this.generateUUID();

                // 构建请求数据
                const requestData = {
                    model: this.currentFeedbackForKnowledge.model_name,
                    messages: [{
                        role: 'user',
                        content: this.currentFeedbackForKnowledge.user_question
                    }],
                    kb_reference: kb_reference,
                    max_tokens: 10240,
                    temperature: 0.6,
                    stream: true,
                    chat_id: uuid,
                    // TODO: 需要修改
                    department: this.currentFeedbackForKnowledge.department,
                    kb_category: this.currentFeedbackForKnowledge.category
                };

                console.log('AI生成请求数据:', requestData);

                // 发送请求并处理流式响应
                const response = await fetch(`${baseUrl}/v1/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Authorization': API_AUTH_TOKEN,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestData)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                // 获取响应流读取器
                const reader = response.body.getReader();
                const decoder = new TextDecoder("utf-8");
                
                let fullContent = "";
                let accumulatedContent = "";
                let jsonBuffer = ""; // 添加JSON缓冲区
                let currentEvent = null;
                let knowledgeData = [];  // 存储knowledge事件数据

                // 通过reader.read()处理流式响应
                while (true) {
                    const { done, value } = await reader.read();

                    if (done) {
                        break;
                    }

                    this.AIAnswer = true;
                    // 解码二进制数据为文本
                    const chunk = decoder.decode(value, { stream: true });

                    // 处理包含"data:"前缀的流式数据
                    const lines = chunk.split("\n");
                    for (const line of lines) {
                        if (line.startsWith("event:")) {
                            currentEvent = line.substring(6).trim();
                            continue;
                        }
                        if (line.startsWith("data:")) {
                            let jsonStr = line.substring(5).trim();
                            if (!jsonStr) continue;
                            if (jsonStr.includes("DONE")) continue;

                            // 处理knowledge事件数据
                            if (currentEvent === "knowledge" && jsonStr.includes("kb_title")) {
                                console.log("收到 knowledge 数据块:", jsonStr);
                                try {
                                    // 尝试解析JSON字符串
                                    const knowledgeItem = JSON.parse(jsonStr);
                                    // 如果 knowledgeItem 是数组，展开它；如果是单个对象，直接添加
                                    if (Array.isArray(knowledgeItem)) {
                                        knowledgeData.push(...knowledgeItem);
                                    } else {
                                        knowledgeData.push(knowledgeItem);
                                    }
                                } catch (e) {
                                    console.error("解析knowledge数据失败:", e, "数据:", jsonStr);
                                }
                                continue;
                            }

                            // 处理可能被分割的JSON
                            if (!jsonStr.startsWith("{") && jsonBuffer) {
                                // 这可能是前一个JSON的继续
                                jsonBuffer += jsonStr;
                                jsonStr = jsonBuffer;
                            } else if (jsonStr.startsWith("{") && !jsonStr.endsWith("}")) {
                                // 这是一个新的不完整JSON
                                jsonBuffer = jsonStr;
                                continue;
                            } else if (jsonStr.startsWith("{") && jsonStr.endsWith("}")) {
                                // 完整的JSON，重置缓冲区
                                jsonBuffer = "";
                            }

                            try {
                                // 检查JSON字符串是否完整
                                if (jsonStr.endsWith('}') || jsonStr.endsWith(']')) {
                                    const data = JSON.parse(jsonStr);

                                    // 从流中提取内容
                                    if (data.choices && data.choices.length > 0 && data.choices[0].delta) {
                                        const delta = data.choices[0].delta;

                                        // 如果有内容，添加到累积内容中
                                        if (delta.content) {
                                            const content = delta.content;

                                            fullContent += content;
                                            accumulatedContent += content;

                                            // 立即更新UI显示
                                            if (this.md) {
                                                this.renderedGeneratedAnswer = this.md.render(fullContent);
                                            } else {
                                                this.renderedGeneratedAnswer = fullContent;
                                            }

                                            // 避免过于频繁的渲染导致性能问题
                                            if (accumulatedContent.length > 10 || content.includes("\n")) {
                                                accumulatedContent = "";
                                            }
                                        }
                                    }
                                } else {
                                    // 如果JSON不完整，记录但不抛出错误
                                    console.warn("收到不完整的JSON数据，跳过此块:", jsonStr);
                                }
                            } catch (e) {
                                console.error("解析流式数据失败:", e, "数据:", jsonStr);
                                // 不中断流程，继续处理下一块数据
                            }
                        }
                    }
                }

                // 确保解码器刷新所有剩余内容
                decoder.decode();
                
                // 处理可能剩余在缓冲区的JSON数据
                if (jsonBuffer && jsonBuffer.endsWith('}')) {
                    try {
                        const data = JSON.parse(jsonBuffer);
                        if (data.choices && data.choices.length > 0 && data.choices[0].delta && data.choices[0].delta.content) {
                            const content = data.choices[0].delta.content;
                            fullContent += content;
                            if (this.md) {
                                this.renderedGeneratedAnswer = this.md.render(fullContent);
                            } else {
                                this.renderedGeneratedAnswer = fullContent;
                            }
                        }
                    } catch (e) {
                        console.warn("处理剩余缓冲区数据失败:", e);
                    }
                    jsonBuffer = "";
                }

                this.generatedAnswer = fullContent;
                this.$message.success('回答生成成功');
                
                // 确保生成的回答区域可见
                this.qaCollapseActive = ['question', 'answer'];
                
            } catch (error) {
                console.error('生成回答失败:', error);
                this.$message.error('生成回答失败: ' + error.message);
            } finally {
                this.isGeneratingAnswer = false;
                this.isStreaming = false;
            }
        },

        // 打开处理详情弹窗
        openProcessingDialog(row) {
            this.currentProcessingFeedback = {
                md_id: row.md_id,
                review_opinions: row.review_opinions || '暂无'
            };
            this.processingDialogVisible = true;
        },

        // 处理处理详情弹窗关闭
        handleProcessingDialogClose() {
            this.processingDialogVisible = false;
            this.currentProcessingFeedback = null;
        },

        // 保存处理详情
        async saveProcessingDetails() {
            if (!this.currentProcessingFeedback) {
                this.$message.warning('未选择反馈项');
                return;
            }
            
            try {
                // 更新本地表格数据中的处理意见
                const index = this.tableData.findIndex(item => item.md_id === this.currentProcessingFeedback.md_id);
                if (index !== -1) {
                    this.tableData[index].review_opinions = this.currentProcessingFeedback.review_opinions;
                }
                
                this.processingDialogVisible = false;
                
            } catch (error) {
                console.error('提交处理意见失败:', error);
                this.$message.error('提交处理意见失败: ' + error.message);
            }
        },

        // 添加回医保获取知识点内容的方法
        async fetchKnowledgeContent(kgids) {
            try {
                const response = await axios.post(`${baseUrl}/api/feedbackKnow_Cnt`, kgids, {
                    headers: {
                        'Authorization': API_AUTH_TOKEN,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.data && response.data.feedback_list) {
                    return response.data.feedback_list;
                }
                return [];
            } catch (error) {
                console.error('获取知识点内容失败:', error);
                // this.$message.error('获取知识点内容失败');
                return [];
            }
        },
        // 添加获取龙岗知识点内容方法
        async fetchLonggangKnowledgeContent(kgids) {
            try {
                const response = await axios.post(`${baseUrl}/api/feedbackLGKnow_Cnt`, { ids:kgids }, {
                    headers: {
                        'Authorization': API_AUTH_TOKEN,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.data && response.data.feedback_list) {
                    return response.data.feedback_list;
                }
                return [];
            } catch (error) {
                console.error('获取知识点内容失败:', error);
                // this.$message.error('获取知识点内容失败');
                return [];
            }
        },
        generateUUID() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
    },
    mounted() {
        this.getFeedbackTableData();
        this.getFeedbackTypes(); // 获取反馈类型列表
        
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

<style scoped>
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
    padding: 10px 20px;
    max-height: calc(90vh - 150px);
    overflow-y: auto;
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
    height: 750px;
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

.knowledge-tree-panel .department-selector {
    padding: 16px;
    border-bottom: 1px solid #e6e6e6;
    background-color: #fbfbfb;
}

.knowledge-tree-panel .department-selector .el-select {
    width: 100%;
}

.knowledge-tree-panel .el-select .el-input__inner {
    height: 40px;
    line-height: 40px;
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
.el-dialog__body {
    padding: 0;
}
.detail-content-inline {
    display: inline-block;
    line-height: 1.5;
}

/* 知识点引用弹框样式 */
.kb-reference-detail {
    padding: 20px;
}

.kb-content {
    max-height: 200px;
    overflow-y: auto;
    white-space: pre-wrap;
    line-height: 1.5;
}

/* 用户问题和AI回答区域样式 */
.user-qa-section {
    margin-bottom: 20px;
}

.qa-content {
    padding: 10px;
    background-color: #f9f9f9;
    border-radius: 4px;
    line-height: 1.5;
    max-height: 200px;
    overflow-y: auto;
}

/* 已引用知识点区域样式 */
.referenced-knowledge-section {
    margin-bottom: 20px;
}

.referenced-nodes {
    margin-bottom: 10px;
}

.referenced-tag {
    margin-right: 5px;
    margin-bottom: 5px;
}

.no-referenced-nodes {
    text-align: center;
    padding: 20px 0;
    color: #909399;
}

.reset-button-container {
    margin-top: 10px;
    text-align: right;
}

/* 新增的知识点区域样式 */
.selected-nodes-section {
    margin: 15px 0;
    padding: 10px;
    background-color: #f0f9eb;
    border-radius: 4px;
    border-left: 3px solid #67c23a;
}

.selected-nodes-title {
    font-weight: bold;
    margin-bottom: 10px;
    color: #67c23a;
}

.selected-nodes {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.selected-tag {
    margin-bottom: 5px;
}

.no-selected-nodes {
    text-align: center;
    padding: 10px 0;
    color: #909399;
    font-style: italic;
    background-color: #f9f9f9;
    border-radius: 4px;
    margin: 10px 0;
}

/* 重新生成回答区域样式 */
.generated-answer-section {
    margin: 15px 0;
    padding: 15px;
    background-color: #f0f9eb;
    border-radius: 4px;
    border-left: 3px solid #67c23a;
}

.generated-answer-content {
    /* line-height: 1.6;
    white-space: pre-wrap; */
    max-height: 300px;
    overflow-y: auto;
    padding: 10px;
    background-color: #fff;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

/* 知识点卡片标题和复选框样式 */
.knowledge-item-title {
    font-weight: bold;
    display: inline-block;
    max-width: 80%;
    vertical-align: middle;
    margin-left: 5px;
    margin-right: 5px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.knowledge-item-checkbox {
    display: inline-block;
    vertical-align: middle;
    float: right;
    margin: 0;
    padding: 0;
}

.item-tip {
    margin-top: 10px;
    padding: 8px;
    background-color: #f0f9eb;
    color: #67c23a;
    border-radius: 4px;
    font-size: 13px;
}

.item-tip i {
    margin-right: 5px;
}

/* 自定义复选框颜色 */
.knowledge-item-checkbox .el-checkbox__input.is-checked .el-checkbox__inner {
    background-color: #409EFF;
    border-color: #409EFF;
}

.knowledge-item-checkbox .el-checkbox__inner {
    border-color: #606266;
    border-width: 2px;
}

.knowledge-item-checkbox .el-checkbox__inner:hover {
    border-color: #409EFF;
}

.item-content {
    padding: 12px;
    line-height: 1.6;
    color: #303133;
    font-size: 14px;
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 280px;
    overflow-y: auto;
    background-color: #f8f8f8;
    border-radius: 4px;
    border-left: 3px solid #409EFF;
    margin-bottom: 10px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    box-shadow: inset 0 0 5px rgba(0,0,0,0.05);
}

.item-content:hover {
    background-color: #f0f7ff;
    transition: background-color 0.3s ease;
}

.clearfix {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
}

.clearfix:after {
    content: "";
    display: table;
    clear: both;
}

/* 处理详情弹窗样式 */
.processing-detail {
    padding: 20px 10px;
}

.processing-detail .detail-item {
    margin-bottom: 20px;
}

.processing-detail .detail-item label {
    display: block;
    margin-bottom: 8px;
    font-weight: bold;
    color: #606266;
}

.processing-detail .el-select {
    width: 100%;
}

.processing-detail .el-textarea {
    width: 100%;
}
</style>

<!-- 添加全局样式 -->
<style>
/* 设置表格悬浮框的宽度为自适应，最大宽度为页面的50% */
.el-tooltip__popper {
    width: auto !important; /* 改为自适应宽度 */
    max-width: 50vw !important; /* 保留最大宽度限制 */
    min-width: 200px; /* 设置最小宽度 */
    word-break: break-all;
    max-height: 80vh;
    overflow: visible; /* 修改为visible以移除滚动条 */
}

/* 确保悬浮框内容不会溢出 */
.el-tooltip__popper .popper__arrow {
    border-width: 6px !important;
}

/* 优化悬浮框内的文本显示 */
.el-tooltip__popper .el-tooltip__content {
    font-size: 14px;
    line-height: 1.6;
    padding: 10px;
    white-space: normal; /* 确保文本自动换行 */
}

/* 思考过程样式 */
.thinking-process {
    display: inline-block;
    background-color: #f0f9eb;
    color: #67c23a;
    padding: 4px 8px;
    border-radius: 4px;
    border-left: 3px solid #67c23a;
    margin: 5px 0;
    font-weight: bold;
}

/* 自定义反馈详情弹框样式 */
.feedback-detail-dialog {
    display: flex;
    flex-direction: column;
    max-height: 90vh;
    margin-top: 5vh !important;
}

.feedback-detail-dialog .el-dialog__body {
    overflow: hidden;
    padding: 0;
}

/* 滚动条样式 */
.feedback-detail::-webkit-scrollbar {
    width: 6px;
}

.feedback-detail::-webkit-scrollbar-thumb {
    background-color: #c0c4cc;
    border-radius: 3px;
}

.feedback-detail::-webkit-scrollbar-track {
    background-color: #f5f7fa;
}
</style>
