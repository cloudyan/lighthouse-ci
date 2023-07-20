# lighthouse-ci

基于 [Lighthouse](https://github.com/GoogleChrome/lighthouse) 实现巡检系统

特征

- 在每个 PR 旁边获取一份 Lighthouse 报告。
- 防止可访问性、SEO、离线支持和性能最佳实践的回归。
- 随着时间的推移跟踪性能指标和 Lighthouse 分数。
- 设置并保留脚本和图像的性能预算。
- 多次运行 Lighthouse 以减少差异。
- 比较您网站的两个版本，以发现个别资源的改进和退化。

### 核心指标

- FP
- LCP

1. 可以在 `CI/CD` 流程，构建完成自动检查性能，做性能守卫
2. 也可以对线上服务，定期检查性能，做性能巡检
3. 还可以扩展设计为视觉走查提效方案

具体实现，可以使用 `lighthouse` 也可以使用 `lighthouse-ci`。

### 性能守卫

> 性能守卫是一种系统或工具，用于监控和管理应用程序或系统的性能。它旨在确保应用程序在各种负载和使用情况下能够提供稳定和良好的性能。

Lighthouse 是一个开源的自动化工具，提供了四种使用方式：

- Chrome DevTools
- Chrome插件
- Node CLI
- Node模块

架构如下

图

我们可借助 `Lighthouse Node` 模块继承到 `CI/CD` 流程中，这样我们就能在构建阶段知道我们的页面具体性能，如果指标不合格，那么就不给合并 `MR`

### 剖析 lighthouse-ci 实现

lighthouse-ci 实现机制很简单，核心实现步骤如上图，差异就是lighthouse-ci 实现了自己的server端，保持导出的性能指标数据，由于公司一般对这类数据敏感，所以我们一般只需要导出对应的数据指标JSON，上传到我们自己的平台就行了。

实现步骤

1. **启动浏览器实例**：CLI通过Puppeteer启动一个Chrome实例。
2. **创建新的浏览器标签页**：接着，CLI创建一个新的标签页（或称为"页面"）。
3. **导航到目标URL**：CLI命令浏览器加载指定的URL。
4. **收集数据**：在加载页面的同时，CLI使用各种Chrome提供的API收集数据，包括网络请求数据、JavaScript执行时间、页面渲染时间等。
5. **运行审计**：数据收集完成后，CLI将这些数据传递给Lighthouse核心，该核心运行一系列预定义的审计。
6. **生成和返回报告**：最后，审计结果被用来生成一个JSON或HTML格式的报告。
7. **关闭浏览器实例**：报告生成后，CLI关闭Chrome实例。

```js
const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const {URL} = require('url');

async function run() {
  // 使用 puppeteer 连接到 Chrome 浏览器
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  // 新建一个页面
  const page = await browser.newPage();

  // 在这里，你可以执行任何Puppeteer代码，例如:
  // await page.goto('https://example.com');
  // await page.click('button');

  const url = 'https://example.com';

  // 使用 Lighthouse 进行审查
  const {lhr} = await lighthouse(url, {
    port: new URL(browser.wsEndpoint()).port,
    output: 'json',
    logLevel: 'info',
  });

  console.log(`Lighthouse score: ${lhr.categories.performance.score * 100}`);

  await browser.close();
}

run();
```

然后可以导出 html 文件或 json 数据

### 实现一个性能守卫插件

在实现一个性能守卫插件，我们需要考虑以下因数：


1. 易用性和灵活性：插件应该易于配置和使用，以便它可以适应各种不同的CI/CD环境和应用场景。它也应该能够适应各种不同的性能指标和阈值。
2. 稳定性和可靠性：插件需要可靠和稳定，因为它将影响整个构建流程。任何失败或错误都可能导致构建失败，所以需要有强大的错误处理和恢复能力。
3. 性能：插件本身的性能也很重要，因为它将直接影响构建的速度和效率。它应该尽可能地快速和高效。
4. 可维护性和扩展性：插件应该设计得易于维护和扩展，以便随着应用和需求的变化进行适当的修改和更新。
5. 报告和通知：插件应该能够提供清晰和有用的报告，以便开发人员可以快速理解和处理任何性能问题。它也应该有一个通知系统，当性能指标低于预定阈值时，能够通知相关人员。
6. 集成：插件应该能够轻松集成到现有的CI/CD流程中，同时还应该支持各种流行的CI/CD工具和平台。
7. 安全性：如果插件需要访问或处理敏感数据，如用户凭证，那么必须考虑安全性。应使用最佳的安全实践来保护数据，如使用环境变量来存储敏感数据。

流程图

```js
//perfci插件
const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const { port } = new URL(browser.wsEndpoint());

async function runAudit(url) {
  const browser = await puppeteer.launch();
  const { lhr } = await lighthouse(url, {
    port,
    output: 'json',
    logLevel: 'info',
  });
  await browser.close();

  // 在这里定义你的性能预期
  const performanceScore = lhr.categories.performance.score;
  if (performanceScore < 0.9) { // 如果性能得分低于0.9，脚本将抛出错误
    throw new Error(`Performance score of ${performanceScore} is below the threshold of 0.9`);
  }
}

runAudit('https://example.com').catch(console.error);
```

CI 流水线

```yaml
name: CI
on: [push]
jobs:
  lighthouseci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 16
      - run: npm install && npm install -g @lhci/cli@0.11.x
      - run: npm run build
      - run: perfci autorun
```

性能审计

```js
const lighthouse = require('lighthouse');
const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');

// 配置邮件发送器
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-password',
  },
});

// 定义一个函数用于执行Lighthouse审计并处理结果
async function runAudit(url) {
  // 通过Puppeteer启动Chrome
  const browser = await puppeteer.launch({ headless: true });
  const { port } = new URL(browser.wsEndpoint());

  // 使用Lighthouse进行性能审计
  const { lhr } = await lighthouse(url, { port });

  // 检查性能得分是否低于阈值
  if (lhr.categories.performance.score < 0.9) {
    // 如果性能低于阈值，发送警告邮件
    let mailOptions = {
      from: 'your-email@gmail.com',
      to: 'admin@example.com',
      subject: '网站性能低于阈值',
      text: `Lighthouse得分：${lhr.categories.performance.score}`,
    };

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  }

  await browser.close();
}

// 使用函数
runAudit('https://example.com');
```

### 数据告警

```js
const lighthouse = require('lighthouse');
const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');

// 配置邮件发送器
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-password',
  },
});

// 定义一个函数用于执行Lighthouse审计并处理结果
async function runAudit(url) {
  // 通过Puppeteer启动Chrome
  const browser = await puppeteer.launch({ headless: true });
  const { port } = new URL(browser.wsEndpoint());

  // 使用Lighthouse进行性能审计
  const { lhr } = await lighthouse(url, { port });

  // 检查性能得分是否低于阈值
  if (lhr.categories.performance.score < 0.9) {
    // 如果性能低于阈值，发送警告邮件
    let mailOptions = {
      from: 'your-email@gmail.com',
      to: 'admin@example.com',
      subject: '网站性能低于阈值',
      text: `Lighthouse得分：${lhr.categories.performance.score}`,
    };

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  }

  await browser.close();
}

// 使用函数
runAudit('https://example.com');
```

### 处理设备、网络等不稳定情况

```js
// 网络抖动
const { lhr } = await lighthouse(url, {
  port,
  emulatedFormFactor: 'desktop',
  throttling: {
    rttMs: 150,
    throughputKbps: 1638.4,
    cpuSlowdownMultiplier: 4,
    requestLatencyMs: 0,
    downloadThroughputKbps: 0,
    uploadThroughputKbps: 0,
  },
});


// 设备
const { lhr } = await lighthouse(url, {
  port,
  emulatedFormFactor: 'desktop', // 这里可以设定为 'mobile' 或 'desktop'
});
```

### 用户登录态问题

> 也可以让后端同学专门提供一条内网访问的登录态接口环境，仅用于测试环境

```js
const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const fs = require('fs');
const axios = require('axios');
const { promisify } = require('util');
const { port } = new URL(browser.wsEndpoint());

// promisify fs.writeFile for easier use
const writeFile = promisify(fs.writeFile);

async function runAudit(url, options = { port }) {
  // 使用Puppeteer启动Chrome
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // 访问登录页面
  await page.goto('https://example.com/login');

  // 输入用户名和密码
  await page.type('#username', 'example_username');
  await page.type('#password', 'example_password');

  // 提交登录表单
  await Promise.all([
    page.waitForNavigation(), // 等待页面跳转
    page.click('#login-button'), // 点击登录按钮
  ]);

  // 运行Lighthouse
  const { lhr } = await lighthouse(url, options);

  // 保存审计结果到JSON文件
  const resultJson = JSON.stringify(lhr);
  await writeFile('lighthouse.json', resultJson);

  // 上传JSON文件到服务器
  const formData = new FormData();
  formData.append('file', fs.createReadStream('lighthouse.json'));

  // 上传文件到你的服务器
  const res = await axios.post('https://your-server.com/upload', formData, {
    headers: formData.getHeaders()
  });

  console.log('File uploaded successfully');

  await browser.close();
}

// 运行函数
runAudit('https://example.com');
```

### 性能巡检

是类似的实现，但因为巡检页面可能会比较多，需要做特殊处理。

### 扩展

根据截图等，结合设计稿，可以进一步设计为视觉走查提效方案

参考资料

- 推荐 https://web.dev/lighthouse-ci/
- 推荐 https://github.com/GoogleChrome/lighthouse-ci
  - `npm i -g @lhci/cli` -> `lhci autorun`
  - https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md#commands
- https://github.com/GoogleChrome/lighthouse
  - https://github.com/GoogleChrome/lighthouse#using-the-node-cli
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
- https://mp.weixin.qq.com/s/j-H7h6ja64EEk9m5mTyX_Q
