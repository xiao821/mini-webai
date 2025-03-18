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
                <el-table-column prop="user_question" label="市民原始问题" show-overflow-tooltip></el-table-column>
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
                    <el-table-column prop="kb_title" label="知识库标题"></el-table-column>
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
                            <el-option label="龙岗政数局知识库" value="龙岗政数局"></el-option>
                            <el-option label="市医保中心知识库" value="市医保中心"></el-option>
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
                    <div v-if="generatedAnswer" class="generated-answer-section">
                        <el-divider>AI生成的回答</el-divider>
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
const baseUrl = 'https://lgdev.baicc.cc/';
// const baseUrl = 'http://172.16.99.32:1032';
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
            lgznTreeData: [
                {
                    "category2": "一、企业注册与设立",
                    "category3": [
                        "1.1 名称管理",
                        "1.1 注册流程",
                        "1.2 名称管理",
                        "1.3 资本与出资",
                        "1.4 地址与场所"
                    ]
                },
                {
                    "category2": "七、商事登记制度改革",
                    "category3": [
                        "7.1 政策解读",
                        "7.2 新模式",
                        "7.3 特殊事项"
                    ]
                },
                {
                    "category2": "三、企业注销与清算",
                    "category3": [
                        "3.1 注销流程",
                        "3.2 清算程序",
                        "3.3 特殊注销"
                    ]
                },
                {
                    "category2": "二、企业变更与备案",
                    "category3": [
                        "2.1 变更事项",
                        "2.2 备案要求"
                    ]
                },
                {
                    "category2": "五、外资企业管理",
                    "category3": [
                        "5.1 投资政策",
                        "5.2 代表机构管理",
                        "5.3 特殊规定"
                    ]
                },
                {
                    "category2": "八、金融与证券监管",
                    "category3": [
                        "2.2 监管要求",
                        "2.监管要求",
                        "8.2 监管要求",
                        "8.3 特殊规定"
                    ]
                },
                {
                    "category2": "六、营业执照管理",
                    "category3": [
                        "6.1 办理与换发",
                        "6.2 内容与效力",
                        "6.3 特殊情况"
                    ]
                },
                {
                    "category2": "十、其他专项事务",
                    "category3": [
                        "",
                        "10.1 医疗器械管理",
                        "10.2 食品与卫生许可",
                        "10.3 特种设备管理",
                        "10.4 农业合作组织",
                        "10.5 教育与文化审批",
                        "教育与文化审批"
                    ]
                },
                {
                    "category2": "四、股权管理与转让",
                    "category3": [
                        "",
                        "4.1 股权变更",
                        "4.2 材料提交",
                        "4.3 特殊情况"
                    ]
                }
            ],
            // 市医保中心知识点树
            yibaoTreeData: [
                {
                    "category2": "个人账户管理",
                    "category3": [
                        "其他个人账户问题",
                        "家庭共济与亲情账户",
                        "账户使用范围",
                        "账户查询与余额"
                    ]
                },
                {
                    "category2": "其他医保相关",
                    "category3": [
                        "其他保障",
                        "其他辅助操作",
                        "医保卡管理",
                        "医保报销",
                        "医疗保险系统",
                        "惠民保",
                        "相关操作问题",
                        "相关流程",
                        "缴费方式",
                        "购买方式"
                    ]
                },
                {
                    "category2": "医保待遇与保障",
                    "category3": [
                        "住院待遇",
                        "住院待遇医保待遇与保障",
                        "其他保障",
                        "基本医疗保险报销",
                        "大病保险与补充医疗保险",
                        "普通门诊待遇",
                        "门诊大病待遇",
                        "门诊慢特病待遇",
                        "门诊特定病种待遇",
                        "门诊统筹待遇"
                    ]
                },
                {
                    "category2": "医疗机构管理与就医",
                    "category3": [
                        "医疗费用结算",
                        "定点医疗机构",
                        "就医管理与流程",
                        "社康中心管理"
                    ]
                },
                {
                    "category2": "参保与缴费",
                    "category3": [
                        "参保登记与信息变更",
                        "参保资格与条件",
                        "参保资格与条件参保与缴费",
                        "缴费与补缴",
                        "缴费年限",
                        "缴费方式",
                        "缴费标准与待遇",
                        "重复参保与处理"
                    ]
                },
                {
                    "category2": "异地就医管理",
                    "category3": [
                        "其他异地就医问题",
                        "异地就医备案",
                        "异地就医报销",
                        "转诊与转院",
                        "门诊慢特病异地就医"
                    ]
                },
                {
                    "category2": "特定人群医保",
                    "category3": [
                        "失业人员医保",
                        "学生医保",
                        "新生儿医保",
                        "灵活就业人员医保",
                        "退休人员医保"
                    ]
                }
            ]
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
                        'Authorization': API_AUTH_TOKEN
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
                        'Authorization': API_AUTH_TOKEN
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
        async viewKnowledge(row) {
            // 打开知识库弹窗
            this.currentFeedbackForKnowledge = {
                ...row,
                audit_status: row.audit_status || this.audit_status
            };
            this.knowledgeDialogVisible = true;
            this.selectedKnowledgeNodes = [];
            this.regeneratedAnswer = '';
            this.renderedRegeneratedAnswer = '';
            
            // 渲染AI回答
            if (row.ai_answer && this.md) {
                try {
                    this.renderedKnowledgeAIAnswer = this.md.render(row.ai_answer);
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
            
            if (row.kb_reference && row.kb_reference.length > 0) {
                // 提取所有的 kb_id
                const kgids = row.kb_reference.map(item => item.kb_id);
                
                // 获取知识点内容
                const knowledgeContent = await this.fetchKnowledgeContent(kgids);
                
                // 转换kb_reference为知识点节点格式
                this.originalKnowledgeNodes = row.kb_reference.map((item, index) => ({
                    kb_id: item.kb_id,
                    kb_title: knowledgeContent[index] ? knowledgeContent[index].title : '',
                    kb_content: knowledgeContent[index] ? knowledgeContent[index].content : '',
                    kb_simil: item.similarity
                }));
                
                // 备份原始知识点，用于重置
                this.originalKnowledgeNodesBackup = JSON.parse(JSON.stringify(this.originalKnowledgeNodes));
            }
            
            // 获取知识库分类树
            this.fetchKnowledgeCategories();
        },
        // 获取知识库分类
        async fetchKnowledgeCategories() {
            this.loading = true;
            try {
                // 根据选择的部门获取不同的知识树数据
                let treeData = [];
                if (this.selectedDepartment === '龙岗政数局') {
                    treeData = this.lgznTreeData;
                } else if (this.selectedDepartment === '市医保中心') {
                    treeData = this.yibaoTreeData;
                }
                
                // 将树形数据转换为适合Element UI Tree组件的格式
                this.knowledgeTree = this.transformCategoryTree(treeData);
                
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
                
            } catch (error) {
                console.error('获取知识点分类失败:', error);
                this.$message.error('获取知识点分类失败: ' + error.message);
            } finally {
                this.loading = false;
            }
        },
        
        // 转换分类树结构
        transformCategoryTree(treeData) {
            return treeData.map((category, index) => {
                // 创建二级分类节点
                const categoryNode = {
                    id: `category-${index}`,
                    label: category.category2,
                    name: category.category2,
                    type: 'category',
                    children: []
                };
                
                // 添加三级分类作为子节点
                if (category.category3 && category.category3.length > 0) {
                    categoryNode.children = category.category3
                        .filter(subcategory => subcategory) // 过滤掉空字符串
                        .map((subcategory, subIndex) => {
                            return {
                                id: `category-${index}-${subIndex}`,
                                label: subcategory,
                                name: subcategory,
                                type: 'category',
                                parentId: `category-${index}`
                            };
                        });
                }
                
                return categoryNode;
            });
        },
        
        // 根据分类获取知识点列表
        async fetchKnowledgeByCategory(category) {
            try {
                // 模拟获取知识点的逻辑，实际项目中应从API获取
                // 这里仅演示根据category名称返回模拟数据
                
                // 创建一些模拟的知识点数据
                const mockKnowledgeItems = [];
                const itemCount = Math.floor(Math.random() * 5) + 3; // 随机3-7个知识点
                
                for (let i = 0; i < itemCount; i++) {
                    let title, content;
                    
                    if (this.selectedDepartment === '龙岗政数局') {
                        // 为龙岗政数局创建知识点
                        if (category.includes('注册')) {
                            title = `企业${category}知识点${i+1}`;
                            content = `这是关于${category}的详细说明，包含办理要求、所需材料和流程步骤等内容。`;
                        } else if (category.includes('变更')) {
                            title = `${category}申请知识点${i+1}`;
                            content = `这是关于${category}的详细内容，包含变更条件、所需证明文件和办理时限等要求。`;
                        } else {
                            title = `${category}知识点${i+1}`;
                            content = `这是关于${category}的知识内容，包含相关政策解读和办理指南。第${i+1}条。`;
                        }
                    } else if (this.selectedDepartment === '市医保中心') {
                        // 为市医保中心创建知识点
                        if (category.includes('账户')) {
                            title = `医保${category}知识点${i+1}`;
                            content = `这是关于医保${category}的详细说明，包含查询方式、使用范围和注意事项。`;
                        } else if (category.includes('待遇')) {
                            title = `${category}报销知识点${i+1}`;
                            content = `这是关于${category}的详细内容，包含报销比例、起付标准和最高支付限额等信息。`;
                        } else {
                            title = `${category}知识点${i+1}`;
                            content = `这是关于医保${category}的知识内容，包含相关政策和办理流程。第${i+1}条。`;
                        }
                    }
                    
                    mockKnowledgeItems.push({
                        kgid: `mock-${Date.now()}-${i}`,
                        title: title,
                        content: content
                    });
                }
                
                // 将知识点添加到对应的分类节点下
                this.addKnowledgeItemsToTree(category, mockKnowledgeItems);
                
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
            
            // 转换知识点为树节点格式，确保每个节点都有唯一的id和kgid
            const knowledgeNodes = items.map(item => {
                // 确保每个知识点都有有效的kgid
                const kgid = item.kgid || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                return {
                    id: `item-${kgid}`, // 确保id是字符串类型且唯一
                    label: item.title,
                    content: item.content,
                    type: 'item',
                    parentId: categoryNode.id,
                    kgid: kgid, // 确保kgid存在
                    isLeaf: true
                };
            });
            
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
                // 默认设置为未选中
                this.currentPreviewNode.isSelected = false;
                
                // 然后检查是否在已选择列表中
                const nodeId = data.id || '';
                const isSelected = this.selectedKnowledgeNodes.some(node => {
                    const selectedId = node.id || '';
                    return selectedId === nodeId;
                });
                
                if (isSelected) {
                    this.currentPreviewNode.isSelected = true;
                }
                
                // 打印节点信息，便于调试
                console.log('点击知识点:', {
                    id: data.id,
                    kgid: data.kgid,
                    label: data.label,
                    isSelected: this.currentPreviewNode.isSelected
                });
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
                return this.md.render(content);
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
            // console.log('知识点row', row);
            
            if (row.kb_reference && Array.isArray(row.kb_reference)) {
                // 提取所有的 kb_id
                const kgids = row.kb_reference.map(item => item.kb_id);
                
                // 获取知识点内容
                const knowledgeContent = await this.fetchKnowledgeContent(kgids);
                
                // 将获取到的内容与原始数据合并
                const mergedKbReference = row.kb_reference.map(ref => {
                    const content = knowledgeContent.find((_, index) => index === row.kb_reference.indexOf(ref));
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
            this.$message.info('正在生成回答，请稍候...');

            try {
                // 构建知识点数据
                const knowledgeData = {
                    original_knowledge: this.originalKnowledgeNodes.map(item => ({
                        kgid: item.kb_id,
                        title: item.kb_title,
                        content: item.kb_content
                    })),
                    new_knowledge: this.selectedKnowledgeNodes.map(item => ({
                        kgid: item.kgid,
                        title: item.label,
                        content: item.content
                    }))
                };

                // 构建请求数据
                const requestData = {
                    user_question: this.currentFeedbackForKnowledge.user_question,
                    knowledge_list: [...knowledgeData.original_knowledge, ...knowledgeData.new_knowledge]
                };

                // 调用后端API
                const response = await axios.post(`${baseUrl}/api/feedback/generateAnswer`, requestData, {
                    headers: {
                        'Authorization': API_AUTH_TOKEN,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.data && response.data.answer) {
                    this.generatedAnswer = response.data.answer;
                    
                    // 渲染Markdown
                    if (this.md) {
                        try {
                            this.renderedGeneratedAnswer = this.md.render(this.generatedAnswer);
                        } catch (error) {
                            console.error('Markdown渲染失败:', error);
                            this.renderedGeneratedAnswer = this.generatedAnswer;
                        }
                    } else {
                        this.renderedGeneratedAnswer = this.generatedAnswer;
                    }

                    this.$message.success('回答生成成功');
                    
                    // 确保生成的回答区域可见
                    this.qaCollapseActive = ['question', 'answer'];
                } else {
                    throw new Error('生成回答失败');
                }
            } catch (error) {
                console.error('生成回答失败:', error);
                this.$message.error('生成回答失败: ' + error.message);
            } finally {
                this.isGeneratingAnswer = false;
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

        // 添加回获取知识点内容的方法
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
                this.$message.error('获取知识点内容失败');
                return [];
            }
        },
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
    padding: 10px 20px;
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
    line-height: 1.6;
    white-space: pre-wrap;
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
