# Chinese Poker Lotus

斗地主发牌机

*还在设计中, 请稍候*

## 主要包含两个模块

- 发牌控制模块: 控制发出的牌的整体及每个玩家的强度
- 简单的玩家控制模块: 根据玩家收益控制函数及玩家历史数据估计下一局玩家应得的牌的强度

## 如何使用

- 安装

```bash
# npm
npm install chinese-poker-lotus -S

# yarn
yarn add chinese-poker-lotus
```

- 使用

```typescript
import * as lotus from 'chinese-poker-lotus'

lotus.deal({ level: 0 })
```

## API 设计

```typescript
import { DealOptions, DealResult } from './src'
// 发牌接口
export declare function deal(options: DealOptions): DealResult;
// 预测下一局玩家应该获得的强度接口
export declare function guess(history: number[], controller: (x: number) => number): number;
```

## License

MIT

