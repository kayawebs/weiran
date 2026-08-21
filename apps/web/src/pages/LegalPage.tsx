import { Seo } from "../components/Seo";
import { marketConfig } from "../config/market";

type LegalKind = "privacy" | "terms" | "disclaimer";

const content = {
  en: {
    privacy: { title: "Privacy policy", intro: "Weiran Lab minimizes personal data and separates product analytics, authentication, media processing, and advertising.", sections: [
      ["What we process", "Guest or WeChat account identifiers, task metadata, technical request logs, and files you intentionally submit to a tool."],
      ["Files and results", "Uploaded files are stored privately for processing. Temporary links expire. Retention periods can vary by tool and deployment."],
      ["Advertising", "The global and China deployments may use different advertising providers. Providers can process device and consent information under their own policies."],
      ["Your choices", "Do not submit sensitive or unauthorized material. You may stop using the service and request deletion where applicable."]
    ] },
    terms: { title: "Terms of use", intro: "Use Weiran Lab only for lawful creator workflows and material you own or are authorized to process.", sections: [
      ["Authorized use", "You are responsible for the links and files you submit and for obtaining all required rights and permissions."],
      ["Platform rules", "Source tools do not grant rights to third-party content. You must also follow the source platform's terms and applicable law."],
      ["Service changes", "Connectors can stop working when upstream platforms change. Tools may be changed, limited, or discontinued without guarantee."],
      ["Abuse", "Do not bypass access controls, overload the service, distribute harmful content, or use results to mislead people about content provenance."]
    ] },
    disclaimer: { title: "Disclaimer", intro: "Weiran Lab is an independent creator utility platform and is not affiliated with the platforms named in individual tools.", sections: [
      ["Third-party names", "Product names and trademarks identify compatibility only and remain the property of their respective owners."],
      ["No ownership transfer", "Downloading or processing material does not transfer copyright, privacy, publicity, or other rights."],
      ["Availability", "Results depend on public source data and upstream services. No uninterrupted availability or specific output is guaranteed."],
      ["AI provenance", "Removing a visible mark does not remove invisible provenance systems and must not be used to conceal the origin of AI-generated content."]
    ] }
  },
  "zh-CN": {
    privacy: { title: "隐私政策", intro: "未然Lab 尽量减少个人数据处理，并隔离产品分析、身份认证、素材处理与广告模块。", sections: [
      ["我们处理的信息", "访客或微信账户标识、任务元数据、必要的技术请求日志，以及您主动提交给工具的文件。"],
      ["文件与结果", "上传文件会以私有方式保存用于处理，临时链接会自动失效；保留时间可能因工具与部署区域而异。"],
      ["广告", "海外与国内部署可能使用不同广告服务商；服务商会依据其政策处理设备与同意状态信息。"],
      ["您的选择", "请勿提交敏感或未经授权的素材；在适用情况下，您可以停止使用并申请删除数据。"]
    ] },
    terms: { title: "使用条款", intro: "请仅将未然Lab 用于合法创作流程，并处理您拥有或已经获得授权的素材。", sections: [
      ["授权使用", "您需要对提交的链接和文件负责，并自行取得所需的全部权利与许可。"],
      ["平台规则", "素材获取工具不会赋予您第三方内容的权利；您仍需遵守来源平台规则和适用法律。"],
      ["服务变化", "上游平台变化可能导致连接器失效；工具可能调整、限制或停止，无法保证持续可用。"],
      ["禁止滥用", "不得绕过访问控制、恶意占用服务、传播有害内容，或利用结果误导他人对内容来源的判断。"]
    ] },
    disclaimer: { title: "免责声明", intro: "未然Lab 是独立的创作者工具平台，与各工具中提及的平台不存在隶属关系。", sections: [
      ["第三方名称", "产品名和商标仅用于说明兼容性，其权利归各自所有者。"],
      ["不转移权利", "下载或处理素材不会转移版权、隐私权、肖像权或其他权利。"],
      ["可用性", "结果依赖公开来源数据和上游服务，不保证持续可用或得到特定输出。"],
      ["AI 来源标识", "移除可见标记不会移除不可见的来源证明系统，也不得用来隐瞒 AI 生成内容的来源。"]
    ] }
  }
} as const;

export function LegalPage({ kind }: { kind: LegalKind }) {
  const page = content[marketConfig.locale][kind];
  return (
    <>
      <Seo title={page.title} description={page.intro} path={`/${kind}`} />
      <article className="legal-page">
        <p className="eyebrow">WEIRAN LAB · LEGAL</p>
        <h1>{page.title}</h1>
        <p className="legal-intro">{page.intro}</p>
        <div className="legal-sections">{page.sections.map(([title, body], index) => <section key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><h2>{title}</h2><p>{body}</p></div></section>)}</div>
      </article>
    </>
  );
}
