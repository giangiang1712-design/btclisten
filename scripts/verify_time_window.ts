/**
 * Time Window Compliance Audit Script
 * FinPulse AI - Financial News Scraper & Database Audit Suite
 *
 * Checks if articles retrieved by the scraper and database strictly adhere to the requested time window boundaries.
 * Run with: npx tsx scripts/verify_time_window.ts [1h|24h|db|all]
 */

import http from 'http';

interface ArticleItem {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  publishedTimestamp?: number;
  publishedTimeStr?: string;
  timeAgo?: string;
}

interface ScrapeResponse {
  success: boolean;
  totalFound: number;
  timeBounds?: {
    startMs: number;
    endMs: number;
    scannedWindow?: string;
  };
  news: ArticleItem[];
}

function formatVnTime(ts: number): string {
  if (!ts || isNaN(ts)) return 'Không xác định';
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(ts));
}

function fetchApi(path: string, postData?: any, timeoutMs = 180000): Promise<any> {
  return new Promise((resolve, reject) => {
    const dataString = postData ? JSON.stringify(postData) : '';
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 3000,
        path,
        method: postData ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(dataString),
        },
        timeout: timeoutMs,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`Failed to parse JSON response (${res.statusCode}): ${body.slice(0, 200)}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Yêu cầu bị timeout sau ${(timeoutMs / 1000).toFixed(0)} giây`));
    });

    if (dataString) {
      req.write(dataString);
    }
    req.end();
  });
}

export async function auditSession(timeRange: string, customStartMs?: number, customEndMs?: number): Promise<boolean> {
  const now = Date.now();
  let startMs = customStartMs;
  let endMs = customEndMs || now;

  if (!startMs) {
    if (timeRange === '1h') startMs = now - 60 * 60 * 1000;
    else if (timeRange === '24h') startMs = now - 24 * 60 * 60 * 1000;
    else if (timeRange === '7d') startMs = now - 7 * 24 * 60 * 60 * 1000;
    else startMs = now - 60 * 60 * 1000;
  }

  console.log('\n' + '='.repeat(90));
  console.log(`🔍 [KIỂM THỬ KHUNG GIỜ QUÉT] Phiên kiểm tra: ${timeRange.toUpperCase()}`);
  console.log(`   Khung giờ yêu cầu : ${formatVnTime(startMs)} ➔ ${formatVnTime(endMs)}`);
  console.log(`   Thời gian máy chủ : ${formatVnTime(now)}`);
  console.log('='.repeat(90));

  const payload = {
    timeRange,
    sector: 'all',
    startMs,
    endMs,
    query: '',
  };

  try {
    console.log('⏳ Đang gửi yêu cầu quét và kiểm định tới máy chủ...');
    const result: ScrapeResponse = await fetchApi('/api/scrape/financial-news', payload, 180000);

    if (!result || !result.success) {
      console.error('❌ Lỗi: API phản hồi không thành công!');
      return false;
    }

    const articles = result.news || [];
    console.log(`📊 Tổng số bài viết thu thập được: ${articles.length} bài`);

    if (articles.length === 0) {
      console.log('ℹ️ Không có bài viết nào phát hành trong khung giờ này (hoàn toàn hợp lệ theo mốc thời gian).');
      return true;
    }

    let violations = 0;
    let minTimestampFound = Infinity;
    let maxTimestampFound = -Infinity;
    const graceBufferMs = 3 * 60 * 1000; // 3 phút cho phép lệch đồng hồ máy chủ nguồn tin

    const details: Array<{
      title: string;
      source: string;
      publishTimeStr: string;
      status: 'PASS' | 'FAIL_TOO_EARLY' | 'FAIL_FUTURE';
      deltaMinutes: number;
    }> = [];

    for (const art of articles) {
      const pubMs = art.publishedTimestamp || (art.publishedAt ? new Date(art.publishedAt).getTime() : 0);

      if (!pubMs || isNaN(pubMs)) {
        violations++;
        details.push({
          title: (art.title || '').slice(0, 45) + '...',
          source: art.source || 'Unknown',
          publishTimeStr: 'Không có thời gian',
          status: 'FAIL_TOO_EARLY',
          deltaMinutes: -999999,
        });
        continue;
      }

      minTimestampFound = Math.min(minTimestampFound, pubMs);
      maxTimestampFound = Math.max(maxTimestampFound, pubMs);

      if (pubMs < startMs) {
        violations++;
        const deltaMins = Math.round((startMs - pubMs) / 60000);
        details.push({
          title: (art.title || '').slice(0, 45) + '...',
          source: art.source || 'Unknown',
          publishTimeStr: formatVnTime(pubMs),
          status: 'FAIL_TOO_EARLY',
          deltaMinutes: -deltaMins,
        });
      } else if (pubMs > endMs + graceBufferMs) {
        violations++;
        const deltaMins = Math.round((pubMs - endMs) / 60000);
        details.push({
          title: (art.title || '').slice(0, 45) + '...',
          source: art.source || 'Unknown',
          publishTimeStr: formatVnTime(pubMs),
          status: 'FAIL_FUTURE',
          deltaMinutes: deltaMins,
        });
      } else {
        details.push({
          title: (art.title || '').slice(0, 45) + '...',
          source: art.source || 'Unknown',
          publishTimeStr: formatVnTime(pubMs),
          status: 'PASS',
          deltaMinutes: 0,
        });
      }
    }

    console.log('\n📋 MẪU 10 BÀI VIẾT ĐÃ ĐỐI SOÁT MỐC THỜI GIAN:');
    console.log('-'.repeat(90));
    console.log(
      'STT'.padEnd(5) +
      'Trạng thái'.padEnd(16) +
      'Thời gian xuất bản'.padEnd(24) +
      'Nguồn báo'.padEnd(20) +
      'Tiêu đề'
    );
    console.log('-'.repeat(90));

    details.slice(0, 10).forEach((d, idx) => {
      const statusStr = d.status === 'PASS' ? '✅ HỢP LỆ' : '❌ VI PHẠM';
      console.log(
        `${idx + 1}`.padEnd(5) +
        statusStr.padEnd(16) +
        d.publishTimeStr.padEnd(24) +
        d.source.slice(0, 18).padEnd(20) +
        d.title
      );
    });

    console.log('-'.repeat(90));
    console.log(`📌 THÔNG SỐ KIỂM ĐỊNH PHIÊN:`);
    console.log(`   - Bài đăng sớm nhất : ${minTimestampFound < Infinity ? formatVnTime(minTimestampFound) : 'N/A'}`);
    console.log(`   - Bài đăng mới nhất : ${maxTimestampFound > -Infinity ? formatVnTime(maxTimestampFound) : 'N/A'}`);
    console.log(`   - Tỷ lệ đúng giờ    : ${(((articles.length - violations) / articles.length) * 100).toFixed(1)}%`);
    console.log(`   - Số lượng vi phạm  : ${violations} / ${articles.length} bài`);

    if (violations === 0) {
      console.log(`\n🎉 KẾT LUẬN THỜI GIAN: ĐẠT CHUẨN 100% (Mọi bài viết đều nằm chính xác trong khung giờ yêu cầu)`);
    } else {
      console.log(`\n❌ KẾT LUẬN THỜI GIAN: PHÁT HIỆN ${violations} BÀI LỆCH KHUNG GIỜ!`);
    }

    // Step 2: Link Verification (Sample of up to 10 articles or all)
    console.log('\n' + '-'.repeat(90));
    console.log(`🔗 [KIỂM ĐỊNH TOÀN VẸN LIÊN KẾT & ĐỌC THỬ BÀI VIẾT]`);
    console.log('-'.repeat(90));

    const sampleToAudit = articles.slice(0, 10).map((a, i) => ({
      id: a.id || `cli-${i}`,
      url: a.url,
      title: a.title,
    }));

    try {
      const linkCheckRes = await fetchApi('/api/audit/verify-links-batch', { items: sampleToAudit }, 60000);
      if (linkCheckRes && linkCheckRes.success) {
        console.log(`   - Tổng link kiểm tra : ${linkCheckRes.totalChecked} bài`);
        console.log(`   - Link mở đọc tốt    : ${linkCheckRes.okCount} bài`);
        console.log(`   - Link lỗi / 404     : ${linkCheckRes.deadCount} bài`);
        console.log(`   - Link trỏ sai bài   : ${linkCheckRes.mismatchCount} bài`);

        console.log('\n   Chi tiết mẫu kiểm tra link:');
        (linkCheckRes.results || []).forEach((r: any, idx: number) => {
          const badge = r.status === 'ok' ? '✅ ĐỌC TỐT' : r.status === 'mismatch' ? '⚠️ TRỎ SAI' : '❌ LỖI/404';
          console.log(`   [${idx + 1}] ${badge.padEnd(12)} (${r.similarityScore || 0}% khớp) - ${r.url}`);
          if (r.status === 'mismatch') {
            console.log(`       ➔ Tiêu đề nhận được: "${(r.pageTitle || '').slice(0, 70)}..."`);
          }
        });
      }
    } catch (e: any) {
      console.log(`   ⚠️ Không thể kết nối API kiểm định link: ${e?.message}`);
    }

    return violations === 0;
  } catch (err: any) {
    console.error(`❌ Lỗi khi thực hiện kiểm thử: ${err.message || err}`);
    return false;
  }
}

export async function auditDatabaseRecords(): Promise<boolean> {
  console.log('\n' + '='.repeat(90));
  console.log(`🔍 [KIỂM THỬ CƠ SỞ DỮ LIỆU ĐÃ LƯU TRỮ] (Database Integrity Check)`);
  console.log('='.repeat(90));

  try {
    const res = await fetchApi('/api/db/query', { limit: 100, page: 1 }, 10000);
    if (!res || !res.success) {
      console.log('⚠️ Không thể truy vấn cơ sở dữ liệu hoặc DB đang rỗng.');
      return true;
    }

    const articles: any[] = res.articles || [];
    console.log(`📊 Tổng số bài viết trong database được kiểm tra: ${articles.length} bài`);

    let validTimestamps = 0;
    for (const art of articles) {
      const pubMs = art.publishedTimestamp || (art.publishedAt ? new Date(art.publishedAt).getTime() : 0);
      if (pubMs && !isNaN(pubMs) && pubMs > 0) {
        validTimestamps++;
      }
    }

    console.log(`   - Bài viết có timestamp hợp lệ: ${validTimestamps} / ${articles.length}`);
    console.log(`   - Tỷ lệ toàn vẹn dữ liệu: ${articles.length > 0 ? ((validTimestamps / articles.length) * 100).toFixed(1) : 100}%`);
    return validTimestamps === articles.length;
  } catch (err: any) {
    console.error(`❌ Lỗi khi kiểm tra DB: ${err.message || err}`);
    return false;
  }
}

async function main() {
  const mode = process.argv[2] || 'all';

  console.log('\n==========================================================================================');
  console.log('🧪 CHƯƠNG TRÌNH KIỂM THỬ KHUNG GIỜ & ĐỐI SOÁT MỐC THỜI GIAN (TIME WINDOW AUDIT SUITE)');
  console.log('==========================================================================================');

  if (mode === 'db') {
    await auditDatabaseRecords();
  } else if (mode === '1h') {
    await auditSession('1h');
  } else if (mode === '24h') {
    await auditSession('24h');
  } else {
    // Audit database first
    await auditDatabaseRecords();
    // Then 1h session
    await auditSession('1h');
  }

  console.log('\n✅ Quá trình kiểm thử đã hoàn tất.');
}

main();
