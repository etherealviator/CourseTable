# 📅 CourseTable v2

极简课程表 Android 应用。无广告 · 秒开 · 专注课表本身。

## ✨ 功能

- 📋 **周视图课程表** — 7天×12节网格，当前周高亮，非本周淡化
- ➕ **手动添加课程** — 课程名、教师、地点、周次、节次、自定义颜色
- 🔄 **教务系统导入** — 登录正方/青果/URP 等教务系统自动抓取，支持粘贴 HTML 解析
- 🏫 **130+ 学校内置** — 覆盖全国高校教务系统地址，远程更新
- 🌗 **深色模式** — 一键切换
- 🧩 **模块化架构** — Zustand 状态管理，features/shared 分离，parser 四策略可扩展

## 🛠 技术栈

| 层 | 选型 |
|---|------|
| 框架 | React Native + Expo SDK 56 |
| 状态管理 | Zustand |
| UI | React Native Paper |
| 路由 | Expo Router v4 |
| 存储 | AsyncStorage |
| 解析 | 自研四策略 HTML Parser（Table/Div/JSON/Grid） |

## 🏗 构建 APK（本地，3 分钟）

```bash
git clone https://github.com/etherealviator/CourseTable -b v2
cd CourseTable
npm install --legacy-peer-deps
npx expo run:android --variant release
# APK 在 android/app/build/outputs/apk/release/
```

或开发调试：
```bash
npx expo start        # 扫码在手机上实时预览
```

> GitHub Actions CI 因 Expo SDK 56 与最新 Ubuntu 镜像不兼容暂时无法构建，本地构建不受影响。

## 📱 下载

👉 [v1.1.0 APK](https://github.com/etherealviator/CourseTable/releases/tag/v1.1.0) | v2 APK 待本地构建后上传

## 📂 目录结构

```
src/
├── features/
│   ├── timetable/     # 课表核心 (store + 组件)
│   ├── import/        # 教务导入 (parser 四策略 + 学校库)
│   └── settings/      # 设置
├── shared/            # 跨模块共享
│   ├── types/         # 类型定义
│   ├── storage/       # 持久化
│   ├── utils/         # 时间/工具
│   └── constants/     # 主题/常量
└── app/               # Expo Router 页面
```

## License

MIT
