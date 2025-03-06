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
                border>
                <el-table-column type="expand">
                    <template #default="props">
                        <el-table
                            :data="props.row.kb_reference"
                            style="width: 100%">
                            <el-table-column prop="title" label="知识库标题"></el-table-column>
                            <el-table-column prop="content" label="知识库内容" show-overflow-tooltip></el-table-column>
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
                <el-table-column prop="ai_answer" label="AI回答" show-overflow-tooltip></el-table-column>
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
                <!-- 操作内容 -->
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
            width="600px"
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
            currentFeedback: null
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
                    }
                });
                
                // 处理数据，获取用户问题和AI回答
                this.tableData = response.data.feedback_list.map(feedback => {
                    const messages = feedback.conversation_messages || [];
                    const aiAnswerIndex = messages.findIndex(msg => msg === feedback.conversation_messages);
                    const userQuestion = aiAnswerIndex > 0 ? messages[aiAnswerIndex - 1] : '';
                    
                    return {
                        ...feedback,
                        user_question: userQuestion,
                        ai_answer: feedback.conversation_messages,
                        kb_reference: Array.isArray(feedback.kb_reference) ? feedback.kb_reference : []
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
            console.log('row',row)
        },
        // 查看知识库
        viewKnowledge(row) {
            this.$router.push({
                path: '/knowledge',
                query: { id: row.knowledgeId }
            });
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
    },
    mounted() {
        this.getFeedbackTableData();
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
</style>
