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
          <button 
            class="upload-btn"
            @click="triggerFileInput"
          >
            上传Excel文件
          </button>
          <div class="upload-tip">
            请上传xlsx或xls格式的Excel文件
          </div>
          <div v-if="selectedFile" class="file-info">
            已选择文件: {{ selectedFile.name }}
          </div>
        </div>
      </div>
  
      <!-- 参数输入部分 -->
      <div class="params-section" v-if="uploadSuccess">
        <div class="el-form">
          <div class="el-form-item">
            <label class="el-form-item__label">批次大小:</label>
            <div class="el-form-item__content">
              <div class="el-input">
                <input 
                  class="el-input__inner"
                  type="number"
                  v-model="form.batch_size"
                  placeholder="请输入批次大小"
                >
              </div>
            </div>
          </div>
          <div class="el-form-item">
            <label class="el-form-item__label">实验名称:</label>
            <div class="el-form-item__content">
              <div class="el-input">
                <input
                  class="el-input__inner"
                  type="text" 
                  v-model="form.exp_name"
                  placeholder="请输入实验名称"
                >
              </div>
            </div>
          </div>
          <div class="el-form-item" style="text-align: center;">
            <div class="el-form-item__content">
              <button 
                class="el-button el-button--primary"
                @click="handleSubmit"
                :disabled="loading"
              >
                <span>{{ loading ? '提交中...' : '提交' }}</span>
              </button>
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
                  <th class="el-table__cell is-leaf"><div class="cell">实验名称</div></th>
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
                  <td class="el-table__cell"><div class="cell">{{ item.exp_name }}</div></td>
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
  const baseUrl = 'https://aiapi.szmckj.cn';
  const API_AUTH_TOKEN = 'Bearer lg-evduwtdszwhdqzgqkwvdtmjgpmffipkwoogudnnqemjtvgcv';
  
  module.exports = {
    data() {
      return {
        uploadSuccess: false,
        loading: false,
        dataLoading: false,
        tableData: [],
        selectedFile: null,
        form: {
          batch_size: '',
          exp_name: ''
        }
      }
    },
    methods: {
      // 触发文件选择
      triggerFileInput() {
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
      },
  
      // 上传文件
      async uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);
  
        try {
          const response = await fetch(`${baseUrl}/api/read_and_insert_excel`, {
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
          this.uploadSuccess = true;
          alert('文件上传成功');
        } catch (error) {
          alert('文件上传失败: ' + error.message);
        }
      },
  
      // 提交表单
      async handleSubmit() {
        if (!this.form.batch_size || !this.form.exp_name) {
          alert('请填写完整信息');
          return;
        }
  
        this.loading = true;
        try {
          // 调用第二个接口
          const response1 = await fetch(`${baseUrl}/api/tsg_test`, {
            method: 'POST',
            headers: {
              'Authorization': API_AUTH_TOKEN,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              batch_size: this.form.batch_size,
              exp_name: this.form.exp_name
            })
          });
  
          if (!response1.ok) {
            throw new Error('提交失败');
          }
  
          // 调用第三个接口获取数据
          await this.fetchData();
        } catch (error) {
          alert('操作失败：' + error.message);
        } finally {
          this.loading = false;
        }
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
  </style>