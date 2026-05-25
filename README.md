# 📅 课程表 (CourseTable)

一个极简、纯净的课程表 Android 应用。**无广告 · 极速启动 · 一目了然**。

> 灵感来自 WakeUp 课程表，只保留核心课程表功能，去除了广告和繁杂功能。

## ✨ 功能

- 📋 **周视图课程表** — 7天 × 12节 清晰网格布局，当前周高亮
- 🎨 **非本周淡化** — 非本周课程自动淡色显示 + "非本周"标记
- 📌 **顶部状态栏** — 实时显示第几周、星期几、月份日期
- 🔄 **教务系统导入** — 登录教务系统自动抓取课程表
  - 支持正方、青果、URP 等主流教务系统
  - 智能解析 HTML 表格
  - 自动裁剪只保留：课程名 + 教师 + 地点
  - 自动校正时间对应节次
- 🌗 **深色模式** — 自动跟随系统或手动切换
- 🎯 **极简设计** — 无冗余功能，专注课程表本身
- 🚀 **极速启动** — Expo 优化，秒开

## 📱 下载

👉 **[下载 APK (v1.0.0)](https://github.com/etherealviator/CourseTable/releases/download/v1.0.0/app-release.apk)**

## 🛠 技术栈

- React Native + Expo SDK 56
- Expo Router (文件路由)
- React Native Paper (UI)
- AsyncStorage (本地存储)
- WebView (教务系统抓取)

## 🏗 本地构建

```bash
# 安装依赖
npm install

# 启动开发
npm start

# 构建 APK (需要 Expo 账号)
npm install -g eas-cli
eas build --platform android --profile production
```

## 📖 使用说明

1. **添加课程** — 点击右下角 + 手动添加课程
2. **导入课表** — 设置 → 从教务系统导入 → 登录教务系统 → 抓取课表
3. **切换周次** — 课程表顶部左右箭头切换周次
4. **编辑课程** — 点击课程卡片查看/编辑详情

## 📄 License

MIT
