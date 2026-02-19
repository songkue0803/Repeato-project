/**
 * Slack Incoming Webhook 설정을 통해 받은 URL을 아래에 입력하세요.
 */
// [주의] Webhook URL이 정확한지 다시 한번 확인해주세요.
const WebhookUrl = '여기에_슬랙_웹훅_주소_입력'; 

// ==========================================
// [종료 알림] 배치가 완료될 때 실행 (이 기능은 지원됨)
// ==========================================
batchRunner.addOnBatchCompleted('config', async (batchRun) => {
  try {
    // 1. 리포트 생성 및 업로드
    const reportPath = await batchRunner.createBatchRunExport();
    log('Created report: ' + reportPath);

    log('Uploading report...');
    const reportUrl = await batchRunner.uploadReport(reportPath, new AbortController());
    log('Uploaded report: ' + reportUrl);

    // 2. 데이터 추출
    const stats = batchRun.stats || {};
    
    // 배치 이름 가져오기
    const batchName = batchRun.title || "Unknown Batch"; 
    
    const passed = stats.successCount || 0;
    const failed = stats.failCount || 0;
    const total = stats.totalCount || (passed + failed);
    const duration = stats.duration || "00:00:00"; 

    // 3. 상태 설정
    const isSuccess = batchRun.wasSuccessful;
    const emoji = isSuccess ? "✅" : "❌";
    const titleText = "Repeato 자동화 테스트 결과 - 박송규"; 
    
    // 4. Slack Block Kit 메시지 구성
    const payload = {
      blocks: [
        {
          "type": "header",
          "text": {
            "type": "plain_text",
            "text": `${emoji} ${titleText}`,
            "emoji": true
          }
        },
        // 첫 번째 줄: [테스트 이름] | [결과]
        {
          "type": "section",
          "fields": [
            {
              "type": "mrkdwn",
              "text": `*테스트 이름:*\n${batchName}`
            },
            {
              "type": "mrkdwn",
              "text": `*결과:*\n${isSuccess ? 'PASS' : 'FAIL'}`
            }
          ]
        },
        // 두 번째 줄: [소요 시간] | [총 테스트]
        {
          "type": "section",
          "fields": [
            {
              "type": "mrkdwn",
              "text": `*소요 시간:*\n${duration}`
            },
            {
              "type": "mrkdwn",
              "text": `*총 테스트 케이스 수:*\n${total}건`
            }
          ]
        },
        // 세 번째 줄: [성공] | [실패]
        {
          "type": "section",
          "fields": [
            {
              "type": "mrkdwn",
              "text": `*성공한 케이스 수:*\n${passed}건`
            },
            {
              "type": "mrkdwn",
              "text": `*실패한 케이스 수:*\n${failed}건`
            }
          ]
        },
        {
          "type": "divider"
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "상세 내용은 리포트에서 확인하세요."
          },
          "accessory": {
            "type": "button",
            "text": {
              "type": "plain_text",
              "text": "📊 리포트 보기",
              "emoji": true
            },
            "value": "view_report",
            "url": reportUrl, 
            "action_id": "button-action"
          }
        }
      ]
    };

    // 5. 슬랙으로 전송
    await axios.post(WebhookUrl, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    log('Completion message sent to Slack.');
    
  } catch (error) {
    log('Failed in completion handler: ' + error);
  }
});