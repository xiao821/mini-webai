src/
|-- assets/                 // 静态资源
|   |-- images/             // 图片资源
|   |-- styles/             // 样式文件
|       |-- tailwind.css    // Tailwind CSS
|       |-- main.css        // 全局样式
|
|-- components/             // 通用组件
|   |-- common/             // 公共UI组件
|   |   |-- MessageBubble.vue       // 消息气泡
|   |   |-- LoadingIndicator.vue    // 加载指示器
|   |   |-- Feedback.vue            // 反馈组件
|   |   |-- MarkdownRenderer.vue    // Markdown渲染器
|   |
|   |-- chat/               // 聊天相关组件
|   |   |-- ChatContainer.vue       // 聊天容器
|   |   |-- ChatInput.vue           // 输入框组件
|   |   |-- MessageList.vue         // 消息列表
|   |
|   |-- sidebar/            // 侧边栏组件
|       |-- ConversationList.vue    // 会话列表
|       |-- ModeSelector.vue        // 模式选择器
|       |-- KnowledgeTree.vue       // 知识分类树
|
|-- views/                  // 页面视图
|   |-- ChatView.vue        // 主聊天页面
|   |-- LoginView.vue       // 登录页面
|
|-- store/                  // Vuex状态管理
|   |-- index.js            // Store入口
|   |-- modules/            // 模块化状态
|       |-- chat.js         // 聊天状态
|       |-- conversations.js// 会话管理状态
|       |-- knowledge.js    // 知识分类状态
|       |-- modes.js        // 模式管理状态
|       |-- user.js         // 用户状态
|
|-- api/                    // API接口封装
|   |-- index.js            // API入口
|   |-- chat.js             // 聊天相关API
|   |-- knowledge.js        // 知识库相关API
|   |-- feedback.js         // 反馈相关API
|
|-- utils/                  // 工具函数
|   |-- markdown.js         // Markdown处理
|   |-- storage.js          // 存储工具
|   |-- id-generator.js     // ID生成工具
|
|-- config/                 // 配置文件
|   |-- index.js            // 主配置
|   |-- mode-config.js      // 模式配置
|   |-- api-config.js       // API配置
|
|-- router/                 // 路由管理
|   |-- index.js            // 路由定义
|
|-- plugins/                // 插件配置
|   |-- axios.js            // Axios配置
|
|-- App.vue                 // 根组件
|-- main.js                 // 应用入口