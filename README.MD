StackLocker是基于StackEdit开发的私有笔记本软件，通过在Cloudflare上部署而保护你的数据。

# 发何发布

1. 进入```editor```目录，运行```npm run build```。
2. 进入```server```目录，运行```npm run deploy```。

> 注意：先编译```editor```，然后再执行发布操作。

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
RE_INIT='yes'
```

**若```RE_INIT```设置为```yes```，则可以重新初始化账号，在忘记密码和二步认证密钥的时候使用。**

> 更多配置，请参考```cloudflare```官方说明。

# 注意

```editor```的node必须是```11.15.0```的版本，此处建议使用使用```volta```进行版本管理。

```server```的node版本为```20.11.0```。

# 开发说明

1. 进入```editor```，运行```npm start```启动前端项目。
2. 进入```server```，运行```npm run dev```启动后端项目。

# 更新日志
