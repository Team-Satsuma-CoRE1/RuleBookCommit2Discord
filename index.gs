function doPost(e) {
  var feedUrl = "https://github.com/scramble-robot/CoRE-Rulebook/commits/main.atom"; // CoREルールブックへのコミットRSSフィードのURL
  var discordWebhookUrl = "DISCORD WEBHOOK URL"; // DiscordのWebhook URL
  var retryAfter = 300;
  var response = UrlFetchApp.fetch(feedUrl);
  var xml = response.getContentText();
  var document = XmlService.parse(xml);
  var entries = document.getRootElement().getChildren('entry', XmlService.getNamespace('http://www.w3.org/2005/Atom'));

  // 以前に保存した最後のコミットIDを取得
  var lastCommitId = PropertiesService.getScriptProperties().getProperty('lastCommitId');
  var newLastCommitId = "";
  var notificationsSent = 0;

  // RSSフィードを逆順に処理し、最後の確認以降の全てのコミットについて通知
  for (var i = entries.length - 1; i >= 0; i--) {
    var entry = entries[i];
    var commitId = entry.getChildText('id', XmlService.getNamespace('http://www.w3.org/2005/Atom'));

    // 最新のコミットIDを更新
    if (i === 0) {
      newLastCommitId = commitId;
    }

    // 前回のコミット以降のみ処理
    if (commitId === lastCommitId) {
      break; // 既知の最後のコミットに達したら処理を停止
    }

    var commitMessage = entry.getChildText('title', XmlService.getNamespace('http://www.w3.org/2005/Atom'));
    var commitUrl = entry.getChild('link', XmlService.getNamespace('http://www.w3.org/2005/Atom')).getAttribute('href').getValue();
    var message = "ルールブックが更新されました!: " + commitMessage + "\nURL: " + commitUrl;

    var discordPayload = JSON.stringify({content: message});
    var options = {
      method: "post",
      contentType: "application/json",
      payload: discordPayload
    };


    try {
      UrlFetchApp.fetch(discordWebhookUrl, options);
    } catch (e) {
    // レート制限に達した場合、指定された時間（retry_after）だけ待機
      Utilities.sleep(retryAfter);
    // リトライ
      UrlFetchApp.fetch(discordWebhookUrl, options);
    }
notificationsSent++;
  }

  // 最新のコミットIDで更新
  if (newLastCommitId !== "") {
    PropertiesService.getScriptProperties().setProperty('lastCommitId', newLastCommitId);
  }

  // 通知の送信結果をログに記録
  console.log(notificationsSent + " notifications sent.");
}
