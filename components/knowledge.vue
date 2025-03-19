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
                                    <el-button type="text" size="mini" @click.stop="showItemGraph(item, $event)">
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
                    <p>请选择查看一个知识库条目</p>
                    <!-- <el-button type="primary" @click="createNewNode">创建新条目</el-button> -->
                </div>
            </div>
        </div>

        <!-- 添加知识分解弹框 -->
        <el-dialog
            title="知识分解"
            :visible="decompositionDialogVisible"
            width="70%"
            @close="closeDecompositionDialog">
            <div v-if="isLoading" class="loading-container">
                <el-progress type="circle" :percentage="loadingPercentage" :status="loadingStatus"></el-progress>
                <p>{{ loadingMessage }}</p>
            </div>
            <div v-else>
                <el-input
                    type="textarea"
                    :rows="15"
                    placeholder="知识分解结果将在这里显示"
                    v-model="decompositionResult"
                    readonly>
                </el-input>
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
                // baseUrl: 'http://172.16.99.32:1034',
                baseUrl: 'https://lgdev.baicc.cc/',
                // baseUrl: 'http://172.16.99.32:1032',
                token: 'Bearer lg-evduwtdszwhdqzgqkwvdtmjgpmffipkwoogudnnqemjtvgcv'
            },
            // 新增的部门选项
            departmentOptions: [
                { value: '龙岗政数局', label: '市监局知识库' },
                { value: '市医保中心', label: '医保知识库' },
            ],
            // 当前选中的部门
            selectedDepartment: '龙岗政数局',
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
        }
    },
    created() {
        // 组件创建时获取知识点分类
        this.fetchKnowledgeCategories();
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
        // 关闭知识分解弹框
        closeDecompositionDialog() {
            this.decompositionDialogVisible = false;
            this.decompositionResult = '';
            this.isLoading = false;
        },
        
        // 知识分解按钮点击事件
        handleShowDialog1(item) {
            this.decompositionDialogVisible = true;
            // 确保在下一个事件循环中执行
            this.$nextTick(() => {
                // 开始生成知识分解
                if (item && item.title && item.content) {
                    this.generateDecomposition(item);
                } else {
                    console.error('知识项数据不完整', item);
                }
            });
        },

        // 生成知识分解
        async generateDecomposition(item) {
            if (!item || !item.title || !item.content) {
                this.$message.error('知识项数据不完整，无法进行分解');
                return;
            }
            
            this.loadingMessage = '正在生成知识分解...';
            
            try { 
                // 构建请求数据
                const requestData = {
                    title: item.title,
                    content: item.content
                };
                
                // 调用知识分解API
                const apiUrl = `${this.apiConfig.baseUrl}/api/feedback/decompose_knowledge`;
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': this.apiConfig.token,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestData)
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`生成知识分解失败: ${response.status} ${errorText}`);
                }
                
                const data = await response.json();
                
                // 假设API返回了一个格式的json结构
                if (data && data.result) {
                    this.decompositionResult = data.result;
                    // 保存json结构以便图谱使用
                    this.decompositionJson = data.result;
                    
                    // 将分解结果保存到当前知识项
                    if (this.currentKnowledgeItem) {
                        this.currentKnowledgeItem.decompositionJson = data.result;
                    }
                    
                    // 触发分解生成后的事件
                    this.onDecompositionGenerated(data.result);
                } else {
                    throw new Error('API返回的数据格式不正确');
                }
                
            } catch (error) {
                this.$message.error('生成知识分解失败: ' + error.message);
            }
        },

        // 知识分解生成后的处理
        onDecompositionGenerated(decomposition) {
            console.log('知识分解生成后的处理:', decomposition);
            // 在这里可以添加处理逻辑，例如保存分解结果到数据库
        },

        // 保存分解结果
        saveDecompositionResult() {
            if (!this.decompositionResult || !this.currentKnowledgeItem) {
                this.$message.warning('没有可保存的分解结果');
                return;
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
            
            console.log('显示知识图谱:', item);
            
            // 保存当前选中的知识项
            this.currentKnowledgeItem = item;
            
            // 打开图谱弹框并生成图谱
            this.graphDialogVisible = true;
            
            // 如果已经有分解数据，则直接使用
            if (this.currentKnowledgeItem && this.currentKnowledgeItem.decompositionJson) {
                this.generateKnowledgeGraph(this.currentKnowledgeItem, this.currentKnowledgeItem.decompositionJson);
            } else {
                // 如果没有分解数据，创建一个多层级示例数据进行演示
                const demoData = {
                    "key": "root",
                    "title": "基本医疗保险一档参保人门诊医保待遇",
                    "items": [
                        {
                            "key": "section1",
                            "title": "一、普通门诊统筹待遇",
                            "items": [
                                {
                                    "key": "section1_1",
                                    "title": "基本报销比例",
                                    "details": "按照医疗机构级别不同比例支付",
                                    "items": [
                                        {
                                            "key": "s1_1_1",
                                            "title": "一级以下医疗机构",
                                            "value": "75%"
                                        },
                                        {
                                            "key": "s1_1_2",
                                            "title": "二级医院",
                                            "value": "65%"
                                        },
                                        {
                                            "key": "s1_1_3",
                                            "title": "三级医院",
                                            "value": "55%"
                                        }
                                    ]
                                },
                                {
                                    "key": "section1_2",
                                    "title": "特殊人群额外补贴",
                                    "details": "退休人员及60岁以上居民参保人",
                                    "value": "支付比例提高5个百分点"
                                },
                                {
                                    "key": "section1_3",
                                    "title": "非选定医疗机构就诊",
                                    "details": "未经转诊到非选定医疗机构",
                                    "value": "统筹基金不予支付，可由个人账户支付"
                                }
                            ]
                        },
                        {
                            "key": "section2",
                            "title": "二、普通门诊统筹支付限额",
                            "items": [
                                {
                                    "key": "section2_1",
                                    "title": "职工基本医疗保险一档参保人",
                                    "items": [
                                        {
                                            "key": "s2_1_1",
                                            "title": "总体支付限额",
                                            "value": "不超过上上年度在岗职工年平均工资的6%（退休人员为7%）"
                                        },
                                        {
                                            "key": "s2_1_2",
                                            "title": "二级以上医院限额",
                                            "value": "不超过上上年度在岗职工年平均工资的3%（退休人员为3.5%）"
                                        }
                                    ]
                                },
                                {
                                    "key": "section2_2",
                                    "title": "职工基本医疗保险二档参保人、居民基本医疗保险参保人",
                                    "value": "支付限额最高不超过上上年度在岗职工年平均工资的1.5%"
                                }
                            ]
                        },
                        {
                            "key": "section3",
                            "title": "三、门诊诊查费",
                            "items": [
                                {
                                    "key": "section3_1",
                                    "title": "基本报销比例",
                                    "items": [
                                        {
                                            "key": "s3_1_1",
                                            "title": "一级以下医疗机构",
                                            "value": "80%"
                                        },
                                        {
                                            "key": "s3_1_2",
                                            "title": "二级医院",
                                            "value": "70%"
                                        },
                                        {
                                            "key": "s3_1_3",
                                            "title": "三级医院",
                                            "value": "60%"
                                        }
                                    ]
                                },
                                {
                                    "key": "section3_2",
                                    "title": "待遇限制",
                                    "value": "门诊诊查费待遇与其他由基本医疗保险统筹基金支付的门诊基本医疗费用待遇不重复享受"
                                }
                            ]
                        },
                        {
                            "key": "section4",
                            "title": "四、门诊大型设备",
                            "items": [
                                {
                                    "key": "section4_1",
                                    "title": "职工基本医疗保险一档参保人",
                                    "details": "在市内定点医疗机构门诊发生的大型医疗设备检查费用和治疗所发生的基本医疗费用",
                                    "value": "由职工基本医疗保险统筹基金按照80%的比例支付"
                                },
                                {
                                    "key": "section4_2",
                                    "title": "待遇限制",
                                    "value": "与其他由职工基本医疗保险统筹基金支付的门诊基本医疗费用待遇不重复享受"
                                },
                                {
                                    "key": "section4_3",
                                    "title": "适用范围",
                                    "value": "门诊大型医疗设备检查和治疗项目范围由市医疗保障行政部门另行制定"
                                }
                            ]
                        },
                        {
                            "key": "section5",
                            "title": "五、门诊特定病种待遇",
                            "items": [
                                {
                                    "key": "section5_1",
                                    "title": "门特病种分类",
                                    "items": [
                                        {
                                            "key": "s5_1_1",
                                            "title": "一类门特病种"
                                        },
                                        {
                                            "key": "s5_1_2",
                                            "title": "二类门特病种"
                                        }
                                    ]
                                },
                                {
                                    "key": "section5_2",
                                    "title": "一类门特病种支付比例",
                                    "items": [
                                        {
                                            "key": "s5_2_1",
                                            "title": "连续参保时间未满12个月",
                                            "value": "60%"
                                        },
                                        {
                                            "key": "s5_2_2",
                                            "title": "连续参保时间满12个月未满36个月",
                                            "value": "75%"
                                        },
                                        {
                                            "key": "s5_2_3",
                                            "title": "连续参保时间满36个月",
                                            "value": "90%"
                                        }
                                    ]
                                },
                                {
                                    "key": "section5_3",
                                    "title": "二类门特病种支付比例",
                                    "items": [
                                        {
                                            "key": "s5_3_1",
                                            "title": "高血压、糖尿病药品门诊费用",
                                            "details": "支付比例按第三十条规定执行"
                                        },
                                        {
                                            "key": "s5_3_2",
                                            "title": "签约家庭医生开具处方的高血压、糖尿病药品费用",
                                            "value": "90%"
                                        },
                                        {
                                            "key": "s5_3_3",
                                            "title": "其他二类门特病种",
                                            "items": [
                                                {
                                                    "key": "s5_3_3_1",
                                                    "title": "职工基本医疗保险一档参保人",
                                                    "value": "80%"
                                                },
                                                {
                                                    "key": "s5_3_3_2",
                                                    "title": "职工二档、居民参保人",
                                                    "value": "不低于60%"
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                };
                this.generateKnowledgeGraph(this.currentKnowledgeItem, demoData);
                this.$message.warning('该知识点暂无分解数据，显示示例图谱');
            }
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
                        nodeSpacing: 20,
                        layerSpacing: 50,
                        arrangement: go.TreeLayout.ArrangementVertical
                    }),
                    "animationManager.isEnabled": true,
                    initialContentAlignment: go.Spot.Center
                });
                
                // 定义节点模板 - 根据节点层级使用不同的样式
                this.myDiagram.nodeTemplate = new go.Node("Auto")
                    .add(
                        new go.Shape("RoundedRectangle", {
                            fill: "white",
                            stroke: "#333",
                            strokeWidth: 1
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
                            margin: 8,
                            font: "12px sans-serif"
                        })
                        .bind("text", "text")
                        .bind("font", "level", level => {
                            // 根据层级返回不同的字体样式
                            if (level === 0) return "bold 14px sans-serif";
                            if (level === 1) return "bold 13px sans-serif";
                            return `12px sans-serif`;
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
                const key = node.key || `node_${Math.random().toString(36).substr(2, 9)}`;
                const title = node.title || node.text || node.name || node.content || '未命名节点';
                
                // 将节点添加到节点数组
                nodeDataArray.push({
                    key: key,
                    text: title,
                    level: level  // 记录节点层级以支持样式区分
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
        
        // 获取知识点分类
        async fetchKnowledgeCategories() {
            this.loading = true;
            this.knowledgeTree = []; // 清空现有树数据
            
            try {
                console.log(`开始获取 ${this.selectedDepartment} 的知识分类数据`);
                
                const params = new URLSearchParams({
                    department: this.selectedDepartment
                });
                
                const apiUrl = `${this.apiConfig.baseUrl}/api/query_kb_category?${params.toString()}`;
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
                // 根据实际返回的数据格式处理
                if (data) {
                    // 直接使用返回的数组数据
                    this.knowledgeTree = this.transformCategoryTree(data);
                    console.log(`${this.selectedDepartment} 转换后的知识树:`, this.knowledgeTree);
                    
                    // 清空当前选中的节点
                    this.currentNode = null;
                    this.currentNodeId = null;
                    this.knowledgeItems = [];
                    
                    // 如果树不为空，可以默认展开第一级
                    if (this.knowledgeTree.length > 0) {
                        this.$nextTick(() => {
                            if (this.$refs.tree) {
                                // 展开第一个分类
                                this.$refs.tree.store.nodesMap[this.knowledgeTree[0].id].expanded = true;
                            }
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
                        label: this.stripHtmlTags(category.category2),
                        name: category.category2,
                        type: 'category',
                        children: Array.isArray(category.category3) ? category.category3
                            .filter(subCategory => subCategory) // 过滤掉空字符串
                            .map((subCategory, subIndex) => ({
                                id: `subcategory-${index}-${subIndex}`,
                                label: this.stripHtmlTags(subCategory),
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
        async fetchKnowledgeByCategory(category) {
            this.knowledgeItems = [];
            this.loading = true;
            
            try {
                console.log(`获取 ${this.selectedDepartment} 下 ${category} 分类的知识点`);
                
                const params = {
                    // department: this.selectedDepartment,
                    category: category
                };
                
                const queryString = new URLSearchParams(params).toString();
                
                // 根据不同部门选择不同的API接口
                let apiUrl;
                if (this.selectedDepartment === '市医保中心') {
                    // 医保知识库使用 getKnowle 接口
                    apiUrl = `${this.apiConfig.baseUrl}/api/feedback/getKnowle/${category}`;
                } else if (this.selectedDepartment === '龙岗政数局') {
                    // 市监局知识库使用 getLGKnowle 接口
                    apiUrl = `${this.apiConfig.baseUrl}/api/feedback/getLGKnowle/${category}?`;
                }
                
                console.log('知识点请求URL:', apiUrl);
                
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
                console.log(`${category} 知识点数据:`, data);
                
                if (data && data.feedback_list) {
                    this.knowledgeItems = data.feedback_list;
                    console.log(`获取到 ${this.knowledgeItems.length} 条知识点`);
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
            
            // 如果点击的是二级分类节点，获取该分类下的知识点
            if (data.type === 'subcategory') {
                this.fetchKnowledgeByCategory(data.name);
            } else if (data.type === 'category') {
                // 如果点击的是一级分类，清空知识点列表
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
                const fileName = (this.currentKnowledgeItem && this.currentKnowledgeItem.name) 
                    ? `知识图谱_${this.currentKnowledgeItem.name}.svg`
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
    min-height: 500px;
    /* height: calc(100vh - 160px); */
    border: 1px solid #e6e6e6;
    border-radius: 4px;
    background-color: #f5f7fa;
}

.el-dialog__body{
    padding: 10px;
}

/* 添加全屏对话框样式 */
/* :deep(.fullscreen-dialog) {
    display: flex;
    flex-direction: column;
    margin: 0 !important;
}

:deep(.fullscreen-dialog .el-dialog__body) {
    flex: 1;
    overflow: auto;
    padding: 10px;
} */
</style> 