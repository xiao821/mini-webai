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
                        <el-button type="primary" size="small" @click="showKnowledgeGraph(currentNode, $event)">
                            <i class="el-icon-share"></i> 知识图谱
                        </el-button>
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

        <!-- 知识图谱对话框 -->
        <el-dialog
            title="知识图谱"
            v-model="graphDialogVisible"
            width="80%"
            :before-close="handleGraphDialogClose"
            @opened="handleDialogOpened"
            fullscreen>
            <div class="knowledge-graph-container">
                <div class="graph-header">
                    <h3>{{ currentNode ? currentNode.name : '' }} 知识图谱</h3>
                    <div class="graph-tools">
                        <el-tooltip content="刷新图谱" placement="top">
                            <el-button type="text" icon="el-icon-refresh" @click="refreshGraph"></el-button>
                        </el-tooltip>
                        <el-tooltip content="全屏显示" placement="top">
                            <el-button type="text" icon="el-icon-full-screen" @click="fullscreenGraph"></el-button>
                        </el-tooltip>
                    </div>
                </div>
                
                <!-- 加载中状态 - 作为覆盖层 -->
                <div v-if="graphLoading" class="graph-loading-overlay">
                    <div class="graph-loading-content">
                        <i class="el-icon-loading"></i>
                        <p>知识图谱加载中...</p>
                    </div>
                </div>
                
                <!-- 知识图谱容器 - 始终可见 -->
                <div id="knowledgeGraphViewer" ref="graphViewer" class="graph-viewer-container"></div>
                
                <!-- 知识点详情 -->
                <el-card v-if="selectedGraphNode" class="detail-card" shadow="hover">
                    <template #header>
                        <div class="detail-header">
                            <span>{{ selectedGraphNode.title }}</span>
                        </div>
                    </template>
                    <div class="detail-content">{{ selectedGraphNode.content }}</div>
                </el-card>
            </div>
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
            
            // 知识图谱相关数据
            graphDialogVisible: false,
            graphLoading: false,
            graphData: null,
            knowledgeGraph: null,
            selectedGraphNode: null,
        }
    },
    created() {
        // 组件创建时获取知识点分类
        this.fetchKnowledgeCategories();
        
        // 检查GoJS库是否已加载，如果没有则动态加载
        if (!window.go) {
            this.loadGoJSLibrary();
        }
    },
    watch: {
        // 监听搜索文本变化
        filterText(val) {
            this.$refs.tree.filter(val);
        },
        // 监听路由参数变化
        '$route.query.id': {
            handler(id) {
                if (id) {
                    this.loadNodeById(id);
                }
            },
            immediate: true
        },
        // 监听对话框可见性
        graphDialogVisible(val) {
            if (val && this.graphData) {
                // 对话框打开且有数据时重新初始化图谱
                this.$nextTick(() => {
                    setTimeout(() => {
                        if (this.graphDialogVisible) { // 再次检查以确保对话框仍然是打开的
                            const graphElement = document.getElementById('knowledgeGraphViewer');
                            if (graphElement) {
                                this.initKnowledgeGraph(this.graphData.category, this.graphData.items);
                                this.graphLoading = false;
                            } else {
                                console.error('找不到知识图谱容器元素 (watch)');
                                // 再尝试通过ref获取
                                if (this.$refs.graphViewer) {
                                    this.initKnowledgeGraph(this.graphData.category, this.graphData.items);
                                    this.graphLoading = false;
                                } else {
                                    this.$message.error('无法初始化知识图谱，请重试');
                                    this.graphLoading = false;
                                }
                            }
                        }
                    }, 500); // 增加延迟时间
                });
            }
        }
    },
    methods: {
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
                
                const apiUrl = `${this.apiConfig.baseUrl}api/query_kb_category?${params.toString()}`;
                console.log('请求URL:', apiUrl);
                
                console.log('发送请求...');
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': this.apiConfig.token,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('收到响应:', response.status, response.statusText);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('响应错误:', errorText);
                    throw new Error(`获取分类失败: ${response.status} ${response.statusText}`);
                }
                
                const data = await response.json();
                console.log(`${this.selectedDepartment} 接收到的原始数据:`, JSON.stringify(data));
                console.log(`${this.selectedDepartment} 接收到的数据类型:`, typeof data, Array.isArray(data));
                
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
                                this.$refs.tree.store.setExpandedKeys([this.knowledgeTree[0].id]);
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
                    apiUrl = `${this.apiConfig.baseUrl}api/feedback/getKnowle/${category}`;
                } else if (this.selectedDepartment === '龙岗政数局') {
                    // 市监局知识库使用 getLGKnowle 接口
                    apiUrl = `${this.apiConfig.baseUrl}api/feedback/getLGKnowle/${category}?`;
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
        
        // 在指定节点下添加子节点
        appendNode(data) {
            // 由于不需要编辑功能，此处禁用添加节点
            this.$message({
                type: 'info',
                message: '当前不支持编辑功能'
            });
        },
        
        // 保存节点
        saveNode() {
            // 暂时不需要编辑知识点
            this.$message({
                type: 'info',
                message: '当前不支持编辑功能'
            });
        },
        
        // 删除节点
        deleteNode() {
            // 暂时不需要编辑知识点
            this.$message({
                type: 'info',
                message: '当前不支持编辑功能'
            });
        },
        
        // 根据ID加载节点
        loadNodeById(id) {
            // 这里实现根据ID加载节点的逻辑
            console.log('加载节点:', id);
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
        
        // 显示知识图谱
        showKnowledgeGraph() {
            // 直接打开对话框
            this.graphDialogVisible = true;
            console.log('对话框显示状态:', this.graphDialogVisible);
        },
        
        // 加载GoJS库
        loadGoJSLibrary() {
            // 检查是否已加载
            if (window.go) {
                console.log('GoJS库已加载');
                return Promise.resolve(window.go);
            }
            
            console.log('开始加载GoJS库');
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/gojs@2.3.3/release/go.js';
                script.async = true;
                script.onload = () => {
                    console.log('GoJS库加载成功');
                    resolve(window.go);
                };
                script.onerror = (err) => {
                    console.error('GoJS库加载失败', err);
                    this.$message.error('知识图谱库加载失败，请刷新页面重试');
                    reject(err);
                };
                document.head.appendChild(script);
            });
        },
        
        // 获取知识图谱数据
        async fetchKnowledgeForGraph(category) {
            this.graphLoading = true;
            console.log('获取知识图谱数据，分类:', category);

            // 使用固定的医保政策数据，无论传入什么category参数
            const policyData = {
                "key": "root",
                "title": "基本医疗保险一档参保人门诊医保待遇",
                "items": [
                    {
                        "key": "section1",
                        "title": "一、普通门诊统筹待遇",
                        "content": "参保人员在本市基本医疗保险定点医疗机构普通门诊发生的符合本市基本医疗保险药品目录、诊疗项目和医疗服务设施范围内的医疗费用，可使用个人账户支付，或由统筹基金按规定支付一定比例"
                    },
                    {
                        "key": "section2",
                        "title": "二、普通门诊统筹支付限额",
                        "content": "参保人员享受普通门诊统筹待遇的年度最高支付限额为3000元，纳入本市基本医疗保险年度最高支付限额管理"
                    },
                    {
                        "key": "section3",
                        "title": "三、门诊诊查费",
                        "content": "参保人员在本市基本医疗保险定点医疗机构门诊就医发生的挂号费、诊查费，可使用个人账户支付，不纳入普通门诊统筹支付范围"
                    },
                    {
                        "key": "section4",
                        "title": "四、门诊大型设备",
                        "content": "参保人员经门诊或住院医生开具检查单，在本市基本医疗保险定点医疗机构进行CT、核磁共振等大型设备检查的费用，符合规定的部分由统筹基金支付一定比例"
                    },
                    {
                        "key": "section5",
                        "title": "五、门诊特定病种待遇",
                        "content": "患有《本市基本医疗保险门诊特定病种病种分类及待遇标准》所列病种，经认定备案后，可按相应比例享受门诊特定病种医疗费用报销待遇"
                    }
                ]
            };
            
            console.log('使用固定的医保政策数据');
            
            // 直接使用硬编码的数据
            this.graphData = {
                category: policyData.title, // 使用医保政策标题作为分类名
                items: policyData.items.map(item => ({
                    kgid: item.key,
                    title: item.title,
                    content: item.content || "暂无内容描述"
                }))
            };
            
            console.log('准备好的图谱数据:', this.graphData);
            
            // 使用nextTick确保DOM已更新
            this.$nextTick(() => {
                // 给一个延迟确保对话框已完全渲染
                setTimeout(() => {
                    // 确保对话框仍然可见
                    if (this.graphDialogVisible) {
                        // 调用初始化方法，传入标题和准备好的数据项
                        console.log('执行initKnowledgeGraph，传入:', policyData.title, this.graphData.items);
                        this.initKnowledgeGraph(policyData.title, this.graphData.items);
                    }
                    this.graphLoading = false; // 加载完成
                }, 500); // 延迟500ms
            });
        },
        
        // 初始化知识图谱
        initKnowledgeGraph(category, knowledgeList) {
            // 引入GoJS库
            const go = window.go;
            if (!go) {
                console.error('GoJS库未加载，尝试重新加载');
                this.loadGoJSLibrary();
                this.$message.error('GoJS库未加载，请刷新页面重试');
                this.graphLoading = false;
                return;
            }
            
            console.log('准备初始化知识图谱', category, knowledgeList);
            
            // 确保DOM元素存在
            let graphElement = document.getElementById('knowledgeGraphViewer');
            
            // 如果通过ID找不到，尝试通过ref获取
            if (!graphElement && this.$refs.graphViewer) {
                graphElement = this.$refs.graphViewer;
                console.log('通过ref找到了知识图谱容器元素');
            }
            
            if (!graphElement) {
                console.error('找不到知识图谱容器元素');
                this.$message.error('知识图谱初始化失败，请关闭对话框重试');
                this.graphLoading = false;
                return;
            }
            
            // 检查容器元素尺寸
            console.log('图谱容器尺寸:', graphElement.offsetWidth, 'x', graphElement.offsetHeight);
            
            // 确保容器元素可见
            graphElement.style.display = 'block';
            graphElement.style.height = '600px';
            graphElement.style.width = '100%';
            graphElement.style.backgroundColor = '#FFFFFF';
            graphElement.style.border = '1px solid #e0e0e0';
            graphElement.style.borderRadius = '4px';
            
            try {
                const $ = go.GraphObject.make;
                
                // 清理旧图谱
                if (this.knowledgeGraph) {
                    console.log('清理旧图谱');
                    try {
                        this.knowledgeGraph.div = null;
                        this.knowledgeGraph = null;
                    } catch (e) {
                        console.error('清理知识图谱资源时出错:', e);
                    }
                }
                
                // 如果没有知识点，显示空状态
                if (!knowledgeList || !Array.isArray(knowledgeList) || knowledgeList.length === 0) {
                    console.log('无知识点数据，显示空状态');
                    // 创建一个简单的图表，显示空状态
                    const diagram = $(go.Diagram, graphElement, {
                        "undoManager.isEnabled": true,
                        initialContentAlignment: go.Spot.Center
                    });
                    
                    // 添加一个简单的节点显示无数据信息
                    diagram.add(
                        $(go.Node, "Auto",
                            $(go.Shape, "RoundedRectangle", { fill: "#f5f5f5", stroke: "#d9d9d9" }),
                            $(go.TextBlock, "该分类下暂无知识点", { margin: 20, font: "16px 'Microsoft YaHei'" })
                        )
                    );
                    
                    this.knowledgeGraph = diagram;
                    console.log('空状态图谱已创建');
                    this.graphLoading = false;
                    return;
                }
                
                // 准备图谱数据 - 使用医疗保险政策结构
                const graphData = {
                    key: "root",
                    title: category,
                    items: knowledgeList.map((item, index) => {
                        return {
                            key: item.key || `item-${index}`,
                            title: this.stripHtmlTags(item.title),
                            content: item.content
                        };
                    })
                };
                
                console.log('图谱数据已准备:', graphData);
                
                // 转换数据为图谱所需格式
                const nodeDataArray = this.convertGraphData(graphData);
                console.log('节点数据数组:', nodeDataArray);
                
                if (!nodeDataArray || nodeDataArray.length <= 1) {
                    console.error('节点数据为空或只有根节点');
                    this.$message.error('知识图谱数据为空');
                    this.graphLoading = false;
                    return;
                }
                
                // 创建图表 - 简化布局方式
                console.log('创建图谱...');
                const diagram = $(go.Diagram, graphElement, {
                    initialContentAlignment: go.Spot.Center,
                    layout: $(go.TreeLayout, { 
                        angle: 90, 
                        arrangement: go.TreeLayout.ArrangementVertical,
                        nodeSpacing: 30,
                        layerSpacing: 80
                    }),
                    "undoManager.isEnabled": true,
                    allowZoom: true,
                    allowPan: true,
                    "minScale": 0.25,
                    "maxScale": 2,
                    "animationManager.initialAnimationStyle": go.AnimationManager.None
                });
                
                // 引用Vue组件的this，以便在事件处理函数中使用
                const self = this;
                
                // 使用简单的节点模板
                diagram.nodeTemplate = $(go.Node, "Auto",
                    { 
                        selectionAdorned: true,
                        cursor: "pointer",
                        click: function(e, node) {
                            const data = node.data;
                            if (data.key !== "root") {
                                // 选中显示详细内容
                                self.selectedGraphNode = data;
                                console.log('选中节点:', data);
                            } else {
                                // 清除选中状态
                                self.selectedGraphNode = null;
                            }
                        }
                    },
                    new go.Binding("background", "isSelected", function(s) {
                        return s ? "#e3f2fd" : null;
                    }).ofObject(),
                    $(go.Shape, "RoundedRectangle", 
                        { 
                            name: "SHAPE",
                            fill: "white", 
                            stroke: "#1890ff",
                            strokeWidth: 1,
                            minSize: new go.Size(120, 30),
                            portId: ""
                        },
                        new go.Binding("fill", "key", function(k) {
                            return k === "root" ? "#e6f7ff" : "white";
                        }),
                        new go.Binding("stroke", "key", function(k) {
                            return k === "root" ? "#1890ff" : "#1890ff";
                        })
                    ),
                    $(go.TextBlock, 
                        { 
                            margin: 10,
                            font: "14px 'Microsoft YaHei'",
                            wrap: go.TextBlock.WrapFit,
                            textAlign: "center",
                            maxSize: new go.Size(150, NaN)
                        }, 
                        new go.Binding("text", "title"),
                        new go.Binding("font", "key", function(k) {
                            return k === "root" ? "bold 16px 'Microsoft YaHei'" : "14px 'Microsoft YaHei'";
                        })
                    )
                );
                
                // 定义连线模板 - 简化样式
                diagram.linkTemplate = $(go.Link,
                    { 
                        routing: go.Link.Normal, 
                        curve: go.Link.Bezier,
                        corner: 5,
                        selectable: false
                    },
                    $(go.Shape, { 
                        strokeWidth: 1.5, 
                        stroke: "#1890ff"
                    }),
                    $(go.Shape, { 
                        toArrow: "Standard", 
                        stroke: "#1890ff", 
                        fill: "#1890ff"
                    })
                );
                
                // 设置图谱模型
                diagram.model = new go.TreeModel(nodeDataArray);
                console.log('图谱模型已设置，节点数:', nodeDataArray.length);
                
                // 添加节点悬停工具提示
                var tooltiptemplate = $(go.Adornment, "Auto",
                    $(go.Shape, { fill: "#FFFFCC" }),
                    $(go.TextBlock, { margin: 4 },
                        new go.Binding("text", "", function(d) { 
                            return d.title; 
                        }))
                );
                
                diagram.nodeTemplate.toolTip = tooltiptemplate;
                
                // 保存引用以便后续使用
                this.knowledgeGraph = diagram;
                
                // 确保图谱可见
                this.graphLoading = false;
                
                // 布局图谱
                console.log('执行图谱布局');
                diagram.zoomToFit();
                diagram.centerRect(diagram.documentBounds);
                
                // 确保所有节点可见
                console.log('记录节点位置:');
                diagram.nodes.each(node => {
                    console.log(`节点 ${node.data.title} 位置: (${node.position.x}, ${node.position.y})`);
                });
                
                // 如果图谱不可见，尝试执行额外操作
                setTimeout(() => {
                    if (diagram && diagram.div) {
                        console.log('执行延迟布局');
                        diagram.layoutDiagram(true);
                        diagram.zoomToFit();
                    }
                }, 300);
            } catch (error) {
                console.error('初始化知识图谱时出错:', error);
                this.$message.error('知识图谱初始化失败: ' + error.message);
                this.graphLoading = false;
            }
        },
        
        // 转换图谱数据
        convertGraphData(data) {
            let result = [];
            
            // 添加根节点
            result.push({
                key: data.key || "root",
                title: data.title
            });
            
            // 添加子节点
            if (data.items) {
                for (let item of data.items) {
                    result.push({
                        key: item.key || item.kgid,
                        title: item.title,
                        parent: data.key || "root",
                        content: item.content
                    });
                }
            }
            
            return result;
        },
        
        // 刷新知识图谱
        refreshGraph() {
            if (this.currentNode && this.currentNode.type === 'category') {
                this.graphLoading = true; // 开始重新加载
                
                // 清理旧图谱
                if (this.knowledgeGraph) {
                    try {
                        this.knowledgeGraph.div = null;
                        this.knowledgeGraph = null;
                    } catch (e) {
                        console.error('清理知识图谱资源时出错:', e);
                    }
                }
                
                this.fetchKnowledgeForGraph(this.currentNode.name);
            }
        },
        
        // 全屏显示知识图谱
        fullscreenGraph() {
            const viewer = document.getElementById('knowledgeGraphViewer');
            if (viewer) {
                if (document.fullscreenElement) {
                    // 当前已是全屏，退出全屏
                    document.exitFullscreen();
                } else {
                    // 请求全屏
                    viewer.requestFullscreen().catch(err => {
                        this.$message.error(`全屏显示错误: ${err.message}`);
                    });
                }
            }
        },
        
        // 对话框打开处理
        handleDialogOpened() {
            console.log('对话框已完全打开');
            
            // 简单的固定数据结构 - 医保政策示例
            const policyData = {
                nodes: [
                    { key: "root", title: "基本医疗保险一档参保人门诊医保待遇" },
                    { key: "section1", parent: "root", title: "一、普通门诊统筹待遇", content: "参保人员在定点医疗机构普通门诊发生的医疗费用，可使用个人账户支付，或由统筹基金按规定支付一定比例" },
                    { key: "section2", parent: "root", title: "二、普通门诊统筹支付限额", content: "参保人员享受普通门诊统筹待遇的年度最高支付限额为3000元" },
                    { key: "section3", parent: "root", title: "三、门诊诊查费", content: "门诊就医发生的挂号费、诊查费，可使用个人账户支付，不纳入普通门诊统筹支付范围" },
                    { key: "section4", parent: "root", title: "四、门诊大型设备", content: "门诊进行CT、核磁共振等大型设备检查的费用，符合规定的部分由统筹基金支付一定比例" },
                    { key: "section5", parent: "root", title: "五、门诊特定病种待遇", content: "患有特定病种，经认定备案后，可按相应比例享受门诊特定病种医疗费用报销待遇" }
                ]
            };
            
            setTimeout(() => {
                // 获取容器元素
                const graphElement = document.getElementById('knowledgeGraphViewer');
                if (graphElement) {
                    console.log('知识图谱容器已找到，初始化图谱');
                    this.createSimpleGraph(graphElement, policyData);
                } else {
                    console.error('知识图谱容器未找到');
                    this.$message.error('无法初始化知识图谱');
                    this.graphLoading = false;
                }
            }, 300);
        },
        
        // 创建简单图谱
        createSimpleGraph(container, data) {
            if (!window.go) {
                console.error('GoJS库未加载');
                this.$message.error('图谱库未加载，请刷新页面');
                this.graphLoading = false;
                return;
            }
            
            // 确保容器有足够的大小
            container.style.height = '600px';
            container.style.width = '100%';
            container.style.backgroundColor = '#fff';
            
            try {
                // 清理旧图谱
                if (this.knowledgeGraph) {
                    this.knowledgeGraph.div = null;
                    this.knowledgeGraph = null;
                }
                
                const go = window.go;
                const $ = go.GraphObject.make;
                
                // 创建简单图谱
                const diagram = $(go.Diagram, container, {
                    initialContentAlignment: go.Spot.Center,
                    layout: $(go.TreeLayout, { 
                        angle: 90,  // 垂直布局
                        nodeSpacing: 20,
                        layerSpacing: 60
                    }),
                    "undoManager.isEnabled": true,
                    "toolManager.mouseWheelBehavior": go.ToolManager.WheelZoom
                });
                
                const self = this;
                
                // 启用基本交互功能
                diagram.toolManager.mouseWheelBehavior = go.ToolManager.WheelZoom;
                diagram.allowPan = true;
                diagram.allowZoom = true;
                
                // 简单节点模板
                diagram.nodeTemplate = $(go.Node, "Auto", 
                    {
                        cursor: "pointer",
                        click: function(e, node) {
                            const data = node.data;
                            if (data.key !== "root") {
                                // 显示详情
                                self.selectedGraphNode = {
                                    title: data.title,
                                    content: data.content || "暂无详细内容"
                                };
                            } else {
                                self.selectedGraphNode = null;
                            }
                        }
                    },
                    $(go.Shape, "RoundedRectangle", 
                        { 
                            fill: "white", 
                            stroke: "#1890ff", 
                            strokeWidth: 1.5 
                        },
                        new go.Binding("fill", "key", function(k) {
                            return k === "root" ? "#e6f7ff" : "white";
                        })
                    ),
                    $(go.TextBlock, 
                        { 
                            margin: 10, 
                            wrap: go.TextBlock.WrapFit,
                            textAlign: "center",
                            width: 140,
                            font: "14px 'Microsoft YaHei'"
                        }, 
                        new go.Binding("text", "title"),
                        new go.Binding("font", "key", function(k) {
                            return k === "root" ? "bold 15px 'Microsoft YaHei'" : "14px 'Microsoft YaHei'";
                        })
                    )
                );
                
                // 简单连线模板
                diagram.linkTemplate = $(go.Link,
                    { routing: go.Link.Orthogonal, corner: 5 },
                    $(go.Shape, { strokeWidth: 1.5, stroke: "#1890ff" }),
                    $(go.Shape, { toArrow: "Standard", fill: "#1890ff", stroke: "#1890ff" })
                );
                
                // 设置数据
                diagram.model = new go.TreeModel(data.nodes);
                
                // 保存引用
                this.knowledgeGraph = diagram;
                
                // 缩放以适应所有内容
                diagram.zoomToFit();
                
                // 加载完成
                this.graphLoading = false;
                
            } catch (error) {
                console.error('创建图谱出错:', error);
                this.$message.error('创建图谱失败: ' + error.message);
                this.graphLoading = false;
            }
        },
        
        // 对话框关闭处理
        handleGraphDialogClose() {
            this.graphDialogVisible = false;
            this.selectedGraphNode = null;
            this.graphLoading = false;
            // 清理图谱资源
            if (this.knowledgeGraph) {
                try {
                    console.log('清理图谱资源');
                    this.knowledgeGraph.div = null;
                    this.knowledgeGraph = null;
                } catch (e) {
                    console.error('清理知识图谱资源时出错:', e);
                }
            }
            return true; // 允许关闭对话框
        },
        
        // 测试方法 - 直接打开对话框
        showGraphButton() {
            alert('测试按钮被点击');
            console.log('测试按钮被点击，设置graphDialogVisible=true');
            this.graphDialogVisible = true;
            console.log('对话框显示状态:', this.graphDialogVisible);
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

.knowledge-graph-container {
    padding: 20px;
}

.graph-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.graph-tools {
    display: flex;
    gap: 10px;
}

.graph-loading {
    text-align: center;
    padding: 60px 0;
    color: #909399;
}

.graph-loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10;
}

.graph-loading-content {
    text-align: center;
    color: #909399;
}

.graph-loading-content i {
    font-size: 32px;
    margin-bottom: 15px;
}

.graph-empty {
    text-align: center;
    padding: 60px 0;
    color: #909399;
}

.graph-empty i {
    font-size: 48px;
    margin-bottom: 20px;
}

.graph-empty p {
    margin: 20px 0;
    font-size: 14px;
}

.detail-card {
    margin-top: 20px;
}

.detail-header {
    font-weight: bold;
    font-size: 16px;
}

.detail-content {
    white-space: pre-line;
    line-height: 1.6;
    padding: 0 20px;
    font-size: 14px;
    color: #606266;
}

/* 新增样式 - 图谱容器 */
.graph-viewer-container {
    width: 100%;
    height: 600px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    background-color: #fff;
    margin: 15px 0;
    position: relative;
}

/* 确保知识图谱容器区域有正确的位置设置 */
.knowledge-graph-container {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 700px;
    padding: 20px;
}
</style> 