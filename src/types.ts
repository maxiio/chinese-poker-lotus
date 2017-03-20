/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-11 23:55:04
 * @version 1.0.0
 * @desc types.ts
 *
 * TCP是可靠的, write没有error则认为消息到达, 所以Request/Response只需要保存
 * 失败和成功的状态, 失败的才重试, 需要保证消息有序性.
 */


export enum ChatRoomKinds {
  Private   = 1,
  Group     = 2,
  Room      = 3,
  Broadcast = 4,
}


export enum Commands {
  CSysReady       = 100001, // Socket就绪, 初始化ID
  CSysSync        = 100002, // 同步丢失的消息
  CSysSyncOffline = 100003, // 同步离线消息

  CUserInfo       = 100101, // 获取用户信息
  CUserUpdate     = 100102, // 更新用户信息

  CChatCreate     = 100201, // 创建聊天
  CChatSend       = 100202, // 发送聊天消息
  SChatPush       = 100203, // 推送聊天消息
  CChatSync       = 100204, // 获取历史聊天消息
  CChatList       = 100205, // 获取聊天列表

  CGameList       = 100301, // 获取房间列表
  SGameFlush      = 100302, // 更新房间列表
  CGameJoin       = 100303, // 进入游戏
  CGameReady      = 100304, // 准备
  CGamePlay       = 100305, // 出牌
  CGameLeave      = 100306, // 离开
  SGameJoin       = 100307, // 用户进入
  SGameReady      = 100308, // 用户准备
  SGamePlay       = 100309, // 用户出牌
  SGameLeave      = 100310, // 用户离开
  SGameKickOut    = 100311, // 用户被踢出
  CGameKickOut    = 100312, // 踢出用户
}


export enum MessageKinds {
  ClientRequest  = 1,
  ClientResponse = 2,
  ServerRequest  = 3,
  ServerResponse = 4,
}


export interface SocketMessage<T> {
  id: number; // 临时的连续消息ID, Socket连接时重置
  kind: MessageKinds; // 消息类型, 请求或回复
  cmd: Commands; // 命令号
  time: number; // 创建时间, 用来排序离线消息, 离线消息id无效
  data: T; // 消息体
}

export interface MessagePair<Q, S> {
  id: number;
  request: SocketMessage<Q>;
  response: SocketMessage<S>;
}

export interface CSysReadyCQ {
  nonce: number;
}

export interface CSysReadySS {
  serverStartMid: number;
  clientStartMid: number;
  maxMid: number;
}
