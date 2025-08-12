# 订阅转换器 (Subscribe Convert)

一个简单、高效的前端工具，用于将常见的代理订阅链接（VLESS, VMess, Trojan, Shadowsocks）转换为 Mihomo (Clash.Meta) 内核兼容的 JSON 配置格式。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fjoewongex%2Fsubscribe-convert)

## ✨ 功能特性

- **多协议支持**: 支持 `vless://`, `vmess://`, `trojan://`, 和 `ss://` 链接。
- **批量处理**: 一次性粘贴和转换多个链接。
- **即时转换**: 所有转换都在浏览器端完成，无需后端服务器，保证隐私和速度。
- **一键复制**: 轻松复制格式化后的 JSON 输出。
- **响应式设计**: 在桌面和移动设备上均有良好体验。
- **一键部署**: 使用 Vercel 轻松部署您自己的版本。

## 📸 截图

*<-- 这里可以将来访的截图链接放在这里 -->*

## 🚀 使用方法

1.  访问部署后的网站。
2.  将您的节点链接（每行一个）粘贴到左侧的输入框中。
3.  点击“转换”按钮。
4.  转换后的 JSON 配置将显示在右侧的输出框中。
5.  点击“复制”按钮，将配置粘贴到您的 Clash.Meta 客户端中。

## 🛠️ 本地开发

如果您希望在本地运行或修改本项目，请按照以下步骤操作：

1.  **克隆仓库**
    ```bash
    git clone https://github.com/joewongex/subscribe-convert.git
    cd subscribe_covert
    ```

2.  **安装依赖**
    ```bash
    npm install
    ```

3.  **启动开发服务器**
    ```bash
    npm run dev
    ```
    项目将在 `http://localhost:5173` (或另一个可用端口) 上运行。

## 📝 许可证

本项目采用 [MIT License](LICENSE) 开源。
