# シフトカレンダー共有アプリ（MVP）

仕事仲間と使う共有カレンダーアプリ。予定表を撮影すると、AI（Claude API）が内容を読み取ってカレンダーに自動登録する。

## できること（MVP）

- メール/パスワードでのアカウント登録・ログイン
- カレンダーの新規作成／招待コードでの参加（複数人で共有）
- 月表示カレンダー、日ごとの予定一覧
- 予定の手動追加・編集・削除
- 予定表の写真を撮影/選択 → Claude APIが解析 → 内容を確認してから一括登録

## セットアップ手順（あなたが行う作業）

### 1. Firebaseプロジェクトを作成

1. https://console.firebase.google.com/ にアクセスし、新規プロジェクトを作成
2. 「Authentication」→「Sign-in method」→「メール/パスワード」を有効化
3. 「Firestore Database」を作成（本番環境モード）
4. 「プロジェクトの設定」→「全般」の一番下「マイアプリ」で `</>`（ウェブ）アプリを追加し、表示された設定値を `src/firebase.js` の `firebaseConfig` に貼り付ける

### 2. Firestoreのセキュリティルールを反映

`firestore.rules` の内容を、Firebaseコンソールの「Firestore Database」→「ルール」にコピー＆貼り付けて公開する
（もしくは firebase-tools を使える環境があれば `firebase deploy --only firestore:rules`）

### 3. Cloud Functions（写真解析API）をデプロイ

これはNode.jsが動く環境（このアプリを操作しているPCでOK）で行います。

```
npm install -g firebase-tools
firebase login
cd functions
npm install
cd ..
firebase use --add   # 作成したFirebaseプロジェクトを選択
firebase functions:secrets:set ANTHROPIC_API_KEY   # console.anthropic.com で取得したAPIキーを貼り付け
firebase deploy --only functions
```

### 4. アプリの依存パッケージをインストールして起動確認

```
npm install
npx expo start
```

スマホにExpo Goアプリを入れて、表示されたQRコードを読み込むと動作確認できます。

### 5. 本番ビルド（App Store提出用）

前回の「宝くじ数字ラボ」と同様、EAS Buildを使ってクラウドでビルドします。

```
npm install -g eas-cli
eas login
eas build:configure
eas build --platform ios
```

## フォルダ構成

```
App.js                     ナビゲーションのルート
src/firebase.js            Firebase初期化（要: 設定値の書き換え）
src/context/AuthContext.js ログイン状態の管理
src/services/              Firestore操作・Claude API呼び出し
src/screens/                各画面
functions/                 Cloud Functions（写真解析のサーバー側処理）
firestore.rules            Firestoreのセキュリティルール
```

## 今後の拡張候補

- プッシュ通知（新しい予定が追加されたらメンバーに通知）
- 予定の色分け・カテゴリ分け
- 週表示・リスト表示の切り替え
- 予定の繰り返し設定
