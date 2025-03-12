## プロジェクト初期化

```
git clone git@github.com:kawadumax/decopon.git
cp .env.example .env # git から落としてきた後、.env をコピーする。
composer install # phpの依存ファイルを入れる
npm install # jsの依存ファイルを入れる
```

DB の初期化

```
php artisan migrate --seed
```

暗号化キーの生成がいるかも

```
php artisan key:generate
```

## コマンドのメモ書き
マイクロサービス化して、ルートディレクトリにコマンドを置いておく
タスクランナとしてjustを使っているのでjustを入れてください

```
brew install just

just backend # バックエンド起動
just web # webのフロントエンド起動
just all # 全部起動

```





開発サーバ実行

```
php artisan serve
```

フロントエンドも一緒に

```
npm run dev
```

上記を同時にできるかも

```
composer run dev
```

DB リセットして Seeder 実行

```
php artisan migrate:fresh --seed
```

## Git hooksのフォルダを指定
```
git config --local core.hooksPath .githooks
```

## フロントエンドのルーティングについて。

route("name のほうをいれる")

## ビューのイメージ

タスクビューでは、ツリービューと詳細ビューがある？
ツリービューは分解するためのビュー。詳細ビューはログを取るためのビュー。
実行コンテクストも詳細ビュー。
