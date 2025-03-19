<!--
 * @Author: AI Assistant
 * @Date: 2023-03-17
 * @Description: 语音列表管理页面
-->

<template>
  <div class="voice-list-container">
    <!-- 筛选条件区域 -->
    <div class="filter-section">
      <el-form :inline="true" :model="filterForm" class="filter-form" size="small">
        <el-form-item label="录音开始时间" class="filter-item">
            <el-date-picker
                v-model="filterForm.start_date"
                type="datetime"
                placeholder="选择开始时间"
                format="yyyy-MM-dd HH:mm:ss"
                value-format="yyyy-MM-dd HH:mm:ss"
                :picker-options="pickerOptions"
                size="small"
                style="width: 180px;">
            </el-date-picker>
        </el-form-item>
        <el-form-item label="录音结束时间" class="filter-item">
            <el-date-picker
                v-model="filterForm.end_date"
                type="datetime"
                placeholder="选择结束时间"
                format="yyyy-MM-dd HH:mm:ss"
                value-format="yyyy-MM-dd HH:mm:ss"
                :picker-options="pickerOptions"
                size="small"
                style="width: 180px;">
            </el-date-picker>
        </el-form-item>
        <el-form-item label="坐席" class="filter-item">
          <el-input v-model="filterForm.agent_id" placeholder="坐席工号" size="small" style="width: 120px;"></el-input>
        </el-form-item>
        <el-form-item label="分机号" class="filter-item">
          <el-input v-model="filterForm.extension" placeholder="分机号" size="small" style="width: 120px;"></el-input>
        </el-form-item>
        <el-form-item label="主叫" class="filter-item">
          <el-input v-model="filterForm.caller_number" placeholder="主叫号码" size="small" style="width: 120px;"></el-input>
        </el-form-item>
        <el-form-item label="被叫" class="filter-item">
          <el-input v-model="filterForm.called_number" placeholder="被叫号码" size="small" style="width: 120px;"></el-input>
        </el-form-item>
        <el-form-item label="呼叫方向" class="filter-item">
          <el-select v-model="filterForm.call_direction" placeholder="选择呼叫方向" size="small" style="width: 120px;">
            <el-option value="in">呼入</el-option>
            <el-option value="out">呼出</el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="技能队列" class="filter-item">
          <el-input v-model="filterForm.skill_queue" placeholder="技能队列" size="small" style="width: 120px;"></el-input>
        </el-form-item>
        <el-form-item class="filter-item">
          <el-button type="primary" size="small" @click="handleSearch">查询</el-button>
          <el-button size="small" @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 表格区域 -->
    <div class="table-section">
      <el-table
        :data="voiceList"
        border
        style="width: 100%"
        v-loading="loading"
        @row-click="handleRowClick">
        <el-table-column
          type="index"
          label="序号"
          width="60"
          align="center">
        </el-table-column>
        <el-table-column
          prop="call_id"
          label="呼叫编号"
          width="180">
        </el-table-column>
        <el-table-column
          prop="extension"
          label="分机号码"
          width="100">
        </el-table-column>
        <el-table-column
          prop="agent_id"
          label="坐席工号"
          width="120">
        </el-table-column>
        <el-table-column
          prop="call_direction"
          label="呼叫方向"
          width="90">
        </el-table-column>
        <el-table-column
          prop="caller_number"
          label="主叫号码"
          width="150">
        </el-table-column>
        <el-table-column
          prop="called_number"
          label="被叫号码"
          width="120">
        </el-table-column>
        <el-table-column
          prop="start_time"
          label="录音开始时间"
          width="180">
        </el-table-column>
        <el-table-column
          prop="end_time"
          label="录音结束时间"
          width="180">
        </el-table-column>
        <el-table-column
          prop="duration"
          label="录音时长(秒)"
          width="120">
        </el-table-column>
        <el-table-column
          prop="skill_queue"
          label="技能队列"
          width="100">
        </el-table-column>
        <el-table-column
          label="操作">
          <template #default="scope">
            <el-button
              size="mini"
              type="primary"
              @click.stop="handleListen(scope.row)">试听</el-button>
            <el-button
              size="mini"
              type="info"
              @click.stop="handleViewDetail(scope.row)">查看详情</el-button>
            <el-select
              size="mini"
              v-model="scope.row.selectedTag"
              placeholder="选择标签"
              @change="(val) => handleTagChange(val, scope.row)"
              @click.stop
              style="width: 100px;">
              <el-option
                v-for="item in tagOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value">
              </el-option>
            </el-select>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="pagination.currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pagination.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total">
        </el-pagination>
      </div>
    </div>

    <!-- 详情区域 -->
    <div v-if="showDetail" class="detail-section">
      <div class="detail-header">
        <div>
            <h3>
                呼叫编号：{{ currentRow.call_id }}
            </h3>
            <h4 style="padding: 10px;margin: 0;">通话详情:</h4>
        </div>


        <el-button size="mini" type="text" @click="closeDetail" style="font-size: 16px;margin-right: 2%;">关闭</el-button>
      </div>
      <div class="detail-content">
        
        <!-- <div class="call-id"></div> -->
        <div class="transcription">
          <div v-for="(line, index) in transcriptList" :key="index" class="transcription-line">
            {{ line }}
          </div>
        </div>
      </div>
    </div>

    <!-- 音频播放器 -->
    <div v-if="audioDialogVisible" class="audio-dialog-overlay" @click.self="closeAudioDialog">
      <div class="audio-dialog">
        <div class="audio-dialog-header">
          <h3>录音试听</h3>
          <button class="close-btn" @click="closeAudioDialog">×</button>
        </div>
        <div class="audio-player-container">
          <audio ref="audioPlayer" controls autoplay class="custom-audio-player">
            <source :src="currentAudioUrl" type="audio/mpeg">
            您的浏览器不支持音频播放
          </audio>
          <div v-if="audioError" class="audio-error">
            <p>音频加载失败，请检查链接是否有效</p>
            <p>当前链接: {{ currentAudioUrl }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
module.exports = {
  name: 'VoiceList',
  data() {
    return {
        apiConfig: {
                // baseUrl: 'https://lgdev.baicc.cc/',
                baseUrl: 'http://172.16.99.32:1034',
                token: 'Bearer lg-evduwtdszwhdqzgqkwvdtmjgpmffipkwoogudnnqemjtvgcv'
            },
      // 筛选表单
      filterForm: {
        start_date: '',
        end_date: '',
        agent_id: '',
        extension: '',
        call_direction: '',
        skill_queue: '',
        caller_number: '',
        called_number: ''
      },
      // 日期选择器配置
      pickerOptions: {
        disabledDate(time) {
            return time.getTime() > Date.now();  // 禁止选择未来的日期
        },
        shortcuts: [
            {
            text: '最近一周',
            onClick(picker) {
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 7);
                picker.$emit('pick', [start, end]);
            }
            }
        ]
        },
      // 表格数据
      voiceList: [],
      // 加载状态
      loading: false,
      // 分页信息
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      // 标签选项
      tagOptions: [
        { value: 'important', label: '重要' },
        { value: 'normal', label: '普通' },
        { value: 'followup', label: '需跟进' },
        { value: 'resolved', label: '已解决' }
      ],
      // 详情展示
      showDetail: false,
      // 当前选中的行
      currentRow: null,
      // 转写内容
      transcriptList: [],
      // 音频对话框
      audioDialogVisible: false,
      // 当前音频URL
      currentAudioUrl: '',
      // 音频错误
      audioError: false
    };
  },
  created() {
    // 初始化加载数据
    this.fetchVoiceList();
  },
  methods: {
    // 获取语音列表数据
    async fetchVoiceList() {
      this.loading = true;
      try {
        const requestData = {
          page: this.pagination.currentPage,
          page_size: this.pagination.pageSize,
          start_date: this.filterForm.start_date || '',
          end_date: this.filterForm.end_date || '',
          agent_id: this.filterForm.agent_id,
          extension: this.filterForm.extension,
          call_direction: this.filterForm.call_direction,
          skill_queue: this.filterForm.skill_queue,
          caller_number: this.filterForm.caller_number,
          called_number: this.filterForm.called_number
        };

        console.log('请求数据:', requestData); // 添加日志

        const response = await fetch(`${this.apiConfig.baseUrl}/api/call-records`, {
          method: 'POST',
          headers: {
            'Authorization': this.apiConfig.token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
          throw new Error('获取语音列表失败');
        }
        
        const data = await response.json();
        
        if (data.code === 200) {
          this.voiceList = data.data;
          this.pagination.total = data.total;
        } else {
          this.$message.error(data.message || '获取数据失败');
        }
      } catch (error) {
        console.error('获取语音列表失败:', error);
        this.$message.error('获取数据失败');
      } finally {
        this.loading = false;
      }
    },
    
    // 搜索处理
    handleSearch() {
      this.pagination.currentPage = 1;
      this.fetchVoiceList();
    },
    
    // 重置表单
    resetForm() {
      this.filterForm = {
        start_date: '',
        end_date: '',
        agent_id: '',
        extension: '',
        call_direction: '',
        skill_queue: '',
        caller_number: '',
        called_number: ''
      };
      this.handleSearch();
    },
    
    // 分页大小变化
    handleSizeChange(val) {
      this.pagination.pageSize = val;
      this.fetchVoiceList();
    },
    
    // 当前页变化
    handleCurrentChange(val) {
      this.pagination.currentPage = val;
      this.fetchVoiceList();
    },
    
    // 试听录音
    handleListen(row) {
      // 检查音频URL是否存在
      if (!row.audioUrl) {
        this.$message.error('该录音没有可用的音频链接');
        return;
      }
      
      this.currentAudioUrl = row.audioUrl;
      this.audioError = false;
      this.audioDialogVisible = true;
      
      // 在对话框显示后尝试播放音频
      this.$nextTick(() => {
        this.handleDialogOpened();
      });
    },
    
    // 关闭音频对话框
    closeAudioDialog() {
      this.audioDialogVisible = false;
      if (this.$refs.audioPlayer) {
        this.$refs.audioPlayer.pause();
      }
    },
    
    // 对话框打开后处理音频播放
    handleDialogOpened() {
      this.$nextTick(() => {
        if (this.$refs.audioPlayer) {
          // 重置音频播放器
          this.$refs.audioPlayer.load();
          
          // 尝试播放
          const playPromise = this.$refs.audioPlayer.play();
          
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.error('音频播放失败:', error);
              this.audioError = true;
              
              // 如果是自动播放策略问题，可以提示用户手动点击播放
              if (error.name === 'NotAllowedError') {
                this.$message.info('请点击播放按钮开始播放');
              }
            });
          }
        }
      });
    },
    
    // 查看详情
    handleViewDetail(row) {
      this.currentRow = row;
      this.showDetail = true;
      this.fetchTranscriptData(row.call_id);
    },
    
    // 关闭详情
    closeDetail() {
      this.showDetail = false;
      this.currentRow = null;
      this.transcriptList = [];
    },
    
    // 获取转写数据
    async fetchTranscriptData(callId) {
      try {
        const response = await fetch(`${this.apiConfig.baseUrl}/api/transcription?call_id=${callId}`, {
          method: 'GET',
          headers: {
            'Authorization': this.apiConfig.token,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('获取转写数据失败');
        }
        
        const data = await response.json();
        
        if (data.code === 200) {
          // 直接将转写文本按换行符分割成数组
          this.transcriptList = data.data.transcription.split('\n').filter(line => line.trim());
        } else {
          this.$message.error(data.message || '获取转写数据失败');
        }
      } catch (error) {
        console.error('获取转写数据失败:', error);
        this.$message.error('获取转写数据失败');
      }
    },
    
    // 行点击事件
    handleRowClick(row) {
      this.handleViewDetail(row);
    },
    
    // 标签变化
    handleTagChange(value, row) {
      console.log('标签已更改:', value, '行数据:', row);
      // 这里应该调用API保存标签
    }
  }
};
</script>

<style scoped>
.filter-section {
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.filter-item {
  margin-bottom: 10px !important;
  margin-right: 10px !important;
  flex: 0 0 auto;
}

.filter-item:last-child {
  margin-right: 0 !important;
}

/* 调整日期选择器的宽度 */
.filter-item .el-date-picker {
  width: 180px;
}

/* 调整输入框和选择器的宽度 */
.filter-item .el-input,
.filter-item .el-select {
  width: 120px;
}

.table-section {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}

.detail-section {
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  margin-top: 20px;
  height: 500px;  /* 设置固定高度 */
  display: flex;
  flex-direction: column;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  flex-shrink: 0;  /* 防止头部被压缩 */
}

.detail-content {
  padding: 10px;
  flex: 1;
  overflow-y: auto;  /* 添加垂直滚动条 */
  height: 0;  /* 配合flex:1使用 */
}

.call-id {
  font-weight: bold;
  margin-bottom: 15px;
  color: #303133;
  position: sticky;  /* 使call-id固定在顶部 */
  top: 0;
  background-color: #f5f7fa;
  padding: 5px 0;
  z-index: 1;
}

.transcription {
  line-height: 1.8;
}

.transcription-line {
  margin-bottom: 8px;
  color: #606266;
}

.audio-player-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.audio-player-container audio {
  width: 100%;
  outline: none;
  margin-bottom: 10px;
}

.audio-error {
  color: #f56c6c;
  margin-top: 10px;
  text-align: center;
  width: 100%;
}

.audio-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  overflow: hidden;
}

.audio-dialog {
  background-color: #fff;
  padding: 10px;
  border-radius: 4px;
  width: 500px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border: none;
  outline: none;
  position: relative;
  max-width: 90%;
}

.audio-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 10px;
}

.audio-dialog-header h3 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 500;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #909399;
  outline: none;
  padding: 0;
  line-height: 1;
}

.close-btn:hover {
  color: #409EFF;
}
</style>

<style>
/* 全局样式，覆盖默认的音频播放器样式 */
audio::-webkit-media-controls-enclosure {
  border-radius: 4px;
  background-color: #f5f7fa;
  border: none;
}

audio::-webkit-media-controls-panel {
  background-color: #f5f7fa;
}

audio::-webkit-media-controls-play-button {
  background-color: #409EFF;
  border-radius: 50%;
}

audio:focus {
  outline: none;
}

.custom-audio-player {
  width: 100%;
  border: none;
  outline: none;
  box-shadow: none;
  background-color: transparent;
}

/* 修复可能的边框问题 */
.audio-dialog * {
  box-sizing: border-box;
}

.audio-dialog-overlay::before,
.audio-dialog-overlay::after,
.audio-dialog::before,
.audio-dialog::after {
  display: none;
}
</style>
