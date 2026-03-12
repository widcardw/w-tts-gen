# 编码规范与约束

## 🚫 禁止修改的自动生成文件
以下目录/文件是自动生成的，**绝对不要直接修改**：
- `frontend/wailsjs/` - Wails 自动生成的服务绑定和类型定义
- `frontend/dist/` - 前端构建产物
- `frontend/node_modules/` - 前端依赖包
- `build/` - 项目构建产物
- `bin/` - 可执行文件输出目录

## TypeScript 编码规范
1. **不使用分号**（semi: false
2. **使用单引号**（singleQuote: true）
3. 函数名使用 camelCase 命名风格
4. 组件名使用 PascalCase 命名风格
5. 常量使用 UPPER_SNAKE_CASE 命名风格
6. 导入路径使用相对路径或别名 `#/` 指向 `frontend/bindings/`, `~/` 指向 `frontend/src/`
7. 所有异步操作必须处理异常

## Go 编码规范
1. 遵循标准 Go 编码规范（gofmt）
2. 服务方法必须返回适当的错误信息
3. 日志使用 app.Logger 而非 fmt.Print
4. 敏感信息禁止硬编码，使用配置服务管理

## AI 助手使用说明
1. 开发前请先阅读 `.ai-docs/` 目录下的所有文档
2. 优先参考 `PROJECT_GUIDE.md` 了解项目整体架构
3. 快速查询开发模式参考 `QUICK_START.md`
4. 严格遵守本文件的编码规范和约束
5. 如果涉及到Wails框架相关的开发，参考官方文档：https://v3alpha.wails.io/
