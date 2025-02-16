StackLocker是基于StackEdit开发的私有笔记本软件，通过在Cloudflare上部署而保护你的数据。

# 发何发布

1. 进入```editor```目录，运行```npm run build```。
2. 进入```server```目录，运行```npm run deploy```。

## 发布说明

发布前请配置好```wrangler.toml```文件，文件位于```server/wrangler.toml```。

配置模板：
```toml
name = "<name>"
pages_build_output_dir="./dist"
compatibility_flags = [ "nodejs_compat" ]
compatibility_date = "2024-09-23"

[[kv_namespaces]]
binding = "<name>"
id = "<id>"

[vars]
JWT_SECRET='<生成登录token的密钥>'
```

> 更多配置，请参考```cloudflare```官方说明。

# 注意

```editor```的node必须是```11.15.0```的版本，此处建议使用使用```volta```进行版本管理。

```server```的node版本为```20.11.0```。
