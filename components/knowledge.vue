<!--
 * @Author: Ray
 * @Date: 2025-03-04
 * @Description: 知识库管理页面
-->

<template>
    <div class="knowledge-container">
        <!-- 顶部操作栏 -->
        <!-- <div class="knowledge-header">
            <el-button type="primary" @click="createNewNode">
                <i class="el-icon-plus"></i> 新建条目
            </el-button>
            <el-button type="success" @click="fetchKnowledgeCategories">
                <i class="el-icon-refresh"></i> 刷新数据
            </el-button>
        </div> -->

        <!-- 主体内容区 -->
        <div class="knowledge-main">
            <!-- 左侧目录树 -->
            <div class="knowledge-sidebar">
                <div class="search-box">
                    <el-select 
                        v-model="selectedDepartment" 
                        placeholder="请选择单位" 
                        size="small"
                        style="width: 100%; margin-bottom: 10px;"
                        @change="handleDepartmentChange">
                        <el-option
                            v-for="item in departmentOptions"
                            :key="item.value"
                            :label="item.label"
                            :value="item.value">
                        </el-option>
                    </el-select>
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
                        :current-node-key="currentNodeId"
                        highlight-current
                        :check-on-click-node="true"
                        ref="tree">
                        <template v-slot="{ node, data }">
                            <span class="custom-tree-node">
                                <span class="node-icon-label">
                                    <i :class="getNodeIcon(data)"></i>
                                    <span class="node-label">{{ stripHtmlTags(node.label) }}</span>
                                </span>
                            </span>
                        </template>
                    </el-tree>
                </div>
            </div>

            <!-- 右侧内容区 -->
            <div class="knowledge-content">
                <!-- 有选中节点时显示编辑表单 -->
                <div v-if="currentNode && currentNode.type === 'item'" class="edit-form">
                    <el-form :model="currentNode" label-width="80px" size="small">
                        <el-form-item label="标题">
                            <el-input v-model="currentNode.label" placeholder="请输入标题"></el-input>
                        </el-form-item>
                        <el-form-item label="所属分类">
                            <div class="category-display">
                                <el-tag type="primary" v-if="currentNode.parentCategory">{{ currentNode.parentCategory }}</el-tag>
                                <el-tag type="success" v-if="currentNode.category">{{ currentNode.category }}</el-tag>
                                <span v-if="!currentNode.category && !currentNode.parentCategory" class="no-category">未分类</span>
                            </div>
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
                
                <!-- 如果选中的是分类节点，显示知识点列表 -->
                <div v-else-if="currentNode && (currentNode.type === 'category' || currentNode.type === 'subcategory')" class="category-items">
                    <div class="category-header">
                        <h2>{{ stripHtmlTags(currentNode.label) }}</h2>
                    </div>
                    <el-divider></el-divider>
                    
                    <div v-if="knowledgeItems.length === 0" class="empty-items">
                        正在加载，请稍等...
                    </div>
                    
                    <el-card 
                        v-for="item in knowledgeItems" 
                        :key="item.kgid" 
                        class="knowledge-item-card" 
                        shadow="hover"
                        :class="{'active-card': currentNode && currentNode.id === item.kgid}"
                        @click="viewKnowledgeDetail(item)">
                        <template #header>
                            <div class="clearfix">
                                <span>{{ item.title }}</span>
                                <div class="item-buttons">
                                    <el-button type="text" size="mini" @click.stop="handleShowDialog1(item)">
                                        <i class="el-icon-s-operation"></i> 知识分解
                                    </el-button>
                                    <el-button 
                                        type="text" 
                                        size="mini" 
                                        @click.stop="showItemGraph(item, $event)"
                                        :disabled="!item.decompositionJson && !decompositionJson"
                                        :class="{'disabled-button': !item.decompositionJson && !decompositionJson}">
                                        <i class="el-icon-share"></i> 知识图谱
                                    </el-button>
                                </div>
                            </div>
                        </template>
                        <div class="item-content">{{ item.content }}</div>
                    </el-card>
                </div>

                <!-- 未选中节点时显示空状态 -->
                <div v-else class="empty-state">
                    <i class="el-icon-document"></i>
                    <p>请选择点击查看一个知识库条目</p>
                    <!-- <el-button type="primary" @click="createNewNode">创建新条目</el-button> -->
                </div>
            </div>
        </div>

        <!-- 添加知识分解弹框 -->
        <el-dialog
            title="知识分解"
            :visible="decompositionDialogVisible"
            width="70%"
            :fullscreen="false"
            custom-class="knowledge-decomposition-dialog"
            @close="closeDecompositionDialog">
            <div v-if="isLoading" class="loading-container">
                <el-progress type="circle" :percentage="loadingPercentage" :status="loadingStatus"></el-progress>
                <p>{{ loadingMessage }}</p>
            </div>
            <div v-else>
                <div class="markdown-content" v-html="renderedMarkdown"></div>
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="closeDecompositionDialog">关闭</el-button>
                    <el-button type="primary" @click="saveDecompositionResult" :disabled="!decompositionResult">保存</el-button>
                </div>
            </template>
        </el-dialog>

        <!-- 添加知识图谱弹框 -->
        <!-- custom-class="fullscreen-dialog"
        :fullscreen="true" -->
        <el-dialog
            title="知识图谱"
            :visible="graphDialogVisible"
            width="70%"
        :fullscreen="true"
            custom-class="knowledge-graph-dialog"
            @close="closeGraphDialog">
            <div v-if="isGraphLoading" class="loading-container">
                <el-progress type="circle" :percentage="graphLoadingPercentage" :status="graphLoadingStatus"></el-progress>
                <p>{{ graphLoadingMessage }}</p>
            </div>
            <div v-else class="graph-container" id="knowledge-graph-container">
                <!-- 知识图谱将在这里渲染 -->
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="closeGraphDialog">关闭</el-button>
                    <el-button @click="exportGraphAsSvg">导出SVG</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script>
module.exports =  {
    name: 'Knowledge',
    data() {
        return {
            // API 配置
            apiConfig: {
                // baseUrl: 'http://172.16.99.32:1030',
                baseUrl: 'https://lgdev.baicc.cc/',
                // baseUrl: '/nlprag/',
                // baseUrl: 'http://172.16.99.32:1036',
                token: 'Bearer unloving-lushness-subtly-smirk2-aerosol-lgminiai'
            },
            // 新增的部门选项
            departmentOptions: [],
            // 当前选中的部门
            selectedDepartment: '',
            // 搜索过滤文本
            filterText: '',
            // 知识库树形数据
            knowledgeTree: [],
            // 当前选中分类下的知识点列表
            knowledgeItems: [],
            // 树形配置
            defaultProps: {
                children: 'children',
                label: 'label'
            },
            // 当前选中的节点
            currentNode: null,
            // 加载状态
            loading: false,
            // 当前选中的节点ID
            currentNodeId: null,
            // 展开的节点
            expandedKeys: [],
            // 保存当前选中的知识项
            currentKnowledgeItem: null,
            // 新增的数据属性
            decompositionDialogVisible: false,
            graphDialogVisible: false,
            decompositionResult: '',
            decompositionJson: null,
            isLoading: false,
            loadingPercentage: 0,
            loadingStatus: '',
            loadingMessage: '正在生成知识分解...',
            isGraphLoading: false,
            graphLoadingPercentage: 0,
            graphLoadingStatus: '',
            graphLoadingMessage: '正在生成知识图谱...',
            // 添加go对象引用
            go: null,
            // 初始化原始引用的知识点
            originalKnowledgeNodes: [],
            originalKnowledgeNodesBackup: [],
            // 添加markdown-it实例和渲染后的结果
            md: null,
            renderedMarkdown: '',
        }
    },
    created() {
        // 组件创建时获取部门列表
        this.fetchDepartments();
        // 初始化markdown-it
        this.initMarkdownIt();
    },
    mounted() {
        this.decompositionDialogVisible = false;
        this.graphDialogVisible = false;
        
        // 加载GoJS库
        this.loadGoJSLibrary();
    },
    watch: {
        // 监听搜索文本变化
        filterText(val) {
            this.$refs.tree.filter(val);
        }
    },
    methods: {  
        // 添加GoJS库加载方法
        loadGoJSLibrary() {
            // 检查是否已经存在
            if (window.go) {
                this.go = window.go;
                console.log('GoJS库已加载');
                return;
            }
            
            // 动态加载GoJS
            const script = document.createElement('script');
            // script.src = 'https://unpkg.com/gojs@2.3.5/release/go.js';
            script.async = true;
            script.onload = () => {
                this.go = window.go;
                console.log('GoJS库加载成功');
            };
            script.onerror = () => {
                console.error('GoJS库加载失败');
            };
            document.head.appendChild(script);
        },
        // 初始化markdown-it方法
        initMarkdownIt() {
            // 检查是否已经存在window.markdownit
            if (window.markdownit) {
                this.md = window.markdownit({
                    html: true,        // 允许HTML标签
                    linkify: true,     // 自动转换URL为链接
                    typographer: true, // 启用一些语言中性的替换和引号
                    breaks: true       // 转换换行符为<br>
                });
                console.log('markdown-it初始化成功');
            } else {
                console.error('markdown-it库未加载');
            }
        },
        // 更新关闭知识分解弹框方法
        closeDecompositionDialog() {
            this.decompositionDialogVisible = false;
            this.decompositionResult = '';
            this.renderedMarkdown = ''; // 清空渲染结果
            this.isLoading = false;
            // 不清除decompositionJson，以便保存后可以使用
        },
        
        // 知识分解按钮点击事件
        handleShowDialog1(item) {
            this.decompositionDialogVisible = true;
            
            // 保存当前选中的知识项
            this.currentKnowledgeItem = item;
            
            // 确保在下一个事件循环中执行
            this.$nextTick(() => {
                // 开始生成知识分解
                if (item && item.content) {
                    this.generateDecomposition(item);
                } else {
                    console.error('知识项数据不完整', item);
                }
            });
        },

        // 修改生成知识分解方法
        async generateDecomposition(item) {
            if (!item || !item.content) {
                this.$message.error('知识项数据不完整，无法进行分解');
                return;
            }
            
            this.decompositionResult = ''; // 清空之前的结果
            this.renderedMarkdown = ''; // 清空渲染结果
            this.decompositionJson = null; // 清空之前的JSON
            let jsonContent = ''; // 用于累积JSON内容
            let isCollectingJson = false; // 标记是否正在收集JSON内容
            
            try {
                // 构建请求参数
                const params = {
                    model: "qwen2.5-72b",
                    content: item.content,
                    max_token: "10240",
                    temperature: "0.6",
                    stream: true
                };
                
                // 创建 EventSource 连接
                const response = await fetch(`${this.apiConfig.baseUrl}/v1/knowledge/graph`, {
                    method: 'POST',
                    headers: {
                        'Authorization': this.apiConfig.token,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(params)
                });

                // 创建可读流并处理数据
                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        console.log('流读取完成');
                        break;
                    }
                    
                    // 解码数据
                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');
                    
                    for (const line of lines) {
                        if (line.trim() === '') continue;
                        
                        if (line.startsWith('data: ')) {
                            const jsonData = line.slice(6); // 移除 'data: ' 前缀
                            try {
                                if (jsonData.trim() === '[DONE]') {
                                    // 流结束
                                    continue;
                                }
                                
                                const data = JSON.parse(jsonData);
                                
                                // 从choices数组中获取content
                                if (data.choices && data.choices[0] && data.choices[0].delta) {
                                    const content = data.choices[0].delta.content;
                                    if (content) {
                                        // 检查是否包含```json标记
                                        if (content.includes('```json')) {
                                            isCollectingJson = true;
                                            jsonContent = ''; // 确保开始时是空的
                                            console.log('开始收集JSON数据');
                                            continue;
                                        }
                                        
                                        // 检查是否是JSON结束标记 - 修改为更精确地检测结束标记
                                        if (content.includes('```') && isCollectingJson && !content.includes('```json')) {
                                            isCollectingJson = false;
                                            // 解析收集到的JSON
                                            try {
                                                // 确保JSON内容不为空并且是有效的JSON格式
                                                if (jsonContent && jsonContent.trim()) {
                                                    console.log('收集到的JSON数据:', jsonContent);
                                                    const knolDataObj = JSON.parse(jsonContent);
                                                    this.decompositionJson = knolDataObj;
                                                    console.log('成功解析JSON数据:', knolDataObj);
                                                    
                                                    // 将分解结果保存到当前知识项
                                                    if (this.currentKnowledgeItem) {
                                                        this.currentKnowledgeItem.decompositionJson = knolDataObj;
                                                    }
                                                } else {
                                                    console.error('收集到的JSON数据为空');
                                                    this.$message.error('JSON数据为空，请重试');
                                                }
                                            } catch (e) {
                                                console.error('解析JSON数据失败:', e, '原始数据:', jsonContent);
                                                this.$message.error('JSON数据解析失败，请重试');
                                            }
                                            continue;
                                        }
                                        
                                        // 如果正在收集JSON，添加到jsonContent
                                        if (isCollectingJson) {
                                            jsonContent += content;
                                        }
                                        
                                        // 实时追加内容到结果中
                                        this.decompositionResult += content;
                                        
                                        // 使用markdown-it实时渲染内容
                                        if (this.md) {
                                            this.renderedMarkdown = this.md.render(this.decompositionResult);
                                        } else {
                                            // 如果markdown-it未初始化，使用普通文本
                                            this.renderedMarkdown = this.decompositionResult;
                                        }
                                    }
                                }
                            } catch (e) {
                                console.error('解析SSE数据失败:', e);
                            }
                        }
                    }
                }
                
            } catch (error) {
                console.error('生成知识分解失败:', error);
                this.$message.error('生成知识分解失败: ' + error.message);
            } finally {
                this.isLoading = false;
            }
        },

        // 保存分解结果
        saveDecompositionResult() {
            if (!this.decompositionResult || !this.currentKnowledgeItem) {
                this.$message.warning('没有可保存的分解结果');
                return;
            }
            
            // 如果decompositionJson为null，尝试从decompositionResult中提取JSON
            if (!this.decompositionJson && this.decompositionResult) {
                console.log('尝试从分解结果中提取JSON数据');
                
                // 使用正则表达式提取```json...```部分
                const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
                const match = this.decompositionResult.match(jsonRegex);
                
                if (match && match[1]) {
                    try {
                        const extractedJson = match[1].trim();
                        console.log('从结果中提取的JSON:', extractedJson);
                        
                        // 解析提取的JSON
                        const jsonData = JSON.parse(extractedJson);
                        this.decompositionJson = jsonData;
                        console.log('成功从结果中解析JSON数据');
                    } catch (e) {
                        console.error('从结果中解析JSON失败:', e);
                        this.$message.warning('解析JSON失败，将只保存文本结果');
                    }
                } else {
                    console.warn('未在结果中找到JSON数据');
                }
            }
            
            console.log('保存分解结果:', this.decompositionJson);
            // 确保当前知识项保存解析后的JSON数据
            if (this.decompositionJson) {
                this.currentKnowledgeItem.decompositionJson = this.decompositionJson;
            }
            
            // 这里可以添加保存到后端的逻辑
            this.$message.success('分解结果已保存');
            this.closeDecompositionDialog();
        },

        // 显示知识图谱
        showItemGraph(item, event) {
            // 阻止事件冒泡，防止触发卡片点击
            if (event) {
                event.stopPropagation();
            }
            
            // 保存当前选中的知识项
            this.currentKnowledgeItem = item;
            
            // 检查是否已经进行过知识分解
            let graphData = item.decompositionJson || this.decompositionJson;
            
            if (!graphData) {
                this.$message.warning('请先点击"知识分解"按钮，生成知识分解结果后再查看知识图谱');
                return;
            }
            
            // 打开图谱弹框并生成图谱
            this.graphDialogVisible = true;
            
            // 生成知识图谱
            this.generateKnowledgeGraph(this.currentKnowledgeItem, graphData);
        },

        // 关闭图谱弹框
        closeGraphDialog() {
            this.graphDialogVisible = false;
            this.isGraphLoading = false;
            
            // 正确释放GoJS图表实例
            if (this.myDiagram) {
                this.myDiagram.div = null;  // 断开与DOM元素的连接
                this.myDiagram = null;      // 清空实例引用
            }
            
            // 清空图谱容器
            const container = document.getElementById('knowledge-graph-container');
            if (container) {
                container.innerHTML = '';
            }
            
            // 不要清除decompositionJson，因为可能还需要再次查看图谱
        },

        // 生成知识图谱
        async generateKnowledgeGraph(item, decompositionJson) {
            if (!item || !decompositionJson) {
                this.$message.error('数据不完整，无法生成知识图谱');
                return;
            }
            
            this.isGraphLoading = true;
            this.graphLoadingPercentage = 0;
            this.graphLoadingStatus = '';
            this.graphLoadingMessage = '正在生成知识图谱...';
            
            try {
                // 解析JSON数据
                // 如果decompositionJson是字符串，需要解析
                let parsedData = decompositionJson;
                if (typeof decompositionJson === 'string') {
                    try {
                        parsedData = JSON.parse(decompositionJson);
                    } catch (e) {
                        console.error('分解数据不是有效的JSON:', e);
                    }
                }
                
                // 将loading进度调整为100%
                this.graphLoadingPercentage = 100;
                this.graphLoadingStatus = 'success';
                
                // 延迟关闭加载状态，渲染图谱
                setTimeout(() => {
                    this.isGraphLoading = false;
                    
                    // 在这里渲染图谱
                    this.$nextTick(() => {
                        this.renderKnowledgeGraph(parsedData);
                    });
                }, 500);
                
            } catch (error) {
                this.$message.error('生成知识图谱失败: ' + error.message);
                this.isGraphLoading = false;
            }
        },

        // 渲染知识图谱 - 支持多层级结构
        renderKnowledgeGraph(graphData) {
            const container = document.getElementById('knowledge-graph-container');
            if (!container) {
                console.error('找不到图谱容器元素');
                return;
            }
            
            // 清空容器
            container.innerHTML = '';
            
            // 确保GoJS已加载
            if (!window.go && !this.go) {
                container.innerHTML = '<div style="padding: 20px; color: red;">GoJS库未加载，请刷新页面重试</div>';
                console.error('GoJS库未加载');
                return;
            }
            
            const go = window.go || this.go;
            
            try {
                // 创建GoJS图表 - 使用树形布局
                this.myDiagram = new go.Diagram(container, {
                    "undoManager.isEnabled": true,  // 启用撤销/重做
                    layout: new go.TreeLayout({
                        angle: 90,  // 垂直布局
                        nodeSpacing: 40,  // 增加节点间距
                        layerSpacing: 80,  // 增加层级间距
                        arrangement: go.TreeLayout.ArrangementVertical
                    }),
                    "animationManager.isEnabled": true,
                    initialContentAlignment: go.Spot.Center
                });
                
                // 定义节点模板 - 使用简单文本块先确保基本功能可用
                this.myDiagram.nodeTemplate = new go.Node("Auto")
                    .add(
                        new go.Shape("RoundedRectangle", {
                            fill: "white", 
                            stroke: "#333",
                            strokeWidth: 1,
                            minSize: new go.Size(250, 60)  // 增加最小尺寸
                        }).bind("fill", "level", level => {
                            // 根据层级返回不同的颜色
                            const colors = [
                                "#e6f7ff", // 根节点
                                "#fffbe6", // 一级节点
                                "#f6ffed", // 二级节点
                                "#fff1f0", // 三级节点
                                "#f9f0ff"  // 更深层级节点
                            ];
                            return colors[Math.min(level, colors.length - 1)] || "#ffffff";
                        }),
                        new go.TextBlock({
                            margin: 10,
                            font: "12px sans-serif",
                            stroke: "#333",
                            wrap: go.TextBlock.WrapFit,
                            textAlign: "left",
                            width: 280,
                            editable: false
                        }).bind("text", "text")
                         .bind("font", "level", level => {
                             // 根据层级返回不同的字体样式
                             if (level === 0) return "bold 15px sans-serif";
                             if (level === 1) return "bold 14px sans-serif";
                             return "12px sans-serif";
                         })
                    );
                
                // 定义链接模板 - 简化线条
                this.myDiagram.linkTemplate =
                    new go.Link()
                        .add(
                            new go.Shape({
                                stroke: "#555",
                                strokeWidth: 1.2
                            }),
                            new go.Shape({
                                toArrow: "Standard",
                                fill: "#555",
                                stroke: null,
                                scale: 0.8
                            })
                        );
                
                // 转换数据结构为GoJS可用的格式
                const { nodeDataArray, linkDataArray } = this.convertToGraphModel(graphData);
                
                // 如果没有数据，显示简单的提示
                if (nodeDataArray.length === 0) {
                    container.innerHTML = '<div style="padding: 20px; text-align: center;">没有可显示的知识图谱数据</div>';
                    return;
                }
                
                // 设置模型数据
                this.myDiagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);
                
                // 自动缩放以适应所有内容
                this.myDiagram.zoomToFit();
                
            } catch (error) {
                console.error('渲染知识图谱时出错:', error);
                container.innerHTML = `<div style="padding: 20px; color: red;">图谱渲染失败: ${error.message}</div>`;
            }
        },

        // 数据结构转换工具：将层次结构转换为图表可用的节点和链接数组
        convertToGraphModel(data) {
            const nodeDataArray = [];
            const linkDataArray = [];
            
            
            // 使用递归方法处理各种可能的数据结构
            const processNode = (node, parentKey = null, level = 0) => {
                // 如果节点无效，则跳过
                if (!node) return null;
                
                // 提取节点键和标题
                const key = node.key || node.kp_id || node.session || `node_${Math.random().toString(36).substr(2, 9)}`;
                const title = node.title || node.text || node.name || node.content || '未命名节点';
                
                
                // 创建节点文本(包含details、contacts和links)
                let nodeText = title;
                
                // 处理详情内容
                if (node.details) {
                    if (Array.isArray(node.details)) {
                        // 如果是数组，添加概要
                        nodeText += '\n\n详情: ' + node.details.join(' | ');
                    } else if (typeof node.details === 'string') {
                        nodeText += '\n\n详情: ' + node.details;
                    }
                }
                
                // 处理联系人信息
                if (node.contacts && Array.isArray(node.contacts) && node.contacts.length > 0) {
                    nodeText += '\n\n联系方式: ';
                    node.contacts.forEach(contact => {
                        if (contact.name) nodeText += contact.name + ' ';
                        if (contact.address) nodeText += contact.address + ' ';
                        if (contact.hours) nodeText += contact.hours;
                    });
                }
                
                // 处理链接信息
                if (node.links && Array.isArray(node.links) && node.links.length > 0) {
                    nodeText += '\n\n相关链接: ';
                    node.links.forEach(link => {
                        if (link.name) nodeText += link.name + ' ';
                        if (link.url) nodeText += link.url;
                    });
                }
                
                // 将节点添加到节点数组
                nodeDataArray.push({
                    key: key,
                    text: nodeText,
                    level: level,  // 记录节点层级以支持样式区分
                    originalData: node  // 保存原始数据，以便需要时可以访问
                });
                
                // 如果有父节点，则创建连接
                if (parentKey !== null) {
                    linkDataArray.push({
                        from: parentKey,
                        to: key
                    });
                }
                
                // 处理子节点 - 支持多种可能的子节点属性名称
                const childrenArrays = [
                    node.children,
                    node.items,
                    node.subitems,
                    node.knowledge_points,
                    node.sub_points,
                    node.subNodes
                ];
                
                // 处理所有可能的子节点数组
                childrenArrays.forEach(childrenArray => {
                    if (Array.isArray(childrenArray)) {
                        childrenArray.forEach(child => {
                            // 如果子项是字符串，则为其创建一个对象结构
                            if (typeof child === 'string') {
                                child = { 
                                    key: `child_${Math.random().toString(36).substr(2, 9)}`, 
                                    title: child 
                                };
                            }
                            processNode(child, key, level + 1);
                        });
                    }
                });
                
                return key;
            };
            
            // 开始处理根节点
            processNode(data, null, 0);
            
            return { nodeDataArray, linkDataArray };
        },
        // 单位变化处理
        handleDepartmentChange() {
            console.log(`部门切换为: ${this.selectedDepartment}`);
            
            // 清空当前数据
            this.knowledgeTree = [];
            this.knowledgeItems = [];
            this.currentNode = null;
            this.currentNodeId = null;
            this.filterText = '';
            
            // 重新获取分类数据
            this.fetchKnowledgeCategories();
            
            // 提示用户
            this.$message({
                type: 'info',
                message: `已切换到${this.selectedDepartment}知识库`
            });
        },
        
        // 获取部门列表
        async fetchDepartments() {
            try {
                const apiUrl = `${this.apiConfig.baseUrl}/api/departments`;
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': this.apiConfig.token,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`获取部门列表失败: ${response.status} ${response.statusText}`);
                }
                
                const data = await response.json();
                if (data && data.departments) {
                    // 转换部门数据为选项格式
                    this.departmentOptions = data.departments.map(dept => ({
                        value: dept.department_name,
                        label: dept.department_name
                    }));
                    
                    // 如果有部门数据，默认选择第一个
                    if (this.departmentOptions.length > 0) {
                        this.selectedDepartment = this.departmentOptions[0].value;
                        // 获取该部门的知识分类
                        this.fetchKnowledgeCategories();
                    }
                } else {
                    console.warn('部门数据格式不正确');
                    this.$message.warning('获取部门列表数据格式不正确');
                }
            } catch (error) {
                console.error('获取部门列表失败:', error);
                this.$message.error('获取部门列表失败: ' + error.message);
            }
        },
        
        // 获取知识点分类
        async fetchKnowledgeCategories() {
            this.loading = true;
            this.knowledgeTree = []; // 清空现有树数据
            
            try {
                // console.log(`开始获取 ${this.selectedDepartment} 的知识分类数据`);
                
                const apiUrl = `${this.apiConfig.baseUrl}/api/department_taxonomy?department_name=${encodeURIComponent(this.selectedDepartment)}`;
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': this.apiConfig.token,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('响应错误:', errorText);
                    throw new Error(`获取分类失败: ${response.status} ${response.statusText}`);
                }
                
                const data = await response.json();
                if (data) {
                    // 转换分类数据为树形结构
                    this.knowledgeTree = this.transformCategoryTree(data);
                    // console.log(`${this.selectedDepartment} 转换后的知识树:`, this.knowledgeTree);
                    
                    // 清空当前选中的节点
                    this.currentNode = null;
                    this.currentNodeId = null;
                    this.knowledgeItems = [];
                    
                    // 如果树不为空，可以默认展开第一级
                    if (this.knowledgeTree.length > 0) {
                        this.$nextTick(() => {
                            let maxDepth = this.getMaxDepth(this.knowledgeTree);
                            let expandLevel = maxDepth > 1 ? maxDepth - 1 : maxDepth;
                            this.expandNodesRecursively(this.knowledgeTree, expandLevel);
                        });
                    } else {
                        console.warn(`${this.selectedDepartment} 转换后的知识树为空`);
                    }
                } else {
                    console.warn(`${this.selectedDepartment} 返回数据为空`);
                    this.$message.warning('获取知识点分类数据为空');
                }
                
            } catch (error) {
                console.error(`获取 ${this.selectedDepartment} 知识点分类失败:`, error);
                this.$message.error('获取知识点分类失败: ' + error.message);
            } finally {
                this.loading = false;
            }
        },
        
        // 转换分类树结构
        transformCategoryTree(data) {
            if (!data || !data.items) {
                console.log('分类数据无效或为空');
                return [];
            }
            
            try {
                // 递归处理节点
                const processNode = (node, parentId = null, level = 0) => {
                    if (!node || !node.key) return null;
                    
                    const nodeId = `node-${Math.random().toString(36).substr(2, 9)}`;
                    const nodeData = {
                        id: nodeId,
                        label: node.key,
                        name: node.key,
                        type: 'category', // 默认为category类型
                        level: level
                    };
                    
                    // 如果有父节点，添加父节点ID
                    if (parentId) {
                        nodeData.parentId = parentId;
                    }
                    
                    // 处理子节点
                    if (node.items && node.items.length > 0) {
                        nodeData.children = node.items
                            .map(child => processNode(child, nodeId, level + 1))
                            .filter(child => child !== null);
                    } else {
                        // 如果没有子节点，则标记为subcategory（最后一级分类）
                        nodeData.type = 'subcategory';
                    }
                    
                    return nodeData;
                };
                
                // 处理根节点的子节点
                return data.items
                    .map(item => processNode(item))
                    .filter(item => item !== null);
                    
            } catch (error) {
                console.error('转换知识树数据时出错:', error);
                return [];
            }
        },
        
        // 根据分类获取知识点列表
        async fetchKnowledgeByCategory(category) {
            this.knowledgeItems = [];
            this.loading = true;
            
            try {
                // console.log(`获取 ${this.selectedDepartment} 下 ${category} 分类的知识点`);
                
                const params = {
                    category: category
                };
                
                // 根据不同部门选择不同的API接口
                let apiUrl;
                
                if (this.selectedDepartment === '市医保中心') {
                    // 市医保中心知识库使用 sjj_knowledge 接口
                    apiUrl = `${this.apiConfig.baseUrl}/api/feedback/getKnowle/${encodeURIComponent(category)}`;
                } else if (this.selectedDepartment === '政务中心业务') {
                    // 政务中心业务使用 zwzx_knowledge 接口，使用参数形式
                    apiUrl = `${this.apiConfig.baseUrl}/api/zwzx_knowledge?category=${encodeURIComponent(category)}`;
                } else if (this.selectedDepartment === '市监知识库') {
                    // 市监知识库使用 getLGKnowle 接口
                    apiUrl = `${this.apiConfig.baseUrl}/api/feedback/getLGKnowle/${encodeURIComponent(category)}`;
                }
                
                if (!apiUrl) {
                    throw new Error(`未找到 ${this.selectedDepartment} 的对应接口`);
                }
                
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': this.apiConfig.token,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`获取知识点失败: ${response.status} ${response.statusText}`);
                }
                
                const data = await response.json();
                // console.log(`${category} 知识点数据:`, data);
                
                // 根据不同接口处理返回的数据格式
                if (this.selectedDepartment === '政务中心业务' && data && data.knowledge) {
                    // 政务中心业务返回格式处理
                    this.knowledgeItems = data.knowledge.map(item => {
                        // 解析知识项，格式为"标题,内容"
                        const parts = item.split(',');
                        let title = parts[0] || '';
                        // 去掉内容中的引号
                        let content = parts.length > 1 ? parts[1].replace(/^"|"$/g, '') : '';
                        
                        return {
                            title: title,
                            content: content,
                            kgid: Math.random().toString(36).substr(2, 9)  // 生成临时ID
                        };
                    });
                } else if (data && data.feedback_list) {
                    // 市医保中心和市监知识库使用相同的返回格式
                    this.knowledgeItems = data.feedback_list;
                } else {
                    console.warn(`${category} 知识点数据格式不符合预期:`, data);
                    this.$message.warning('获取知识点数据格式不正确');
                    this.knowledgeItems = [];
                }
                
            } catch (error) {
                console.error(`获取 ${category} 知识点失败:`, error);
                this.$message.error('获取知识点失败: ' + error.message);
                this.knowledgeItems = [];
            } finally {
                this.loading = false;
            }
        },
        
        // 节点过滤方法
        filterNode(value, data) {
            if (!value) return true;
            return data.label.toLowerCase().includes(value.toLowerCase());
        },
        
        // 点击节点
        handleNodeClick(data) {
            this.currentNode = JSON.parse(JSON.stringify(data));
            this.currentNodeId = data.id;
            
            // 检查是否是最后一级分类（没有子节点或type为subcategory）
            if (data.type === 'subcategory' || ((!data.children || data.children.length === 0) && data.type === 'category')) {
                // 调用接口获取该分类下的知识项
                this.fetchKnowledgeByCategory(data.name);
            } else {
                // 如果点击的是中间级别的分类，清空知识点列表
                this.knowledgeItems = [];
            }
        },
        
        // 编辑知识点项
        editKnowledgeItem(item) {
            // 确定所属分类信息
            let currentCategory = this.currentNode.name;
            let parentCategory = '';
            
            // 查找当前分类的父级
            for (let category of this.knowledgeTree) {
                if (category.children) {
                    for (let subcategory of category.children) {
                        if (subcategory.name === currentCategory) {
                            parentCategory = category.name;
                            break;
                        }
                    }
                }
            }
            
            // 如果没有找到父分类，说明当前分类是一级分类
            if (!parentCategory) {
                parentCategory = currentCategory;
                currentCategory = '';
            }
            
            this.currentNode = {
                id: item.kgid,
                label: this.stripHtmlTags(item.title),
                content: item.content,
                category: currentCategory,
                parentCategory: parentCategory,
                type: 'item'
            };
            
            // 将树的当前选中节点重置为空，因为我们现在在编辑知识点
            this.currentNodeId = null;
        },
        
        // 创建新节点
        createNewNode() {
            // 如果当前选中了分类，确定是一级还是二级分类
            let currentCategory = '';
            let parentCategory = '';
            
            if (this.currentNode && this.currentNode.type === 'category') {
                let isSubcategory = false;
                
                // 检查是否是二级分类
                for (let category of this.knowledgeTree) {
                    if (category.children) {
                        for (let subcategory of category.children) {
                            if (subcategory.id === this.currentNode.id) {
                                currentCategory = subcategory.name;
                                parentCategory = category.name;
                                isSubcategory = true;
                                break;
                            }
                        }
                        if (isSubcategory) break;
                    }
                }
                
                // 如果不是二级分类，那就是一级分类
                if (!isSubcategory) {
                    parentCategory = this.currentNode.name;
                }
            } else if (this.knowledgeTree.length > 0) {
                // 默认使用第一个分类
                parentCategory = this.knowledgeTree[0].name;
            }
            
            this.currentNode = {
                label: '新建条目',
                content: '',
                category: currentCategory,
                parentCategory: parentCategory,
                type: 'item'
            };
            
            // 重置树的当前选中节点
            this.currentNodeId = null;
        },
           
        // 获取节点图标
        getNodeIcon(data) {
            if (data.type === 'category') {
                return 'el-icon-folder';
            } else if (data.type === 'item') {
                return 'el-icon-document';
            }
            return '';
        },
        
        // 移除HTML标签
        stripHtmlTags(text) {
            if (!text) return '';
            return text.replace(/<\/?[^>]+(>|$)/g, '');
        },
        
        // 查看知识点详情
        viewKnowledgeDetail(item) {
            // 不重置decompositionJson和decompositionResult
            // 这样即使切换知识项，也不会丢失已生成的数据
            this.editKnowledgeItem(item);
        },

        // 导出图谱为SVG并下载
        exportGraphAsSvg() {
            if (!this.myDiagram) {
                this.$message.error('图谱尚未渲染，无法导出');
                return;
            }
            
            try {
                // 创建SVG元素
                const svg = this.myDiagram.makeSvg({
                    scale: 1,
                    background: "white" // 设置背景颜色
                });
                
                // 转换SVG为字符串
                const serializer = new XMLSerializer();
                let svgString = serializer.serializeToString(svg);
                
                // 添加XML声明和DOCTYPE
                svgString = '<?xml version="1.0" encoding="utf-8"?>\n' + svgString;
                
                // 将SVG字符串转换为Blob
                const blob = new Blob([svgString], { type: 'image/svg+xml' });
                
                // 创建下载链接
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                
                // 设置文件名 - 使用知识点标题或默认名称
                const fileName = (this.currentKnowledgeItem && this.currentKnowledgeItem.title) 
                    ? `知识图谱_${this.currentKnowledgeItem.title}.svg`
                    : '知识图谱.svg';
                
                link.download = fileName;
                
                // 模拟点击下载
                document.body.appendChild(link);
                link.click();
                
                // 清理
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
                
                this.$message.success('图谱已导出为SVG文件');
            } catch (error) {
                console.error('导出SVG时出错:', error);
                this.$message.error('导出SVG失败: ' + error.message);
            }
        },

        getMaxDepth(nodes) {
            let max = 0;
            function traverse(arr) {
                arr.forEach(node => {
                    if (node.level > max) max = node.level;
                    if (node.children && node.children.length > 0) {
                        traverse(node.children);
                    }
                });
            }
            traverse(nodes);
            return max;
        },

        expandNodesRecursively(nodes, expandLevel) {
            nodes.forEach(node => {
                if (node.level < expandLevel) {
                    let treeNode = this.$refs.tree.store.nodesMap[node.id];
                    if (treeNode) {
                        treeNode.expanded = true;
                    }
                    if (node.children && node.children.length > 0) {
                        this.expandNodesRecursively(node.children, expandLevel);
                    }
                }
            });
        }
    }
}
</script>

<style scoped>
.knowledge-container {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.knowledge-header {
    padding: 16px;
    border-bottom: 1px solid #e6e6e6;
    display: flex;
    gap: 10px;
}

.knowledge-main {
    flex: 1;
    display: flex;
    overflow: hidden;
}

.knowledge-sidebar {
    width: 320px;
    border-right: 1px solid #e6e6e6;
    display: flex;
    flex-direction: column;
    background-color: #fff;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.search-box {
    padding: 16px;
    border-bottom: 1px solid #e6e6e6;
    background-color: #fbfbfb;
}

.tree-container {
    flex: 1;
    overflow: auto;
    padding: 12px;
    background-color: #fff;
}

.el-tree {
    background-color: transparent;
}

.el-tree-node {
    position: relative;
}

.el-tree-node__content {
    height: 36px;
    border-radius: 4px;
    margin-bottom: 4px;
    transition: all 0.3s;
}

.el-tree-node__content:hover {
    background-color: #edf6ff;
}

.el-tree-node.is-current > .el-tree-node__content {
    background-color: #ecf5ff;
    color: #409EFF;
    font-weight: bold;
    box-shadow: 0 2px 8px 0 rgba(64, 158, 255, 0.15);
}

.el-tree-node__children {
    padding-left: 4px;
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

.el-tree-node.is-current > .el-tree-node__content .node-icon-label i {
    color: #409EFF;
}

.node-label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.knowledge-content {
    flex: 1;
    padding: 20px;
    overflow: auto;
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

.category-items {
    padding: 10px;
}

.knowledge-item-card {
    margin-bottom: 15px;
}

.item-content {
    white-space: pre-line;
    line-height: 1.6;
    padding: 0 20px;
    font-size: 14px;
    color: #606266;
}

.empty-items {
    text-align: center;
    padding: 30px;
    color: #909399;
}

.active-card {
    border: 2px solid #409EFF;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.category-display {
    line-height: 32px;
}

.category-display .el-tag {
    margin-right: 10px;
}

.no-category {
    color: #909399;
    font-style: italic;
}

/* 自定义展开按钮样式 - 横向三角形 */
.el-tree-node__expand-icon {
    font-size: 12px;
}

.el-tree-node__expand-icon.expanded {
    transform: rotate(90deg);
}

.el-tree-node__expand-icon.is-leaf {
    color: transparent;
}

.el-card__header {
    padding: 15px 20px;
    font-weight: bold;
    font-size: 16px;
    background-color: #f5f7fa;
    border-bottom: 1px solid #e6e6e6;
}

.el-card__body {
    padding: 15px 0;
}

.knowledge-item-card .clearfix {
    display: flex;
    align-items: center;
}

.knowledge-item-card .clearfix span {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.category-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.category-header h2 {
    margin: 0;
}

.item-buttons {
    float: right;
}

.item-buttons .el-button {
    margin-left: 5px;
}

/* 新增样式 */
.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 0;
}

.loading-container p {
    margin-top: 20px;
    color: #606266;
}

.graph-container {
    height: 75vh;
    border: 1px solid #e6e6e6;
    border-radius: 4px;
    background-color: #f5f7fa;
}

.el-dialog__body{
    padding: 10px;
}

/* 添加知识图谱弹框样式 */
:deep(.knowledge-graph-dialog) {
    height: 75vh;
    display: flex;
    flex-direction: column;
}

:deep(.knowledge-graph-dialog.el-dialog) {
    margin-top: 2.5vh !important;
}

:deep(.knowledge-graph-dialog .el-dialog__body) {
    flex: 1;
    overflow: auto;
    padding: 10px;
}

:deep(.knowledge-graph-dialog .el-dialog__header) {
    padding: 15px 20px;
}

:deep(.knowledge-graph-dialog .el-dialog__footer) {
    padding: 10px 20px;
}

/* 添加知识分解弹框样式 */
:deep(.knowledge-decomposition-dialog) {
    height: 80vh;
    display: flex;
    flex-direction: column;
}

:deep(.knowledge-decomposition-dialog.el-dialog) {
    margin-top: 2.5vh !important;
}

:deep(.knowledge-decomposition-dialog .el-dialog__body) {
    flex: 1;
    overflow: auto;
    padding: 15px;
}

:deep(.knowledge-decomposition-dialog .el-dialog__header) {
    padding: 15px 20px;
}

:deep(.knowledge-decomposition-dialog .el-dialog__footer) {
    padding: 10px 20px;
}

:deep(.el-textarea__inner) {
    height: 100%;
    min-height: 65vh;
    line-height: 1.6;
    font-size: 14px;
}

.disabled-button {
    color: #c0c4cc !important;
    cursor: not-allowed !important;
}

pre{
    background: #e9e9e9;
    padding: 10px;
    border-radius: 4px;
}

/* 添加Markdown渲染区域样式 */
.markdown-content {
    height: 65vh;
    overflow-y: auto;
    border: 1px solid #e6e6e6;
    border-radius: 4px;
    padding: 15px;
    line-height: 1.6;
    font-size: 14px;
    background-color: #fff;
}

/* Markdown内容样式美化 */
.markdown-content :deep(h1) {
    font-size: 24px;
    margin-top: 20px;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #eaecef;
}

.markdown-content :deep(h2) {
    font-size: 20px;
    margin-top: 18px;
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid #eaecef;
}

.markdown-content :deep(h3) {
    font-size: 18px;
    margin-top: 16px;
    margin-bottom: 8px;
}

.markdown-content :deep(h4) {
    font-size: 16px;
    margin-top: 14px;
    margin-bottom: 6px;
}

.markdown-content :deep(p) {
    margin-top: 8px;
    margin-bottom: 8px;
}

.markdown-content :deep(ul), .markdown-content :deep(ol) {
    padding-left: 20px;
    margin-top: 8px;
    margin-bottom: 8px;
}

.markdown-content :deep(blockquote) {
    padding: 0 1em;
    color: #6a737d;
    border-left: 0.25em solid #dfe2e5;
    margin: 12px 0;
}

.markdown-content :deep(code) {
    background-color: rgba(27,31,35,0.05);
    border-radius: 3px;
    padding: 0.2em 0.4em;
    font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
}

.markdown-content :deep(pre) {
    background-color: #f6f8fa;
    border-radius: 3px;
    padding: 16px;
    overflow: auto;
    margin: 12px 0;
}

.markdown-content :deep(pre code) {
    background-color: transparent;
    padding: 0;
}

.markdown-content :deep(table) {
    border-collapse: collapse;
    width: 100%;
    margin: 12px 0;
}

.markdown-content :deep(th), .markdown-content :deep(td) {
    border: 1px solid #dfe2e5;
    padding: 6px 13px;
}

.markdown-content :deep(th) {
    background-color: #f6f8fa;
    font-weight: 600;
}
</style> 
