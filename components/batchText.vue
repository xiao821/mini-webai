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
                  <span>{{ loading ? '提交中...' : '开始测试' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 手动获取数据按钮 -->
      <div class="refresh-section" v-if="tableData.length > 0">
        <button 
          class="el-button el-button--success"
          @click="fetchData"
          :disabled="dataLoading"
        >
          <span>{{ dataLoading ? '获取中...' : '刷新数据' }}</span>
        </button>
      </div>
  
      <!-- 数据展示部分 -->
      <div class="data-section" v-if="tableData.length > 0">
        <div class="el-table">
          <div class="el-table__header-wrapper">
            <table class="el-table__header">
              <thead>
                <tr>
                  <th class="el-table__cell is-leaf"><div class="cell">ID</div></th>
                  <th class="el-table__cell is-leaf"><div class="cell">问题描述</div></th>
                  <th class="el-table__cell is-leaf"><div class="cell">AI回答</div></th>
                </tr>
              </thead>
            </table>
          </div>
          <div class="el-table__body-wrapper">
            <table class="el-table__body">
              <tbody>
                <tr v-for="item in tableData" :key="item.id" class="el-table__row">
                  <td class="el-table__cell"><div class="cell">{{ item.id }}</div></td>
                  <td class="el-table__cell"><div class="cell">{{ item.problemdescription }}</div></td>
                  <td class="el-table__cell"><div class="cell">{{ item.ai_answer_test || '暂无回答' }}</div></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  const baseUrl = 'https://lgdev.baicc.cc/';
  const API_AUTH_TOKEN = 'Bearer lg-evduwtdszwhdqzgqkwvdtmjgpmffipkwoogudnnqemjtvgcv';
  
  module.exports = {
    data() {
      return {
        uploadSuccess: false,
        loading: false,
        dataLoading: false,
        uploadLoading: false,
        tableData: [],
        selectedFile: null,
        questions: []
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
        this.uploadFile(file);
        
        // 清空文件输入框，确保可以重复上传相同文件
        event.target.value = '';
      },
  
      // 上传文件
      async uploadFile(file) {
        this.uploadLoading = true;
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
        } catch (error) {
          alert('文件上传失败: ' + error.message);
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
          this.questions = result.data.map(item => ({
            ...item,
            selected: false
          }));
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
        try {
          // 调用接口进行测试
          const response = await fetch(`${baseUrl}/api/tsg_test`, {
            method: 'POST',
            headers: {
              'Authorization': API_AUTH_TOKEN,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              questions: selectedQuestions.map(q => ({
                lq_id: q.lq_id,
                user_id: q.user_id,
                question: q.question,
                model_name: q.model_name,
                department: q.department,
                category: q.category
              }))
            })
          });
  
          if (!response.ok) {
            throw new Error('提交失败');
          }
  
          // 调用接口获取数据
          await this.fetchData();
        } catch (error) {
          alert('操作失败：' + error.message);
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
      async fetchData() {
        this.dataLoading = true;
        try {
          const response = await fetch(`${baseUrl}/api/ai_answer`, {
            headers: {
              'Authorization': API_AUTH_TOKEN
            }
          });
  
          if (!response.ok) {
            throw new Error('获取数据失败');
          }
  
          const data = await response.json();
          this.tableData = data;
          alert('数据获取成功');
        } catch (error) {
          alert('获取数据失败：' + error.message);
        } finally {
          this.dataLoading = false;
        }
      },

      formatDate(dateStr) {
        if (!dateStr) return '无';
        const date = new Date(dateStr);
        return date.toLocaleString();
      }
    }
  }
  </script>
  
  <style scoped>
  .batch-text-container {
    padding: 20px;
    font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif;
  }
  
  .upload-section {
    margin: 20px 0;
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
  </style>