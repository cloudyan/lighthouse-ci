# lighthouse-ci

基于 [Lighthouse](https://github.com/GoogleChrome/lighthouse) 实现巡检系统

特征

- 在每个 PR 旁边获取一份 Lighthouse 报告。
- 防止可访问性、SEO、离线支持和性能最佳实践的回归。
- 随着时间的推移跟踪性能指标和 Lighthouse 分数。
- 设置并保留脚本和图像的性能预算。
- 多次运行 Lighthouse 以减少差异。
- 比较您网站的两个版本，以发现个别资源的改进和退化。

参考资料

- https://github.com/GoogleChrome/lighthouse
  - https://github.com/GoogleChrome/lighthouse#using-the-node-cli
- https://github.com/GoogleChrome/lighthouse-ci
  - `npm i -g @lhci/cli` -> `lhci autorun`
  - https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md#commands
- https://github.com/marketplace/actions/lighthouse-ci-action
  - https://github.com/treosh/lighthouse-ci-action
  - https://github.com/hchiam/learning-lighthouse-ci
- https://github.com/GoogleChromeLabs/lighthousebot
- https://github.com/andreasonny83/lighthouse-ci
- https://github.com/codechecks
  - https://github.com/codechecks/lighthouse-keeper
  - https://github.com/codechecks/awesome-codechecks
- https://github.com/marketplace/actions/lighthouse-check
  - https://github.com/foo-software/lighthouse-check
  - 产品化 https://www.foo.software/
- https://juejin.cn/post/6873912165632966669
