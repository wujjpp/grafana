# Grafana开发说明

![Grafana](docs/logo-horizontal.png)

## 环境安装

1. 安装nodejs
2. [安装go](https://go.dev/doc/install)， 建议下载zip包安装
   设置环境变量`GOROOT`和`GOPATH`路径，例如：  
   GOPATH=d:\go  
   GOROOT=d:\devtools\go  
   备注： `GOROOT`指GO安装目录，`GOPATH`指GO模块下载保存路径  
   将`%GOPATH%\bin`和`%GOROOT%\bin` 添加到环境变量`PATH`中  
3. [安装mage](https://github.com/magefile/mage)
  
## 获取代码

目录结构，请按照目录存放源码

```shell
  .
  ├── /grafana/                                    # 存放Grafana源代码
  └── /plugins/                                    # 存放自定义Grafana插件
      ├── /graph-panel/                            # 支持 Grafana 7.x 和 aliyun sls 的图插件
      ├── /log-backend-datasource/                 # 支持 Grafana 7.x 和 aliyun sls 的日志查看插件
      ├── /logs-panel/                             # 支持 Grafana 7.x 和 aliyun sls 的日志查看插件
      ├── /piechart-panel/                         # 支持 Grafana 7.x 和 aliyun sls 的饼图插件
      └── /worldmap-panel.js                       # 支持 Grafana 7.x 和 aliyun sls 的百度地图插件

```

### 1. 准备一个目录，存放Grafana以及插件目录

```shell
# 创建grafana-extension目录
mkdir grafana-extensions
cd grafana-extensions
# 创建plugins目录
mkdir plugins
```

### 2. 准备grafana代码

```shell
# 进入grafana-extensions目录
cd grafana-extensions
# 获取grafana代码
git clone http://gitlab.greatld.com:18888/grafana-extensions/grafana.git
# 进入grafana目录，安装node包依赖，注意：只能使用yarn安装
cd grafana
yarn install
```

### 3. 准备自定义插件代码

```shell
# 进入plugins目录
cd grafana-extensions
cd plugins

# 获取log-backend-datasource源码
git clone http://gitlab.greatld.com:18888/grafana-extensions/log-backend-datasource.git
# 获取graph-panel源码
git clone http://gitlab.greatld.com:18888/grafana-extensions/graph-panel.git
# 获取logs-panel源码
git clone http://gitlab.greatld.com:18888/grafana-extensions/logs-panel.git
# 获取piechart-panel源码
git clone http://gitlab.greatld.com:18888/grafana-extensions/piechart-panel.git
# 获取worldmap-panel源码
git clone http://gitlab.greatld.com:18888/grafana-extensions/worldmap-panel.git
```

### 4. 修改Grafana配置文件

打开`grafana-extensions/grafana/conf/defaults.ini`文件，修改插件路径目录，位于文件25行，修改成`实际路径`，其它不要动

```ini
plugins = D:/workspaces/grafana-extensions/plugins
```

### 5. 编译log-backend-datasource

```shell
cd log-backend-datasource
yarn install
# GO语言部分 
# 由于windows下无法编译出linux以及mac的可执行程序，因此需要使用windows参数，linux获取mac下可以直接执行mage -v
mage build:windows
# 前端，注意：由于v7.5.4的@grafana/toolkit的bug, 这边只能使用dev
npm run dev
```

### 6. 逐个编译其他插件

进入各个插件的目录, 如`worldmap-panel`

```shell
cd worldmap-panel
npm install
npm run dev
```

### 7. 编译&调试Grafana前端

从`一个终端`打开Grafana目录

```shell
npm run watch
```

当编译完成后，

打开`另外一个终端`，进入`grafana/bin`目录，执行`grafana-server.exe`

```shell
cd bin
grafana-server.exe
```

### 8. 其他

log-backend-datasource配置关于SLS的配置，内部沟通

Made with ♥ by Wu Jian Ping
