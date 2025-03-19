<!--
 * @Author: Ray
 * @Date: 2025-03-19
 * @Description: 知识图谱和知识分解组件
-->

<template>
  <div class="knowledge-banner">
    <!-- 知识分解弹框 -->
    <el-dialog
      title="知识分解"
      :visible.sync="showDialog"

      width="800px"
      :before-close="handleClose">
      <div v-if="loading" class="loading-container">
        <i class="el-icon-loading"></i>
        <p>正在加载知识分解内容...</p>
      </div>
      <div v-else class="markdown-container" v-html="markdownContent"></div>
    </el-dialog>
    
    <!-- 知识图谱弹框 -->
    <el-dialog
      title="知识图谱"
      :visible.sync="graphDialogVisible"
      width="800px"
      :before-close="handleClose">
      <div v-if="loading" class="loading-container">
        <i class="el-icon-loading"></i>
        <p>正在加载知识图谱数据...</p>
      </div>
      <div v-else class="graph-container">
        <!-- 这里可以放置知识图谱的可视化内容 -->
        <pre>{{ JSON.stringify(knowledgeData, null, 2) }}</pre>
      </div>
    </el-dialog>
  </div>
</template>

<script>
// 引入 marked 库用于解析 Markdown（如果需要的话）
// const marked = require('marked');

module.exports = {
  name: 'KnowledgeBanner',
  props: {
    node: {
      type: Object,
      required: false,
      default: () => ({})
    },
    props: {
    showDialog: {
      type: Boolean,
      default: false
    },
    item: {
      type: Object,
      default: null
    }
  },
  watch: {
    // 监听父组件传递的showDialog属性变化
    showDialog(newVal) {
      console.log('showDialog changed to:', newVal)
      this.dialogVisible = newVal
    }
  },
  data() {
    return {
      loading: false,
      markdownContent: '',
      dialogVisible: this.showDialog, // 初始化时设置为与prop相同的值
      decompositionDialogVisible: true,
      graphDialogVisible: false,
      markdownContent: '',
      knowledgeData: null,
      decompositionJson: null, // 保存知识分解生成的JSON数据
      currentItem: null // 保存当前处理的知识项
    }
  },
  computed: {
    isCategory() {
      return this.node && (this.node.type === 'category' || this.node.type === 'subcategory');
    }
  },
  methods: {
    // 显示知识分解弹框 - 分类节点
    showKnowledgeDecomposition() {
      this.decompositionDialogVisible = true;
      this.loading = true;
      
      // 调用接口获取知识分解数据
      setTimeout(() => {
        this.fetchKnowledgeDecomposition();
      }, 500);
    },
    
    // 显示知识图谱弹框 - 分类节点
    showKnowledgeGraph() {
      this.graphDialogVisible = true;
      this.loading = true;
      
      // 如果已有分解数据，使用该数据生成图谱
      if (this.decompositionJson) {
        this.generateGraphFromDecomposition(this.decompositionJson);
      } else {
        // 否则直接获取图谱数据
        this.fetchKnowledgeGraph();
      }
    },
    
    // 显示单个知识点的知识分解
    showItemDecomposition(item) {
      console.log('知识库横幅组件: 显示知识分解', item);
      
      // 检查item对象是否有效
      if (!item) {
        console.error('无效的知识项数据: null 或 undefined');
        this.$message.error('无效的知识项数据');
        return;
      }
      
      // 保存当前处理的知识项
      this.currentItem = item;
      
      // 显示弹框并加载状态
      this.decompositionDialogVisible = true;
      this.loading = true;
      
      // 调用接口获取单个知识点的知识分解
      setTimeout(() => {
        this.fetchItemDecomposition(item);
      }, 500);
    },
    
    // 显示单个知识点的知识图谱
    showItemGraph(item, decompositionJson) {
      this.graphDialogVisible = true;
      this.loading = true;
      
      if (decompositionJson) {
        // 如果传入了分解JSON数据，直接用它生成图谱
        this.generateGraphFromDecomposition(decompositionJson);
      } else {
        // 否则调用接口获取知识点的图谱
        setTimeout(() => {
          this.fetchItemGraph(item);
        }, 500);
      }
    },
    
    // 获取知识分解数据 - 分类
    async fetchKnowledgeDecomposition() {
      try {
        // 这里可以根据实际 API 来实现
        // 假设我们从 props 中的 node 获取必要信息
        const categoryName = this.node.name;
        
        // 调用API获取数据（这里用模拟数据代替）
        // const response = await fetch(`${apiUrl}/api/knowledge/decompose?category=${categoryName}`);
        // const jsonData = await response.json();
        
        // 示例 JSON 结构
        const jsonData = {
          title: this.node.label,
          category: categoryName,
          decomposition: [
            {
              title: "核心概念",
              content: "这里是关于" + categoryName + "的核心概念解释"
            },
            {
              title: "关键要点",
              content: "这里是关于" + categoryName + "的关键要点列表"
            },
            {
              title: "应用场景",
              content: "这里是" + categoryName + "的主要应用场景"
            }
          ]
        };
        
        // 保存JSON数据，以便生成图谱时使用
        this.decompositionJson = jsonData;
        
        // 转换为 Markdown 格式
        this.markdownContent = this.convertToMarkdown(jsonData);
        
        // 简单的HTML转换
        this.markdownContent = this.markdownToHtml(this.markdownContent);
          
      } catch (error) {
        console.error('获取知识分解数据失败:', error);
        this.$message.error('获取知识分解数据失败');
        this.markdownContent = '<p class="error-message">获取知识分解数据失败</p>';
      } finally {
        this.loading = false;
      }
    },
    
    // 获取单个知识点的知识分解
    async fetchItemDecomposition(item) {
      try {
        // 确保item对象有效
        if (!item) {
          throw new Error('知识项数据无效');
        }
        
        // 从知识点获取标题和内容，提供默认值避免undefined错误
        const title = item.title || '未知标题';
        const content = item.content || '';
        
        console.log('开始分解知识点:', title);
        
        // 调用API获取数据（这里用模拟数据代替）
        // const response = await fetch(`${apiUrl}/api/knowledge/decompose`, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ title, content })
        // });
        // const jsonData = await response.json();
        
        // 示例 JSON 结构
        const jsonData = {
          title: title,
          content: content,
          decomposition: [
            {
              title: "核心概念",
              content: "这里是关于「" + title + "」的核心概念解释"
            },
            {
              title: "关键要点",
              content: "这里是「" + title + "」的关键要点列表：\n1. 第一个要点\n2. 第二个要点\n3. 第三个要点"
            },
            {
              title: "相关知识",
              content: "与「" + title + "」相关的其他知识点"
            }
          ]
        };
        
        // 保存JSON数据，以便生成图谱时使用
        this.decompositionJson = jsonData;
        
        // 转换为 Markdown 格式
        this.markdownContent = this.convertToMarkdown(jsonData);
        
        // 简单的HTML转换
        this.markdownContent = this.markdownToHtml(this.markdownContent);
        
        // 通知父组件已生成分解数据
        console.log('知识分解数据生成完成，发送事件通知父组件');
        this.$emit('decomposition-generated', jsonData);
        
      } catch (error) {
        console.error('获取知识点分解数据失败:', error);
        this.$message.error('获取知识点分解数据失败');
        this.markdownContent = '<p class="error-message">获取知识点分解数据失败</p>';
      } finally {
        this.loading = false;
      }
    },
    
    // 获取知识图谱数据 - 分类
    async fetchKnowledgeGraph() {
      try {
        // 这里可以根据实际 API 来实现
        const categoryName = this.node.name;
        
        // 调用API获取数据（这里用模拟数据代替）
        // const response = await fetch(`${apiUrl}/api/knowledge/graph?category=${categoryName}`);
        // const graphData = await response.json();
        
        // 示例知识图谱数据
        this.knowledgeData = {
          nodes: [
            { id: 1, label: this.node.label, type: 'category' },
            { id: 2, label: '相关知识点1', type: 'knowledge' },
            { id: 3, label: '相关知识点2', type: 'knowledge' },
            { id: 4, label: '相关知识点3', type: 'knowledge' }
          ],
          edges: [
            { source: 1, target: 2 },
            { source: 1, target: 3 },
            { source: 1, target: 4 },
            { source: 2, target: 3 }
          ]
        };
        
      } catch (error) {
        console.error('获取知识图谱数据失败:', error);
        this.$message.error('获取知识图谱数据失败');
        this.knowledgeData = { error: '获取知识图谱数据失败' };
      } finally {
        this.loading = false;
      }
    },
    
    // 获取单个知识点的图谱
    async fetchItemGraph(item) {
      try {
        // 从知识点获取标题和内容
        const title = item.title;
        const content = item.content;
        
        console.log('开始生成知识点图谱:', title);
        
        // 调用API获取数据（这里用模拟数据代替）
        // const response = await fetch(`${apiUrl}/api/knowledge/graph`, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ title, content })
        // });
        // const graphData = await response.json();
        
        // 示例知识图谱数据
        this.knowledgeData = {
          nodes: [
            { id: 1, label: title, type: 'main' },
            { id: 2, label: '子概念1', type: 'concept' },
            { id: 3, label: '子概念2', type: 'concept' },
            { id: 4, label: '子概念3', type: 'concept' },
            { id: 5, label: '相关知识1', type: 'related' }
          ],
          edges: [
            { source: 1, target: 2 },
            { source: 1, target: 3 },
            { source: 1, target: 4 },
            { source: 4, target: 5 }
          ]
        };
        
      } catch (error) {
        console.error('获取知识点图谱数据失败:', error);
        this.$message.error('获取知识点图谱数据失败');
        this.knowledgeData = { error: '获取知识点图谱数据失败' };
      } finally {
        this.loading = false;
      }
    },
    
    // 根据知识分解数据生成图谱
    generateGraphFromDecomposition(decompositionJson) {
      try {
        console.log('根据分解数据生成图谱');
        
        // 从分解数据生成图谱节点和边
        const title = decompositionJson.title;
        const nodes = [{ id: 1, label: title, type: 'main' }];
        const edges = [];
        
        // 根据分解数据生成节点
        if (decompositionJson.decomposition && Array.isArray(decompositionJson.decomposition)) {
          decompositionJson.decomposition.forEach((item, index) => {
            const nodeId = index + 2; // 从2开始，因为1已经用于主节点
            nodes.push({
              id: nodeId,
              label: item.title,
              type: 'concept'
            });
            
            // 添加与主节点的连接
            edges.push({
              source: 1,
              target: nodeId
            });
            
            // 如果有内容，可以根据内容进一步生成子节点（简化处理）
            if (item.content) {
              const contentWords = item.content.split(' ').filter(word => word.length > 4).slice(0, 2);
              contentWords.forEach((word, wordIndex) => {
                const subNodeId = nodes.length + 1;
                nodes.push({
                  id: subNodeId,
                  label: word,
                  type: 'subconcept'
                });
                
                edges.push({
                  source: nodeId,
                  target: subNodeId
                });
              });
            }
          });
        }
        
        // 生成图谱数据
        this.knowledgeData = {
          nodes: nodes,
          edges: edges
        };
        
      } catch (error) {
        console.error('根据分解数据生成图谱失败:', error);
        this.$message.error('生成图谱失败');
        this.knowledgeData = { error: '生成图谱失败' };
      } finally {
        this.loading = false;
      }
    },
    
    // 将JSON转换为Markdown格式
    convertToMarkdown(jsonData) {
      let markdown = `# ${jsonData.title}\n\n`;
      
      if (jsonData.category) {
        markdown += `**分类:** ${jsonData.category}\n\n`;
      }
      
      if (jsonData.content) {
        markdown += `${jsonData.content}\n\n`;
      }
      
      if (jsonData.decomposition && Array.isArray(jsonData.decomposition)) {
        jsonData.decomposition.forEach(item => {
          markdown += `## ${item.title}\n\n${item.content}\n\n`;
        });
      }
      
      return markdown;
    },
    
    // 将Markdown转换为HTML
    markdownToHtml(markdown) {
      return markdown
        .replace(/# (.*?)\n/g, '<h1>$1</h1>')
        .replace(/## (.*?)\n/g, '<h2>$1</h2>')
        .replace(/### (.*?)\n/g, '<h3>$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br/>');
    },
    
    // 关闭弹框
    handleClose() {
      this.decompositionDialogVisible = false;
      this.graphDialogVisible = false;
      this.markdownContent = '';
      this.knowledgeData = null;
    }
  }
}
</script>

<style scoped>
.knowledge-banner {
  display: inline-flex;
  gap: 10px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.loading-container i {
  font-size: 24px;
  margin-bottom: 10px;
}

.markdown-container {
  max-height: 60vh;
  overflow-y: auto;
  padding: 0 10px;
  line-height: 1.6;
}

.markdown-container h1 {
  font-size: 22px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
  margin-bottom: 20px;
}

.markdown-container h2 {
  font-size: 18px;
  margin-top: 20px;
  margin-bottom: 10px;
}

.markdown-container h3 {
  font-size: 16px;
  margin-top: 16px;
  margin-bottom: 8px;
}

.graph-container {
  max-height: 60vh;
  overflow-y: auto;
}

.error-message {
  color: #f56c6c;
  text-align: center;
}
</style> 