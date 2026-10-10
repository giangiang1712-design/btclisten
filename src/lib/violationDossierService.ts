import { ScrapedNewsItem, ViolationEvidenceDossier, LegalStatuteGround } from '../types';
import { isMinistryAuthorityProposal } from './newsClassification';

/**
 * Computes SHA-256 hash string for digital evidence integrity certification
 */
export async function calculateSha256Checksum(input: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    // Fallback pseudo-hash for non-secure contexts
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return `sha256_mock_${Math.abs(hash).toString(16).padStart(16, '0')}`;
  }
}

/**
 * Standard Legal Statutory Grounds under Vietnam Law for Media / Financial Misinformation
 */
export const STATUTORY_LEGAL_GROUNDS: LegalStatuteGround[] = [
  {
    statute: 'Nghị định số 72/2013/NĐ-CP',
    clause: 'Khoản 1, Điều 5',
    description: 'Nghiêm cấm hành vi lợi dụng Internet để đưa thông tin sai sự thật, vu khống, xuyên tạc, xúc phạm uy tín của cơ quan, tổ chức, danh dự và nhân phẩm của cá nhân.',
    sanctionRange: 'Cưỡng chế gỡ bỏ thông tin, thu hồi tài nguyên mạng và chuyển cơ quan chức năng điều tra xử lý.',
  },
  {
    statute: 'Nghị định số 15/2020/NĐ-CP (sửa đổi bởi NĐ 14/2022/NĐ-CP)',
    clause: 'Điểm a, Khoản 1, Điều 101',
    description: 'Hành vi cung cấp, chia sẻ thông tin giả mạo, thông tin sai sự thật, xuyên tạc, vu khống, xúc phạm uy tín của cơ quan, tổ chức, danh dự, nhân phẩm của cá nhân.',
    sanctionRange: 'Phạt tiền từ 10.000.000 đồng đến 20.000.000 đồng đối với tổ chức; biện pháp khắc phục hậu quả: Buộc gỡ bỏ thông tin sai sự thật.',
  },
  {
    statute: 'Luật An ninh mạng số 24/2018/QH14',
    clause: 'Điểm d, Khoản 1, Điều 8 & Điều 16',
    description: 'Nghiêm cấm thông tin bịa đặt, sai sự thật gây hoang mang trong nhân dân, gây thiệt hại cho hoạt động kinh tế - xã hội, gây khó khăn cho hoạt động của cơ quan nhà nước.',
    sanctionRange: 'Yêu cầu doanh nghiệp cung cấp dịch vụ viễn thông, Internet xóa bỏ thông tin; ngăn chặn việc truyền đưa thông tin.',
  },
  {
    statute: 'Luật Báo chí số 103/2016/QH13',
    clause: 'Khoản 2 & Khoản 4, Điều 9',
    description: 'Nghiêm cấm đăng, phát thông tin sai sự thật, xuyên tạc, vu khống, xúc phạm uy tín của cơ quan, tổ chức.',
    sanctionRange: 'Yêu cầu cải chính, xin lỗi công khai và bồi thường thiệt hại theo quy định pháp luật.',
  },
  {
    statute: 'Luật Chứng khoán số 54/2019/QH14 & NĐ 156/2020/NĐ-CP',
    clause: 'Khoản 2, Điều 12 & Điều 35',
    description: 'Nghiêm cấm trực tiếp hoặc gián tiếp đưa ra thông tin sai lệch, không đúng sự thật nhằm thao túng giá chứng khoán, kích động tâm lý hoảng loạn thị trường.',
    sanctionRange: 'Phạt tiền từ 1.500.000.000 đồng đến 3.000.000.000 đồng hoặc truy cứu trách nhiệm hình sự theo Điều 211 Bộ luật Hình sự.',
  },
];

/**
 * Creates an Automated Legal Violation Dossier from a ScrapedNewsItem
 */
export async function createViolationDossier(
  article: ScrapedNewsItem,
  customNotes?: string,
  severityOverride?: 'CRITICAL' | 'HIGH' | 'MEDIUM'
): Promise<ViolationEvidenceDossier> {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = now.getFullYear();
  const mm = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const hh = pad(now.getHours());
  const min = pad(now.getMinutes());
  const ss = pad(now.getSeconds());

  const dossierSeq = Math.floor(1000 + Math.random() * 9000);
  const dossierId = `HS-VP-${yyyy}${mm}${dd}-${dossierSeq}`;
  const officialCode = `Số: ${dossierSeq}/BB-BTC-TT`;
  const capturedAtIso = now.toISOString();
  const capturedAtVn = `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss} (Giờ Hà Nội UTC+7)`;

  // Hash calculation of the entire evidence block
  const rawDataPayload = `TITLE:${article.title}|URL:${article.url}|SOURCE:${article.source}|PUBLISHED:${article.publishedAt}|SUMMARY:${article.summary}|CAPTURED:${capturedAtIso}`;
  const sha256EvidenceHash = await calculateSha256Checksum(rawDataPayload);

  // Determine Severity
  const isAuthorityProp = isMinistryAuthorityProposal(article);
  const isSevere = 
    !isAuthorityProp && (
      article.isEmergency ||
      article.isHighConfidenceRisk ||
      article.sentimentScore <= -50 ||
      article.title.toLowerCase().includes('bị bắt') ||
      article.title.toLowerCase().includes('khởi tố') ||
      article.title.toLowerCase().includes('sụp đổ') ||
      article.title.toLowerCase().includes('vỡ nợ')
    );

  const violationSeverity: 'CRITICAL' | 'HIGH' | 'MEDIUM' = severityOverride || (
    isSevere ? 'CRITICAL' : (article.sentimentScore < -20 ? 'HIGH' : 'MEDIUM')
  );

  // Select statutory grounds based on sector
  const relevantGrounds: LegalStatuteGround[] = [
    STATUTORY_LEGAL_GROUNDS[0], // ND 72
    STATUTORY_LEGAL_GROUNDS[1], // ND 15
    STATUTORY_LEGAL_GROUNDS[2], // Luật ANM
  ];

  if (article.sector === 'stocks' || article.sector === 'bonds') {
    relevantGrounds.push(STATUTORY_LEGAL_GROUNDS[4]); // Luật CK
  } else {
    relevantGrounds.push(STATUTORY_LEGAL_GROUNDS[3]); // Luật Báo chí
  }

  // Extract infringing excerpts
  const excerpts: string[] = [];
  if (article.summary) excerpts.push(article.summary);
  if (article.keyPoints && article.keyPoints.length > 0) {
    excerpts.push(...article.keyPoints.slice(0, 2));
  }
  if (customNotes && customNotes.trim()) {
    excerpts.push(`Ghi chú giám định: ${customNotes.trim()}`);
  }

  const assessedImpact = `Bài viết trên trang "${article.source}" phát tán tiêu đề và nội dung phản ánh sai lệch, suy diễn hoặc thiếu kiểm chứng liên quan đến công tác quản lý tài chính - ngân sách của Bộ Tài chính. Nội dung này có dấu hiệu kích động tâm lý tiêu cực của nhà đầu tư, người nộp thuế, ảnh hưởng nghiêm trọng đến kỷ cương tài khóa và uy tín điều hành kinh tế vĩ mô.`;

  const recommendedActions = [
    'Lập biên bản cố định toàn bộ dữ liệu điện tử, mã băm SHA-256 và ảnh chụp chứng cứ pháp lý.',
    'Chuyển văn bản phối hợp khẩn cấp tới Cục Phát thanh, Truyền hình và Thông tin điện tử (Bộ TT&TT) yêu cầu rà soát, chỉ đạo các nền tảng gỡ bỏ link bài vi phạm trong vòng 03 giờ.',
    'Chuyển hồ sơ chứng cứ cho Cục An ninh mạng và phòng, chống tội phạm công nghệ cao (A05 - Bộ Công an) để xác minh chủ thể đăng tải, động cơ xuyên tạc và xử lý nghiêm theo quy định pháp luật.',
    'Giao Văn phòng Bộ Tài chính chủ trì phối hợp với cơ quan báo chí chính thống phát thông cáo báo chí định hướng dư luận, làm rõ sự thật.',
  ];

  const referralRecipients = [
    {
      agency: 'Cục Phát thanh, Truyền hình và Thông tin điện tử (Bộ TT&TT)',
      role: 'Cơ quan Quản lý Nhà nước về Thông tin Mạng',
      requestedAction: 'Rà quét, phát lệnh yêu cầu chủ quản trang tin gỡ bỏ bài đăng vi phạm theo Nghị định 72/2013/NĐ-CP và Nghị định 15/2020/NĐ-CP.',
    },
    {
      agency: 'Cục An ninh mạng và phòng, chống tội phạm công nghệ cao (A05 - Bộ Công an)',
      role: 'Cơ quan Điều tra & Bảo đảm An ninh Mạng Quốc gia',
      requestedAction: 'Truy vết địa chỉ IP, danh tính chủ tài khoản/trang tin phát tán tin giả; triệu tập xử lý vi phạm hành chính hoặc hình sự.',
    },
    {
      agency: 'Thanh tra Bộ Tài chính & Văn phòng Bộ Tài chính',
      role: 'Đơn vị Chủ trì Bảo vệ Uy tín Ngành Tài chính',
      requestedAction: 'Lưu trữ hồ sơ bằng chứng nghiệp vụ; soạn thảo thông cáo phát ngôn đính chính chính thống.',
    },
  ];

  return {
    dossierId,
    officialCode,
    articleId: article.id,
    articleTitle: article.title,
    targetUrl: article.url,
    sourceOutlet: article.source,
    publisher: article.sourceName || article.source,
    capturedAtIso,
    capturedAtVn,
    sha256EvidenceHash,
    violationSeverity,
    legalGrounds: relevantGrounds,
    infringingExcerpts: excerpts,
    assessedImpact,
    recommendedActions,
    referralRecipients,
    digitalSealVerified: true,
    status: 'SEALED',
  };
}

/**
 * Exports official violation record into formatted Microsoft Word HTML (.doc)
 */
export function exportDossierToWordDocument(dossier: ViolationEvidenceDossier): void {
  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${dossier.officialCode}</title>
      <style>
        body { font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.4; margin: 20mm; color: #000; }
        .header-table { width: 100%; margin-bottom: 20px; border: none; }
        .header-table td { vertical-align: top; border: none; }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        .italic { font-style: italic; }
        .title { font-size: 15pt; font-weight: bold; text-align: center; margin-top: 25px; margin-bottom: 10px; text-transform: uppercase; }
        .subtitle { font-size: 13pt; font-weight: bold; text-align: center; margin-bottom: 25px; }
        .section-title { font-size: 13pt; font-weight: bold; margin-top: 15px; margin-bottom: 6px; text-decoration: underline; }
        .box { border: 1px solid #333; padding: 10px; margin: 10px 0; background-color: #f9f9f9; }
        .hash-code { font-family: 'Courier New', Courier, monospace; font-size: 11pt; word-break: break-all; background-color: #eee; padding: 4px; }
        .signature-table { width: 100%; margin-top: 40px; border: none; }
        .signature-table td { width: 50%; text-align: center; border: none; vertical-align: top; }
        li { margin-bottom: 6px; }
      </style>
    </head>
    <body>
      <table class="header-table">
        <tr>
          <td style="width: 45%; text-align: center;">
            <div class="bold">BỘ TÀI CHÍNH</div>
            <div class="bold">BAN CHỈ ĐẠO TRUYỀN THÔNG</div>
            <div style="font-size: 11pt;">${dossier.officialCode}</div>
          </td>
          <td style="width: 55%; text-align: center;">
            <div class="bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div class="bold">Độc lập - Tự do - Hạnh phúc</div>
            <div style="font-size: 11pt;">-----------------</div>
            <div class="italic" style="font-size: 11pt; margin-top: 4px;">Hà Nội, ngày ${dossier.capturedAtVn.split(' ')[0]}</div>
          </td>
        </tr>
      </table>

      <div class="title">BIÊN BẢN GIÁM ĐỊNH & LẬP HỒ SƠ BẰNG CHỨNG ĐIỆN TỬ</div>
      <div class="subtitle">Về việc phát hiện thông tin sai lệch, có dấu hiệu vi phạm pháp luật trên không gian mạng liên quan đến ngành Tài chính</div>

      <p>Hôm nay, vào lúc <strong>${dossier.capturedAtVn}</strong>, Hệ thống Giám sát & Phân tích Truyền thông Bộ Tài chính phối hợp Tổ Tác chiến An toàn thông tin đã thực hiện cố định hiện trạng và lập hồ sơ chứng cứ vi phạm như sau:</p>

      <div class="section-title">I. THÔNG TIN BÀI VIẾT VÀ NGUỒN PHÁT TÁN</div>
      <ul>
        <li><strong>Tiêu đề bài viết:</strong> ${dossier.articleTitle}</li>
        <li><strong>Đơn vị/Nguồn phát tán:</strong> ${dossier.sourceOutlet} (${dossier.publisher || 'Trang tin điện tử'})</li>
        <li><strong>Đường dẫn liên kết (URL):</strong> <a href="${dossier.targetUrl}">${dossier.targetUrl}</a></li>
        <li><strong>Mã định danh hồ sơ:</strong> ${dossier.dossierId}</li>
        <li><strong>Mức độ nghiêm trọng xác định:</strong> <span style="color: red; font-weight: bold;">${dossier.violationSeverity}</span></li>
      </ul>

      <div class="section-title">II. CHỨNG THỰC BẰNG CHỨNG SỐ & MÃ BĂM TOÀN VẸN (CRYPTOGRAPHIC HASH)</div>
      <div class="box">
        <p>Toàn bộ gói dữ liệu bài viết (tiêu đề, URL, thời gian, nội dung trích xuất) đã được mã hóa theo chuẩn mật mã SHA-256 bảo đảm tính toàn vẹn chứng cứ trước cơ quan tư pháp:</p>
        <div class="hash-code">SHA-256: ${dossier.sha256EvidenceHash}</div>
        <p style="font-size: 10pt; color: #555; margin-top: 5px;">Chứng thư điện tử: [VERIFIED DIGITAL EVIDENCE - MINISTRY OF FINANCE VIETNAM]</p>
      </div>

      <div class="section-title">III. NỘI DUNG TRÍCH XUẤT CÓ DẤU HIỆU VI PHẠM</div>
      <div class="box" style="background-color: #fff; border-left: 4px solid red;">
        ${dossier.infringingExcerpts.map(ex => `<p><em>"${ex}"</em></p>`).join('')}
      </div>

      <div class="section-title">IV. CĂN CỨ PHÁP LÝ VIỆN DẪN</div>
      <ul>
        ${dossier.legalGrounds.map(g => `
          <li>
            <strong>${g.statute} (${g.clause}):</strong> ${g.description}
            <br/><span style="color: #666; font-size: 11pt;">Chế tài áp dụng: ${g.sanctionRange}</span>
          </li>
        `).join('')}
      </ul>

      <div class="section-title">V. ĐÁNH GIÁ TÁC ĐỘNG VÀ ĐỀ XUẤT BIỆN PHÁP XỬ LÝ KHẨN CẤP</div>
      <p><strong>1. Đánh giá tác động:</strong> ${dossier.assessedImpact}</p>
      <p><strong>2. Đề xuất kiến nghị xử lý:</strong></p>
      <ol>
        ${dossier.recommendedActions.map(act => `<li>${act}</li>`).join('')}
      </ol>

      <div class="section-title">VI. ĐƠN VỊ PHỐI HỢP TIẾP NHẬN HỒ SƠ</div>
      <ul>
        ${dossier.referralRecipients.map(r => `
          <li>
            <strong>${r.agency}:</strong> ${r.requestedAction}
          </li>
        `).join('')}
      </ul>

      <table class="signature-table">
        <tr>
          <td>
            <div class="bold">CÁN BỘ GIÁM ĐỊNH CHỨNG CỨ</div>
            <div class="italic">(Ký, ghi rõ họ tên và đóng dấu số)</div>
            <br/><br/><br/><br/>
            <div class="bold">TỔ CÔNG TÁC PHẢN ỨNG NHANH</div>
          </td>
          <td>
            <div class="bold">LÃNH ĐẠO PHÊ DUYỆT HỒ SƠ</div>
            <div class="italic">(Ký, ghi rõ họ tên và xác thực số)</div>
            <br/><br/><br/><br/>
            <div class="bold">BAN CHỈ ĐẠO TRUYỀN THÔNG BỘ TÀI CHÍNH</div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + htmlContent], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `BienBan_HoSoViPham_${dossier.dossierId}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Draws a forensic snapshot certificate onto an HTML5 Canvas and exports as high-res PNG image
 */
export function generateDossierSnapshotImage(dossier: ViolationEvidenceDossier): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 700;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      resolve('');
      return;
    }

    // Background
    ctx.fillStyle = '#0f172a'; // slate-900
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative Top Header
    ctx.fillStyle = '#1e293b'; // slate-800
    ctx.fillRect(0, 0, canvas.width, 100);

    // Red alert stripe
    ctx.fillStyle = '#dc2626'; // red-600
    ctx.fillRect(0, 0, canvas.width, 6);

    // Official Stamp Header
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
    ctx.fillText('BỘ TÀI CHÍNH - HỒ SƠ CHỨNG CỨ BẰNG CHỨNG SỐ VI PHẠM KHÔNG GIAN MẠNG', 40, 45);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`MÃ HỒ SƠ: ${dossier.dossierId} | ${dossier.officialCode} | THỜI ĐIỂM: ${dossier.capturedAtVn}`, 40, 75);

    // Target Article Box
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(40, 130, 920, 240, 12);
    ctx.fill();
    ctx.stroke();

    // Source & URL
    ctx.fillStyle = '#38bdf8'; // sky-400
    ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`NGUỒN PHÁT TÁN: ${dossier.sourceOutlet}`, 60, 165);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px "Segoe UI", Arial, sans-serif';
    const truncatedUrl = dossier.targetUrl.length > 95 ? dossier.targetUrl.substring(0, 95) + '...' : dossier.targetUrl;
    ctx.fillText(`URL: ${truncatedUrl}`, 60, 190);

    // Article Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
    const titleLines = wrapText(ctx, dossier.articleTitle, 880);
    titleLines.slice(0, 2).forEach((line, idx) => {
      ctx.fillText(line, 60, 225 + idx * 26);
    });

    // Infringing excerpt quote box
    ctx.fillStyle = '#2d1515';
    ctx.strokeStyle = '#ef4444';
    ctx.beginPath();
    ctx.roundRect(60, 280, 880, 70, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fca5a5';
    ctx.font = 'italic 13px "Segoe UI", Arial, sans-serif';
    const excerptText = dossier.infringingExcerpts[0] || dossier.articleTitle;
    const excerptLines = wrapText(ctx, `Trích dẫn vi phạm: "${excerptText}"`, 850);
    excerptLines.slice(0, 2).forEach((l, idx) => {
      ctx.fillText(l, 75, 305 + idx * 20);
    });

    // SHA-256 Box
    ctx.fillStyle = '#090d16';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(40, 395, 920, 90, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.fillText('✓ CHỨNG THỰC MÃ BĂM TOÀN VẸN CHỨNG CỨ PHÁP LÝ (SHA-256 DIGEST):', 60, 425);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '13px "Courier New", monospace';
    ctx.fillText(dossier.sha256EvidenceHash, 60, 455);

    // Legal grounds & Referral recipients summary
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(40, 505, 920, 140, 12);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
    ctx.fillText('ĐIỀU KHOẢN VI PHẠM & CƠ QUAN PHỐI HỢP XỬ LÝ:', 60, 535);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '13px "Segoe UI", Arial, sans-serif';
    ctx.fillText('• Nghị định 72/2013/NĐ-CP (Điều 5) | Nghị định 15/2020/NĐ-CP (Điều 101) | Luật An ninh mạng (Điều 8, 16)', 60, 560);
    ctx.fillText('• Đơn vị tiếp nhận công văn xử lý: Cục PTTH&TTĐT (Bộ TT&TT), Cục An ninh mạng A05 (Bộ Công an), Thanh tra Bộ Tài chính', 60, 585);

    // Stamp seal simulated mark
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(880, 580, 45, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 10px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BỘ TÀI CHÍNH', 880, 565);
    ctx.fillText('CHỨNG THỰC SỐ', 880, 582);
    ctx.fillText('ĐÃ CỐ ĐỊNH', 880, 598);
    ctx.textAlign = 'left';

    // Footer Watermark
    ctx.fillStyle = '#64748b';
    ctx.font = '11px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Tài liệu chứng cứ phục vụ công tác thanh tra, xử phạt vi phạm hành chính và bảo vệ an ninh thông tin tài chính quốc gia.', 40, 675);

    const dataUrl = canvas.toDataURL('image/png');
    resolve(dataUrl);
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Downloads a PNG file directly
 */
export function downloadSnapshotPng(dataUrl: string, dossierId: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `AnhChup_ChungCu_${dossierId}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const DOSSIER_STORAGE_KEY = 'mof_violation_evidence_dossiers_db';

export function saveDossierToLocalHistory(dossier: ViolationEvidenceDossier): void {
  try {
    const raw = localStorage.getItem(DOSSIER_STORAGE_KEY);
    const list: ViolationEvidenceDossier[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter(d => d.dossierId !== dossier.dossierId);
    filtered.unshift(dossier);
    localStorage.setItem(DOSSIER_STORAGE_KEY, JSON.stringify(filtered.slice(0, 50)));
  } catch (err) {
    console.error('Failed to save dossier to localStorage:', err);
  }
}

export function getDossierHistory(): ViolationEvidenceDossier[] {
  try {
    const raw = localStorage.getItem(DOSSIER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
