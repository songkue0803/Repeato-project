// Slack Incoming Webhook URL을 아래에 입력하세요.
const WebhookUrl = '여기에_슬랙_웹훅_주소_입력'; 

batchRunner.addOnBatchCompleted('config', async (batchRun) => {
  try {
    // 리포트 생성 및 업로드
    const reportPath = await batchRunner.createBatchRunExport();
    log('Created report: ' + reportPath);

    log('Uploading report...');
    const reportUrl = await batchRunner.uploadReport(reportPath, new AbortController());
    log('Uploaded report: ' + reportUrl);

    // 데이터 추출
    const stats = batchRun.stats || {};
    const batchName = batchRun.title || "Unknown Batch"; 
    const passed = stats.successCount || 0;
    const failed = stats.failCount || 0;
    const total = stats.totalCount || (passed + failed);
    const duration = stats.duration || "00:00:00"; 

    // 상태 설정
    const isSuccess = batchRun.wasSuccessful;
    const emoji = isSuccess ? "✅" : "❌";
    const titleText = "Repeato 자동화 테스트 결과 - 담당자”; 
    
    // Slack Block Kit 메시지 구성
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
        {
          "type": "section",
          "fields": [
            {
              "type": "mrkdwn",
              "text": `테스트 이름:\n${batchName}`
            },
            {
              "type": "mrkdwn",
              "text": `결과:\n${isSuccess ? 'PASS' : 'FAIL'}`
            }
          ]
        },
        {
          "type": "section",
          "fields": [
            {
              "type": "mrkdwn",
              "text": `소요 시간:\n${duration}`
            },
            {
              "type": "mrkdwn",
              "text": `총 테스트 케이스 수:\n${total}건`
            }
          ]
        },
        {
          "type": "section",
          "fields": [
            {
              "type": "mrkdwn",
              "text": `성공한 케이스 수:\n${passed}건`
            },
            {
              "type": "mrkdwn",
              "text": `실패한 케이스 수:\n${failed}건`
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

    // fetch를 사용하여 슬랙으로 전송
    const response = await fetch(WebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      log('Completion message sent to Slack.');
    } else {
      log(`Failed to send Slack message. Status: ${response.status}`);
    }
    
  } catch (error) {
    log('Failed in completion handler: ' + error);
  }
});
