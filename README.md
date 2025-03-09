# 重构并且恢复基本功能

## 新增需求

- **消息渲染**  
  - 对于历史会话中 think 标签内部进行渲染 P0  ---- 已完成

- **消息管理**
  - 消息重试

- **其他**
  - 增加播放 AI 消息。

- **设计右侧扩展框**  
  设计右侧扩展框（用于工作流展示）。 P3

### 接口设计
> 1. 批量导出接口未完成
> 2. 知识标注提交后，再次点开还是初始化状态，而不是已提交的状态
> 3. 根据已选择的知识点重新生成ai回答
> 4. 如果处理意见我不选择，然后就直接知识标注进行提交了，就会导致处理意见不能更新

## BUG

- **conversation会话管理**
  切换会话之后再次发送消息没有把之前的消息进行获取并送到后端。  
  --- 出现原因是因为每次发送消息才把会话历史送到后端，但是发送完消息后如果不再发送那么就会导致AI回复的最新消息没有能送到后端
  --- 我发现当前的会话刷新页面会丢失之前的历史记录

### 会话bug
 - ---有时候点踩会没有带上kg_refrence知识点这个参数     ---  获取的知识点会被截断
   ---- 保存的历史记录里面没有存储会话历史的知识点会导致历史消息点踩无效，  --- 需要送给后端的时候也需要存储知识点，后端需要增加知识点字段
   --- 点踩时有时候会获取到不上这个消息的知识点  --- 这个bug是由于知识点截断所产生的

## 优化

- **欢迎词渲染逻辑**  
  欢迎词渲染逻辑不该侵入消息列表。 P3

- **项目结构**  
  完成上述任务后，继续重构项目结构。
