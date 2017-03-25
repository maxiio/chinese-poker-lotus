# 斗地主

一个斗地主游戏服务器及客户端的简单实现

## 安装

```bash
# yarn
yarn global add chinese-poker-lotus

# 或者 npm
npm install --global chinese-poker-lotus
```

## 启动

```bash
# 启动游戏服务器
poker start server

# 后台启动
nohup poker start server >server.log 2>&1 &

# Web客户端
poker start web

# 后台启动
nohup poker start web >web.log 2>&1 &

# 也可以用nginx取代内置的node web服务器
# 只需要配置一个nginx server, root指向
# {安装文件夹}/lib/public即可
```

## Task List

优先级(处理顺序)由高到低

- [x] 斗地主核心逻辑
- [x] Socket消息协议
- [x] 服务器模块化框架
- [x] 简单用户和数值系统
- [ ] 游戏服务
- [ ] 客户端
- [ ] 发布到NPM
- [ ] 完善文档
- [ ] 发牌强度控制
- [ ] 强化机器人(AI?)
- [ ] 完善用户和数值系统
- [ ] 数据持久化
- [ ] 分离Socket服务器和游戏服务器, 集群支持
- [ ] 分离UI和Service层, 服务调用RPC化

## License

MIT

    The MIT License (MIT)
    
    Copyright (c) 2017 acrazing
    
    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:
    
    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.
    
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.