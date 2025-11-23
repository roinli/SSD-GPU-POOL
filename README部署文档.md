# 慧通岛-前端

**慧通岛开源人工智能平台**（简称：**慧通岛**），包括海量数据处理、交互式模型构建（包含Notebook和模型可视化）、AI模型高效训练。多维度产品形态满足从开发者到大型企业的不同需求，将提升人工智能技术的研发效率、扩大算法模型的应用范围，进一步构建人工智能生态“朋友圈”。

## 特性
* 一站式开发
* 集成先进算法
* 灵活易用
* 性能优越

## 预览
![概览](/public/dubhe_dashboard.png "概览")

## 源码部署

### 1. 下载源码

``` bash
git clone https://github.com/roinli/SSD-GPU-POOL.git

# 进入根目录
cd dubhe-web

```
### 2. 配置

根据需要修改如下配置文件
```
.env.mock
.env.development
.env.test
.env.production
```

### 3. 构建
- node版本建议14.21.3 
``` bash
# 安装项目依赖
npm install

# 构建生产环境
npm run build:prod
```

### 4. 部署

- 构建完成后会在根目录生成 dist 文件夹，并将该文件夹上传至服务器；
- 在服务器 nginx.conf 文件中添加如下配置；

``` nginx
server {
    listen       80;        # 端口
    server_name  localhost; # 域名/外网IP

    location / {
        root   /home/wwwroot/dubhe-web/dist; # dist 文件夹根目录
        index  index.html;
        try_files $uri $uri/ /index.html;
    }
}

```

- 保存 `nginx.conf` 并重启 Nginx 使之生效。


## 本地开发

``` bash
# 下载源码
git clone https://github.com/roinli/SSD-GPU-POOL.git

# 进入项目根目录
cd dubhe-web

# 安装依赖
npm install

# 启动服务 localhost:8013
npm run dev
```

## 接口 Mock

当前项目自动集成了接口 mock 服务，用户可以通过 `npm run mock` 启动数据 mock 服务。

- 普通接口：在 `mock` 目录下创建根据请求 url 创建对应文件，比如请求路径是`api/data/datasets`，在就直接创建 `mock/api/data/datasets.js` 文件，并导出 mock 文件
- RESTful 风格接口：在 `mock/mock-map` 文件下创建对应的文件 map, key 为符合[path-to-regexp](https://github.com/pillarjs/path-to-regexp) 风格的路径，value 为对应的实际 mock 文件地址

如果用户未创建 mock 文件，请求会转发到 `development` 环境指定的 api 地址。

## 项目结构

```
├── public          公共静态文件 
├── src             源码目录 
│   ├── api         接口 
│   ├── assets      静态资源 
│   ├── assets      静态资源 
│   ├── boot        全局加载 
│   ├── components  公共组件 
│   ├── config      全局配置 
│   ├── directives  全局指令 
│   ├── hooks       全局Hook 
│   ├── layout      页面布局 
│   ├── mixins      混入 
│   ├── router      路由 
│   ├── store       存储 
│   ├── utils       工具函数 
│   ├── views       页面 
│   ├── App.vue     根组件 
│   ├── main.js     项目入口 
│   └── settings.js 项目设置 
```

## production配置示例

```angular2html
ENV = 'production'

# 默认BASE URL
VUE_APP_BASE_API = '/'

# TODO: 目前后端连接位于 30960端口 k8s 服务，需要后端调整后再同步调整
# WebSocket 连接地址
VUE_APP_WS_API = 'ws://182.40.194.71:30960/ws'

# 数据管理
VUE_APP_DATA_API = '/'

# 训练可视化
VUE_APP_VISUAL_API = '/'

# minio
VUE_APP_MINIO_API = 'http://182.40.194.71:30900/minio'

# atlas
VUE_APP_ATLAS_HOST = 'http://182.40.194.71'

# DCM4CHEE
VUE_APP_DCM_API = 'http://182.40.194.71:30800/dcm4chee/dcm4chee-arc/aets/DCM4CHEE_ADMIN'

# minIO 服务 IP
VUE_APP_MINIO_ENDPOINT = '182.40.194.71'
# minIO 服务 端口
VUE_APP_MINIO_PORT = '30900'
# 是  开启 SSL
VUE_APP_MINIO_USESSL = 'false'
# bucketName
VUE_APP_MINIO_BUCKETNAME = 'dubhe-prod'

# 文档链接
VUE_APP_DOCS_URL = http://huitongdao.doc.huizhidata.com/docs/
```
