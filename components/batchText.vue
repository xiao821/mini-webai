<template>
    <div class="batch-text-container">
      <!-- 文件上传部分 -->
      <div class="upload-section">
        <div class="upload-box">
          <input 
            type="file" 
            id="fileInput"
            ref="fileInput"
            accept=".xlsx,.xls" 
            @change="handleFileChange"
            style="display: none"
          >
          <el-button 
            type="success"
            class="upload-btn"
            @click="triggerFileInput"
            :disabled="uploadLoading"
          >
            {{ uploadLoading ? '上传中...' : '上传Excel文件' }}
          </el-button>
          <el-button type="primary" @click="downloadTemplate" :disabled="uploadLoading">下载模板文件</el-button>
          <div class="upload-tip">
            请上传xlsx或xls格式的Excel文件
          </div>
          <div v-if="selectedFile" class="file-info">
            已选择文件: {{ selectedFile.name }}
          </div>
        </div>
      </div>
  
      <!-- 进度展示部分 -->
      <div class="progress-section" v-if="currentStep > 0">
        <div class="progress-container">
          <div class="progress-header">
            <div class="progress-title">当前进度</div>
            <div v-if="hasError" class="progress-status error">
              <i class="progress-error-icon">!</i> {{ errorMessage }}
            </div>
            <div v-else-if="currentStep < 4" class="progress-status">
              {{ progressSteps[currentStep - 1] }}中...
            </div>
            <div v-else class="progress-status success">
              <i class="progress-success-icon">✓</i> 全部完成
            </div>
          </div>
          <div class="progress-bar-container">
            <div class="progress-steps">
              <div 
                v-for="(step, index) in progressSteps" 
                :key="index"
                class="progress-step"
                :class="{ 
                  'active': currentStep >= index + 1, 
                  'current': currentStep === index + 1,
                  'error': hasError && currentStep === index + 1
                }"
              >
                <div class="step-icon">
                  <i class="step-icon-inner">{{ index + 1 }}</i>
                  <i v-if="currentStep > index + 1" class="step-icon-check">✓</i>
                  <i v-if="hasError && currentStep === index + 1" class="step-icon-error">!</i>
                </div>
                <div class="step-label">{{ step }}</div>
              </div>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-bar-inner" 
                :class="{ 'error-bar': hasError }"
                :style="{ width: progressPercentage + '%' }"
              ></div>
            </div>
          </div>
          <div class="progress-actions" v-if="currentStep === 4 || hasError">
            <el-button type="text" size="small" @click="resetProgress">重新开始</el-button>
            <el-button v-if="hasError" type="primary" size="small" @click="retryCurrentStep">重试</el-button>
          </div>
        </div>
      </div>
  
      <!-- 问题选择部分 -->
      <div class="question-selection-section" v-if="questions.length > 0">
        <h3>请选择要测试的问题列表</h3>
        <div class="selection-controls">
          <el-button size="small" type="primary" @click="selectAll" :disabled="uploadLoading">全选</el-button>
          <el-button size="small" @click="deselectAll" :disabled="uploadLoading">取消全选</el-button>
          <el-button size="small" type="warning" @click="triggerFileInput" :disabled="uploadLoading">
            {{ uploadLoading ? '上传中...' : '重新上传' }}
          </el-button>
        </div>
        <div class="el-table">
          <div class="el-table__header-wrapper">
            <table class="el-table__header">
              <thead>
                <tr>
                  <th class="el-table__cell is-leaf" style="width: 50px;"><div class="cell">选择</div></th>
                  <th class="el-table__cell is-leaf"><div class="cell">用户ID</div></th>
                  <th class="el-table__cell is-leaf"><div class="cell">问题描述</div></th>
                  <th class="el-table__cell is-leaf"><div class="cell">模型名称</div></th>
                  <th class="el-table__cell is-leaf"><div class="cell">知识库</div></th>
                  <th class="el-table__cell is-leaf"><div class="cell">知识库类别</div></th>
                  <th class="el-table__cell is-leaf"><div class="cell">创建时间</div></th>
                </tr>
              </thead>
            </table>
          </div>
          <div class="el-table__body-wrapper">
            <table class="el-table__body">
              <tbody>
                <tr v-for="item in questions" :key="item.lq_id" class="el-table__row">
                  <td class="el-table__cell" style="width: 50px;">
                    <div class="cell">
                      <input 
                        type="checkbox" 
                        :id="'question-' + item.lq_id" 
                        v-model="item.selected"
                      >
                    </div>
                  </td>
                  <td class="el-table__cell"><div class="cell">{{ item.user_id }}</div></td>
                  <td class="el-table__cell"><div class="cell">{{ item.question }}</div></td>
                  <td class="el-table__cell"><div class="cell">{{ item.model_name }}</div></td>
                  <td class="el-table__cell"><div class="cell">{{ item.department }}</div></td>
                  <td class="el-table__cell"><div class="cell">{{ item.category || '暂无分类' }}</div></td>
                  <td class="el-table__cell"><div class="cell">{{ formatDate(item.created_at) }}</div></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 提交按钮部分 -->
        <div class="params-section" v-if="questions.length > 0">
          <div class="el-form">
            <div class="el-form-item" style="text-align: center;">
              <div class="el-form-item__content">
                <button 
                  class="el-button el-button--primary submit-btn"
                  @click="handleSubmit"
                  :disabled="loading || uploadLoading || getSelectedQuestions().length === 0"
                >
                  <span>{{ loading ? '提交中...' : '提交任务' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
  
      <!-- 数据展示部分 -->
      <div class="data-section" v-if="tableData.length > 0">
        <div class="el-table">
          <div class="el-table__header-wrapper">
            <table class="el-table__header">
              <thead>
                <tr>
                  <th class="el-table__cell is-leaf"><div class="cell">任务ID</div></th>
                  <th class="el-table__cell is-leaf"><div class="cell">问题ID</div></th>
                  <th class="el-table__cell is-leaf"><div class="cell">用户ID</div></th>
                  <th class="el-table__cell is-leaf"><div class="cell">问题描述</div></th>
                  <th class="el-table__cell is-leaf"><div class="cell">模型名称</div></th>
                  <th class="el-table__cell is-leaf"><div class="cell">知识库</div></th>
                  <th class="el-table__cell is-leaf"><div class="cell">类别</div></th>
                  <th class="el-table__cell is-leaf"><div class="cell">AI回答</div></th>
                  <th class="el-table__cell is-leaf"><div class="cell">创建时间</div></th>
                  <th class="el-table__cell is-leaf"><div class="cell">操作</div></th>
                </tr>
              </thead>
            </table>
          </div>
          <div class="el-table__body-wrapper">
            <table class="el-table__body">
              <tbody>
                <tr v-for="item in tableData" :key="item.lta_id" class="el-table__row">
                  <td class="el-table__cell"><div class="cell">{{ item.task_id }}</div></td>
                  <td class="el-table__cell"><div class="cell">{{ item.lq_id }}</div></td>
                  <td class="el-table__cell"><div class="cell">{{ item.user_id }}</div></td>
                  <td class="el-table__cell"><div class="cell">{{ item.question }}</div></td>
                  <td class="el-table__cell"><div class="cell">{{ item.model_name }}</div></td>
                  <td class="el-table__cell"><div class="cell">{{ item.department }}</div></td>
                  <td class="el-table__cell"><div class="cell">{{ item.category || '暂无分类' }}</div></td>
                  <td class="el-table__cell"><div class="cell">{{ truncateText(item.answer, 30) || '暂无回答' }}</div></td>
                  <td class="el-table__cell"><div class="cell">{{ formatDate(item.created_at) }}</div></td>
                  <td class="el-table__cell">
                    <div class="cell">
                      <el-button type="primary" size="small" @click="showDetail(item)">详情</el-button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 详情对话框 -->
      <el-dialog
        title="详细信息"
        :visible.sync="dialogVisible"
        width="70%"
        :before-close="handleClose"
        custom-class="detail-dialog"
      >
        <div class="detail-content">
          <div class="detail-item">
            <label>问题描述：</label>
            <div class="detail-text">{{ currentDetail.question }}</div>
          </div>
          <div class="detail-item">
            <label>AI回答：</label>
            <div class="detail-text">{{ currentDetail.answer || '暂无回答' }}</div>
          </div>
          <div class="detail-item">
            <label>模型名称：</label>
            <div class="detail-text">{{ currentDetail.model_name }}</div>
          </div>
          <div class="detail-item">
            <label>知识库：</label>
            <div class="detail-text">{{ currentDetail.department }}</div>
          </div>
          <div class="detail-item">
            <label>类别：</label>
            <div class="detail-text">{{ currentDetail.category || '暂无分类' }}</div>
          </div>
          <div class="detail-item">
            <label>创建时间：</label>
            <div class="detail-text">{{ formatDate(currentDetail.created_at) }}</div>
          </div>
        </div>
        <div slot="footer" class="dialog-footer">
          <el-button @click="dialogVisible = false">关闭</el-button>
        </div>
      </el-dialog>
    </div>
  </template>
  
  <script>
  // const baseUrl = '/nlprag/';
  const baseUrl = 'https://lgdev.baicc.cc';
  // const baseUrl = 'http://172.16.99.32:1035';
  const API_AUTH_TOKEN = 'Bearer power3-browbeat-footsie-abridge-gaming-mckj';
  // const API_AUTH_TOKEN = 'Bearer unloving-lushness-subtly-smirk2-aerosol-lgminiai';
  
  module.exports = {
    data() {
      return {
        uploadSuccess: false,
        loading: false,
        dataLoading: false,
        uploadLoading: false,
        tableData: [],
        selectedFile: null,
        questions: [],
        dialogVisible: false,
        currentDetail: {},
        // 进度状态管理
        currentStep: 0, // 0: 未开始, 1: 上传文件, 2: 选择问题, 3: 提交任务, 4: 执行完成
        progressSteps: ['上传文件', '选择问题', '提交任务', '获取数据'],
        hasError: false,
        errorMessage: ''
      }
    },
    computed: {
      // 计算进度条百分比
      progressPercentage() {
        if (this.currentStep === 0) return 0;
        return (this.currentStep / this.progressSteps.length) * 100;
      }
    },
    methods: {
      // 触发文件选择
      triggerFileInput() {
        if (this.uploadLoading) {
          alert('正在上传文件，请稍后再试');
          return;
        }
        this.$refs.fileInput.click();
      },
  
      // 文件选择改变
      handleFileChange(event) {
        const file = event.target.files[0];
        if (!file) return;
  
        // 验证文件类型
        const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                        file.type === 'application/vnd.ms-excel';
        
        if (!isExcel) {
          alert('只能上传Excel文件!');
          event.target.value = ''; // 清空选择
          return;
        }
  
        this.selectedFile = file;
        this.currentStep = 1; // 更新进度状态：上传文件
        this.uploadFile(file);
        
        // 清空文件输入框，确保可以重复上传相同文件
        event.target.value = '';
      },
  
      // 上传文件
      async uploadFile(file) {
        this.uploadLoading = true;
        this.hasError = false;
        const formData = new FormData();
        formData.append('file', file);
  
        try {
          const response = await fetch(`${baseUrl}/api/upload_test_questions`, {
            method: 'POST',
            headers: {
              'Authorization': API_AUTH_TOKEN
            },
            body: formData
          });
  
          if (!response.ok) {
            throw new Error('上传失败');
          }
  
          const result = await response.json();
          alert('文件上传成功');
          
          // 获取上传成功后的问题列表
          await this.fetchQuestions();
          this.currentStep = 2; // 更新进度状态：选择问题
        } catch (error) {
          alert('文件上传失败: ' + error.message);
          this.hasError = true;
          this.errorMessage = '上传文件失败';
          this.currentStep = 1; // 保持在当前步骤，显示错误状态
        } finally {
          this.uploadLoading = false;
        }
      },
      
      // 获取问题列表
      async fetchQuestions() {
        try {
          const response = await fetch(`${baseUrl}/api/test_questions`, {
            method: 'GET',
            headers: {
              'Authorization': API_AUTH_TOKEN
            }
          });
          
          if (!response.ok) {
            throw new Error('获取问题列表失败');
          }
          
          const result = await response.json();
          // 添加 selected 属性到每个问题中
          const allQuestions = result.data.map(item => ({
            ...item,
            selected: false
          }));
          
          // 按创建时间倒序排序
          allQuestions.sort((a, b) => {
            return new Date(b.created_at) - new Date(a.created_at);
          });
          
          // 只取前10条数据
          this.questions = allQuestions.slice(0, 10);
        } catch (error) {
          alert('获取问题列表失败: ' + error.message);
        }
      },
      
      // 全选
      selectAll() {
        this.questions.forEach(item => {
          item.selected = true;
        });
      },
      
      // 取消全选
      deselectAll() {
        this.questions.forEach(item => {
          item.selected = false;
        });
      },
      
      // 获取cookie值
      getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
      },

      // 获取选中的问题
      getSelectedQuestions() {
        return this.questions.filter(item => item.selected);
      },
  
      // 提交表单
      async handleSubmit() {
        const selectedQuestions = this.getSelectedQuestions();
        if (selectedQuestions.length === 0) {
          alert('请至少选择一个问题');
          return;
        }
  
        this.loading = true;
        this.currentStep = 3; // 更新进度状态：提交任务
        this.hasError = false;
        try {
          // 从cookie获取user_id
          const userId = this.getCookie('miniai_TSG_Id');
          if (!userId) {
            throw new Error('未找到用户ID，请确保已登录');
          }

          // 获取选中问题的lq_id列表
          const questionIds = selectedQuestions.map(q => q.lq_id);

          // 创建测试任务
          const createTaskResponse = await fetch(`${baseUrl}/api/test_tasks`, {
            method: 'POST',
            headers: {
              'Authorization': API_AUTH_TOKEN,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              user_id: userId,
              question_ids: questionIds
            })
          });

          if (!createTaskResponse.ok) {
            throw new Error('创建任务失败');
          }

          const taskResult = await createTaskResponse.json();
          const taskId = taskResult.task_id; // 假设返回的数据中包含task_id字段

          // 执行测试任务
          const executeResponse = await fetch(`${baseUrl}/api/test_tasks/${taskId}/execute`, {
            method: 'POST',
            headers: {
              'Authorization': API_AUTH_TOKEN
            }
          });

          if (!executeResponse.ok) {
            throw new Error('执行任务失败');
          }

          alert('任务已提交执行');
          await this.fetchData(taskId);
          this.currentStep = 4; // 更新进度状态：获取数据
        } catch (error) {
          alert('操作失败：' + error.message);
          this.hasError = true;
          this.errorMessage = '提交任务失败';
          // 保持在当前步骤，显示错误状态
        } finally {
          this.loading = false;
        }
      },

      // 下载模板文件
      async downloadTemplate() {
        const response = await fetch(`${baseUrl}/api/test_questions/template`, {
          headers: {
            'Authorization': API_AUTH_TOKEN
          }
        });
        if (!response.ok) {
          throw new Error('下载模板文件失败');
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(new Blob([blob]));
        const a = document.createElement('a');
        a.href = url;
        a.download = '问题测试模板.xlsx';
        a.click();
      },

      // 手动获取数据
      async fetchData(task_id) {
        this.dataLoading = true;
        this.hasError = false;
        try {
          const response = await fetch(`${baseUrl}/api/test_tasks/${task_id}/answers`, {
            headers: {
              'Authorization': API_AUTH_TOKEN
            }
          });
  
          if (!response.ok) {
            throw new Error('获取数据失败');
          }
  
          const result = await response.json();
          if (result && result.data) {
            this.tableData = result.data;
            alert('数据获取成功');
          } else {
            throw new Error('数据格式不正确');
          }
        } catch (error) {
          alert('获取数据失败：' + error.message);
          this.hasError = true;
          this.errorMessage = '获取数据失败';
          this.currentStep = 3; // 回退到执行任务步骤
        } finally {
          this.dataLoading = false;
        }
      },

      formatDate(dateStr) {
        if (!dateStr) return '无';
        const date = new Date(dateStr);
        return date.toLocaleString();
      },

      truncateText(text, length = 30) {
        if (!text) return '';
        return text.length > length ? text.substring(0, length) + '...' : text;
      },

      showDetail(item) {
        this.currentDetail = { ...item };
        this.dialogVisible = true;
      },

      handleClose(done) {
        done();
      },
      
      // 重置进度
      resetProgress() {
        this.currentStep = 0;
        this.tableData = [];
        this.questions = [];
        this.selectedFile = null;
        this.hasError = false;
        this.errorMessage = '';
      },
      
      // 重试当前步骤
      retryCurrentStep() {
        this.hasError = false;
        this.errorMessage = '';
        
        if (this.currentStep === 1 && this.selectedFile) {
          // 重试上传
          this.uploadFile(this.selectedFile);
        } else if (this.currentStep === 3) {
          // 重试提交
          this.handleSubmit();
        }
      }
    }
  }
  </script>
  
  <style scoped>
  .batch-text-container {
    padding: 0 20px;
    font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif;
  }
  
  .upload-section {
    margin: 5px 0;
  }
  
  .upload-box {
    padding: 20px;
    border: 2px dashed #ddd;
    border-radius: 4px;
    text-align: center;
  }
  
  .upload-btn {
    padding: 10px 20px;
    background-color: #409EFF;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }
  
  .upload-btn:hover {
    background-color: #66b1ff;
  }
  
  .upload-tip {
    margin-top: 10px;
    color: #666;
    font-size: 14px;
  }
  
  .file-info {
    margin-top: 10px;
    color: #409EFF;
    font-size: 14px;
  }
  
  /* 问题选择部分样式 */
  .question-selection-section {
    margin: 20px 0;
  }
  
  .selection-controls {
    margin: 10px 0;
  }
  
  /* Element 表单样式 */
  .el-form {
    max-width: 500px;
    margin: 0 auto;
  }
  
  .el-form-item {
    margin-bottom: 22px;
  }
  
  .el-form-item__label {
    display: inline-block;
    width: 100px;
    text-align: right;
    margin-right: 10px;
    color: #606266;
    font-size: 14px;
    line-height: 40px;
  }
  
  .el-form-item__content {
    display: inline-block;
    vertical-align: top;
  }
  
  .el-input {
    display: inline-block;
    width: 220px;
    position: relative;
  }
  
  .el-input__inner {
    padding: 0 15px;
    height: 40px;
    line-height: 40px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    width: 100%;
    font-size: 14px;
    color: #606266;
    transition: border-color .2s;
    box-sizing: border-box;
  }
  
  .el-input__inner:focus {
    border-color: #409EFF;
    outline: none;
  }
  
  .el-button {
    display: inline-block;
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
    background: #fff;
    border: 1px solid #dcdfe6;
    color: #606266;
    text-align: center;
    box-sizing: border-box;
    outline: none;
    margin: 0;
    transition: .1s;
    font-weight: 500;
    padding: 12px 20px;
    font-size: 14px;
    border-radius: 4px;
  }
  
  .el-button--primary {
    color: #fff;
    background-color: #409EFF;
    border-color: #409EFF;
  }
  
  .el-button--primary:hover {
    background: #66b1ff;
    border-color: #66b1ff;
    color: #fff;
  }

  .el-button--success {
    color: #fff;
    background-color: #67c23a;
    border-color: #67c23a;
  }

  .el-button--success:hover {
    background: #85ce61;
    border-color: #85ce61;
    color: #fff;
  }
  
  .el-button[disabled] {
    cursor: not-allowed;
    opacity: 0.7;
  }
  
  .el-button--small {
    padding: 9px 15px;
    font-size: 12px;
    border-radius: 3px;
  }

  .refresh-section {
    margin: 20px 0;
    text-align: center;
  }
  
  /* Element 表格样式 */
  .el-table {
    position: relative;
    overflow: hidden;
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
    background-color: #fff;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    font-size: 14px;
    color: #606266;
    margin-bottom: 20px;
  }
  
  .el-table__header-wrapper, .el-table__body-wrapper {
    width: 100%;
  }
  
  .el-table__header, .el-table__body {
    width: 100%;
    table-layout: fixed;
    border-collapse: separate;
  }
  
  .el-table__cell {
    padding: 12px 0;
    min-width: 0;
    box-sizing: border-box;
    text-overflow: ellipsis;
    vertical-align: middle;
    position: relative;
    text-align: left;
    border-bottom: 1px solid #ebeef5;
  }
  
  .el-table__header .el-table__cell {
    background-color: #f5f7fa;
    color: #909399;
    font-weight: 500;
  }
  
  .el-table__row:hover {
    background-color: #f5f7fa;
  }
  
  .cell {
    box-sizing: border-box;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: normal;
    word-break: break-all;
    line-height: 23px;
    padding: 0 10px;
  }

  .submit-btn {
    padding: 15px 30px;
    font-size: 16px;
  }

  .detail-dialog {
    margin-top: 15vh !important;
  }

  .detail-content {
    max-height: 60vh;
    overflow-y: auto;
  }

  .detail-item {
    margin-bottom: 20px;
  }

  .detail-item label {
    font-weight: bold;
    color: #606266;
    margin-bottom: 8px;
    display: block;
  }

  .detail-text {
    color: #333;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
    background-color: #f8f9fa;
    padding: 12px;
    border-radius: 4px;
    border: 1px solid #e9ecef;
  }

  .dialog-footer {
    text-align: right;
  }

  /* 进度条样式 */
  .progress-section {
    margin: 15px 0;
    transition: all 0.3s ease;
  }
  
  .progress-container {
    background-color: #ffffff;
    border-radius: 8px;
    padding: 15px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    border: 1px solid #ebeef5;
    transition: all 0.3s ease;
  }
  
  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
  }
  
  .progress-title {
    font-size: 14px;
    color: #606266;
    font-weight: 500;
  }
  
  .progress-status {
    font-size: 13px;
    color: #409EFF;
    font-weight: 500;
    transition: color 0.3s ease;
    display: flex;
    align-items: center;
  }
  
  .progress-status.success {
    color: #67c23a;
  }

  .progress-status.error {
    color: #f56c6c;
  }
  
  .progress-success-icon,
  .progress-error-icon {
    font-style: normal;
    margin-right: 4px;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    font-weight: bold;
  }
  
  .progress-actions {
    text-align: right;
    margin-top: 10px;
  }
  
  .progress-bar-container {
    padding: 0 5px;
    position: relative;
  }
  
  .progress-steps {
    display: flex;
    justify-content: space-between;
    position: relative;
    margin-bottom: 25px;
    z-index: 2;
  }
  
  .progress-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    flex: 1;
    transition: all 0.3s ease;
  }
  
  .step-icon {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
    position: relative;
    border: 2px solid #e0e0e0;
    transition: all 0.3s ease;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  }
  
  .step-icon-inner {
    font-style: normal;
    font-size: 12px;
    color: #909399;
    transition: color 0.3s ease;
  }
  
  .step-icon-check,
  .step-icon-error {
    position: absolute;
    font-style: normal;
    color: #ffffff;
    font-size: 12px;
    font-weight: bold;
    animation: fadeIn 0.3s ease-in-out;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1); }
  }
  
  .step-label {
    font-size: 12px;
    color: #909399;
    white-space: nowrap;
    transition: color 0.3s ease, font-weight 0.3s ease;
  }
  
  .progress-step.active .step-icon {
    background-color: #67c23a;
    border-color: #67c23a;
    box-shadow: 0 2px 10px rgba(103, 194, 58, 0.2);
    transform: scale(1.05);
  }
  
  .progress-step.active .step-icon-inner {
    color: #ffffff;
  }
  
  .progress-step.current .step-icon {
    background-color: #409EFF;
    border-color: #409EFF;
    box-shadow: 0 2px 10px rgba(64, 158, 255, 0.2);
    animation: pulse 1.5s infinite;
  }
  
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
  
  .progress-step.current .step-icon-inner {
    color: #ffffff;
  }
  
  .progress-step.error .step-icon {
    background-color: #f56c6c;
    border-color: #f56c6c;
    box-shadow: 0 2px 10px rgba(245, 108, 108, 0.2);
    animation: shake 0.5s ease-in-out;
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-3px); }
    40%, 80% { transform: translateX(3px); }
  }
  
  .progress-step.error .step-icon-inner,
  .progress-step.error .step-icon-error {
    color: #ffffff;
  }
  
  .progress-step.active .step-label {
    color: #303133;
    font-weight: 500;
  }
  
  .progress-bar {
    height: 6px;
    background-color: #ebeef5;
    border-radius: 10px;
    position: relative;
    margin-top: -20px;
    overflow: hidden;
    z-index: 1;
  }
  
  .progress-bar-inner {
    height: 100%;
    background-color: #67c23a;
    background-image: linear-gradient(to right, #67c23a, #85ce61);
    border-radius: 10px;
    transition: width 0.5s ease;
    position: relative;
    overflow: hidden;
  }
  
  .progress-bar-inner::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, 
                  rgba(255, 255, 255, 0) 0%, 
                  rgba(255, 255, 255, 0.3) 50%, 
                  rgba(255, 255, 255, 0) 100%);
    transform: translateX(-100%);
    animation: shimmer 2s infinite;
  }
  
  @keyframes shimmer {
    100% { transform: translateX(100%); }
  }
  
  .progress-bar-inner.error-bar {
    background-color: #f56c6c;
    background-image: linear-gradient(to right, #f56c6c, #f78989);
  }
  </style>