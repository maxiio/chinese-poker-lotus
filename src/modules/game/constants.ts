/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-23 18:18:56
 * @version 1.0.0
 * @desc consts.ts
 */


export const MODULE_GAME = 0x0002

// 客户端请求
export const CMD_GAME_LIST        = 0x00020001
// 客户端请求; 服务端大厅广播, 房间广播
export const CMD_GAME_JOIN        = 0x00020002
// 客户端请求; 服务端大厅广播, 房间广播
export const CMD_GAME_READY       = 0x00020003
// 客户端请求; 服务端大厅广播, 房间广播
export const CMD_GAME_UNREADY     = 0x00020004
// 服务端请求
export const CMD_GAME_START       = 0x00020005
// 服务端大厅广播, 房间广播
export const CMD_GAME_DEAL        = 0x00020006
// 客户端请求; 服务端广播
export const CMD_GAME_FIGHT       = 0x00020007
// 客户端请求; 服务端广播
export const CMD_GAME_PLAY        = 0x00020008
// 服务端广播
export const CMD_GAME_OVER        = 0x00020009
// 客户端请求; 服务端广播; 服务端定时踢人广播; 服务端超时踢人广播; 服务端大厅广播
export const CMD_GAME_LEAVE       = 0x0002000A
// 客户端请求; 服务端广播
export const CMD_GAME_ADD         = 0x0002000B
// 用户请求进入大厅
export const CMD_GAME_SIGN_IN     = 0x0002000C
// 用户请求离开大厅
export const CMD_GAME_SIGN_OUT    = 0x0002000D
// 游戏状态更新时大厅内广播
export const CMD_GAME_LOBBY_FLUSH = 0x0002000E
